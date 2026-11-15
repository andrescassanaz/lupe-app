import { art, scoop } from './art.js';
import { FLAVORS, MAX_SCOOPS, createOrder, addScoop, orderMatches, orderAudio } from './rules.js';
import { icon, confetti } from '../../shared/art.js';
import { replaceView } from '../../shared/ui.js';

export function mount(root, { audio }) {
  let order = createOrder();
  let scoops = [];
  let success = false;
  let needsHelp = false;
  let customer = 0;

  function render() {
    replaceView(root, `<section class="game icecream-game" aria-labelledby="game-title">
      <div class="game-heading"><span class="eyebrow">UN MUNDO DE SABORES</span><h1 id="game-title">La heladería</h1><p class="level-note">Nueve sabores para preparar algo rico.</p></div>
      <div class="icecream-layout">
        <div class="customer-scene">
          <div class="shop-front">
          ${art('shop', 'shop-building', 'Heladería con toldo a rayas, ventana y mostrador')}
          <div class="order-bubble ${needsHelp ? 'hint' : ''} ${success ? 'order-success' : ''}">
            <div class="order-scoops" aria-label="Pedido del cliente">${order.map(f => scoop(f)).join('')}</div>
            <button class="icon-button order-audio" data-action="listen" data-focus="listen" aria-label="Escuchar el pedido">${icon('sound')}</button>
          </div>
          ${art(['customer-bunny', 'customer-bear', 'customer-fox'][customer % 3], 'customer', 'Cliente esperando su helado')}
          </div>
        </div>
        
          <div class="prepared-icecream" role="img" aria-label="Tu helado: ${scoops.length ? scoops.map(id => FLAVORS.find(f => f.id === id).name.toLowerCase()).join(' y ') : 'cucurucho vacío'}">
            <div class="scoop-stack">${[...scoops].reverse().map(f => scoop(f)).join('')}</div>
            ${art('cone', 'cone')}
            ${scoops.length === 0 ? `<span class="scoop-guide" aria-hidden="true">${icon('download')}</span>` : ''}
          </div>
          <div class="flavor-tray" aria-label="Elegir sabores">${FLAVORS.map(f => `
            <button class="flavor ${f.id}" data-action="add" data-flavor="${f.id}" data-focus="${f.id}" aria-label="Agregar una bocha de ${f.name.toLowerCase()}" ${scoops.length === MAX_SCOOPS || success ? 'disabled' : ''}>
              ${scoop(f.id, 'flavor-preview')}<span>${f.name}</span>
            </button>`).join('')}
          </div>
          <div class="icecream-actions">
            <button class="undo-button" data-action="undo" data-focus="undo" aria-label="Quitar la última bocha" ${!scoops.length || success ? 'disabled' : ''}>${icon('undo')}</button>
            <button class="deliver-button" data-action="${success ? 'next' : 'deliver'}" data-focus="deliver" ${!scoops.length ? 'disabled' : ''}>${success ? '¡Otro helado!' : '¡Listo!'} ${icon(success ? 'arrow' : 'check')}</button>
          </div>
          <p class="game-message" role="status">${success ? '¡Qué rico! ¡Gracias!' : needsHelp ? 'Mirá el pedido. ¡Probá otra vez!' : 'Tocá un sabor y prepará el pedido'}</p>
      </div>${success ? confetti() : ''}
    </section>`);
  }

  function handleClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    switch (button.dataset.action) {
      case 'listen': audio.play(orderAudio(order)); break;
      case 'add': scoops = addScoop(scoops, button.dataset.flavor); needsHelp = false; audio.play('pop'); render(); break;
      case 'undo': scoops = scoops.slice(0, -1); needsHelp = false; audio.play('pop'); render(); break;
      case 'deliver':
        success = orderMatches(order, scoops);
        needsHelp = !success;
        audio.play(success ? 'icecream-success' : 'try-again');
        render();
        break;
      case 'next':
        if (!success) return;
        order = createOrder(); scoops = []; success = false; needsHelp = false; customer++;
        render(); audio.play(orderAudio(order));
        break;
    }
  }
  render();
  audio.play(orderAudio(order));
  root.addEventListener('click', handleClick);
  return () => root.removeEventListener('click', handleClick);
}
