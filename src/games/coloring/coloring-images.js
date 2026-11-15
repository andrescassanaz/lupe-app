import { detectRegions } from './coloring-regions.js';

export async function loadCatalog(signal) {
  const response = await fetch(new URL('./assets/drawings/catalog.json', import.meta.url), { signal });
  if (!response.ok) throw new Error('No se pudo abrir la carpeta de dibujos.');
  const drawings = await response.json();
  if (!Array.isArray(drawings) || drawings.some(d => typeof d.id !== 'string' || typeof d.name !== 'string' || typeof d.image !== 'string' || !d.image.startsWith('./src/games/coloring/assets/drawings/') || !/\.png$/i.test(d.image))) throw new Error('La lista de dibujos no es válida.');
  return drawings;
}

export async function prepareDrawing(entry, signal) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    const cleanup = () => { signal.removeEventListener('abort', abort); image.onload = null; image.onerror = null; };
    const abort = () => { cleanup(); image.src = ''; reject(new DOMException('Cancelled', 'AbortError')); };
    image.onload = () => { cleanup(); resolve(); };
    image.onerror = () => { cleanup(); reject(new Error('No se pudo abrir este dibujo. Probá con otro dibujo.')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    image.src = entry.image;
  });
  const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  let regions;
  if (typeof Worker === 'undefined') regions = detectRegions(data, width, height, { includeEdges: entry.fullBleed === true });
  else regions = await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./coloring-worker.js', import.meta.url), { type: 'module' });
    const cleanup = () => { worker.terminate(); signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    worker.onmessage = ({ data: result }) => { cleanup(); result.error ? reject(new Error(result.error)) : resolve(result.regions); };
    worker.onerror = () => { cleanup(); reject(new Error('No se pudieron preparar los sectores del dibujo.')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    worker.postMessage({ pixels: data.buffer, width, height, includeEdges: entry.fullBleed === true }, [data.buffer]);
  });
  if (!regions.length) throw new Error('Este dibujo no tiene sectores cerrados para colorear. Elegí otro.');
  return { ...entry, width, height, regions, source: image };
}
