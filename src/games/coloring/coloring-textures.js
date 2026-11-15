// One deterministic raster tile per material/color, shared by preview and PNG export.
const cache = new Map();
export const TEXTURE_SIZE = 64;
export function paintTexture(material, color) {
  const key = `${material}:${color}`;
  if (cache.has(key)) return cache.get(key);
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const ctx = tile.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
  let seed = 417;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  if (material === 'crayon') {
    // Fine irregular wax grain, without a repeating stripe/checkerboard effect.
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = `rgba(255,255,255,${.12 + random() * .42})`;
      ctx.fillRect(random() * 128, random() * 128, .5 + random() * 2, .5 + random() * 1.7);
    }
    for (let i = 0; i < 350; i++) {
      ctx.fillStyle = 'rgba(86,64,48,.065)';
      ctx.fillRect(random() * 128, random() * 128, 1, 1);
    }
  } else if (material === 'brush') {
    // Wrapped translucent washes keep the tile seamless.
    for (let i = 0; i < 22; i++) {
      const x = random() * 128, y = random() * 128, radius = 15 + random() * 33;
      for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) {
        const g = ctx.createRadialGradient(x+dx, y+dy, 0, x+dx, y+dy, radius);
        g.addColorStop(0, 'rgba(255,255,255,.21)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x+dx-radius, y+dy-radius, radius*2, radius*2);
      }
    }
  } else if (material === 'glitter') {
    for (let i = 0; i < 170; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(255,255,255,.65)' : 'rgba(255,237,170,.85)';
      ctx.beginPath(); ctx.arc(random()*128, random()*128, .5+random()*1.1, 0, Math.PI*2); ctx.fill();
    }
    for (const [x,y,r] of [[21,25,7],[82,19,4],[59,81,6],[110,107,4]]) {
      ctx.fillStyle = '#fff8d6'; ctx.beginPath();
      ctx.moveTo(x,y-r); ctx.lineTo(x+1.8,y-1.8); ctx.lineTo(x+r,y); ctx.lineTo(x+1.8,y+1.8);
      ctx.lineTo(x,y+r); ctx.lineTo(x-1.8,y+1.8); ctx.lineTo(x-r,y); ctx.lineTo(x-1.8,y-1.8); ctx.closePath(); ctx.fill();
    }
  }
  const result = { tile, url: tile.toDataURL('image/png') };
  cache.set(key, result);
  return result;
}
export function textureMarkup(material, color) {
  return `<image href="${paintTexture(material, color).url}" width="${TEXTURE_SIZE}" height="${TEXTURE_SIZE}"/>`;
}
