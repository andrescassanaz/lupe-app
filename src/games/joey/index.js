import { gameHeading } from '../../shared/ui.js';
import { icon } from '../../shared/art.js';
import { DIRECTIONS, LEVELS, createLevelMaze, move, atHome, routeHome } from './rules.js';
import { createScene } from './scene.js';

export function mount(root, { audio }) {
  root.innerHTML = `<section class="game joey-game">
    <div class="game-heading">${gameHeading('Joey vuelve a casa')}</div>
    <div class="joey-toolbar">
      <div class="joey-levels" role="group" aria-label="Niveles del laberinto">
        ${LEVELS.map(({ level }) => `<button data-level="${level}" aria-label="Nivel ${level} de 10" aria-pressed="${level === 1}">${level}</button>`).join('')}
      </div>
      <button class="secondary-button joey-new" data-action="new" aria-label="Crear otro laberinto">${icon('refresh')}<span>Otro camino</span></button>
    </div>
    <div class="joey-play">
      <div class="joey-garden">
        <span class="joey-garden-label">NIVEL 1 DE 10</span>
        <canvas class="joey-canvas" tabindex="0" aria-label="Laberinto de Joey. Usá las cuatro flechas de dirección o las flechas del teclado." aria-describedby="joey-message"></canvas>
        <div class="joey-arrival" hidden><div><span>♥</span><h2>¡Llegamos a casa!</h2><p>¡Muy bien, Lupe!</p><button class="primary-button" data-action="next">Siguiente nivel ${icon('arrow')}</button></div></div>
      </div>
      <aside class="joey-controls" aria-label="Controles de Joey">
        <div class="joey-control-copy"><span class="eyebrow">PASITO A PASITO</span><p>Llevá a Joey<br>hasta su casa</p></div>
        <div class="joey-pad" role="group" aria-label="Cuatro direcciones">
          ${['nw', 'ne', 'sw', 'se'].map(d => `<button data-direction="${d}" aria-label="${DIRECTIONS[d].label}" title="${DIRECTIONS[d].label}" disabled><span aria-hidden="true">${DIRECTIONS[d].arrow}</span></button>`).join('')}
        </div>
        <button class="secondary-button joey-hint" data-action="hint" disabled>✦ Una ayudita</button>
        <p class="joey-keyboard">También podés usar<br>las flechas del teclado</p>
      </aside>
    </div>
    <p class="joey-message" id="joey-message" role="status" aria-live="polite">Preparando el laberinto…</p>
  </section>`;
  const canvas = root.querySelector('canvas'), scene = createScene(canvas);
  const arrival = root.querySelector('.joey-arrival'), message = root.querySelector('.joey-message');
  let level = 1, variant = Math.floor(Math.random() * 24);
  let maze = createLevelMaze(level, variant), position = { ...maze.start }, direction = 'ne', hint = null;
  let won = false, disposed = false, loaded = false, frame = 0, animation = null, lastMove = 0;
  let holdDelay = 0, holdRepeat = 0, held = null, suppressClick = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function draw(time = performance.now()) {
    if (disposed) return;
    let visible = position;
    if (animation) {
      const t = Math.min(1, (time - animation.start) / 145), ease = 1 - (1 - t) ** 2;
      visible = { x: animation.from.x + (position.x - animation.from.x) * ease, y: animation.from.y + (position.y - animation.from.y) * ease };
      if (t === 1) animation = null;
    }
    scene.draw({ maze, position: visible, direction, hint, won });
    canvas.dataset.position = `${position.x},${position.y}`;
    canvas.dataset.level = level; canvas.dataset.variant = maze.variant;
    canvas.dataset.direction = direction; canvas.dataset.state = won ? 'won' : loaded ? 'playing' : 'loading';
    if (animation) frame = requestAnimationFrame(draw);
  }
  function render() { cancelAnimationFrame(frame); draw(); }
  function stopHold() {
    clearTimeout(holdDelay); clearInterval(holdRepeat); held = null;
  }
  function step(d) {
    if (!loaded || won || disposed || document.querySelector('dialog[open]')) return;
    const now = performance.now();
    if (now - lastMove < 135) return;
    lastMove = now; direction = d;
    const next = move(maze, position, d);
    if (next === position) { message.textContent = 'Por ahí hay un arbustito. ¡Probá otra flecha!'; render(); return; }
    hint = null; animation = reducedMotion.matches ? null : { from: position, start: now };
    position = next;
    root.querySelectorAll('button[data-direction]').forEach(button => button.classList.remove('is-hint'));
    won = atHome(maze, position);
    message.textContent = won ? '¡Joey llegó a casa! ¡Muy bien, Lupe!' : '¡Vamos, Joey! Seguí el caminito hasta casa.';
    if (won) {
      stopHold(); audio.play('celebrate'); arrival.hidden = false;
      arrival.querySelector('h2').textContent = level === 10 ? '¡Superaste el nivel 10!' : '¡Llegamos a casa!';
      arrival.querySelector('p').textContent = `Nivel ${level} completado. ¡Muy bien, Lupe!`;
      arrival.querySelector('button').innerHTML = `${level === 10 ? 'Volver al nivel 1' : 'Siguiente nivel'} ${icon('arrow')}`;
      root.querySelectorAll('button[data-direction], [data-action="hint"]').forEach(button => { button.disabled = true; });
      arrival.querySelector('button').focus({ preventScroll: true });
    }
    render();
  }
  function restart(nextLevel = level) {
    stopHold(); cancelAnimationFrame(frame); audio.stop();
    level = nextLevel; variant++;
    maze = createLevelMaze(level, variant); position = { ...maze.start }; direction = 'ne'; hint = null; won = false; animation = null; lastMove = 0;
    arrival.hidden = true;
    root.querySelectorAll('button[data-level]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.level) === level)));
    root.querySelector('.joey-garden-label').textContent = `NIVEL ${level} DE 10`;
    root.querySelectorAll('button[data-direction], [data-action="hint"]').forEach(button => { button.disabled = !loaded; button.classList.remove('is-hint'); });
    message.textContent = loaded ? `Nivel ${level} de 10. ¡Llevá a Joey hasta casa!` : 'Preparando el laberinto…';
    render();
  }
  function click(event) {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.dataset.direction) {
      if (suppressClick && event.detail > 0) { suppressClick = false; return; }
      step(button.dataset.direction);
    }
    if (button.dataset.level) restart(Number(button.dataset.level));
    if (button.dataset.action === 'new') restart();
    if (button.dataset.action === 'next' && won) {
      restart(level === 10 ? 1 : level + 1); canvas.focus({ preventScroll: true });
    }
    if (button.dataset.action === 'hint' && loaded && !won) {
      const next = routeHome(maze, position)[0];
      hint = move(maze, position, next);
      root.querySelectorAll('button[data-direction]').forEach(b => b.classList.toggle('is-hint', b.dataset.direction === next));
      message.textContent = 'Seguí la estrellita: ' + DIRECTIONS[next].label.toLowerCase() + '.';
      render();
    }
  }
  function pointerDown(event) {
    const button = event.target.closest('button[data-direction]');
    if (!button || button.disabled || !event.isPrimary || event.button !== 0) return;
    stopHold(); suppressClick = true; held = event.pointerId;
    button.setPointerCapture(event.pointerId); step(button.dataset.direction);
    holdDelay = setTimeout(() => { holdRepeat = setInterval(() => step(button.dataset.direction), 210); }, 340);
  }
  function pointerEnd(event) { if (event.pointerId === held) stopHold(); }
  function keydown(event) {
    const d = Object.keys(DIRECTIONS).find(d => DIRECTIONS[d].key === event.key);
    if (!d || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault(); suppressClick = false; step(d);
  }
  function hide() { if (document.hidden) stopHold(); }
  function globalClick(event) { if (event.target.closest('[data-global]')) stopHold(); }
  root.addEventListener('click', click); root.addEventListener('pointerdown', pointerDown);
  root.addEventListener('pointerup', pointerEnd); root.addEventListener('pointercancel', pointerEnd); root.addEventListener('lostpointercapture', pointerEnd);
  root.addEventListener('keydown', keydown);
  document.addEventListener('visibilitychange', hide); document.addEventListener('click', globalClick, true); window.addEventListener('blur', stopHold);
  const observer = new ResizeObserver(render); observer.observe(canvas);
  render(); audio.intro();
  scene.ready.then(() => {
    if (disposed) return;
    loaded = true; canvas.dataset.artwork = 'ready';
    root.querySelectorAll('button[data-direction], [data-action="hint"]').forEach(button => { button.disabled = false; });
    message.textContent = 'Tocá las flechas para acompañar a Joey.';
    render(); canvas.focus({ preventScroll: true });
  }).catch(() => { if (!disposed) message.textContent = 'No se pudieron cargar las imágenes. Volvé al inicio para intentar otra vez.'; });
  return () => {
    disposed = true; stopHold(); cancelAnimationFrame(frame); observer.disconnect(); audio.stop();
    root.removeEventListener('click', click); root.removeEventListener('pointerdown', pointerDown);
    root.removeEventListener('pointerup', pointerEnd); root.removeEventListener('pointercancel', pointerEnd); root.removeEventListener('lostpointercapture', pointerEnd);
    root.removeEventListener('keydown', keydown);
    document.removeEventListener('visibilitychange', hide); document.removeEventListener('click', globalClick, true); window.removeEventListener('blur', stopHold);
  };
}
