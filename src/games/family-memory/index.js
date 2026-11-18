import { PEOPLE, LEVELS } from './people.js';
import { createMemory, createPlayers, flipCard, resolvePair, winners } from './rules.js';
import { fitMemoryGrid } from './layout.js';
import { icon, confetti, escapeHtml } from '../../shared/art.js';
import { replaceView, gameHeading } from '../../shared/ui.js';

const names = new Map(PEOPLE.map(person => [person.id, person.name]));
const portrait = id => new URL(`./assets/images/${id}.png`, import.meta.url).href;
const heart = '<svg class="icon" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor"><path d="M13 23 3.2 13.5C-3 7.5 5.4-1 13 7c7.6-8 16 .5 9.8 6.5Z"/></svg>';
const difficulties = ['Fácil', 'Medio', 'Difícil'];

export function mount(root, { audio }) {
  let count = 12, playerCount = 1, playerNames = ['', '', '', ''];
  let state, screen = 'setup', timer, disposed = false;
  const observer = new ResizeObserver(layoutBoard);

  function layoutBoard() {
    if (disposed) return;
    const board = root.querySelector('.family-board');
    if (!board) return;
    const style = getComputedStyle(board);
    const width = board.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = board.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const layout = fitMemoryGrid(state.cards.length, width, height, parseFloat(style.gap));
    board.style.gridTemplateColumns = `repeat(${layout.columns}, ${layout.cardWidth}px)`;
    board.style.gridTemplateRows = `repeat(${layout.rows}, ${layout.cardHeight}px)`;
    board.style.alignContent = layout.scroll ? 'start' : 'center';
    board.dataset.scroll = String(layout.scroll);
    observer.observe(board);
  }
  const images = PEOPLE.map(person => { const image = new Image(); image.src = portrait(person.id); image.decode().catch(() => {}); return image; });

  function outcome() {
    const winning = winners(state);
    if (state.players.length === 1) return '¡Ganaste! Encontraste todos los pares.';
    const labels = winning.map(index => state.players[index].name);
    const score = state.players[winning[0]].score;
    return winning.length === 1
      ? `¡Ganó ${labels[0]}! ${score} ${score === 1 ? 'par' : 'pares'}.`
      : `¡Empate entre ${labels.join(' y ')}! ${score} pares cada uno.`;
  }

  function renderSetup() {
    return `<form class="family-setup" data-region="setup">
      <fieldset><legend>Dificultad</legend><div class="family-choices family-levels">${LEVELS.map((size, index) => `<button type="button" class="secondary-button" data-level="${size}" data-focus="level-${size}" aria-pressed="${count === size}"><strong>${difficulties[index]}</strong><small>${index === 2 ? 'Todas · ' : ''}${size} figuras</small></button>`).join('')}</div></fieldset>
      <fieldset><legend>Jugadores</legend><div class="family-choices family-player-count">${[1, 2, 3, 4].map(size => `<button type="button" class="secondary-button" data-players="${size}" data-focus="players-${size}" aria-label="${size} ${size === 1 ? 'jugador' : 'jugadores'}" aria-pressed="${playerCount === size}">${size}</button>`).join('')}</div></fieldset>
      ${playerCount > 1 ? `<fieldset class="family-names"><legend>Nombres <span>(opcional)</span></legend><div class="family-name-inputs">${Array.from({ length: playerCount }, (_, index) => `<label for="family-player-${index}">Jugador ${index + 1}<input id="family-player-${index}" data-name="${index}" data-focus="name-${index}" maxlength="24" autocomplete="off" placeholder="Jugador ${index + 1}" value="${escapeHtml(playerNames[index])}"></label>`).join('')}</div></fieldset>` : ''}
      <p class="family-setup-hint">${playerCount > 1 ? 'Cada par suma un punto y te deja seguir. Si no coinciden, pasa el turno.' : 'Encontrá las dos tarjetas de cada figura.'}</p>
      <button class="primary-button family-start" type="submit">¡A jugar! ${icon('arrow')}</button>
    </form>`;
  }

  function renderRound() {
    const winning = winners(state), won = winning.length > 0;
    return `<div class="family-toolbar" data-region="round-controls">
      <button class="secondary-button family-options" data-action="options" data-focus="options">Opciones</button>
      <div class="family-standing">
        <div class="family-round-status" role="status">${escapeHtml(won ? outcome() : state.players.length > 1 ? `Turno de ${state.players[state.turn].name}` : `${difficulties[LEVELS.indexOf(count)]} · ${count} figuras`)}</div>
        <div class="family-scores" aria-label="Puntajes">${state.players.map((player, index) => `<div class="family-score ${!won && state.turn === index ? 'current' : ''} ${won && winning.includes(index) ? 'winner' : ''}" data-player="${index}" ${!won && state.turn === index ? 'aria-current="true"' : ''} aria-label="${escapeHtml(player.name)}: ${player.score} ${player.score === 1 ? 'par' : 'pares'}"><span>${escapeHtml(player.name)}</span><strong>${player.score}</strong></div>`).join('')}</div>
      </div>
      ${won ? `<button class="primary-button family-replay" data-action="replay" data-focus="replay" aria-label="Jugar otra vez">${icon('refresh')} <span>Otra vez</span></button>` : `<div class="family-progress" aria-label="${state.matched.length / 2} de ${count} pares encontrados"><span aria-hidden="true">${heart}</span><span>${state.matched.length / 2} / ${count}</span></div>`}
      </div>
      <div class="family-board" data-region="board" aria-label="Cartas del memotest de familia">${state.cards.map((card, index) => {
        const matched = state.matched.includes(card.id);
        const faceUp = matched || state.selected.includes(card.id);
        const name = escapeHtml(names.get(card.person));
        return `<button class="family-card ${faceUp ? 'face-up' : ''} ${matched ? 'matched' : ''}" data-card="${card.id}" data-person="${card.person}" data-focus="card-${card.id}" aria-label="Carta ${index + 1}${faceUp ? `: ${name}${matched ? ', par encontrado' : ''}` : ': boca abajo'}" aria-pressed="${faceUp}" ${matched ? 'disabled' : ''}>
          <span class="family-card-inner" aria-hidden="true"><span class="family-card-back">${heart}<span>✦</span></span>
          <span class="family-card-front"><img src="${portrait(card.person)}" alt="" draggable="false">${matched ? `<span class="family-check">${icon('check')}</span>` : ''}</span></span>
        </button>`;
      }).join('')}</div>${won ? confetti() : ''}`;
  }

  function render() {
    replaceView(root, `<section class="game family-memory-game" data-pairs="${count}" data-stage="${screen}" aria-labelledby="game-title">
      <div class="game-heading">${gameHeading('Memotest de familia')}</div>
      ${screen === 'setup' ? renderSetup() : renderRound()}
    </section>`);
    layoutBoard();
  }

  function start() {
    clearTimeout(timer); observer.disconnect();
    state = createMemory(count, Math.random, createPlayers(playerCount, playerNames));
    screen = 'round'; render(); audio.intro();
    root.querySelector('#game-title')?.focus({ preventScroll: true });
  }

  function announceWinner() {
    const winning = winners(state);
    // Custom names stay on the device. Recorded player numbers also work
    // offline on browsers without an installed Spanish speech voice.
    if (state.players.length === 1) audio.play(['win-solo', 'celebrate']);
    else if (audio.speechSupported && audio.spanishVoice() && winning.some(index => state.players[index].name !== `Jugador ${index + 1}`)) audio.speak(outcome());
    else if (winning.length > 1) audio.play(['win-tie', 'celebrate']);
    else {
      audio.play([`win-player-${winning[0] + 1}`, 'celebrate']);
    }
  }

  function handleClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled || !root.contains(button)) return;
    if (screen === 'setup') {
      if (button.dataset.level && LEVELS.includes(Number(button.dataset.level))) count = Number(button.dataset.level);
      else if (button.dataset.players) playerCount = Number(button.dataset.players);
      else return;
      render(); return;
    }
    if (button.dataset.action === 'options') {
      clearTimeout(timer); observer.disconnect(); audio.stop(); screen = 'setup'; render();
      root.querySelector(`[data-level="${count}"]`)?.focus({ preventScroll: true }); return;
    }
    if (button.dataset.action === 'replay') { start(); return; }
    if (!button.hasAttribute('data-card')) return;
    const next = flipCard(state, Number(button.dataset.card));
    if (next === state) return;
    state = next; audio.play('pop'); render();
    if (!state.resolving) return;
    const [first, second] = state.selected.map(id => state.cards.find(card => card.id === id));
    const match = first.person === second.person;
    if (match && state.matched.length + 2 === state.cards.length) {
      // Announce in the tap that completes the game so mobile speech remains
      // unlocked. The stable card elements still finish their flip animation.
      state = resolvePair(state); render(); announceWinner();
      root.querySelector('[data-action="replay"]')?.focus({ preventScroll: true }); return;
    }
    if (match) audio.play(`person-${first.person}`);
    timer = setTimeout(() => {
      if (disposed || screen !== 'round') return;
      state = resolvePair(state); render();
    }, match ? 550 : 850);
  }

  function handleInput(event) {
    if (event.target.matches('[data-name]')) playerNames[Number(event.target.dataset.name)] = event.target.value;
  }
  function handleSubmit(event) { if (event.target.matches('.family-setup')) { event.preventDefault(); start(); } }
  render(); root.addEventListener('click', handleClick); root.addEventListener('input', handleInput); root.addEventListener('submit', handleSubmit);
  return () => {
    disposed = true; observer.disconnect(); clearTimeout(timer); images.length = 0;
    root.removeEventListener('click', handleClick); root.removeEventListener('input', handleInput); root.removeEventListener('submit', handleSubmit); audio.stop();
  };
}
