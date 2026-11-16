import { gameHeading, replaceView } from '../../shared/ui.js';
import { confetti, icon } from '../../shared/art.js';
import { COLORS, TOTAL_BERRIES, WIN_SCORE, newGame, chooseBerry, revealBerry, eatBerry, finishTurn, hasWon, scoreMessage, outcome } from './rules.js';
import { audioDurations } from './audio-durations.js';

const labels = { red: 'Roja', purple: 'Morada' };
const berries = Object.fromEntries(COLORS.map(color => [color, new URL(`./assets/images/berry-${color}.png`, import.meta.url).href]));
const berry = color => `<img src="${berries[color]}" alt="" draggable="false">`;

export function mount(root, { audio }) {
  let state = newGame(), disposed = false, timer = null, pendingStep = null, remaining = 0, startedAt = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('.adult-dialog');
  const paused = () => document.hidden || Boolean(dialog?.open);

  function schedule(step, delay) {
    clearTimeout(timer);
    pendingStep = step;
    remaining = delay;
    resume();
  }

  function resume() {
    if (disposed || paused() || !pendingStep || timer !== null) return;
    startedAt = performance.now();
    timer = setTimeout(() => {
      timer = null;
      const step = pendingStep;
      pendingStep = null;
      if (!disposed) step();
    }, remaining);
  }

  function onPauseChange() {
    if (paused()) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, remaining - (performance.now() - startedAt));
      }
    } else resume();
  }

  function message() {
    if (state.phase === 'drawing') return 'A ver, a ver… ¿cuál saldrá?';
    if (state.phase === 'revealing') return `¡Salió ${state.pending.color === 'red' ? 'roja' : 'morada'}!`;
    if (state.phase === 'eating') return '¡Ñam! Una morita menos.';
    if (state.phase === 'finished') return hasWon(state) ? '¡Ganaste! ¿Jugamos otra vez?' : '¡Probemos otra vez!';
    return '¿De qué color voy a sacar una mora?';
  }

  function render() {
    const last = state.history.at(-1);
    const finished = state.phase === 'finished';
    const locked = state.phase !== 'ready';
    const round = Math.min(TOTAL_BERRIES, state.history.length + (state.phase === 'ready' || state.phase === 'drawing' ? 1 : 0));
    const result = last ? `${last.correct ? '¡Adivinaste!' : 'Era la otra.'} ${outcome(state) === 'lost' ? `Tenés ${state.score} ${state.score === 1 ? 'punto' : 'puntos'}. Ya no alcanzan los intentos para ganar.` : scoreMessage(state.score)}` : 'Cada acierto suma un punto.';
    replaceView(root, `<section class="game moras-game" aria-labelledby="game-title" data-phase="${state.phase}">
      <div class="game-heading">${gameHeading('Las moritas de Lupe')}<p class="level-note">Hasta ${TOTAL_BERRIES} moritas · Con ${WIN_SCORE} aciertos ganás</p></div>
      <div class="moras-board">
        <div class="moras-scene">
          <div class="moras-speech"><span>LUPE DICE</span><p>${message()}</p></div>
          <div class="moras-character" role="img" aria-label="${state.phase === 'drawing' ? 'Lupe busca una mora en el paquete' : state.phase === 'revealing' ? `Lupe muestra una mora ${labels[state.pending.color].toLowerCase()}` : state.phase === 'eating' ? 'Lupe se come la mora' : 'Lupe sonríe con su paquete de moritas'}">
            <div class="moras-sprite"></div>
            <div class="moras-hand-berry ${state.phase === 'revealing' || state.phase === 'eating' ? 'is-visible' : ''}">${berry(state.pending?.color || 'red')}</div>
          </div>
          <div class="moras-scene-note">Un paquete, hasta diez sorpresas</div>
        </div>
        <div class="moras-play">
          <div class="moras-scoreboard"><span class="moras-round">${finished ? 'Partida terminada' : `Mora ${round} de ${TOTAL_BERRIES}`}</span><strong class="moras-score">${state.score} <span>${state.score === 1 ? 'punto' : 'puntos'}</span></strong></div>
          <progress class="moras-progress" max="${WIN_SCORE}" value="${Math.min(WIN_SCORE, state.score)}" aria-label="${state.score} de ${WIN_SCORE} aciertos para ganar">${state.score}</progress>
          <p class="moras-target">${outcome(state) === 'lost' ? 'Ya no quedan suficientes intentos para llegar a 4' : state.score >= WIN_SCORE ? '¡Ya llegaste a la meta!' : `Faltan ${WIN_SCORE - state.score} aciertos para ganar`}</p>
          <div class="moras-controls" ${finished ? 'hidden' : ''}>
            <h2>¿Cuál va a salir?</h2>
            <div class="moras-choices" role="group" aria-label="Elegí el color de la próxima mora">${COLORS.map(color => `<button class="moras-choice moras-choice-${color} ${state.pending?.guess === color ? 'is-picked' : ''}" data-color="${color}" data-focus="moras-${color}" aria-label="Elegir mora ${labels[color].toLowerCase()}" aria-pressed="${state.pending?.guess === color}" ${locked ? 'disabled' : ''}>${berry(color)}<span>${labels[color]}</span><small>${state.pending?.guess === color ? 'Tu elección' : 'Elegir'}</small></button>`).join('')}</div>
          </div>
          <div class="moras-result" ${finished ? '' : 'hidden'}>
            <span class="moras-result-star" aria-hidden="true">${hasWon(state) ? '✦' : '♡'}</span>
            <h2 tabindex="-1" id="moras-result-title">${hasWon(state) ? '¡Ganaste!' : 'Esta vez no ganaste'}</h2>
            <p>Acertaste <strong>${state.score} de ${state.history.length}</strong> moritas.${hasWon(state) ? '<br>¡Llegaste a los 4 aciertos!' : '<br>Ya no alcanzan los intentos. ¡Vamos de nuevo!'}</p>
            <button class="primary-button" data-action="restart" data-focus="moras-restart">${icon('refresh')} Jugar otra vez</button>
          </div>
          <p class="moras-feedback ${last?.correct ? 'is-correct' : ''}" role="status" aria-atomic="true">${state.phase === 'drawing' ? 'Lupe está sacando tu mora…' : finished ? `Partida terminada. ${state.score} puntos. ${hasWon(state) ? '¡Ganaste!' : 'Esta vez no ganaste.'}` : `${last ? `<span class="moras-sr-only">Salió ${labels[last.color].toLowerCase()}. </span>` : ''}${result}`}</p>
          <ol class="moras-history" aria-label="Las diez moritas">${Array.from({ length: TOTAL_BERRIES }, (_, i) => { const entry = state.history[i]; return `<li class="${entry ? 'is-drawn' : ''} ${entry?.correct ? 'is-correct' : ''}" aria-label="Mora ${i + 1}: ${entry ? `${labels[entry.color]}, ${entry.correct ? 'acertaste' : 'sin punto'}` : 'por sacar'}">${entry ? `${berry(entry.color)}<span aria-hidden="true">${entry.correct ? '✓' : '−'}</span>` : `<span aria-hidden="true">${i + 1}</span>`}</li>`; }).join('')}</ol>
          <p class="moras-luck">Es una sorpresa: ¡puede salir cualquiera de las dos!</p>
        </div>
      </div>${finished && hasWon(state) ? confetti() : ''}
    </section>`);
  }

  function complete() {
    state = finishTurn(state);
    render();
    if (state.phase === 'finished') {
      audio.play(hasWon(state) ? ['celebrate', 'won'] : 'lost');
      root.querySelector('#moras-result-title')?.focus({ preventScroll: true });
    } else {
      audio.play('question');
      root.querySelector(`[data-color="${state.history.at(-1).guess}"]`)?.focus({ preventScroll: true });
    }
  }

  function reveal() {
    state = revealBerry(state);
    render();
    const clips = [state.pending.color, state.history.at(-1).correct ? 'correct' : 'miss', `${outcome(state) === 'lost' ? 'ended' : 'score'}-${state.score}`];
    audio.play(clips);
    // Use the actual bundled recordings so the next question never cuts off
    // the spoken score, including when motion is reduced or sound is muted.
    const revealDuration = Math.ceil(clips.reduce((sum, clip) => sum + audioDurations[clip], 0) * 1000) + 350;
    schedule(() => {
      state = eatBerry(state);
      render();
      schedule(complete, reducedMotion.matches ? 700 : 1000);
    }, revealDuration);
  }

  function click(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled || disposed) return;
    if (button.dataset.action === 'restart' && state.phase === 'finished') {
      state = newGame();
      render();
      audio.play('question');
      root.querySelector('[data-color="red"]')?.focus({ preventScroll: true });
    } else if (button.dataset.color && state.phase === 'ready') {
      state = chooseBerry(state, button.dataset.color);
      audio.play('pop');
      render();
      schedule(reveal, reducedMotion.matches ? 300 : 1000);
    }
  }

  const observer = new MutationObserver(onPauseChange);
  if (dialog) observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('visibilitychange', onPauseChange);
  root.addEventListener('click', click);
  render();
  audio.intro();
  return () => {
    disposed = true;
    clearTimeout(timer);
    pendingStep = null;
    observer.disconnect();
    document.removeEventListener('visibilitychange', onPauseChange);
    root.removeEventListener('click', click);
    audio.stop();
  };
}
