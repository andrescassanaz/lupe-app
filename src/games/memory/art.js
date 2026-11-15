import { createArt, image } from '../../shared/art.js';
import { ANIMALS } from './rules.js';
import { ART_THEME } from './art-theme.js';

const originalArt = createArt(new URL('./assets/images/', import.meta.url));

export function art(name, className = '', alt = '') {
  if (ART_THEME === 'ai-v1' && ANIMALS.includes(name)) {
    return image(new URL(`./assets/images/ai-v1/${name === 'frog' ? 'frog-v2' : name}.png`, import.meta.url), className, alt);
  }
  return originalArt(name, className, alt);
}
