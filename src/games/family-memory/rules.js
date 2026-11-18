import { PEOPLE, LEVELS } from './people.js';

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createPlayers(count = 1, names = []) {
  const size = Number.isInteger(count) ? Math.min(4, Math.max(1, count)) : 1;
  return Array.from({ length: size }, (_, index) => ({
    name: String(names[index] || '').trim().slice(0, 24) || `Jugador ${index + 1}`,
    score: 0,
  }));
}

export function createMemory(count = 12, random = Math.random, players = createPlayers()) {
  const size = LEVELS.includes(count) ? count : 12;
  const people = shuffled(PEOPLE, random).slice(0, size);
  const cards = shuffled([...people, ...people].map((person, id) => ({ id, person: person.id })), random);
  return { cards, selected: [], matched: [], resolving: false,
    players: createPlayers(players.length, players.map(player => player.name)), turn: 0 };
}

export function flipCard(state, id) {
  if (state.resolving || state.selected.includes(id) || state.matched.includes(id) || !state.cards.some(card => card.id === id)) return state;
  const selected = [...state.selected, id];
  return { ...state, selected, resolving: selected.length === 2 };
}

export function resolvePair(state) {
  if (!state.resolving || state.selected.length !== 2) return state;
  const [a, b] = state.selected.map(id => state.cards.find(card => card.id === id));
  const match = a.person === b.person;
  const matched = match ? [...state.matched, ...state.selected] : state.matched;
  const players = state.players.map((player, index) => match && index === state.turn
    ? { ...player, score: player.score + 1 } : player);
  const turn = match ? state.turn : (state.turn + 1) % players.length;
  return { ...state, selected: [], matched, resolving: false, players, turn };
}

export function winners(state) {
  if (state.matched.length !== state.cards.length) return [];
  const high = Math.max(...state.players.map(player => player.score));
  return state.players.flatMap((player, index) => player.score === high ? [index] : []);
}
