export const TOTAL_BERRIES = 10;
export const WIN_SCORE = 4;
export const COLORS = Object.freeze(['red', 'purple']);

export function scoreMessage(score) {
  const points = `Tenés ${score} ${score === 1 ? 'punto' : 'puntos'}.`;
  const left = Math.max(0, WIN_SCORE - score);
  return `${points} ${left ? `Te ${left === 1 ? 'falta' : 'faltan'} adivinar ${left} ${left === 1 ? 'morita' : 'moritas'}.` : '¡Ya llegaste a la meta!'}`;
}

export function newGame() {
  return { phase: 'ready', history: [], score: 0, pending: null };
}

export function outcome(state) {
  if (state.score >= WIN_SCORE) return 'won';
  if (state.score + TOTAL_BERRIES - state.history.length < WIN_SCORE) return 'lost';
  return null;
}

export function chooseBerry(state, guess, random = Math.random) {
  if (state.phase !== 'ready' || state.history.length >= TOTAL_BERRIES || !COLORS.includes(guess)) return state;
  return { ...state, phase: 'drawing', pending: { guess, color: random() < 0.5 ? 'red' : 'purple' } };
}

export function revealBerry(state) {
  if (state.phase !== 'drawing') return state;
  const result = { ...state.pending, correct: state.pending.guess === state.pending.color };
  return { ...state, phase: 'revealing', history: [...state.history, result], score: state.score + Number(result.correct) };
}

export function eatBerry(state) {
  return state.phase === 'revealing' ? { ...state, phase: 'eating' } : state;
}

export function finishTurn(state) {
  if (state.phase !== 'eating') return state;
  return { ...state, pending: null, phase: outcome(state) ? 'finished' : 'ready' };
}

export function hasWon(state) {
  return state.phase === 'finished' && state.score >= WIN_SCORE;
}
