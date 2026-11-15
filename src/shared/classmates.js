// Keep the family's spelling on screen; accents below guide the recorded voice.
export const CLASSMATES = Object.freeze([
  ['amelia', 'Amelia', 'Amelia'], ['athena', 'Athena', 'Athena'],
  ['benjamin', 'Benjamin', 'Benjamín'], ['charo', 'Charo', 'Charo'],
  ['emilia', 'Emilia', 'Emilia'], ['fermin', 'Fermin', 'Fermín'],
  ['genaro', 'Genaro', 'Genaro'], ['greta', 'Greta', 'Greta'],
  ['julian', 'Julian', 'Julián'], ['lucio', 'Lucio', 'Lucio'],
  ['lupe', 'Lupe', 'Lupe'], ['mateo', 'Mateo', 'Mateo'],
  ['renato', 'Renato', 'Renato'], ['rufina', 'Rufina', 'Rufina'],
  ['tiziano', 'Tiziano', 'Tiziano'], ['valentin', 'Valentin', 'Valentín'],
  ['vitto', 'Vitto', 'Vitto'],
].map(([id, name, spoken]) => Object.freeze({ id, name: name.toUpperCase(), spoken })));

export const INITIALS = Object.freeze([...new Set(CLASSMATES.map(item => item.name[0]))]);
export const ROUND_LENGTH = 5;

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// The deck persists across five-name rounds and level changes. A new cycle
// also avoids repeating the very last name of the previous cycle immediately.
export function createNameDeck(random = Math.random) {
  let remaining = [], previous;
  return () => {
    if (!remaining.length) {
      remaining = shuffled(CLASSMATES, random);
      if (remaining.at(-1).id === previous) [remaining[0], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[0]];
    }
    const item = remaining.pop();
    previous = item.id;
    return item;
  };
}

export function choicesFor(item, mode, count = 3, random = Math.random) {
  const answer = mode === 'initials' ? item.name[0] : item.id;
  const pool = mode === 'initials' ? INITIALS : CLASSMATES.map(person => person.id);
  const size = mode === 'initials' ? 3 : [3, 6, 17].includes(count) ? count : 3;
  return shuffled([answer, ...shuffled(pool.filter(value => value !== answer), random).slice(0, size - 1)], random);
}
