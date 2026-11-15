import { art } from './art.js';
import { ANIMALS, createMemory, flipCard, resolvePair } from './rules.js';
import { icon, confetti } from '../../shared/art.js';
import { replaceView } from '../../shared/ui.js';

const names = { dog: 'Perro', cat: 'Gato', cow: 'Vaca', bunny: 'Conejo', bear: 'Oso', fox: 'Zorro', pig: 'Chancho', frog: 'Rana', lion: 'León', panda: 'Panda', owl: 'Búho', penguin: 'Pingüino' };

export function mount(root, { audio }) {
  let state = createMemory();
  let timer;
  let disposed = false;

  function render() {
    const won = state.matched.length === state.cards.length;
    replaceView(root, `<section class="game memory-game" aria-labelledby="game-title">
      <div class="game-heading"><span class="eyebrow">DE A DOS ES MÁS DIVERTIDO</span><h1 id="game-title">Memotest de animales</h1><p class="level-note">12 pares de animales · 24 cartas para descubrir</p></div>
      <div class="memory-progress" aria-label="${state.matched.length / 2} de ${ANIMALS.length} pares encontrados">${ANIMALS.map((animal, i) => `<span class="pair-dot ${state.matched.length / 2 > i ? 'found' : ''}">${icon('paw')}</span>`).join('')}</div>
      <div class="memory-board" aria-label="Cartas del memotest">${state.cards.map((card, index) => {
        const matched = state.matched.includes(card.id);
        const faceUp = matched || state.selected.includes(card.id);
        return `<button class="memory-card ${faceUp ? 'face-up' : ''} ${matched ? 'matched' : ''} animal-${card.animal}" data-card="${card.id}" data-focus="card-${card.id}" aria-label="Carta ${index + 1}${faceUp ? `: ${names[card.animal]}${matched ? ', par encontrado' : ''}` : ': boca abajo'}" aria-pressed="${faceUp}" ${matched ? 'disabled' : ''}>
          <span class="card-back" aria-hidden="true">${icon('paw')}<span class="card-doodle">✦</span></span>
          <span class="card-front" aria-hidden="true">${art(card.animal)}${matched ? `<span class="matched-check">${icon('check')}</span>` : ''}</span>
        </button>`;
      }).join('')}</div>
      <div class="memory-bottom">${won
        ? `<p class="win-message" role="status">¡Encontraste a todos!</p><button class="play-again" data-action="replay">${icon('refresh')} ¡Otra vez!</button>`
        : `<p class="game-message" role="status">Tocá dos cartas y encontrá los compañeros</p><button class="small-listen" data-action="listen" aria-label="Escuchar cómo jugar">${icon('sound')}</button>`}
      </div>${won ? confetti() : ''}
    </section>`);
  }

  function handleClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'listen') { audio.play('memory-intro'); return; }
    if (button.dataset.action === 'replay') {
      clearTimeout(timer); state = createMemory(); render(); audio.play('memory-intro'); return;
    }
    if (!button.hasAttribute('data-card')) return;
    const next = flipCard(state, Number(button.dataset.card));
    if (next === state) return;
    state = next; audio.play('pop'); render();
    if (!state.resolving) return;
    const [first, second] = state.selected.map(id => state.cards.find(c => c.id === id));
    const match = first.animal === second.animal;
    if (match) audio.play(`animal-${first.animal}`);
    timer = setTimeout(() => {
      if (disposed) return;
      state = resolvePair(state); render();
      if (state.matched.length === state.cards.length) audio.play('celebrate');
    }, match ? 550 : 850);
  }
  render(); audio.play('memory-intro');
  root.addEventListener('click', handleClick);
  return () => { disposed = true; clearTimeout(timer); root.removeEventListener('click', handleClick); };
}
