import { createExercise } from './rules.js';
import { confetti, icon } from '../../shared/art.js';
import { replaceView } from '../../shared/ui.js';

export function mount(root, { audio }) {
  let exercise = createExercise();
  let solved = false;
  let tried = new Set();
  let counted = new Set();
  let message = 'Contá los dibujos y tocá el total.';

  function group(count, side) {
    const { item } = exercise;
    const src = new URL(`./assets/images/${item.id}.png`, import.meta.url).href;
    return `<div class="addition-group addition-group-${side}" role="group" aria-label="${count} ${count === 1 ? item.singular : item.plural}">
      <div class="addition-objects">${Array.from({ length: count }, (_, i) => {
        const key = `${side}-${i}`;
        const rank = [...counted].indexOf(key) + 1;
        return `<button class="addition-object ${rank ? 'is-counted' : ''}" data-object="${key}" data-focus="object-${key}" aria-label="${item.singular}, ${i + 1} del grupo ${side === 'left' ? 'izquierdo' : 'derecho'}" aria-pressed="${!!rank}" ${solved ? 'disabled' : ''}>
          <img src="${src}" alt="" draggable="false">${rank ? `<span class="addition-mark" aria-hidden="true">${rank}</span>` : ''}</button>`;
      }).join('')}</div>
      <div class="addition-quantity"><strong>${count}</strong><span>${count === 1 ? item.singular : item.plural}</span></div>
    </div>`;
  }

  function render() {
    replaceView(root, `<section class="game addition-game">
      <div class="game-heading"><span class="eyebrow">POQUITO A POQUITO</span><h1 tabindex="-1">A sumar</h1><p class="level-note">Juntamos ${exercise.item.plural}. ¿Cuántos dibujos hay en total?</p></div>
      <div class="addition-paper">
        <div class="addition-equation">
          ${group(exercise.left, 'left')}<span class="addition-sign" aria-label="más">+</span>${group(exercise.right, 'right')}
          <div class="addition-result"><span class="addition-sign" aria-label="igual">=</span><output class="addition-total ${solved ? 'is-solved' : ''}" aria-label="${solved ? `Resultado: ${exercise.total}` : 'Resultado por descubrir'}">${solved ? exercise.total : '?'}</output></div>
        </div>
        <p class="addition-help">Podés tocar cada dibujo para marcar lo que ya contaste.</p>
        <div class="addition-choices" role="group" aria-label="Elegí el total">${exercise.choices.map(value => `<button class="addition-choice ${solved && value === exercise.total ? 'is-correct' : ''}" data-answer="${value}" data-focus="answer-${value}" aria-label="Respuesta ${value}" ${solved || tried.has(value) ? 'disabled' : ''}>${value}</button>`).join('')}</div>
        <p class="addition-message" role="status" aria-live="polite">${message}</p>
        <div class="addition-actions">${solved ? `<button class="primary-button" data-action="next">Otra suma ${icon('arrow')}</button>` : '<button class="secondary-button" data-action="clear">Volver a contar</button>'}</div>
      </div>
      <p class="game-message">Sin apuro. ¡Contamos a tu ritmo!</p>${solved ? confetti() : ''}
    </section>`);
  }

  function click(event) {
    const button = event.target.closest('button');
    if (!button || !root.contains(button) || button.disabled) return;
    if (button.dataset.action === 'next' && solved) {
      exercise = createExercise(exercise);
      solved = false;
      tried = new Set();
      counted = new Set();
      message = 'Contá los dibujos y tocá el total.';
      audio.stop();
      render();
      root.querySelector('h1').focus({ preventScroll: true });
      root.querySelector('.addition-game').scrollIntoView({ block: 'start' });
      return;
    }
    if (solved) return;
    if (button.dataset.object) {
      const key = button.dataset.object;
      if (counted.has(key)) counted.delete(key);
      else counted.add(key);
      audio.play('pop');
    } else if (button.dataset.action === 'clear') {
      counted.clear();
      message = 'Empezamos de nuevo. Tocá los dibujos de a uno.';
    } else if (button.dataset.answer) {
      const answer = Number(button.dataset.answer);
      if (answer === exercise.total) {
        solved = true;
        message = `¡Muy bien! ${exercise.left} más ${exercise.right} son ${exercise.total}.`;
        audio.play('celebrate');
      } else {
        tried.add(answer);
        message = 'Contemos otra vez. ¡Podés probar otro número!';
        audio.play('pop');
      }
    } else return;
    render();
    if (solved) root.querySelector('[data-action="next"]').focus({ preventScroll: true });
  }

  root.addEventListener('click', click);
  render();
  return () => { root.removeEventListener('click', click); audio.stop(); };
}
