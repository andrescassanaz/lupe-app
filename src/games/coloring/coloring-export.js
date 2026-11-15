import { COLORS } from './coloring-data.js';
import { paintTexture } from './coloring-textures.js';

export async function paintingBlob(drawing, painting) {
  const canvas = document.createElement('canvas');
  canvas.width = drawing.source.naturalWidth;
  canvas.height = drawing.source.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.scale(canvas.width / drawing.width, canvas.height / drawing.height);
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, drawing.width, drawing.height);
  ctx.drawImage(drawing.source, 0, 0, drawing.width, drawing.height);
  for (const region of drawing.regions) {
    const value = painting[region.id];
    if (!value) continue;
    const color = COLORS.find(c => c.id === value.color);
    const pattern = ctx.createPattern(paintTexture(value.material, color.hex).tile, 'repeat');
    pattern.setTransform(new DOMMatrix().scale(drawing.width / 1200));
    ctx.fillStyle = pattern;
    ctx.fill(new Path2D(region.d));
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(drawing.source, 0, 0, drawing.width, drawing.height);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo preparar la imagen.')), 'image/png'));
}

export async function downloadPainting(drawing, painting) {
  const blob = await paintingBlob(drawing, painting);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const name = drawing.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  link.download = `mi-dibujo-${name}.png`;
  document.body.append(link); link.click(); link.remove();
  // Allow browsers time to begin downloading before revoking the temporary URL.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
