import { image } from '../../shared/art.js';
import { FLAVORS, POPSICLES } from './rules.js';

const newArt = new Set(['shop', ...FLAVORS.slice(3).map(f => `scoop-${f.id}`)]);
export const art = (name, className = '', alt = '') =>
  image(new URL(`./assets/images/${newArt.has(name) ? 'ai-v2' : 'ai-v1'}/${name}.png`, import.meta.url), className, alt);

export function scoop(flavor, className = '') {
  const item = FLAVORS.find(f => f.id === flavor);
  return `<span class="scoop ${className} ${item.id}" data-scoop="${item.id}" role="img" aria-label="Sabor ${item.name.toLowerCase()}">${art(`scoop-${item.id}`, 'scoop-art')}</span>`;
}

// Served scoops have their own round silhouette; the little characters remain
// on the flavor buttons and the customer's order as recognizable labels.
export function servedScoop(flavor, region) {
  const item = FLAVORS.find(f => f.id === flavor);
  const [light, cream, shade] = {
    frutilla: ['#ffe0df', '#efa0b2', '#c86d89'],
    chocolate: ['#c39a7b', '#95664e', '#623d30'],
    vainilla: ['#fff5d9', '#f2dfb1', '#c9aa73'],
    arandanos: ['#d5c8ea', '#a18bc4', '#766095'],
    crema: ['#fffef8', '#f4eee2', '#c9bdac'],
    pistacho: ['#e2e9bb', '#b2c68b', '#80965e'],
    naranja: ['#ffdfad', '#f3ad69', '#d17d3d'],
    cielo: ['#dff4f7', '#a0d6e9', '#68a4c1'],
    oreo: ['#fffaf0', '#e4dcd1', '#b4a69a'],
  }[flavor];
  const id = `scoop-${region}`;
  const silhouette = 'M12 65C8 53 15 36 23 28C27 16 43 10 54 11C66 5 83 12 90 19C105 24 110 40 108 52C116 62 112 72 115 80C120 89 112 98 104 97C100 106 86 102 79 104C69 110 59 104 51 105C40 109 32 101 25 102C14 104 7 97 10 90C2 84 5 73 12 65Z';
  const crumbs = flavor === 'oreo' ? `<g fill="#594036" opacity=".9"><path d="m29 32 8-4 5 7-9 5zM72 20l7 2-1 7-8-2zM85 47l9-3 5 7-9 6zM43 65l7-3 4 8-8 4zM22 78l7-2 3 6-8 3zM76 85l9-4 4 8-10 3z"/><path d="m52 29 3 1-1 4-3-1zM60 48l4-1 2 3-5 2zM97 72l3 2-2 4-3-2zM36 48l3-2 2 3-4 2z"/></g>` : '';
  return `<span class="scoop served-scoop ${item.id}" data-scoop="${item.id}" data-region="${region}" role="img" aria-label="Sabor ${item.name.toLowerCase()}">
    <svg class="served-scoop-art" viewBox="0 0 120 110" aria-hidden="true">
      <defs>
        <radialGradient id="${id}-volume" cx="34%" cy="25%" r="80%"><stop stop-color="${light}"/><stop offset=".5" stop-color="${cream}"/><stop offset="1" stop-color="${shade}"/></radialGradient>
        <pattern id="${id}-grain" width="17" height="19" patternUnits="userSpaceOnUse"><path d="m3 6 2-1m6 10 3-1" stroke="${shade}" stroke-width=".7" opacity=".18"/><circle cx="12" cy="4" r=".8" fill="${light}" opacity=".6"/></pattern>
      </defs>
      <path d="${silhouette}" fill="url(#${id}-volume)"/>
      <path d="M19 57C17 38 34 20 53 20M26 67C24 48 40 33 57 31M60 19C75 18 87 26 92 35" fill="none" stroke="${light}" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>
      <path d="M17 81Q22 89 30 84M35 91Q44 98 51 92M62 94Q72 101 80 93M90 84Q103 86 105 74M87 41Q100 54 94 65" fill="none" stroke="${shade}" stroke-width="2.5" stroke-linecap="round" opacity=".25"/>
      <path d="${silhouette}" fill="url(#${id}-grain)"/>
      ${crumbs}
    </svg>
  </span>`;
}

// Each expression comes from the same AI-generated character sheet.
export function customerArt(index, mood = 'waiting') {
  const kind = ['bunny', 'bear', 'fox'][index % 3];
  const expression = mood === 'sad' ? 'sad' : ['happy', 'leaving'].includes(mood) ? 'happy' : 'waiting';
  const label = `${{ bunny: 'Conejito', bear: 'Osito', fox: 'Zorrito' }[kind]} ${expression === 'sad' ? 'triste: quiere que pruebes otra vez' : expression === 'happy' ? 'contento con su helado' : 'esperando su helado'}`;
  // Keep all expressions decoded so a reaction never flashes during a turn.
  return `<div class="customer-art" role="img" aria-label="${label}">${['waiting', 'sad', 'happy'].map(state => image(new URL(`./assets/images/ai-v3/customer-${kind}-${state}.png`, import.meta.url), `customer-expression ${state}${state === expression ? ' is-visible' : ''}`)).join('')}</div>`;
}

export function vesselArt(id, className = '') {
  return image(new URL(id === 'super' ? './assets/images/ai-v6/container-super.png' : id === 'cup' ? './assets/images/ai-v5/container-cup.png' : `./assets/images/ai-v4/container-${id}.png`, import.meta.url), `vessel-art vessel-icon-${id} ${className}`);
}

export function popsicleArt(id, className = '') {
  const item = POPSICLES.find(p => p.id === id);
  return `<span class="popsicle-art ${className}" data-popsicle="${id}" role="img" aria-label="Paleta ${item.name.toLowerCase()}">${image(new URL(`./assets/images/ai-v6/popsicle-${id}.png`, import.meta.url))}</span>`;
}
