import { saveImage } from '../../shared/save-image.js';
import { CANVAS } from './wardrobe.js';
import { drawOutfit } from './art.js';

// Snapshot state before decoding: later choices cannot change this export.
export async function downloadOutfit(outfit, { signal } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS.width; canvas.height = CANVAS.height;
  await drawOutfit(canvas, { ...outfit }, { background: '#faf3ee', isCurrent: () => !signal?.aborted });
  if (signal?.aborted) return 'cancelled';
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo preparar la imagen');
  if (signal?.aborted) return 'cancelled';
  return saveImage(blob, 'lupe-vestida.png', { signal });
}
