import { textureMarkup as texture } from './coloring-textures.js';
import { downloadPainting } from './coloring-export.js';
import { COLORS, MATERIALS, paintRegion } from './coloring-data.js';
import { icon, confetti } from '../../shared/art.js';
import { replaceView, gameHeading } from '../../shared/ui.js';
import { loadCatalog, prepareDrawing } from './coloring-images.js';

const STORAGE_KEY = 'lupe-coloring-scenes-v2';
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function loadSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function mount(root, { audio }) {
  let drawings = [];
  let drawing = null;
  let selectedEntry = null;
  let loading = true;
  let error = '';
  let disposed = false;
  let request = 0;
  const lifecycle = new AbortController();
  let preparation;
  const prepared = new Map();
  let color = COLORS[0].id;
  let material = MATERIALS[0].id;
  const saved = loadSaved();
  const paintings = {};
  const histories = {};
  let celebrating = false;
  let resetPending = false;
  let storageAvailable = true;
  let downloading = false;
  let downloadError = '';
  const painting = () => paintings[drawing.id] || {};

  function save(next) {
    histories[drawing.id].push(painting());
    paintings[drawing.id] = next;
    persist();
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, ...paintings })); }
    catch { storageAvailable = false; }
  }
  function heading() {
    return `<div class="game-heading">${gameHeading('A colorear', 'game-title')}<p class="level-note">Elegí un material, un color y tocá el dibujo.</p></div>
      <div class="drawing-picker" role="group" aria-label="Elegir dibujo">${drawings.map(d => `<button data-drawing="${escapeHtml(d.id)}" data-focus="drawing-${escapeHtml(d.id)}" aria-pressed="${d.id === selectedEntry?.id}"><img src="${escapeHtml(d.image)}" alt="" draggable="false"/><span>${escapeHtml(d.name)}</span></button>`).join('')}</div>`;
  }
  async function selectDrawing(entry) {
    if (selectedEntry?.id === entry.id && (drawing || loading)) return;
    const token = ++request;
    preparation?.abort(); preparation = new AbortController();
    selectedEntry = entry; drawing = null; loading = true; error = ''; resetPending = false; celebrating = false;
    if (!prepared.has(entry.id)) render();
    try {
      const result = prepared.get(entry.id) || await prepareDrawing(entry, preparation.signal);
      if (disposed || token !== request) return;
      prepared.set(entry.id, result); drawing = result;
      if (!paintings[drawing.id]) {
        let restored = {};
        for (const region of drawing.regions) {
          const value = saved[drawing.id]?.[region.id];
          if (value) restored = paintRegion(restored, drawing, region.id, value.color, value.material);
        }
        paintings[drawing.id] = restored; histories[drawing.id] = [];
      }
    } catch (cause) {
      if (disposed || token !== request || cause.name === 'AbortError') return;
      error = cause.message;
    }
    loading = false; render();
  }
  async function start() {
    loading = true; error = ''; render();
    try {
      drawings = await loadCatalog(lifecycle.signal);
      if (disposed) return;
      if (drawings.length) await selectDrawing(drawings[0]);
      else { loading = false; render(); }
    } catch (cause) {
      if (disposed || cause.name === 'AbortError') return;
      error = 'No se pudieron cargar los dibujos. Volvé a intentarlo.'; loading = false; render();
    }
  }
  let lastCatalog, lastEntry, lastDrawing, lastPainting, lastError, lastLoading, lastTools, lastCelebrating;
  const emptyPainting = {};
  function render() {
    if (disposed) return;
    const pickerScroll = root.querySelector('.drawing-picker')?.scrollLeft || 0;
    const current = drawing ? painting() : emptyPainting;
    const count = Object.keys(current).length;
    const completed = drawing && count === drawing.regions.length;
    const selectedColor = COLORS.find(c => c.id === color);
    const selectedMaterial = MATERIALS.find(m => m.id === material);
    if (!root.querySelector('.coloring-game')) {
      root.innerHTML = `<section class="game coloring-game" aria-labelledby="game-title"><div class="coloring-heading"></div><div class="coloring-layout"><div class="coloring-paper"></div><aside class="coloring-tools" aria-label="Materiales y colores"></aside></div><div class="coloring-celebration"></div></section>`;
    }
    if (lastCatalog !== drawings || lastEntry !== selectedEntry) {
      replaceView(root.querySelector('.coloring-heading'), heading());
      lastCatalog = drawings; lastEntry = selectedEntry;
    }
    const paper = root.querySelector('.coloring-paper');
    paper.setAttribute('aria-busy', String(loading));
    if (lastDrawing !== drawing || lastPainting !== current || lastError !== error || lastLoading !== loading) {
      replaceView(paper, `
          ${!drawing ? `<div class="drawing-state" role="${error ? 'alert' : 'status'}"><p>${loading ? 'Preparando el dibujo…' : error ? escapeHtml(error) : 'Todavía no hay dibujos para colorear.'}</p>${error ? '<button class="secondary-button" data-action="retry-drawing">Volver a intentar</button>' : ''}</div>` : `
          <div class="paper-caption"><span>${escapeHtml(drawing.name)}</span><span role="status">${count} / ${drawing.regions.length} partes</span></div>
          <svg class="coloring-canvas coloring-raster" viewBox="0 0 ${drawing.width} ${drawing.height}" role="group" aria-label="${escapeHtml(drawing.name)}: tocá los sectores para colorear">
            <defs>${[...new Map(Object.values(current).map(value => [value.material + '-' + value.color, value])).values()].map(value => { return `<pattern id="paint-${value.material}-${value.color}" width="64" height="64" patternTransform="scale(${drawing.width / 600})" patternUnits="userSpaceOnUse">${texture(value.material, COLORS.find(c => c.id === value.color).hex)}</pattern>`; }).join('')}</defs>
            <image href="${escapeHtml(drawing.image)}" width="${drawing.width}" height="${drawing.height}" aria-hidden="true" pointer-events="none"/>
            ${drawing.regions.map(r => `<path class="coloring-region" d="${r.d}" fill="${current[r.id] ? `url(#paint-${current[r.id].material}-${current[r.id].color})` : 'transparent'}" data-region="${r.id}" data-focus="region-${r.id}" role="button" tabindex="0" aria-label="${r.name}${current[r.id] ? `, ${COLORS.find(c => c.id === current[r.id].color).name}, ${MATERIALS.find(m => m.id === current[r.id].material).name}` : ', sin colorear'}"/>`).join('')}
            <image class="coloring-ink" href="${escapeHtml(drawing.image)}" width="${drawing.width}" height="${drawing.height}" aria-hidden="true" pointer-events="none"/>
          </svg>
          ${completed ? '<p class="coloring-message" role="status">¡Terminaste! Podés seguir pintando.</p>' : ''}`}`);
      lastDrawing = drawing; lastPainting = current; lastError = error; lastLoading = loading;
    }
    const toolsState = [color, material, !!drawing, count, drawing && histories[drawing.id].length, downloading, downloadError, resetPending, storageAvailable].join('|');
    if (lastTools !== toolsState) {
      replaceView(root.querySelector('.coloring-tools'), `
          <span class="eyebrow">1 · TU MATERIAL</span>
          <div class="material-picker" role="group" aria-label="Elegir material">${MATERIALS.map(m => `<button data-material="${m.id}" data-focus="material-${m.id}" aria-label="${m.description}" aria-pressed="${m.id === material}" class="paint-color-${color}"><img src="./src/games/coloring/assets/images/materials-v2/${m.id}.png" alt="" draggable="false"/><span>${m.name}</span></button>`).join('')}</div>
          <span class="eyebrow">2 · TU COLOR</span>
          <div class="color-picker" role="group" aria-label="Elegir color">${COLORS.map(c => `<button data-color="${c.id}" data-focus="color-${c.id}" aria-label="${c.name}" aria-pressed="${c.id === color}" class="paint-color-${c.id}">${c.id === color ? icon('check') : ''}</button>`).join('')}</div>
          <div class="material-preview"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><pattern id="tool-preview" width="64" height="64" patternUnits="userSpaceOnUse">${texture(material, selectedColor.hex)}</pattern></defs><rect x="2" y="2" width="60" height="60" rx="12" fill="url(#tool-preview)"/></svg><span><strong>${selectedColor.name}</strong><small>${selectedMaterial.mark}</small></span></div>
          <button class="primary-button coloring-download" data-action="download" data-focus="color-download" ${downloading || !drawing ? 'disabled' : ''}>${icon('download')} ${downloading ? 'Preparando…' : 'Descargar dibujo'}</button>
          ${downloadError ? `<p class="game-message" role="alert">${downloadError}</p>` : ''}
          <div class="coloring-actions"><button class="secondary-button" data-action="undo" data-focus="color-undo" aria-label="Deshacer último cambio" ${drawing && histories[drawing.id].length ? '' : 'disabled'}>${icon('undo')} Deshacer</button><button class="secondary-button" data-action="reset" data-focus="color-reset" ${count ? '' : 'disabled'}>${icon('refresh')} Empezar de nuevo</button></div>
          ${resetPending ? '<div class="reset-confirm" role="group" aria-label="Confirmar empezar de nuevo"><p>¿Dejamos este dibujo en blanco?</p><button class="secondary-button" data-action="cancel-reset">Seguir pintando</button><button class="primary-button" data-action="confirm-reset">Sí, empezar</button></div>' : ''}
          ${storageAvailable ? '' : '<p class="game-message" role="status">El navegador no pudo guardar el dibujo. Podés seguir pintando mientras estés acá.</p>'}`);
      lastTools = toolsState;
    }
    if (lastCelebrating !== celebrating) {
      replaceView(root.querySelector('.coloring-celebration'), celebrating ? confetti() : '');
      lastCelebrating = celebrating;
    }
    root.querySelector('.drawing-picker').scrollLeft = pickerScroll;
  }
  function handleClick(event) {
    const region = event.target.closest('[data-region]');
    if (region) {
      const current = painting();
      const next = paintRegion(current, drawing, region.dataset.region, color, material);
      if (next === current) return;
      celebrating = Object.keys(current).length < drawing.regions.length && Object.keys(next).length === drawing.regions.length;
      save(next); resetPending = false;
      audio.play(celebrating ? 'coloring-success' : 'pop'); render(); return;
    }
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    celebrating = false;
    if (button.dataset.drawing) {
      const entry = drawings.find(d => d.id === button.dataset.drawing);
      if (entry) selectDrawing(entry);
      return;
    }
    if (button.dataset.action === 'retry-drawing') { selectedEntry ? selectDrawing(selectedEntry) : start(); return; }
    if (!drawing && !button.dataset.color && !button.dataset.material) return;
    if (button.dataset.color) color = button.dataset.color;
    if (button.dataset.material) material = button.dataset.material;
    switch (button.dataset.action) {
      case 'download': {
        if (downloading) return;
        downloading = true; downloadError = '';
        downloadPainting(drawing, { ...painting() }).catch(() => {
          downloadError = 'No se pudo descargar. Probá de nuevo.';
        }).finally(() => { downloading = false; render(); });
        render(); return;
      }
      case 'undo': paintings[drawing.id] = histories[drawing.id].pop(); resetPending = false; persist(); break;
      case 'reset': resetPending = true; break;
      case 'cancel-reset': resetPending = false; break;
      case 'confirm-reset': save({}); resetPending = false; break;
      case 'listen': audio.play('coloring-intro'); return;
    }
    render();
  }
  function handleKey(event) {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-region]')) { event.preventDefault(); handleClick(event); }
  }
  start();
  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKey);
  audio.intro();
  return () => { disposed = true; lifecycle.abort(); preparation?.abort(); root.removeEventListener('click', handleClick); root.removeEventListener('keydown', handleKey); };
}
