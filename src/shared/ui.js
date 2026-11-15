import { icon, escapeHtml } from './art.js';

export function gameHeading(title, id = 'game-title') {
  return `<div class="game-title-row"><h1 id="${escapeHtml(id)}" tabindex="-1">${escapeHtml(title)}</h1><button class="icon-button game-instructions" data-global="instructions" data-focus="instructions" aria-label="Escuchar cómo jugar" title="Escuchar cómo jugar">${icon('sound')}</button></div>`;
}

const key = node => node.nodeType === 1 ? (node.id || node.getAttribute('data-focus') || (node.hasAttribute('data-region') ? `region-${node.dataset.region}` : '')) : '';
const compatible = (a, b) => a.nodeType === b.nodeType && a.nodeName === b.nodeName && key(a) === key(b);

// Keep existing elements, focus, decoded images and scroll positions. Only patch
// changed attributes/text; a turn must not tear down the whole game screen.
function patchChildren(parent, next) {
  let current = parent.firstChild;
  for (const desired of [...next.childNodes]) {
    if (!current) { parent.append(desired); continue; }
    if (!compatible(current, desired)) {
      const match = key(desired) && [...parent.childNodes].find(node => compatible(node, desired));
      if (match) { parent.insertBefore(match, current); current = match; }
      else { parent.insertBefore(desired, current); continue; }
    }
    const following = current.nextSibling;
    if (!current.isEqualNode(desired)) {
      if (current.nodeType !== 1) current.nodeValue = desired.nodeValue;
      else {
        for (const attr of [...current.attributes]) if (!desired.hasAttribute(attr.name)) current.removeAttribute(attr.name);
        for (const attr of desired.attributes) if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
        patchChildren(current, desired);
      }
    }
    current = following;
  }
  while (current) { const following = current.nextSibling; current.remove(); current = following; }
}

export function replaceView(root, html) {
  const active = root.contains(document.activeElement) ? document.activeElement?.dataset.focus : null;
  const template = document.createElement('template');
  template.innerHTML = html;
  patchChildren(root, template.content);
  if (active && !root.contains(document.activeElement)) root.querySelector(`[data-focus="${active}"]`)?.focus({ preventScroll: true });
}
