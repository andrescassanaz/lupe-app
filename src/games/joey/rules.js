import { LEVELS } from './levels.js';
export { LEVELS } from './levels.js';

export const DIRECTIONS = Object.freeze({
  ne: { dx: 0, dy: -1, opposite: 'sw', key: 'ArrowUp', label: 'Arriba a la derecha', arrow: '↗', sprite: 0 },
  se: { dx: 1, dy: 0, opposite: 'nw', key: 'ArrowRight', label: 'Abajo a la derecha', arrow: '↘', sprite: 1 },
  sw: { dx: 0, dy: 1, opposite: 'ne', key: 'ArrowDown', label: 'Abajo a la izquierda', arrow: '↙', sprite: 2 },
  nw: { dx: -1, dy: 0, opposite: 'se', key: 'ArrowLeft', label: 'Arriba a la izquierda', arrow: '↖', sprite: 3 },
});

// A spanning tree guarantees a route home and no disconnected garden cells.
export function createMaze(size = 4, random = Math.random) {
  if (!Number.isInteger(size) || size < 4 || size > 12) throw new RangeError('Tamaño de laberinto inválido');
  const cells = Array.from({ length: size * size }, () => []);
  const start = { x: 0, y: size - 1 }, goal = { x: size - 1, y: 0 };
  const stack = [start], seen = new Set([start.y * size + start.x]);
  while (stack.length) {
    const cell = stack.at(-1);
    const options = Object.entries(DIRECTIONS).filter(([, d]) => {
      const x = cell.x + d.dx, y = cell.y + d.dy;
      return x >= 0 && x < size && y >= 0 && y < size && !seen.has(y * size + x);
    });
    if (!options.length) { stack.pop(); continue; }
    const [name, d] = options[Math.min(options.length - 1, Math.floor(random() * options.length))];
    const next = { x: cell.x + d.dx, y: cell.y + d.dy };
    cells[cell.y * size + cell.x].push(name);
    cells[next.y * size + next.x].push(d.opposite);
    seen.add(next.y * size + next.x); stack.push(next);
  }
  return { size, cells, start, goal };
}

export function move(maze, position, direction) {
  if (!DIRECTIONS[direction] || !maze.cells[position.y * maze.size + position.x]?.includes(direction)) return position;
  const d = DIRECTIONS[direction];
  return { x: position.x + d.dx, y: position.y + d.dy };
}
export const atHome = (maze, p) => p.x === maze.goal.x && p.y === maze.goal.y;

export function routeHome(maze, position) {
  const queue = [{ p: position, route: [] }], seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const { p, route } = queue[i];
    if (atHome(maze, p)) return route;
    for (const direction of maze.cells[p.y * maze.size + p.x]) {
      const next = move(maze, p, direction), id = next.y * maze.size + next.x;
      if (!seen.has(id)) { seen.add(id); queue.push({ p: next, route: [...route, direction] }); }
    }
  }
  return [];
}

export function mazeDifficulty(maze) {
  const route = routeHome(maze, maze.start);
  let p = maze.start, turns = 0, branches = 0;
  route.forEach((d, i) => {
    if (i && route[i - 1] !== d) turns++;
    if (maze.cells[p.y * maze.size + p.x].length >= 3) branches++;
    p = move(maze, p, d);
  });
  return { steps: route.length, turns, branches };
}


export function createLevelMaze(level = 1, variant = 0) {
  if (!Number.isInteger(level) || level < 1 || level > LEVELS.length) throw new RangeError('Nivel inválido');
  if (!Number.isInteger(variant) || variant < 0) throw new RangeError('Variante inválida');
  const config = LEVELS[level - 1];
  let value = config.seeds[variant % config.seeds.length];
  const maze = createMaze(config.size, () => ((value = (value * 1664525 + 1013904223) >>> 0) / 2 ** 32));
  return { ...maze, level, variant: variant % config.seeds.length };
}
