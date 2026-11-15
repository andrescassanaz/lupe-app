import { gameHeading } from '../../shared/ui.js';
import { icon } from '../../shared/art.js';

const DRAFT_KEY = 'lupe-writing-v1';
const MAX_LENGTH = 1000;

export function mount(root, { audio }) {
  root.innerHTML = `<section class="game writing-game" aria-labelledby="writing-title">
    <div class="game-heading">${gameHeading('A escribir', 'writing-title')}</div>
    <div class="writing-paper">
      <label for="writing-text">Escribí acá</label>
      <textarea id="writing-text" class="writing-text" placeholder="Lupe" maxlength="${MAX_LENGTH}" spellcheck="false" autocorrect="off" autocapitalize="off" autocomplete="off" aria-describedby="writing-limit"></textarea>
      <span id="writing-limit" class="writing-limit"></span>
    </div>
    <div class="writing-actions">
      <button class="primary-button writing-play" data-writing="play">${icon('play')}<span>Escuchar</span></button>
      <button class="secondary-button" data-writing="clear">${icon('refresh')}<span>Borrar</span></button>
      <button class="secondary-button" data-writing="undo" hidden>${icon('undo')}<span>Recuperar</span></button>
    </div>
    <p class="writing-status" role="status" aria-live="polite"></p>
  </section>`;

  const input = root.querySelector('textarea');
  const play = root.querySelector('[data-writing="play"]');
  const clear = root.querySelector('[data-writing="clear"]');
  const undo = root.querySelector('[data-writing="undo"]');
  const status = root.querySelector('.writing-status');
  let clearedText = '';
  try { input.value = (localStorage.getItem(DRAFT_KEY) || '').slice(0, MAX_LENGTH); } catch { /* Writing still works when storage is unavailable. */ }

  function save() {
    try { localStorage.setItem(DRAFT_KEY, input.value); } catch { /* Keep the current text in the editor. */ }
  }
  function render() {
    const speaking = audio.speechState === 'speaking';
    play.innerHTML = `${icon(speaking ? 'stop' : 'play')}<span>${speaking ? 'Parar' : 'Escuchar'}</span>`;
    play.disabled = !input.value.trim() || audio.muted || !audio.speechSupported;
    clear.disabled = !input.value;
    undo.hidden = !clearedText;
    root.querySelector('.writing-limit').textContent = input.value.length >= MAX_LENGTH ? '¡La hoja está llena! Podés escucharla o borrar para seguir.' : '';
    if (!audio.speechSupported) status.textContent = 'Podés escribir. Para escuchar, abrí la app en un navegador con lectura en voz alta.';
    else if (audio.muted) status.textContent = 'Activá el sonido arriba para escuchar tus palabras.';
    else if (audio.speechState === 'error') status.textContent = 'No pudimos leerlo. Probá otra vez o pedile ayuda a una persona grande.';
    else if (!audio.spanishVoice()) status.textContent = 'Para escuchar, necesitás una voz en español en este dispositivo. Pedile ayuda a una persona grande.';
    else status.textContent = speaking ? 'Leyendo…' : '';
  }
  function onInput() {
    clearedText = '';
    audio.stop();
    save();
    render();
  }
  function onClick(event) {
    const button = event.target.closest('[data-writing]');
    if (!button || button.disabled) return;
    switch (button.dataset.writing) {
      case 'play':
        if (audio.speechState === 'speaking') audio.stop();
        else audio.speak(input.value);
        break;
      case 'clear':
        clearedText = input.value;
        input.value = '';
        audio.stop(); save(); render(); input.focus();
        break;
      case 'undo':
        input.value = clearedText;
        clearedText = '';
        save(); render(); input.focus();
        break;
    }
  }
  input.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  audio.addEventListener('change', render);
  globalThis.speechSynthesis?.addEventListener('voiceschanged', render);
  render();
  audio.intro();
  return () => {
    input.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
    audio.removeEventListener('change', render);
    globalThis.speechSynthesis?.removeEventListener('voiceschanged', render);
    audio.stop();
  };
}
