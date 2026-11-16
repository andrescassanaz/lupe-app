import { games } from './catalog.generated.js';
import { art, icon, image, escapeHtml } from '../shared/art.js';
import { AudioPlayer } from '../shared/audio.js';
import { gameContext } from '../shared/game-context.js';
import { OfflineManager } from './offline.js';

const audio = new AudioPlayer();
const offline = new OfflineManager();
let screen = 'home';
let disposeGame = () => {};
const app = document.querySelector('#app');

app.innerHTML = `<div class="app-shell">
  <header class="app-header">
    <button class="home-button icon-button" data-global="home" aria-label="Volver al inicio">${icon('home')}</button>
    <a class="brand" href="./" aria-label="Lupe, ir al inicio">${art('sun', 'brand-sun')}<span>lupe<span class="brand-dot">.</span></span></a>
    <button class="sound-button icon-button" data-global="sound" aria-label="Silenciar sonidos" aria-pressed="false">${icon('sound')}</button>
  </header>
  <main id="main-content"></main>
  <p class="audio-feedback" role="status" hidden></p>
  <footer class="app-footer">
    <button class="offline-status" data-global="adults" aria-label="Ver preparación para jugar sin internet"><span class="status-dot"></span><span id="offline-label" role="status">Preparando los juegos…</span></button>
    <button class="adult-button" data-global="adults">${icon('info')} Para grandes</button>
  </footer>
  <dialog class="adult-dialog" aria-labelledby="adult-title">
    <button class="dialog-close icon-button" data-global="close-dialog" aria-label="Cerrar">${icon('close')}</button>
    <h2 id="adult-title">Jugar sin internet</h2>
    <div id="download-details" aria-live="polite"></div>
    <div class="adult-actions"><button class="primary-button" data-global="download-latest">Descargar última versión</button></div>
  </dialog>
</div>`;

audio.addEventListener('change', () => {
  const feedback = app.querySelector('.audio-feedback');
  feedback.hidden = audio.speechState !== 'audio-error';
  feedback.textContent = feedback.hidden ? '' : 'No se pudo reproducir el sonido. Tocá el parlante para volver a intentar.';
});
const main = document.querySelector('#main-content');
const dialog = document.querySelector('dialog');
const gameById = new Map(games.map(game => [game.id, game]));

function home() {
  main.innerHTML = `<section class="home-screen" aria-labelledby="welcome-title">
    <div class="home-intro"><h1 id="welcome-title">¡Hola, Lupe! <span class="hello-spark" aria-hidden="true">✳</span></h1><p>¿A qué jugamos hoy?</p></div>
    <div class="game-grid">${[...games].sort((a, b) => a.order - b.order).map(game => `<button class="game-tile" data-game="${game.id}" aria-label="Jugar a ${escapeHtml(game.name)}">
      <div class="tile-art">${image(new URL(game.cover, import.meta.url))}<span class="tile-spark spark-one" aria-hidden="true">✦</span><span class="tile-spark spark-two" aria-hidden="true">✧</span></div>
      <div class="tile-caption"><div><h2>${escapeHtml(game.name)}</h2><p>${escapeHtml(game.subtitle)}</p></div><span class="tile-go">${icon('arrow')}</span></div>
    </button>`).join('')}</div>
  </section>`;
}

function navigate(destination) {
  if (destination !== 'home' && !gameById.has(destination)) return;
  disposeGame(); disposeGame = () => {}; audio.stop(); screen = destination;
  document.body.dataset.screen = screen;
  if (destination === 'home') { home(); disposeGame = () => {}; }
  else {
    const game = gameById.get(destination);
    try {
      disposeGame = game.mount(main, gameContext(audio, game));
      if (typeof disposeGame !== 'function') throw new Error('El juego debe devolver una función de limpieza.');
    } catch (error) {
      disposeGame = () => {};
      audio.stop();
      main.innerHTML = '<section class="game"><h1>No pudimos abrir este juego.</h1><p>Volvé al inicio para probar otra vez.</p></section>';
      console.error(error);
    }
  }
  window.scrollTo(0, 0);
}

offline.allowReload = () => screen === 'home';

function renderOffline() {
  const { status, ready, progress, update, error, downloading } = offline.state;
  const busy = downloading || status === 'preparing' || status === 'updating';
  const label = document.querySelector('#offline-label');
  label.textContent = ready ? 'Lista para jugar sin internet' : status === 'error' ? 'Falta preparar el modo sin internet' : `Guardando los juegos… ${progress}%`;
  label.parentElement.classList.toggle('is-ready', ready);
  label.parentElement.classList.toggle('is-error', !ready && status === 'error');
  document.querySelector('#download-details').innerHTML = `
    <div class="download-state ${ready ? 'complete' : ''}">${icon(ready ? 'check' : 'download')}<strong>${ready ? 'Lista para jugar sin internet' : status === 'error' ? 'La descarga no terminó' : `Guardando los juegos… ${progress}%`}</strong></div>
    <progress max="100" value="${busy ? progress : ready ? 100 : progress}" aria-label="Avance de descarga">${busy ? progress : ready ? 100 : progress}%</progress>
    ${error ? `<p class="download-error" role="alert"></p>` : ''}`;
  const errorNode = document.querySelector('.download-error');
  if (errorNode) errorNode.textContent = error;
  const downloadButton = document.querySelector('[data-global="download-latest"]');
  downloadButton.disabled = busy || (update && screen !== 'home');
  downloadButton.title = update && screen !== 'home' ? 'Volvé al inicio para aplicar la última versión.' : '';
  downloadButton.setAttribute('aria-busy', String(Boolean(busy)));
}

// Handle help before a game interprets the same tap as a move.
app.addEventListener('click', event => {
  if (!event.target.closest('[data-global="instructions"]')) return;
  event.stopPropagation();
  const game = gameById.get(screen);
  if (!game) return;
  if (audio.muted) {
    audio.toggle();
    const sound = app.querySelector('[data-global="sound"]');
    sound.innerHTML = icon('sound');
    sound.setAttribute('aria-label', 'Silenciar sonidos');
    sound.setAttribute('aria-pressed', 'false');
  }
  gameContext(audio, game).audio.intro();
}, true);

app.addEventListener('click', event => {
  const gameTile = event.target.closest('[data-game]');
  if (gameTile) {
    const game = games.find(item => item.id === gameTile.dataset.game);
    if (game) navigate(game.id);
    return;
  }
  if (event.target.closest('.brand')) { event.preventDefault(); navigate('home'); return; }
  const button = event.target.closest('[data-global]');
  if (!button || button.disabled) return;
  switch (button.dataset.global) {
    case 'home': navigate('home'); break;
    case 'sound': {
      const muted = audio.toggle();
      button.innerHTML = icon(muted ? 'mute' : 'sound');
      button.setAttribute('aria-label', muted ? 'Activar sonidos' : 'Silenciar sonidos');
      button.setAttribute('aria-pressed', String(muted));
      if (!muted) audio.play('welcome');
      break;
    }
    case 'adults': renderOffline(); dialog.showModal(); offline.requestPersistence(); break;
    case 'close-dialog': dialog.close(); break;
    case 'download-latest': offline.downloadLatest(); break;
  }
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
offline.addEventListener('change', renderOffline);
window.addEventListener('online', () => { if (!offline.state.ready) offline.retry(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.stop(); else offline.verify(); });
navigate('home'); renderOffline(); offline.start();
