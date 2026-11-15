export const ANIMALS = Object.freeze(['dog', 'cat', 'cow', 'bunny', 'bear', 'fox', 'pig', 'frog', 'lion', 'panda', 'owl', 'penguin']);

export function createDeck(random = Math.random) {
  const cards = [...ANIMALS, ...ANIMALS].map((animal, id) => ({ id, animal }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createMemory(random = Math.random) {
  return { cards: createDeck(random), selected: [], matched: [], resolving: false };
}

export function flipCard(state, id) {
  if (state.resolving || state.selected.includes(id) || state.matched.includes(id) || !state.cards.some(c => c.id === id)) return state;
  const selected = [...state.selected, id];
  return { ...state, selected, resolving: selected.length === 2 };
}

export function resolvePair(state) {
  if (!state.resolving || state.selected.length !== 2) return state;
  const [a, b] = state.selected.map(id => state.cards.find(c => c.id === id));
  const matched = a.animal === b.animal ? [...state.matched, ...state.selected] : state.matched;
  return { ...state, selected: [], matched, resolving: false };
}

