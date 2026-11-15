import { icon, confetti } from '../../shared/art.js';
import { downloadPortrait } from './save-image.js';
import { replaceView, gameHeading } from '../../shared/ui.js';
import { categories, skinColors, hairColors, defaultFace, normalizeFace, randomFace, asset, STORAGE_KEY } from './parts.js';

export function mount(root, { audio }) {
  let face = { ...defaultFace };
  try { face = normalizeFace(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { /* Play without saved data. */ }
  let category = 'face';
  let previous = null;
  let celebrate = false;
  let timer;
  let saveFailed = false;
  let disposed = false;
  let exporting = false;

  function portrait() {
    const layers = ['outfit', 'ears', 'face', 'eyes', 'nose', 'mouth', 'hair', 'makeup', 'earrings', 'accessory'].filter(part => !['makeup', 'earrings', 'accessory'].includes(part) || face[part] > 0);
    return `<div class="faces-portrait face-shape-${face.face} hair-style-${face.hair} ears-style-${face.ears} accessory-style-${face.accessory}" role="img" aria-label="Tu personaje: ${categories.map(item => item.names[face[item.id]]).join(', ')}">
      ${layers.map(part => `<img class="faces-layer faces-${part}" src="${asset(part, part === 'outfit' && face.skin > 0 ? `${face.outfit}-skin-${face.skin}` : face[part])}" alt="" draggable="false" />`).join('')}
    </div>`;
  }

  function swatches(type, colors, selected, label) {
    return `<div class="faces-colors" role="group" aria-label="${label}"><span>${label}</span><div>${colors.map((color, i) => `<button class="faces-swatch ${selected === i ? 'is-selected' : ''}" data-${type}="${i}" data-focus="${type}-${i}" aria-label="${color.name}" aria-pressed="${selected === i}">${selected === i ? icon('check') : ''}</button>`).join('')}</div></div>`;
  }

  function render() {
    const current = categories.find(item => item.id === category);
    replaceView(root, `<section class="game faces-game" aria-labelledby="faces-title">
      <div class="game-heading">${gameHeading('Caras locas', 'faces-title')}</div>
      <div class="faces-workshop">
        <div class="faces-stage ${celebrate ? 'is-celebrating' : ''}">
          <span class="faces-stage-star faces-star-one" aria-hidden="true">✦</span><span class="faces-stage-star faces-star-two" aria-hidden="true">✧</span>
          ${portrait()}
          <div class="faces-stage-caption">${celebrate ? '¡Listo!' : ''}</div>
          ${celebrate ? confetti() : ''}
        </div>
        <div class="faces-editor">
          <div class="faces-categories" role="group" aria-label="Elegí qué cambiar">${categories.map(item => `<button data-category="${item.id}" data-focus="category-${item.id}" aria-pressed="${item.id === category}" aria-controls="faces-options"><img src="${asset(item.id, ['makeup', 'earrings', 'accessory', 'outfit'].includes(item.id) ? 1 : 0)}" alt="" draggable="false" /><span>${item.label}</span></button>`).join('')}</div>
          <div class="faces-options-panel" id="faces-options" role="group" aria-labelledby="faces-part-title">
            <div class="faces-part-heading"><h2 id="faces-part-title">${current.label}</h2></div>
            <div class="faces-options">${current.names.map((name, i) => `<button class="faces-option ${face[category] === i ? 'is-selected' : ''}" data-option="${i}" data-focus="option-${i}" aria-label="${name}" aria-pressed="${face[category] === i}">${i === 0 && ['makeup', 'earrings', 'accessory'].includes(category) ? '<span class="faces-none" aria-hidden="true">∅</span>' : `<img src="${asset(category, i)}" alt="" draggable="false" />`}<span>${name}</span>${face[category] === i ? `<span class="faces-choice-check">${icon('check')}</span>` : ''}</button>`).join('')}</div>
            ${category === 'face' ? swatches('skin', skinColors, face.skin, 'Color de piel') : category === 'hair' ? swatches('hair-color', hairColors, face.hairColor, 'Color de pelo') : ''}
          </div>
          <div class="faces-actions"><button class="secondary-button" data-action="random" data-focus="random"><span aria-hidden="true">✦</span> Sorprendeme</button><button class="secondary-button faces-undo" data-action="undo" data-focus="undo" aria-label="Deshacer último cambio" ${previous ? '' : 'disabled'}>${icon('undo')}<span>Deshacer</span></button><button class="primary-button" data-action="done" data-focus="done">${icon('check')} ¡Así me gusta!</button><button class="secondary-button" data-action="download" data-focus="download">${icon('download')} Guardar imagen</button></div>
        </div>
      </div>
      <p class="faces-status" role="status" aria-live="polite">${saveFailed ? 'Podés seguir jugando. Este navegador no pudo guardar la carita.' : celebrate ? '¡Tu personaje está listo!' : ''}</p>
    </section>`);

    root.querySelector('.faces-hair').style.filter = hairColors[face.hairColor].filter;
    for (const part of ['face', 'ears', 'nose']) {
      if (part !== 'nose' || face.nose !== 1) root.querySelector(`.faces-${part}`).style.filter = skinColors[face.skin].filter;
    }
    root.querySelectorAll('[data-skin]').forEach(button => { button.style.backgroundColor = skinColors[Number(button.dataset.skin)].color; });
    root.querySelectorAll('[data-hair-color]').forEach(button => { button.style.backgroundColor = hairColors[Number(button.dataset.hairColor)].color; });
    if (category === 'hair') root.querySelectorAll('.faces-option img').forEach(img => { img.style.filter = hairColors[face.hairColor].filter; });
    if (category === 'face') root.querySelectorAll('.faces-option img').forEach(img => { img.style.filter = skinColors[face.skin].filter; });
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(face)); saveFailed = false; } catch { saveFailed = true; }
  }
  function change(next) {
    if (JSON.stringify(next) === JSON.stringify(face)) return;
    previous = { ...face }; face = next; celebrate = false;
    clearTimeout(timer); save(); audio.play('pop'); render();
  }
  function onClick(event) {
    const button = event.target.closest('button');
    if (!button || !root.contains(button) || button.disabled) return;
    if (button.dataset.category) { category = button.dataset.category; audio.play('pop'); render(); }
    else if (button.dataset.option !== undefined) change({ ...face, [category]: Number(button.dataset.option) });
    else if (button.dataset.skin !== undefined) change({ ...face, skin: Number(button.dataset.skin) });
    else if (button.dataset.hairColor !== undefined) change({ ...face, hairColor: Number(button.dataset.hairColor) });
    else if (button.dataset.action === 'random') change(randomFace());
    else if (button.dataset.action === 'download') exportImage();
    else if (button.dataset.action === 'undo' && previous) {
      face = previous; previous = null; celebrate = false; clearTimeout(timer); save(); audio.play('pop'); render();
    } else if (button.dataset.action === 'done') {
      celebrate = true; save(); audio.play('celebrate'); clearTimeout(timer); render();
      timer = setTimeout(() => { celebrate = false; render(); }, 2400);
    }
  }
  async function exportImage() {
    if (exporting) return;
    exporting = true;
    const button = root.querySelector('[data-action="download"]');
    button.disabled = true;
    root.querySelector('.faces-status').textContent = 'Preparando tu imagen…';
    try {
      await downloadPortrait(root.querySelector('.faces-portrait'), () => disposed);
      if (!disposed) root.querySelector('.faces-status').textContent = '¡Imagen lista! Buscala en las descargas.';
    } catch {
      if (!disposed) root.querySelector('.faces-status').textContent = 'No pudimos guardar la imagen. Tocá Guardar imagen para reintentar.';
    } finally { exporting = false; if (!disposed) root.querySelector('[data-action="download"]').disabled = false; }
  }
  root.addEventListener('click', onClick);
  render();
  audio.intro();
  return () => { disposed = true; clearTimeout(timer); root.removeEventListener('click', onClick); };
}
