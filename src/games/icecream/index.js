import { vesselArt, popsicleArt, scoop, servedScoop, customerArt } from './art.js';
import { FLAVORS, CONTAINERS, POPSICLES, MAX_POPSICLES, containerById, createOrder, addScoop, addPopsicle, changeContainer, orderMatches, orderAudio } from './rules.js';
import { icon, confetti } from '../../shared/art.js';
import { replaceView, gameHeading } from '../../shared/ui.js';

export function mount(root, { audio }) {
  let order = createOrder();
  let scoops = [];
  let popsicles = [];
  let selectedContainer = order.container === 'popsicle' ? 'popsicle' : 'cone';
  let customer = 0;
  let phase = 'arriving';
  let timer;
  let disposed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function after(delay, callback) {
    clearTimeout(timer);
    timer = setTimeout(() => { if (!disposed) callback(); }, delay);
  }

  function coneMarkup(held = false) {
    if (selectedContainer === 'popsicle') return `<div class="popsicle-build ${held ? 'held-popsicles' : 'prepared-popsicles'} count-${popsicles.length}">${popsicles.map(id => popsicleArt(id)).join('')}${!popsicles.length ? '<span class="popsicle-placeholder">Elegí tus paletas</span>' : ''}</div>`;
    return `<div class="icecream-build vessel-${selectedContainer} count-${scoops.length}">${vesselArt(selectedContainer, 'serving-vessel')}<div class="${held ? 'held-stack' : 'scoop-stack'}">${scoops.map((f, i) => servedScoop(f, `${held ? 'held' : 'prepared'}-${i}`)).join('')}</div>${scoops.length ? vesselArt(selectedContainer, 'serving-vessel vessel-front') : ''}</div>`;
  }

  function render() {
    const waiting = phase === 'waiting';
    const choosingPopsicles = selectedContainer === 'popsicle';
    const wantsPopsicles = order.container === 'popsicle';
    const count = choosingPopsicles ? popsicles.length : scoops.length;
    const vessel = containerById(selectedContainer);
    const requested = containerById(order.container);
    const special = !!requested?.special;
    const sad = phase === 'sad';
    const happy = phase === 'happy' || phase === 'leaving';
    const messages = {
      arriving: special ? '¡Llega un pedido súper especial!' : '¡Ahí viene un cliente!', waiting: choosingPopsicles ? `${count} ${count === 1 ? 'paleta' : 'paletas'} · Tocá cada paleta del pedido` : `${scoops.length} de ${vessel.capacity} sabores · Elegí el recipiente y prepará el pedido`,
      serving: choosingPopsicles ? '¡Tus paletas están listas!' : '¡Un helado para vos!', sad: 'Ese no era… ¿Lo hacemos de nuevo?',
      happy: '¡Qué rico! ¡Gracias!', leaving: '¡Hasta pronto!',
    };
    replaceView(root, `<section class="game icecream-game" data-phase="${phase}" data-special="${special}" data-container="${selectedContainer}" data-order-container="${order.container}" aria-labelledby="game-title">
      <div class="shop-awning"><div class="game-heading">${gameHeading('La heladería', 'game-title')}</div></div>
      <div class="icecream-layout">
        <div class="customer-scene">
          <div class="shop-garden" aria-hidden="true"><span class="garden-sun"></span><span class="garden-cloud cloud-one"></span><span class="garden-cloud cloud-two"></span><span class="garden-hill hill-one"></span><span class="garden-hill hill-two"></span><span class="garden-path"></span></div>
          <div class="shop-post post-left" aria-hidden="true"></div><div class="shop-post post-right" aria-hidden="true"></div>
          <div class="customer-visitor" data-customer="${customer}">
            ${customerArt(customer, phase)}
            <span class="customer-hearts" aria-hidden="true">♥ <small>♥</small></span>
            <div class="held-icecream" aria-hidden="true">${happy ? coneMarkup(true) : ''}</div>
          </div>
          <div class="order-bubble ${sad ? 'hint' : ''} ${happy ? 'order-success' : ''}">
            <span class="order-caption">${happy ? '¡Me encanta!' : sad ? 'Quería este pedido…' : special ? '★ ¡Un súper cucurucho!' : '¡Hola! Quiero…'}</span>
            ${wantsPopsicles ? `<div class="order-container"><span>${order.popsicles.length} ${order.popsicles.length === 1 ? 'paleta' : 'paletas'}<small>Así, como en el dibujo</small></span></div><div class="order-popsicles" aria-label="Pedido del cliente">${order.popsicles.map(id => popsicleArt(id)).join('')}</div>` : `<div class="order-container">${vesselArt(order.container)}<span>${requested.name}<small>${requested.capacity} sabores</small></span></div><div class="order-scoops" aria-label="Pedido del cliente">${order.flavors.map(f => scoop(f)).join('')}</div>`}
            <button class="icon-button order-audio" data-action="listen" data-focus="listen" aria-label="Escuchar el pedido" ${phase === 'arriving' || phase === 'leaving' ? 'disabled' : ''}>${icon('sound')}</button>
          </div>
          <div class="serving-place">
            <div class="counter-mat" aria-hidden="true"></div>
            <div class="prepared-icecream" role="img" aria-label="${happy ? 'Pedido entregado' : choosingPopsicles ? `Tus paletas: ${popsicles.length ? popsicles.map(id => POPSICLES.find(p => p.id === id).name.toLowerCase()).join(' y ') : 'ninguna todavía'}` : `Tu helado: ${scoops.length ? scoops.map(id => FLAVORS.find(f => f.id === id).name.toLowerCase()).join(' y ') : `${vessel.name.toLowerCase()} sin sabores`}`}" >
              ${coneMarkup()}
              
            </div>
          </div>
          <div class="counter-edge" aria-hidden="true"></div>
        </div>
        <div class="shop-counter">
          <div class="container-picker" role="group" aria-label="Elegir helado o paletas">${CONTAINERS.map(item => `<button class="container-choice ${item.special ? 'special-choice' : ''}" data-action="container" data-container="${item.id}" data-focus="container-${item.id}" aria-label="${item.name}, ${item.capacity} sabores" aria-pressed="${selectedContainer === item.id}" ${waiting ? '' : 'disabled'}>${vesselArt(item.id)}<span>${item.name}<small>${item.capacity} sabores</small></span></button>`).join('')}<button class="container-choice popsicle-choice" data-action="container" data-container="popsicle" data-focus="container-popsicle" aria-label="Paletas, una o varias" aria-pressed="${choosingPopsicles}" ${waiting ? '' : 'disabled'}>${popsicleArt('corazon')}<span>Paletas<small>1 a 4</small></span></button></div>
          ${choosingPopsicles ? `<div class="popsicle-tray" role="group" aria-label="Elegir paletas">${POPSICLES.map(p => `<button class="popsicle-option" data-action="popsicle" data-popsicle-id="${p.id}" data-focus="popsicle-${p.id}" aria-label="Agregar paleta ${p.name.toLowerCase()}" ${!waiting || popsicles.length >= MAX_POPSICLES ? 'disabled' : ''}>${popsicleArt(p.id)}<span class="popsicle-label">${p.name}</span>${popsicles.includes(p.id) ? `<span class="popsicle-quantity" aria-label="${popsicles.filter(id => id === p.id).length} en tu pedido">${popsicles.filter(id => id === p.id).length}</span>` : ''}</button>`).join('')}</div>` : `<div class="flavor-tray" role="group" aria-label="Elegir sabores">${FLAVORS.map(f => `
            <button class="flavor ${f.id}" data-action="add" data-flavor="${f.id}" data-focus="${f.id}" aria-label="Agregar el sabor ${f.name.toLowerCase()}" ${scoops.length >= vessel.capacity || scoops.includes(f.id) || !waiting ? 'disabled' : ''}>
              <span class="flavor-tub">${scoop(f.id, 'flavor-preview')}</span><span class="flavor-label">${f.name}</span>
            </button>`).join('')}
          </div>`}
          <div class="icecream-actions">
            <button class="undo-button" data-action="undo" data-focus="undo" aria-label="${choosingPopsicles ? 'Quitar la última paleta' : 'Quitar el último sabor'}" ${!count || !waiting ? 'disabled' : ''}>${icon('undo')}</button>
            <p class="game-message" role="status" aria-live="polite">${messages[phase]}</p>
            <button class="deliver-button" data-action="${sad ? 'retry' : 'deliver'}" data-focus="deliver" ${sad || (waiting && count) ? '' : 'disabled'}>${sad ? 'Otra vez' : happy ? '¡Gracias!' : '¡Listo!'} ${icon(sad ? 'undo' : 'check')}</button>
          </div>
        </div>
      </div>${special && happy ? confetti() : ''}
    </section>`);
  }

  function arrive(first = false) {
    phase = 'arriving';
    render();
    if (first) audio.intro(orderAudio(order));
    after(reducedMotion.matches ? 80 : 1000, () => {
      phase = 'waiting'; render();
      if (!first) audio.play(orderAudio(order));
    });
  }

  function handleClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'listen') { audio.play(orderAudio(order)); return; }
    if (action === 'retry' && phase === 'sad') {
      scoops = []; popsicles = []; phase = 'waiting'; render(); audio.play(orderAudio(order)); return;
    }
    if (phase !== 'waiting') return;
    switch (action) {
      case 'container': {
        const next = button.dataset.container;
        if ((next === 'popsicle') !== (selectedContainer === 'popsicle')) { scoops = []; popsicles = []; }
        selectedContainer = next;
        scoops = changeContainer(scoops, selectedContainer);
        audio.play('pop'); render(); break;
      }
      case 'add': scoops = addScoop(scoops, button.dataset.flavor, selectedContainer); audio.play('pop'); render(); break;
      case 'popsicle': if (selectedContainer === 'popsicle') popsicles = addPopsicle(popsicles, button.dataset.popsicleId); audio.play('pop'); render(); break;
      case 'undo': if (selectedContainer === 'popsicle') popsicles = popsicles.slice(0, -1); else scoops = scoops.slice(0, -1); audio.play('pop'); render(); break;
      case 'deliver':
        if (!(selectedContainer === 'popsicle' ? popsicles.length : scoops.length)) return;
        phase = 'serving'; render();
        after(reducedMotion.matches ? 80 : 650, () => {
          const success = orderMatches(order, scoops, selectedContainer, popsicles);
          phase = success ? 'happy' : 'sad';
          audio.play(success ? 'icecream-success' : 'try-again'); render();
          if (success) after(1800, () => {
            phase = 'leaving'; render();
            after(reducedMotion.matches ? 100 : 1100, () => {
              customer++; order = createOrder(Math.random, customer % 5 === 4 ? 'super' : customer % 3 === 2 ? 'popsicle' : undefined); scoops = []; popsicles = []; selectedContainer = order.container === 'popsicle' ? 'popsicle' : 'cone'; arrive();
            });
          });
        });
        break;
    }
  }
  arrive(true);
  root.addEventListener('click', handleClick);
  return () => { disposed = true; clearTimeout(timer); root.removeEventListener('click', handleClick); };
}
