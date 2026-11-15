import { BALL_RADIUS, HOOP } from './rules.js';

export function project(x, y, z, width, height) {
  const scale = height * .4 / (1 + Math.max(-.5, z) * .28);
  return { x: width / 2 + x * scale, y: height * .49 + (1.6 - y) * scale, scale };
}

// Canvas positions the generated PNG artwork and projects the moving sprites.
// The stadium, spectators, court, ball and goal are all AI images.
export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  const pictures = Object.fromEntries(['court', 'ball', 'hoop'].map(name => {
    const img = new Image();
    img.src = new URL(`./assets/images/${name}-ai.png`, import.meta.url).href;
    return [name, img];
  }));
  let width = 1, height = 1;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const loaded = img => img.complete && img.naturalWidth > 0;
  const p = (x, y, z) => project(x, y, z, width, height);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  }
  function background() {
    const img = pictures.court;
    if (!loaded(img)) { ctx.fillStyle = '#f1dfc5'; ctx.fillRect(0, 0, width, height); return; }
    // Preserve proportions; the stands/court boundary stays near mid-height.
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (width - w) / 2, (height - h) * .54, w, h);
  }
  function goal(hoopX, front = false) {
    const img = pictures.hoop;
    if (!loaded(img)) return;
    const rim = p(hoopX, HOOP.y, HOOP.z);
    // Measured in the generated 1024×1536 PNG: center (506,665), width 540.
    // Physics and the painted opening therefore share the same anchor.
    const scale = HOOP.radius * 2 * rim.scale / 540;
    const x = rim.x - 506 * scale, y = rim.y - 665 * scale;
    if (front) {
      ctx.drawImage(img, 234, 690, 550, 60, x + 234 * scale, y + 690 * scale, 550 * scale, 60 * scale);
    } else ctx.drawImage(img, x, y, 1024 * scale, 1536 * scale);
  }
  function drawBall(ball, time, ready, dragging) {
    const img = pictures.ball;
    const point = p(ball.x, ball.y, ball.z), radius = point.scale * BALL_RADIUS;
    const floor = p(ball.x, 0, ball.z);
    // Dynamic contact shadow is a lighting effect, not an illustration.
    ctx.save(); ctx.translate(floor.x, Math.min(height * .965, floor.y)); ctx.scale(radius * 1.2, radius * .22);
    const shadow = ctx.createRadialGradient(0, 0, .1, 0, 0, 1);
    shadow.addColorStop(0, '#79522e35'); shadow.addColorStop(1, '#79522e00');
    ctx.fillStyle = shadow; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    if (!loaded(img)) return;
    ctx.save(); ctx.translate(point.x, point.y);
    if (ready && !dragging && !reducedMotion.matches) ctx.translate(0, Math.sin(time * 3) * 2);
    ctx.rotate(ready ? -.15 : ball.age * 2.5);
    const diameter = radius * 2 / .945;
    ctx.drawImage(img, -diameter / 2, -diameter / 2, diameter, diameter);
    ctx.restore();
  }
  function draw({ ball, hoopX, time, ready, dragging }) {
    ctx.clearRect(0, 0, width, height);
    background(); goal(hoopX);
    const current = ball || { x: 0, y: .7, z: 0, age: 0 };
    drawBall(current, time, ready, dragging);
    if (current.z > 6 && current.y <= HOOP.y + .15) goal(hoopX, true);
  }
  const ready = Promise.all(Object.values(pictures).map(img => img.decode()));
  return { resize, draw, ready, get width() { return width; }, get height() { return height; } };
}
