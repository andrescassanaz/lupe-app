import { DIRECTIONS } from './rules.js';

const load = name => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image); image.onerror = reject;
  image.src = new URL(`./assets/images/${name}.png`, import.meta.url).href;
});

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  let sprites, house, ready = false;
  const artwork = Promise.all([load('joey-sprites'), load('house')]).then(([a, b]) => { sprites = a; house = b; ready = true; });
  function draw({ maze, position, direction, hint, won }) {
    const box = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(box.width * ratio)), height = Math.max(1, Math.round(box.height * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 1000, height / 640);
    ctx.setTransform(scale, 0, 0, scale, (width - 1000 * scale) / 2, (height - 640 * scale) / 2);
    const n = maze.size, tw = 740 / n, th = tw * .5;
    const project = (x, y) => ({ x: 456 + (x - y) * tw / 2, y: 225 + (x + y - n + 1) * th / 2 + 125 });
    const poly = (points, color) => {
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    };
    const oval = (x, y, rx, ry, color) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    };
    const ground = [project(-.65, -.65), project(n - .35, -.65), project(n - .35, n - .35), project(-.65, n - .35)];
    poly(ground.map(p => ({ x: p.x, y: p.y + 15 })), '#d0d3ae');
    poly(ground, '#e1e6c9');
    // Warm paths form a continuous floor. Low hedges delineate the actual walls.
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      poly([project(x - .5, y - .5), project(x + .5, y - .5), project(x + .5, y + .5), project(x - .5, y + .5)], (x + y) % 2 ? '#f2e7cb' : '#f5ebd3');
      const p = project(x, y);
      for (let k = 0; k < 9; k++) {
        const a = ((x * 17 + y * 31 + k * 13) % 29) / 29 - .5;
        const b = ((x * 11 + y * 19 + k * 7) % 23) / 23 - .5;
        const dot = project(x + a * .7, y + b * .7);
        oval(dot.x, dot.y, 1.3, .6, '#c9b89155');
      }
      if (x === maze.start.x && y === maze.start.y) {
        oval(p.x, p.y, tw * .24, th * .24, '#d6dfc2');
      }
    }
    const goal = project(maze.goal.x, maze.goal.y);
    oval(goal.x, goal.y, tw * .3, th * .3, '#e1b76d');
    oval(goal.x, goal.y - 1, tw * .23, th * .23, '#f8dfa0');
    if (hint) {
      const p = project(hint.x, hint.y);
      oval(p.x, p.y, tw * .22, th * .22, '#e6b764');
      ctx.fillStyle = '#fffaf0'; ctx.font = `bold ${tw * .25}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('✦', p.x, p.y + tw * .08);
    }
    const walls = [];
    function wall(x1, y1, x2, y2, seed) { walls.push({ a: project(x1, y1), b: project(x2, y2), seed }); }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const exits = maze.cells[y * n + x], seed = x * 23 + y * 47;
      if (!exits.includes('ne')) wall(x - .5, y - .5, x + .5, y - .5, seed);
      if (!exits.includes('nw')) wall(x - .5, y - .5, x - .5, y + .5, seed + 1);
      if (x === n - 1 && y !== 0) wall(x + .5, y - .5, x + .5, y + .5, seed + 2);
      if (y === n - 1) wall(x - .5, y + .5, x + .5, y + .5, seed + 3);
    }
    walls.sort((a, b) => a.a.y + a.b.y - b.a.y - b.b.y);
    for (const { a, b, seed } of walls) {
      ctx.lineCap = 'round'; ctx.lineWidth = tw * .115; ctx.strokeStyle = '#718760';
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 2); ctx.lineTo(b.x, b.y - 2); ctx.stroke();
      const count = 11;
      for (let k = 0; k <= count; k++) {
        const t = k / count, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        const r = tw * (.055 + ((k + seed) % 3) * .006);
        oval(x, y - tw * .065, r, r * .75, ['#9eae7d', '#afba89', '#98aa78'][(k + seed) % 3]);
        oval(x - r * .2, y - tw * .08, r * .42, r * .32, '#ced2a255');
        if ((seed + k) % 13 === 0) {
          oval(x, y - tw * .09, 3.2, 2.8, '#e8bf9d'); oval(x, y - tw * .09, 1.2, 1.2, '#f8e5b0');
        }
      }
    }
    // The house sits outside the northeast exit, leaving the goal tile visible.
    if (ready) {
      const hw = 212, hh = hw * house.height / house.width;
      ctx.drawImage(house, goal.x - 28, goal.y - hh - 8, hw, hh);
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#788563'; ctx.font = '600 16px "Trebuchet MS", sans-serif';
    ctx.fillText('CASA', goal.x + 70, goal.y + 18);
    if (ready) {
      const p = project(position.x, position.y);
      oval(p.x, p.y + 1, tw * .2, tw * .07, '#79654e22');
      const i = DIRECTIONS[direction].sprite, sw = sprites.width / 2, sh = sprites.height / 2;
      // Original sheet: NE, SE / SW, NW. Keep the original alpha and fur texture.
      const dw = tw * .75, dh = dw * sh / sw;
      ctx.drawImage(sprites, (i % 2) * sw, Math.floor(i / 2) * sh, sw, sh, p.x - dw / 2, p.y - dh * .86, dw, dh);
      if (won) {
        ctx.font = '28px sans-serif'; ctx.fillStyle = '#ca8268'; ctx.fillText('♥', p.x, p.y - dh - 8);
      }
    }
  }
  return { ready: artwork, draw };
}
