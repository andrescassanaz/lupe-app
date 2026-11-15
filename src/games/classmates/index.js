import { mountClassmates } from '../../shared/classmates-game.js';
export function mount(root, context) {
  return mountClassmates(root, context, { mode: 'names', title: 'Los nombres del jardín' });
}
