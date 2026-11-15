export const DURATION = 60;
export const GRAVITY = 9.8;
export const BALL_RADIUS = .24;
export const HOOP = Object.freeze({ y: 3.05, z: 7, radius: .76 });
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Distances are fractions of the court height, so a gesture feels the same
// on a phone and tablet. Neither very short taps nor downward swipes launch.
export function launchFromSwipe(dx, up, seconds) {
  if (![dx, up, seconds].every(Number.isFinite) || up < .045 || seconds <= 0) return null;
  const speed = up / Math.max(.075, seconds);
  const power = clamp(.6 * up / .28 + .4 * speed / (.28 / .24), .22, 1.8);
  const vz = 3.3 + 1.95 * power;
  return { x: 0, y: .7, z: 0, vx: clamp(dx / up, -1.2, 1.2) * vz * 1.35, vy: 5.4 + 2.9 * power, vz, scored: false, age: 0, bounced: false };
}

export function difficulty(score) {
  return score < 4 ? { amplitude: 0, speed: 0 } : {
    amplitude: Math.min(1.7, .65 + (score - 4) * .06),
    speed: Math.min(1.9, .5 + (score - 4) * .035),
  };
}

export function remainingTime(elapsed) { return Math.max(0, DURATION - elapsed); }

// Swept intersection prevents a fast ball skipping the rim between frames.
// Only a downward crossing through the horizontal opening earns points.
export function crossesHoop(previous, next, hoopX) {
  if (previous.y < HOOP.y || next.y >= HOOP.y || next.y >= previous.y) return false;
  const fraction = (previous.y - HOOP.y) / (previous.y - next.y);
  const x = previous.x + (next.x - previous.x) * fraction;
  const z = previous.z + (next.z - previous.z) * fraction;
  return Math.hypot(x - hoopX, z - HOOP.z) <= HOOP.radius - BALL_RADIUS * .8;
}

export function stepBall(ball, dt, hoopX) {
  const previous = { x: ball.x, y: ball.y, z: ball.z };
  ball.age += dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt - .5 * GRAVITY * dt * dt;
  ball.z += ball.vz * dt;
  ball.vy -= GRAVITY * dt;
  const basket = !ball.scored && crossesHoop(previous, ball, hoopX);
  if (basket) {
    ball.scored = true;
    // A soft drop into the net; retain the player's actual successful shot.
    ball.vx *= .25;
    ball.vz *= .25;
  } else if (!ball.scored) {
    const crossRim = previous.y >= HOOP.y && ball.y < HOOP.y;
    const distance = Math.hypot(ball.x - hoopX, ball.z - HOOP.z);
    if (crossRim && distance < HOOP.radius + BALL_RADIUS && distance > HOOP.radius - BALL_RADIUS * .8) {
      ball.y = HOOP.y + .02;
      ball.vy = Math.abs(ball.vy) * .45;
      ball.vx += (ball.x >= hoopX ? 1 : -1) * 1.2;
      ball.vz *= -.35;
    }
    // Backboard, behind the rim. Bank shots remain eligible to score.
    if (previous.z < 7.5 && ball.z >= 7.5 && Math.abs(ball.x - hoopX) < 1.4 && ball.y > 3.1 && ball.y < 5.1) {
      ball.z = 7.49;
      ball.vz = -Math.abs(ball.vz) * .55;
    }
  }
  if (ball.y < BALL_RADIUS && ball.vy < 0) {
    ball.y = BALL_RADIUS;
    ball.vy *= -.42;
    ball.vx *= .7;
    ball.vz *= .7;
    ball.bounced = true;
  }
  return basket;
}
