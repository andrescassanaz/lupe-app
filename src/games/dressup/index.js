import { gameHeading, replaceView } from '../../shared/ui.js';
import { icon, escapeHtml, confetti } from '../../shared/art.js';
import { imageSaveMessage } from '../../shared/save-image.js';
import { categories, STORAGE_KEY, CANVAS, defaultOutfit, normalizeOutfit, chooseItem, randomOutfit, coversBottom, outfitDescription, asset } from './wardrobe.js';
import { drawOutfit, clearArtCache } from './art.js';
import { downloadOutfit } from './save-image.js';

export function mount(root, { audio }) {
  let outfit = { ...defaultOutfit }, previous = null, disposed = false, exporting = false;
  let storageFailed = false, status = '', celebrate = false, timer, gesture = null, suppressClick = false;
  const lifecycle = new AbortController();
  let paintVersion = 0;
  try { outfit = normalizeOutfit(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { /* Optional local persistence. */ }

  function render() {
    const bottomLocked = coversBottom(outfit);
    replaceView(root, `<section class="game dressup-game" aria-labelledby="dressup-title">
      <div class="game-heading">${gameHeading('A vestir a Lupe', 'dressup-title')}<p class="level-note">Elegí, combiná… ¡y a jugar!</p></div>
      <div class="dressup-workshop">
        <div class="dressup-stage ${celebrate ? 'is-celebrating' : ''}" data-region="stage">
          <span class="dressup-stage-label" aria-hidden="true">EL VESTIDOR DE LUPE</span>
          <span class="dressup-spark dressup-spark-one" aria-hidden="true">✧</span><span class="dressup-spark dressup-spark-two" aria-hidden="true">✦</span>
          <div class="dressup-doll-space"><div class="dressup-doll" role="img" aria-label="${escapeHtml(outfitDescription(outfit))}"><canvas class="dressup-figure" data-region="figure" width="${CANVAS.width}" height="${CANVAS.height}" aria-hidden="true"></canvas></div></div>
          <span class="dressup-stage-caption">${celebrate ? '¡Lista para salir!' : 'Hoy me visto como quiero'}</span>
          ${celebrate ? confetti() : ''}
        </div>
        <div class="dressup-closet">
          <div class="dressup-closet-heading"><div><span>SU ROPA, MIL IDEAS</span><h2>¿Qué nos ponemos?</h2></div><span aria-hidden="true">♡</span></div>
          <div class="dressup-rows">${categories.map(group => `<section class="dressup-category" aria-labelledby="dressup-${group.id}-title" data-region="category-${group.id}">
            <div class="dressup-category-heading"><h3 id="dressup-${group.id}-title">${group.label}</h3><span class="dressup-current">${group.id === 'bottom' && bottomLocked ? 'Incluida en la prenda entera' : escapeHtml(group.items.find(choice => choice.id === outfit[group.id]).name)}</span></div>
            <div class="dressup-carousel" ${group.id === 'bottom' && bottomLocked ? 'hidden inert' : ''}><button class="dressup-arrow" data-scroll="${group.id}" data-direction="-1" aria-label="Ver anteriores de ${group.label.toLowerCase()}" aria-controls="dressup-${group.id}-options" ${group.id === 'bottom' && bottomLocked ? 'disabled' : ''}>‹</button>
              <div class="dressup-options" id="dressup-${group.id}-options" data-carousel="${group.id}" role="group" aria-label="${group.label}" ${group.id === 'bottom' && bottomLocked ? 'aria-disabled="true"' : ''}>${group.items.map(choice => `<button class="dressup-option ${outfit[group.id] === choice.id ? 'is-selected' : ''}" data-category="${group.id}" data-choice="${choice.id}" data-focus="${choice.id}" aria-label="${escapeHtml(choice.name)}" aria-pressed="${outfit[group.id] === choice.id}" title="${escapeHtml(choice.name)}" ${group.id === 'bottom' && bottomLocked ? 'disabled' : ''}>${choice.file ? `<img src="${asset(`thumb-${choice.id}.png`)}" alt="" draggable="false">` : '<span class="dressup-none" aria-hidden="true">∅</span>'}<span class="dressup-option-label">${escapeHtml(choice.name)}</span><span class="dressup-check" aria-hidden="true">✓</span></button>`).join('')}</div>
              <button class="dressup-arrow" data-scroll="${group.id}" data-direction="1" aria-label="Ver siguientes de ${group.label.toLowerCase()}" aria-controls="dressup-${group.id}-options" ${group.id === 'bottom' && bottomLocked ? 'disabled' : ''}>›</button>
            </div><p class="dressup-bottom-note" ${group.id !== 'bottom' || !bottomLocked ? 'hidden' : ''}>Con vestido o traje de baño no hace falta. Elegí una remera o blusa para combinar la parte de abajo.</p></section>`).join('')}</div>
          <div class="dressup-actions"><button class="secondary-button" data-action="random" data-focus="dressup-random"><span aria-hidden="true">✦</span> Sorprendeme</button><button class="secondary-button" data-action="undo" data-focus="dressup-undo" aria-label="Deshacer último cambio" ${previous ? '' : 'disabled'}>${icon('undo')}<span>Deshacer</span></button><button class="primary-button" data-action="done" data-focus="dressup-done">${icon('check')} ¡Así me gusta!</button><button class="secondary-button" data-action="save" data-focus="dressup-save" ${exporting ? 'disabled' : ''}>${icon('download')} Guardar imagen</button></div>
        </div>
      </div><p class="dressup-status" role="status" aria-live="polite">${escapeHtml(status || (storageFailed ? 'Podés seguir jugando. Esta vez no se pudo guardar la combinación en el navegador.' : ''))}</p>
    </section>`);
    const version = ++paintVersion;
    const canvas = root.querySelector('.dressup-figure');
    canvas.dataset.ready = 'false';
    drawOutfit(canvas, { ...outfit }, { isCurrent: () => !disposed && version === paintVersion }).catch(() => {
      if (disposed || version !== paintVersion) return;
      status = 'No pudimos cargar una prenda. Volvé a elegirla para reintentar.';
      root.querySelector('.dressup-status').textContent = status;
    });
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit)); storageFailed = false; } catch { storageFailed = true; }
  }
  function change(next) {
    if (JSON.stringify(next) === JSON.stringify(outfit)) return;
    previous = { ...outfit }; outfit = next; celebrate = false; status = '';
    clearTimeout(timer); persist(); audio.play('pop'); render();
  }
  async function exportImage() {
    if (exporting) return;
    exporting = true; status = 'Preparando tu imagen…'; render();
    try {
      const result = await downloadOutfit({ ...outfit }, { signal: lifecycle.signal });
      if (!disposed) status = imageSaveMessage(result);
    } catch (error) {
      if (!disposed) status = error.name === 'NotSupportedError' ? error.message : 'No pudimos preparar la imagen. Tocá Guardar imagen para reintentar.';
    } finally { exporting = false; if (!disposed) render(); }
  }
  function click(event) {
    const button = event.target.closest('button');
    if (!button || !root.contains(button) || button.disabled || disposed) return;
    if (suppressClick && button.dataset.choice) { event.preventDefault(); suppressClick = false; return; }
    if (button.dataset.choice) change(chooseItem(outfit, button.dataset.category, button.dataset.choice));
    else if (button.dataset.scroll) {
      const row = root.querySelector(`[data-carousel="${button.dataset.scroll}"]`);
      row.scrollBy({ left: Number(button.dataset.direction) * Math.max(100, row.clientWidth * .75), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } else if (button.dataset.action === 'random') change(randomOutfit());
    else if (button.dataset.action === 'undo' && previous) {
      outfit = previous; previous = null; celebrate = false; status = ''; clearTimeout(timer); persist(); audio.play('pop'); render();
    } else if (button.dataset.action === 'done') {
      celebrate = true; status = '¡Lupe está lista!'; persist(); audio.play('celebrate'); clearTimeout(timer); render();
      timer = setTimeout(() => { celebrate = false; if (!disposed) render(); }, 2200);
    } else if (button.dataset.action === 'save') exportImage();
  }
  function pointerDown(event) {
    const row = event.target.closest('[data-carousel]');
    if (!row || row.getAttribute('aria-disabled') === 'true' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    suppressClick = false;
    gesture = { row, x: event.clientX, y: event.clientY, left: row.scrollLeft, pointer: event.pointerId, mouse: event.pointerType === 'mouse', moved: false };
  }
  function pointerMove(event) {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    if (Math.abs(event.clientX - gesture.x) > 10) {
      gesture.moved = true;
      if (gesture.mouse) { gesture.row.setPointerCapture(event.pointerId); gesture.row.scrollLeft = gesture.left - (event.clientX - gesture.x); }
    }
  }
  function pointerEnd(event) {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    suppressClick = gesture.moved;
    gesture = null;
  }
  function keyboard(event) {
    if (event.key === 'Enter' || event.key === ' ') suppressClick = false;
    const button = event.target.closest('[data-choice]');
    if (!button || button.disabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const choices = [...button.closest('[data-carousel]').querySelectorAll('[data-choice]')];
    const i = choices.indexOf(button);
    const next = choices[event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + choices.length) % choices.length];
    next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  for (const [name, listener] of [['click', click], ['pointerdown', pointerDown], ['pointermove', pointerMove], ['pointerup', pointerEnd], ['pointercancel', pointerEnd], ['keydown', keyboard]]) root.addEventListener(name, listener, { signal: lifecycle.signal });
  render(); audio.intro();
  return () => { disposed = true; lifecycle.abort(); clearTimeout(timer); gesture = null; clearArtCache(); audio.stop(); };
}
