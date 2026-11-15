export const MAX_TOTAL = 20;
export const ITEMS = Object.freeze([
  { id: 'apple', singular: 'manzana', plural: 'manzanas' },
  { id: 'pear', singular: 'pera', plural: 'peras' },
  { id: 'cookie', singular: 'galletita', plural: 'galletitas' },
  { id: 'fish', singular: 'pez', plural: 'peces' },
]);

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

export function createExercise(previous = null, random = Math.random) {
  const pairs = [];
  for (let left = 1; left <= 10; left++) {
    for (let right = 1; right <= 10; right++) {
      // Reversing the same two groups still feels like the same exercise.
      if (previous && ((left === previous.left && right === previous.right)
        || (left === previous.right && right === previous.left))) continue;
      pairs.push({ left, right });
    }
  }
  const { left, right } = pick(pairs, random);
  const item = pick(ITEMS.filter(item => item.id !== previous?.item.id), random);
  const total = left + right;
  const alternatives = Array.from({ length: MAX_TOTAL }, (_, i) => i + 1)
    .filter(value => value !== total);
  const choices = [total];
  while (choices.length < 4) {
    const value = pick(alternatives, random);
    choices.push(value);
    alternatives.splice(alternatives.indexOf(value), 1);
  }
  return { left, right, total, item, choices: choices.sort((a, b) => a - b) };
}
