// Deterministic connected components of the ORIGINAL image, never of painted pixels.
// A one-pixel barrier closes small gaps. Full-page scenes opt into painting edge regions.
export function detectRegions(data, width, height, { minArea = 45, closeGaps = true, includeEdges = false } = {}) {
  if (data.length !== width * height * 4 || width < 1 || height < 1) throw new Error('Invalid image dimensions');
  const size = width * height;
  const ink = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const p = i * 4;
    ink[i] = data[p] * .2126 + data[p + 1] * .7152 + data[p + 2] * .0722 < 205 ? 1 : 0;
  }
  const blocked = ink.slice();
  if (closeGaps) {
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (ink[i]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blocked[i + dy * width + dx] = 1;
    }
  }
  const labels = new Int32Array(size);
  const queue = new Int32Array(size);
  const regions = [];
  let component = 0;
  for (let start = 0; start < size; start++) {
    if (blocked[start] || labels[start]) continue;
    const label = ++component;
    let head = 0, tail = 1, exterior = false;
    queue[0] = start; labels[start] = label;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    while (head < tail) {
      const i = queue[head++];
      const x = i % width, y = Math.floor(i / width);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) exterior = true;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      const visit = n => { if (!blocked[n] && !labels[n]) { labels[n] = label; queue[tail++] = n; } };
      if (x > 0) visit(i - 1);
      if (x + 1 < width) visit(i + 1);
      if (y > 0) visit(i - width);
      if (y + 1 < height) visit(i + width);
    }
    if ((!exterior || includeEdges) && tail >= minArea) regions.push({ label, area: tail, bounds: { minX, minY, maxX, maxY } });
  }
  const valid = new Set(regions.map(r => r.label));
  // Grow back into the one-pixel safety margin without crossing actual ink or merging regions.
  const expanded = labels.slice();
  if (closeGaps) for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    if (ink[i] || labels[i]) continue;
    const candidates = [labels[i - 1], labels[i + 1], labels[i - width], labels[i + width]].filter(n => valid.has(n));
    if (candidates.length && candidates.every(n => n === candidates[0])) expanded[i] = candidates[0];
  }
  const paths = new Map(regions.map(r => [r.label, []]));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width;) {
      const label = expanded[y * width + x];
      const start = x++;
      while (x < width && expanded[y * width + x] === label) x++;
      // Slight row overlap avoids seams from antialiasing. The raster original supplies the outlines.
      if (valid.has(label)) paths.get(label).push(`M${start} ${y}h${x - start}v1.05H${start}Z`);
    }
  }
  return regions.map((r, index) => ({
    id: `sector-${r.label}`, name: `Sector ${index + 1}`, area: r.area, bounds: r.bounds,
    d: paths.get(r.label).join(''),
  }));
}
