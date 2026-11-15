export const categories = [
  { id: 'face', label: 'Cara', names: ['Redondita', 'Alargada', 'Cuadradita', 'De pera'] },
  { id: 'hair', label: 'Pelo', names: ['Despeinado', 'Rulitos', 'Cortito', 'Dos colitas'] },
  { id: 'eyes', label: 'Ojos', names: ['Bien abiertos', 'Contentos', '¡Pirata!', 'Bizquitos'] },
  { id: 'nose', label: 'Nariz', names: ['Botoncito', '¡De payaso!', 'Narigona', 'Respingada'] },
  { id: 'mouth', label: 'Boca', names: ['Sonrisa', '¡Lengua afuera!', '¡Ohhh!', 'Carcajada'] },
  { id: 'ears', label: 'Orejas', names: ['Chiquitas', 'Grandotas', 'De duende', 'Redonditas'] },
  { id: 'makeup', label: 'Maquillaje', names: ['Sin maquillaje', 'Rubor', 'Pecas doradas', 'Estrellitas'] },
  { id: 'earrings', label: 'Aritos', names: ['Sin aritos', 'Estrellas', 'Corazones', 'Perlitas'] },
  { id: 'accessory', label: 'Accesorios', names: ['Sin accesorio', 'Corona', 'Anteojos', 'Moñito'] },
  { id: 'outfit', label: 'Ropa', names: ['A rayas', 'Jardinero', 'Con capucha', 'Un corazón', 'Vestido de flores', 'Chomba Lausanne', 'Pulóver beige', 'Bata de ratoncita', 'Argentina 2026', 'Vestido de Bella', 'Vestido de Rapunzel', 'Vestido de Bella Durmiente'] },
];

export const skinColors = [
  { name: 'Durazno', color: '#f4c5a4', filter: 'none' },
  { name: 'Dorado', color: '#dca070', filter: 'brightness(.86) saturate(1.2)' },
  { name: 'Canela', color: '#b97850', filter: 'brightness(.68) saturate(1.25)' },
  { name: 'Cacao', color: '#85533d', filter: 'brightness(.48) saturate(1.1)' },
];
export const hairColors = [
  { name: 'Castaño', color: '#79462f', filter: 'none' },
  { name: 'Negro', color: '#332a2b', filter: 'saturate(.3) brightness(.48)' },
  { name: 'Rubio', color: '#dfb65d', filter: 'sepia(1) saturate(1.7) brightness(1.9)' },
  { name: 'Pelirrojo', color: '#bd5933', filter: 'sepia(.5) saturate(2) brightness(1.3)' },
  { name: 'Violeta', color: '#9a78b5', filter: 'sepia(1) saturate(2) hue-rotate(225deg) brightness(1.5)' },
  { name: 'Azul', color: '#6b9fae', filter: 'sepia(1) saturate(1.5) hue-rotate(150deg) brightness(1.6)' },
];

export const defaultFace = Object.freeze({ face: 0, hair: 3, eyes: 0, nose: 0, mouth: 0, ears: 0, outfit: 1, skin: 0, hairColor: 0, makeup: 0, earrings: 0, accessory: 0 });
export const STORAGE_KEY = 'lupe-faces-v1';

export function normalizeFace(value) {
  const result = { ...defaultFace };
  if (!value || typeof value !== 'object') return result;
  for (const key of [...categories.map(item => item.id), 'skin', 'hairColor']) {
    const max = key === 'skin' ? skinColors.length : key === 'hairColor' ? hairColors.length : categories.find(item => item.id === key).names.length;
    if (Number.isInteger(value[key]) && value[key] >= 0 && value[key] < max) result[key] = value[key];
  }
  return result;
}

export function randomFace(random = Math.random) {
  const result = { ...defaultFace };
  for (const { id, names } of categories) result[id] = Math.floor(random() * names.length);
  result.skin = Math.floor(random() * skinColors.length);
  result.hairColor = Math.floor(random() * hairColors.length);
  return result;
}

export function asset(part, index) {
  return new URL(`./assets/images/${(['outfit', 'mouth', 'eyes', 'makeup', 'earrings', 'accessory'].includes(part) || part === 'ears' && index === 3) ? 'ai-v2' : 'ai-v1'}/${part}-${index}.png`, import.meta.url).href;
}
