export function replaceView(root, html) {
  const active = root.contains(document.activeElement) ? document.activeElement?.dataset.focus : null;
  root.innerHTML = html;
  if (active) root.querySelector(`[data-focus="${active}"]`)?.focus({ preventScroll: true });
}
