import { CLASSMATES, ROUND_LENGTH, createNameDeck, choicesFor } from './classmates.js';
import { icon, confetti } from './art.js';
import { replaceView, gameHeading } from './ui.js';

export function mountClassmates(root, { audio }, { mode, title }) {
  const nextName = createNameDeck();
  const letters = mode === 'initials';
  let level = 3, turn = 0, solved = false, complete = false, tried = [], message = '';
  let item, choices;
  function prepare() {
    item = nextName();
    choices = choicesFor(item, mode, level);
    tried = []; solved = false; complete = false; message = '';
  }
  const prompt = () => `ask-${item.id}`;
  function render() {
    replaceView(root, `<section class="game classmates-game ${letters ? 'is-letters' : ''}" aria-labelledby="game-title">
      <div class="game-heading">${gameHeading(title)}<p class="level-note">Los nombres del jardín</p></div>
      ${!letters ? `<div class="classmates-levels" role="group" aria-label="Cantidad de nombres para elegir">${[3, 6, 17].map(count => `<button class="secondary-button" data-level="${count}" data-focus="level-${count}" aria-pressed="${level === count}">${count === 17 ? 'Todos' : `${count} nombres`}</button>`).join('')}</div>` : ''}
      <div class="classmates-paper ${complete ? 'is-complete' : ''}">
        <div class="classmates-progress" aria-label="${Math.min(turn + (solved ? 1 : 0), ROUND_LENGTH)} de ${ROUND_LENGTH} nombres encontrados">${Array.from({ length: ROUND_LENGTH }, (_, i) => `<span class="${i < turn + (solved ? 1 : 0) ? 'is-filled' : ''}" aria-hidden="true">★</span>`).join('')}<span class="classmates-round">${complete ? '¡Ronda completa!' : `${turn + 1} de ${ROUND_LENGTH}`}</span></div>
        ${complete ? `<div class="classmates-finish" aria-hidden="true">✦</div><h2>¡Encontraste los cinco!</h2><p class="classmates-finish-note">¿Jugamos con más nombres?</p><button class="primary-button classmates-next" data-action="restart" data-focus="restart">¡Jugar otra vez! ${icon('arrow')}</button>` : `
          <h2 class="classmates-question">${letters ? '¿Con qué letra empieza?' : 'Escuchá y buscá el nombre'}</h2>
          <button class="primary-button classmates-listen" data-action="listen" data-focus="listen">${icon('sound')} Escuchar ${letters ? 'nombre' : 'otra vez'}</button>
          ${letters ? `<div class="classmates-word ${solved ? 'is-revealed' : ''}" aria-label="${solved ? item.name : 'Nombre misterioso'}">${solved ? `<strong>${item.name[0]}</strong>${item.name.slice(1)}` : '<span aria-hidden="true">? ? ?</span>'}</div>` : ''}
          <div class="classmates-choices ${letters ? 'letter-choices' : ''} ${!letters && level === 17 ? 'all-names' : ''}" role="group" aria-label="${letters ? 'Elegí la primera letra' : 'Elegí el nombre que escuchaste'}">${choices.map(value => {
            const label = letters ? value : CLASSMATES.find(person => person.id === value).name;
            const correct = solved && value === (letters ? item.name[0] : item.id);
            return `<button class="classmates-choice ${correct ? 'is-correct' : ''} ${tried.includes(value) ? 'is-tried' : ''}" data-answer="${value}" data-focus="answer-${value}" ${solved ? 'disabled' : ''} aria-label="${letters ? 'Letra ' : ''}${label}${correct ? ', correcto' : ''}">${label}${correct ? `<span class="classmates-check" aria-hidden="true">✓</span>` : ''}</button>`;
          }).join('')}</div>
          <p class="classmates-message" role="status">${message || (letters ? 'Escuchá el nombre y tocá su primera letra.' : 'Tocá el nombre que escuchaste.')}</p>
          <div class="classmates-next-slot">${solved ? `<button class="primary-button classmates-next" data-action="next" data-focus="next">${turn === ROUND_LENGTH - 1 ? 'Terminar ronda' : 'Otro nombre'} ${icon('arrow')}</button>` : ''}</div>`}
      </div>${solved ? confetti() : ''}
    </section>`);
  }
  function focusRound() {
    root.querySelector('#game-title')?.focus({ preventScroll: true });
    root.querySelector('.classmates-choices')?.scrollTo(0, 0);
    if (globalThis.innerWidth < 720) root.querySelector('.classmates-question')?.scrollIntoView({ block: 'nearest' });
  }
  function click(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled || !root.contains(button)) return;
    if (button.dataset.level) {
      const count = Number(button.dataset.level);
      if (count === level) return;
      level = count;
      // A level changes the distractors, keeping this name and round progress.
      if (!complete) choices = choicesFor(item, mode, level);
      render();
      if (!complete) audio.play(prompt());
      return;
    }
    if (button.dataset.action === 'listen') { audio.play(prompt()); return; }
    if (button.dataset.action === 'restart') {
      turn = 0; prepare(); render(); focusRound(); audio.play(prompt()); return;
    }
    if (button.dataset.action === 'next' && solved && !complete) {
      if (turn === ROUND_LENGTH - 1) {
        complete = true; render(); audio.play(['celebrate', 'round-complete']);
        root.querySelector('[data-action="restart"]')?.focus({ preventScroll: true });
      } else { turn++; prepare(); render(); focusRound(); audio.play(prompt()); }
      return;
    }
    if (!button.dataset.answer || solved || complete) return;
    const answer = letters ? item.name[0] : item.id;
    if (button.dataset.answer === answer) {
      solved = true;
      message = letters ? `¡Sí! ${item.name} empieza con ${answer}.` : `¡Sí, ${item.name}!`;
      render(); audio.play([`correct-${letters ? answer.toLowerCase() : item.id}`, 'celebrate']);
      root.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
    } else {
      tried = [...new Set([...tried, button.dataset.answer])];
      message = 'Probá con otro. ¡Vos podés!'; render(); audio.play(['try-again', prompt()]);
    }
  }
  prepare(); render(); root.addEventListener('click', click); audio.intro([prompt()]);
  return () => { root.removeEventListener('click', click); audio.stop(); };
}
