const paths = {
  play: '<path d="m8 4 14 9-14 9z"/>',
  stop: '<rect x="6" y="6" width="14" height="14" rx="2"/>',
  home: '<path d="m4 12 8-7 8 7v9h-6v-6h-4v6H4z"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" fill="none"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6m0-6-5 6" fill="none"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none"/>',
  undo: '<path d="m8 5-5 5 5 5m-5-5h11a6 6 0 0 1 0 12" fill="none"/>',
  check: '<path d="m4 12 5 5L20 6" fill="none"/>',
  refresh: '<path d="M20 9a8 8 0 1 0 0 7M20 3v6h-6" fill="none"/>',
  close: '<path d="m6 6 12 12M18 6 6 18" fill="none"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M4 17v5h16v-5" fill="none"/>',
  info: '<circle cx="12" cy="12" r="10" fill="none"/><path d="M12 11v6M12 6v1" fill="none"/>',
  paw: '<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="4" cy="9" rx="2.6" ry="3.3"/><ellipse cx="10" cy="5" rx="2.6" ry="3.3"/><ellipse cx="17" cy="5.5" rx="2.6" ry="3.3"/><ellipse cx="22" cy="11" rx="2.6" ry="3.3"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.arrow}</svg>`;
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function image(source, className = '', alt = '') {
  return `<img class="art ${escapeHtml(className)}" src="${escapeHtml(source)}" alt="${escapeHtml(alt)}" draggable="false" />`;
}

export function createArt(baseURL) {
  return (name, className = '', alt = '') => image(new URL(`${name}.svg`, baseURL), className, alt);
}

export const art = createArt(new URL('./assets/images/', import.meta.url));

export function confetti() {
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i class="confetti-piece piece-${i}"></i>`).join('')}</div>`;
}
