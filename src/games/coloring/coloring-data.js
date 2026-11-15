export const COLORS = Object.freeze([
  {
    "id": "rosa",
    "name": "Rosa",
    "hex": "#edb1c4"
  },
  {
    "id": "rojo",
    "name": "Rojo",
    "hex": "#dc8984"
  },
  {
    "id": "naranja",
    "name": "Naranja",
    "hex": "#efb282"
  },
  {
    "id": "amarillo",
    "name": "Amarillo",
    "hex": "#f1d98d"
  },
  {
    "id": "verde",
    "name": "Verde",
    "hex": "#a8bf8b"
  },
  {
    "id": "menta",
    "name": "Menta",
    "hex": "#a8d3be"
  },
  {
    "id": "celeste",
    "name": "Celeste",
    "hex": "#b0d2e3"
  },
  {
    "id": "azul",
    "name": "Azul",
    "hex": "#92a9d2"
  },
  {
    "id": "violeta",
    "name": "Violeta",
    "hex": "#b7a0ce"
  },
  {
    "id": "lila",
    "name": "Lila",
    "hex": "#d5c3e4"
  },
  {
    "id": "lavanda",
    "name": "Lavanda",
    "hex": "#c2c4e3"
  },
  {
    "id": "coral",
    "name": "Coral",
    "hex": "#eaa298"
  },
  {
    "id": "durazno",
    "name": "Durazno",
    "hex": "#f3c6ac"
  },
  {
    "id": "crema",
    "name": "Crema",
    "hex": "#f5e6be"
  },
  {
    "id": "salvia",
    "name": "Salvia",
    "hex": "#bcc9a9"
  },
  {
    "id": "turquesa",
    "name": "Turquesa",
    "hex": "#8ebfbf"
  },
  {
    "id": "piel-clara",
    "name": "Piel clara",
    "hex": "#f2d4c2"
  },
  {
    "id": "piel-media",
    "name": "Piel media",
    "hex": "#d8ab89"
  },
  {
    "id": "piel-oscura",
    "name": "Piel oscura",
    "hex": "#9d745d"
  },
  {
    "id": "marron",
    "name": "Marrón",
    "hex": "#b99377"
  },
  {
    "id": "cacao",
    "name": "Cacao",
    "hex": "#775d52"
  },
  {
    "id": "gris",
    "name": "Gris",
    "hex": "#b5b6b5"
  },
  {
    "id": "pizarra",
    "name": "Pizarra",
    "hex": "#6d7885"
  },
  {
    "id": "blanco",
    "name": "Blanco",
    "hex": "#fffaf0"
  }
]);
export const MATERIALS = Object.freeze([
  {
    "id": "crayon",
    "name": "Crayón",
    "description": "Crayón",
    "mark": "Granitos de cera"
  },
  {
    "id": "brush",
    "name": "Acuarela",
    "description": "Pincel de acuarela",
    "mark": "Manchitas suaves"
  },
  {
    "id": "marker",
    "name": "Fibra",
    "description": "Fibra lisa",
    "mark": "Color liso y parejito"
  },
  {
    "id": "glitter",
    "name": "Brillos",
    "description": "Fibra con brillos",
    "mark": "Destellos y estrellitas"
  }
]);
export function paintRegion(painting, drawing, id, color, material) {
  if (!drawing.regions.some(r => r.id === id) || !COLORS.some(c => c.id === color) || !MATERIALS.some(m => m.id === material)) return painting;
  if (painting[id]?.color === color && painting[id]?.material === material) return painting;
  return { ...painting, [id]: { color, material } };
}
