import { gameHeading } from '../../shared/ui.js';
import { icon } from '../../shared/art.js';
import { createScene, project } from './scene.js';
import { DURATION, clamp, difficulty, launchFromSwipe, remainingTime, stepBall } from './rules.js';

export function mount(root, { audio }) {
  root.innerHTML = `<section class="game basketball-game">
    <div class="game-heading">${gameHeading('Básquet')}</div>
    <div class="basketball-toolbar">
      <div class="basketball-counter"><span>Puntos</span><output class="basketball-score" aria-label="Puntos">0</output></div>
      <p class="basketball-level">¡A jugar!</p>
      <div class="basketball-clock"><span>Tiempo</span><output aria-label="Tiempo restante">1:00</output></div>
      <button class="icon-button basketball-pause" aria-label="Pausar partida" disabled>${icon('stop')}</button>
    </div>
    <div class="basketball-court">
      <canvas class="basketball-canvas" tabindex="0" aria-label="Cancha de básquet. Deslizá hacia arriba desde la pelota para lanzar. Con teclado: flechas para apuntar y mantené espacio un instante para lanzar." aria-describedby="basketball-help"></canvas>
      <div class="basketball-feedback" role="status" aria-live="polite"></div>
      <div class="basketball-overlay">
        <div class="basketball-card">
          <span class="basketball-eyebrow">UN MINUTO EN LA CANCHA</span>
          <h2>¡Al aro!</h2>
          <p>Deslizá desde la pelota hacia arriba.<br>Más largo y más rápido, más lejos.</p>
          <p class="basketball-card-note">Apuntá hacia los costados con tu gesto.<br>Cada canasta suma <strong>2 puntos</strong>.</p>
          <button class="primary-button" data-basketball="start" disabled>Preparando cancha…</button>
        </div>
      </div>
    </div>
    <p class="basketball-help" id="basketball-help">Deslizá la pelota hacia el aro · ¡Los animalitos te alientan!</p>
  </section>`;
  const canvas = root.querySelector('canvas');
  const scene = createScene(canvas);
  const overlay = root.querySelector('.basketball-overlay');
  const scoreNode = root.querySelector('.basketball-score');
  const clock = root.querySelector('.basketball-clock output');
  const level = root.querySelector('.basketball-level');
  const feedback = root.querySelector('.basketball-feedback');
  const pauseButton = root.querySelector('.basketball-pause');
  let state = 'ready', score = 0, elapsed = 0, shots = 0;
  let ball = null, drag = null, keyStart = null, keyboardAim = 0;
  let phase = 0, amplitude = 0, hoopX = 0, cheer = 0, feedbackTime = 0, nextBall = 0;
  let frame = 0, previousTime = null, disposed = false;

  function cancelGesture() {
    const pointerId = drag?.id;
    drag = null; keyStart = null;
    if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  }
  function message(text, seconds = 1.5) { feedback.textContent = text; feedbackTime = seconds; }
  function updateCounters() {
    scoreNode.textContent = score;
    const seconds = Math.ceil(remainingTime(elapsed));
    clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    root.querySelector('.basketball-clock').classList.toggle('is-ending', seconds <= 10);
    level.textContent = score < 4 ? '¡Apuntá al aro!' : score < 12 ? 'El aro se mueve' : '¡El aro va más rápido!';
  }
  function start() {
    cancelGesture();
    score = 0; elapsed = 0; shots = 0; ball = null; nextBall = 0;
    phase = 0; amplitude = 0; hoopX = 0; cheer = 0; keyboardAim = 0;
    state = 'playing'; previousTime = performance.now();
    overlay.hidden = true; pauseButton.disabled = false;
    feedback.textContent = ''; feedbackTime = 0;
    audio.stop(); updateCounters(); canvas.focus({ preventScroll: true });
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; cancelGesture(); audio.stop(); pauseButton.disabled = true;
    overlay.hidden = false;
    overlay.innerHTML = `<div class="basketball-card"><span class="basketball-eyebrow">UN RESPIRO</span><h2>Partida en pausa</h2><p>Tu tiempo y tus puntos te esperan.</p><button class="primary-button" data-basketball="resume">Seguir jugando ${icon('play')}</button></div>`;
    overlay.querySelector('button').focus({ preventScroll: true });
  }
  function finish() {
    if (state !== 'playing') return;
    state = 'finished'; elapsed = DURATION; cancelGesture(); pauseButton.disabled = true;
    updateCounters(); feedback.textContent = '';
    overlay.hidden = false;
    overlay.innerHTML = `<div class="basketball-card basketball-result"><span class="basketball-eyebrow">¡TIEMPO!</span><h2>¡Qué lindo partido!</h2><div class="basketball-final-score">${score}<span>puntos</span></div><p>${score / 2} ${score === 2 ? 'canasta' : 'canastas'} · ${shots} ${shots === 1 ? 'lanzamiento' : 'lanzamientos'}</p><p class="basketball-card-note">¡Tus amigos te aplauden!</p><button class="primary-button" data-basketball="start">Jugar otra vez ${icon('refresh')}</button></div>`;
    audio.play('celebrate');
    overlay.querySelector('button').focus({ preventScroll: true });
  }
  function throwBall(dx, up, seconds) {
    if (state !== 'playing' || ball || nextBall > 0) return;
    const launched = launchFromSwipe(dx, up, seconds);
    if (!launched) { message('Deslizá hacia arriba desde la pelota'); return; }
    ball = launched; shots++; audio.play('pop'); feedback.textContent = '';
  }
  function coordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function pointerDown(event) {
    if (state !== 'playing' || ball || nextBall > 0 || drag || !event.isPrimary || event.button !== 0) return;
    const point = coordinates(event), target = project(0, .7, 0, scene.width, scene.height);
    if (Math.hypot(point.x - target.x, point.y - target.y) > Math.max(32, target.scale * .31)) return;
    event.preventDefault(); canvas.focus({ preventScroll: true });
    drag = { id: event.pointerId, start: point, end: point, time: performance.now() };
    canvas.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (event.pointerId !== drag?.id) return;
    event.preventDefault(); drag.end = coordinates(event);
  }
  function pointerUp(event) {
    if (event.pointerId !== drag?.id) return;
    event.preventDefault();
    const current = drag, end = coordinates(event), seconds = (performance.now() - current.time) / 1000;
    cancelGesture();
    throwBall((end.x - current.start.x) / scene.height, (current.start.y - end.y) / scene.height, seconds);
  }
  function pointerCancel(event) { if (event.pointerId === drag?.id) cancelGesture(); }
  function keyDown(event) {
    if (state !== 'playing') return;
    if (event.code === 'Escape') { event.preventDefault(); pause(); }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.code)) {
      event.preventDefault();
      keyboardAim = event.code === 'ArrowUp' ? 0 : clamp(keyboardAim + (event.code === 'ArrowLeft' ? -.025 : .025), -.18, .18);
      message(keyboardAim === 0 ? 'Apuntás al centro' : keyboardAim < 0 ? 'Apuntás a la izquierda' : 'Apuntás a la derecha');
    }
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat && !ball && keyStart === null) keyStart = performance.now();
    }
  }
  function keyUp(event) {
    if (event.code !== 'Space' || keyStart === null) return;
    event.preventDefault();
    const hold = clamp((performance.now() - keyStart) / 1000, .08, .8);
    keyStart = null;
    // Longer key holds correspond to a longer gesture, with the same physics.
    throwBall(keyboardAim, .13 + hold * .625, .24);
  }
  function click(event) {
    if (event.target.closest('.basketball-pause')) pause();
    const action = event.target.closest('[data-basketball]')?.dataset.basketball;
    if (action === 'start') start();
    if (action === 'resume' && state === 'paused') {
      state = 'playing'; previousTime = performance.now(); overlay.hidden = true; pauseButton.disabled = false;
      audio.stop(); canvas.focus({ preventScroll: true });
    }
  }
  function globalClick(event) {
    if (event.target.closest('[data-global="adults"], [data-global="instructions"]')) pause();
  }
  function visibility() { if (document.hidden) pause(); }
  function draw() {
    scene.draw({ ball, hoopX, time: elapsed, cheer, ready: state === 'playing' && !ball && nextBall === 0, dragging: !!drag });
  }
  function resize() { cancelGesture(); scene.resize(); draw(); }

  function tick(now) {
    if (disposed) return;
    const dt = previousTime === null ? 0 : Math.max(0, (now - previousTime) / 1000);
    previousTime = now;
    if (state === 'playing') {
      const available = Math.min(dt, remainingTime(elapsed));
      // Fixed maximum step keeps rim collisions and movement independent of FPS.
      let left = available;
      while (left > .000001) {
        const step = Math.min(1 / 120, left); left -= step; elapsed += step;
        const settings = difficulty(score);
        const limit = Math.max(.2, scene.width / scene.height * 3.7 - 1.5);
        amplitude += (Math.min(settings.amplitude, limit) - amplitude) * Math.min(1, step * 2);
        phase += settings.speed * step; hoopX = Math.sin(phase) * amplitude;
        cheer = Math.max(0, cheer - step);
        nextBall = Math.max(0, nextBall - step);
        feedbackTime = Math.max(0, feedbackTime - step);
        if (ball) {
          if (stepBall(ball, step, hoopX)) {
            score += 2; cheer = 1.4; message('¡Canasta! +2', 1.4); audio.play('celebrate');
          }
          if (ball.age > 3 || (ball.bounced && ball.age > 1.5) || (ball.scored && ball.y < 1.9)) {
            if (!ball.scored) message('¡Probá otra vez!', .9);
            ball = null; nextBall = .15;
          }
        }
      }
      if (feedbackTime === 0) feedback.textContent = '';
      updateCounters();
      if (remainingTime(elapsed) < .00001) finish();
    }
    draw();
    // Read-only scene state also makes real input/physics integration testable.
    canvas.dataset.state = state;
    canvas.dataset.ball = ball ? 'flying' : nextBall > 0 ? 'waiting' : 'ready';
    canvas.dataset.hoopX = hoopX.toFixed(3);
    frame = requestAnimationFrame(tick);
  }

  const observer = new ResizeObserver(resize); observer.observe(canvas);
  root.addEventListener('click', click);
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerCancel);
  canvas.addEventListener('lostpointercapture', pointerCancel);
  canvas.addEventListener('keydown', keyDown); canvas.addEventListener('keyup', keyUp);
  document.addEventListener('click', globalClick, true);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('blur', pause);
  scene.resize(); frame = requestAnimationFrame(tick); audio.intro();
  scene.ready.then(() => {
    if (disposed) return;
    const startButton = overlay.querySelector('[data-basketball="start"]');
    startButton.disabled = false; startButton.innerHTML = `Jugar ${icon('play')}`;
    canvas.dataset.artwork = 'ready'; draw();
  }).catch(() => {
    if (disposed) return;
    message('No se pudo cargar la cancha. Volvé al inicio.', Infinity);
  });
  return () => {
    disposed = true; cancelGesture(); cancelAnimationFrame(frame); observer.disconnect();
    root.removeEventListener('click', click);
    canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerCancel);
    canvas.removeEventListener('lostpointercapture', pointerCancel);
    canvas.removeEventListener('keydown', keyDown); canvas.removeEventListener('keyup', keyUp);
    document.removeEventListener('click', globalClick, true); document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('blur', pause); audio.stop();
  };
}
