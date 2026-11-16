import { saveImage } from '../../shared/save-image.js';

// Rasterize the exact visible layers at their natural proportions, including colors.
export async function downloadPortrait(portrait, { signal } = {}) {
  const cancelled = () => signal?.aborted;
  const bounds = portrait.getBoundingClientRect();
  const layers = [...portrait.querySelectorAll('img')].map(img => ({
    source: img.src, rect: img.getBoundingClientRect(), style: getComputedStyle(img),
  })).map(({ source, rect, style }) => ({ source,
    x: (rect.x - bounds.x) / bounds.width, y: (rect.y - bounds.y) / bounds.height,
    w: rect.width / bounds.width, h: rect.height / bounds.height,
    fit: style.objectFit, filter: style.filter, order: Number(style.zIndex) || 0,
  })).sort((a, b) => a.order - b.order);
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = Math.round(1080 * bounds.height / bounds.width);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const layer of layers) {
    const img = new Image(); img.src = layer.source; await img.decode();
    if (cancelled()) return;
    let w = layer.w * canvas.width, h = layer.h * canvas.height;
    let x = layer.x * canvas.width, y = layer.y * canvas.height;
    if (layer.fit === 'contain') {
      const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * ratio, ih = img.naturalHeight * ratio;
      x += (w - iw) / 2; y += (h - ih) / 2; w = iw; h = ih;
    }
    if ('filter' in ctx) { ctx.filter = layer.filter; ctx.drawImage(img, x, y, w, h); }
    else ctx.drawImage(filteredImage(img, layer.filter), x, y, w, h);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No image generated');
  if (cancelled()) return;
  return saveImage(blob, 'mi-carita.png', { signal });
}

// Canvas filters are absent in some tablet browsers. Apply the same CSS color
// operations to raster pixels so the downloaded picture still matches the preview.
function filteredImage(img, filter) {
  if (filter === 'none') return img;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (const [, name, amount] of filter.matchAll(/([a-z-]+)\(([^)]+)\)/g)) {
    const v = parseFloat(amount), d = pixels.data;
    let m;
    if (name === 'saturate') m = [.213+.787*v,.715-.715*v,.072-.072*v,.213-.213*v,.715+.285*v,.072-.072*v,.213-.213*v,.715-.715*v,.072+.928*v];
    if (name === 'sepia') m = [1-.607*v,.769*v,.189*v,.349*v,1-.314*v,.168*v,.272*v,.534*v,1-.869*v];
    if (name === 'hue-rotate') {
      const c=Math.cos(v*Math.PI/180),s=Math.sin(v*Math.PI/180);
      m=[.213+.787*c-.213*s,.715-.715*c-.715*s,.072-.072*c+.928*s,.213-.213*c+.143*s,.715+.285*c+.140*s,.072-.072*c-.283*s,.213-.213*c-.787*s,.715-.715*c+.715*s,.072+.928*c+.072*s];
    }
    for(let i=0;i<d.length;i+=4) {
      const r=d[i],g=d[i+1],b=d[i+2];
      if(name==='brightness') { d[i]=r*v;d[i+1]=g*v;d[i+2]=b*v; }
      else if(m) { d[i]=r*m[0]+g*m[1]+b*m[2];d[i+1]=r*m[3]+g*m[4]+b*m[5];d[i+2]=r*m[6]+g*m[7]+b*m[8]; }
    }
  }
  ctx.putImageData(pixels,0,0); return canvas;
}
