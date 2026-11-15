import { image } from '../../shared/art.js';
import { FLAVORS } from './rules.js';

const newArt = new Set(['shop', ...FLAVORS.slice(3).map(f => `scoop-${f.id}`)]);
export const art = (name, className = '', alt = '') =>
  image(new URL(`./assets/images/${newArt.has(name) ? 'ai-v2' : 'ai-v1'}/${name}.png`, import.meta.url), className, alt);

export function scoop(flavor, className = '') {
  const item = FLAVORS.find(f => f.id === flavor);
  return `<span class="scoop ${className} ${item.id}" data-scoop="${item.id}" role="img" aria-label="Una bocha de ${item.name.toLowerCase()}">${art(`scoop-${item.id}`, 'scoop-art')}</span>`;
}

