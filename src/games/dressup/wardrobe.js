export const STORAGE_KEY = 'lupe-dressup-v1';
export const CANVAS = { width: 1024, height: 1536 };
const item = (id, name, frame, extra = {}) => ({ id, name, file: `${id}.png`, frame, ...extra });

export const categories = [
  { id: 'hair', label: 'Peinados', items: [
    item('hair-halfup', 'Semirrecogido', [0, 0, 1024, 1536]),
    item('hair-ponytail', 'Cola alta', [0, 0, 1024, 1536]),
    item('hair-braids', 'Dos trenzas', [0, 0, 1024, 1536]),
  ] },
  { id: 'head', label: 'Accesorios de cabeza', items: [
    { id: 'head-none', name: 'Sin accesorio' },
    item('head-bow', 'Moño crema', [318, 5, 374, 180]),
    item('head-pink', 'Moño rosa', [338, 22, 320, 155]),
    item('head-band', 'Vincha de flores', [322, 73, 350, 170]),
  ] },
  { id: 'top', label: 'Parte superior', items: [
    item('dress-flowers', 'Vestido de flores', [245, 465, 490, 770], { dress: true }),
    item('dress-blue-flowers', 'Vestido de flores celestes', [165, 465, 650, 805], { dress: true }),
    item('dress-red-black', 'Vestido rojo y negro', [225, 465, 530, 755], { dress: true }),
    item('dress-blush', 'Vestido de tul', [225, 465, 530, 910], { dress: true }),
    item('dress-hearts', 'Vestido de corazones', [200, 460, 580, 800], { dress: true }),
    item('dress-plaid', 'Vestido de cuadros y flores', [200, 460, 580, 800], { dress: true }),
    item('dress-ice-princess', 'Vestido de princesa de hielo', [90, 460, 800, 1030], { dress: true, longSleeves: true, floorLength: true }),
    item('dress-embroidered', 'Vestido blanco bordado', [200, 460, 580, 875], { dress: true }),
    item('dress-black', 'Vestido negro', [250, 460, 480, 760], { dress: true }),
    item('poncho-strawberries', 'Poncho de frutillas', [190, 460, 600, 790], { onePiece: true }),
    item('dress-anna-cape', 'Vestido azul con capa rosa', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('dress-anna-green', 'Vestido verde de Anna', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('dress-belle', 'Vestido amarillo de Bella', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('dress-aurora', 'Vestido rosa de Aurora', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('dress-snow-white', 'Vestido de Blancanieves', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('dress-rapunzel', 'Vestido de Rapunzel', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('dress-tiana', 'Vestido verde de Tiana', [0, 0, 1024, 1536], { dress: true, fitted: true, includesHands: true, fittedBody: true, floorLength: true }),
    item('swimsuit-unicorns', 'Traje de baño de unicornios', [230, 460, 520, 620], { onePiece: true, longSleeves: true }),
    item('swimsuit-cherries', 'Traje de baño de cerezas', [0, 0, 1024, 1536], { onePiece: true, fitted: true, includesHands: true }),
    item('top-school', 'Chomba del colegio', [260, 459, 460, 431]),
    item('top-knit', 'Chaleco y blusa', [230, 464, 520, 485]),
    item('top-flowers', 'Remera de florcitas', [235, 464, 510, 480]),
    item('top-ivory', 'Blusa bordada', [230, 464, 520, 485]),
    item('top-yellow', 'Remera amarilla', [285, 470, 415, 410]),
    item('top-peterpan', 'Blusa de flores con cuello', [270, 460, 440, 450]),
  ] },
  { id: 'bottom', label: 'Parte inferior', items: [
    item('bottom-shorts', 'Short de jean', [333, 848, 305, 181]),
    item('bottom-jeans', 'Jean azul', [333, 849, 305, 595]),
    item('bottom-orange', 'Pollera naranja', [238, 844, 505, 370]),
    item('bottom-pink', 'Pantalón rosa', [300, 842, 380, 593]),
    item('bottom-school', 'Pollera del colegio', [290, 838, 400, 290]),
  ] },
  { id: 'socks', label: 'Medias', items: [
    { id: 'socks-none', name: 'Sin medias' },
    item('socks-white', 'Blancas', [0, 0, 1024, 1536]),
    item('socks-pink', 'Rosas', [0, 0, 1024, 1536]),
  ] },
  { id: 'shoes', label: 'Zapatillas', items: [
    item('shoes-pink', 'Guillerminas rosas', [306, 1385, 353, 130]),
    item('shoes-sport', 'Deportivas negras', [297, 1370, 375, 145]),
    item('shoes-stripes', 'Negras de tres tiras', [297, 1320, 375, 200]),
    item('shoes-high', 'Botitas negras', [302, 1350, 365, 165]),
  ] },
];

export const defaultOutfit = Object.freeze({ hair: 'hair-halfup', head: 'head-bow', top: 'dress-flowers', bottom: 'bottom-shorts', socks: 'socks-white', shoes: 'shoes-pink' });
export const findItem = (category, id) => categories.find(group => group.id === category)?.items.find(choice => choice.id === id);
export const asset = name => new URL(`./assets/images/${name}`, import.meta.url).href;
export const wearsDress = outfit => Boolean(findItem('top', outfit?.top)?.dress);
export const coversBottom = outfit => wearsDress(outfit) || Boolean(findItem('top', outfit?.top)?.onePiece);

export function normalizeOutfit(value) {
  return Object.fromEntries(categories.map(group => [group.id,
    findItem(group.id, value?.[group.id])?.id || defaultOutfit[group.id],
  ]));
}

export function chooseItem(outfit, category, id) {
  const current = normalizeOutfit(outfit);
  if (category === 'bottom' && coversBottom(current)) return current;
  return findItem(category, id) ? { ...current, [category]: id } : current;
}

export function randomOutfit(random = Math.random) {
  return Object.fromEntries(categories.map(group => [group.id, group.items[Math.max(0, Math.min(group.items.length - 1, Math.floor(random() * group.items.length)))].id]));
}

export function outfitLayers(value) {
  const outfit = normalizeOutfit(value);
  const top = findItem('top', outfit.top);
  const longSleeves = Boolean(top?.longSleeves) || ['top-knit', 'top-flowers', 'top-ivory'].includes(outfit.top);
  return [
    { ...findItem('hair', outfit.hair), swimsuitBase: outfit.top === 'swimsuit-cherries', fittedBody: Boolean(findItem('top', outfit.top)?.fittedBody) }, { ...findItem('socks', outfit.socks), figureFile: `${outfit.hair}.png` },
    !coversBottom(outfit) && findItem('bottom', outfit.bottom),
    top?.floorLength && findItem('shoes', outfit.shoes), top,
    !findItem('top', outfit.top)?.includesHands && { id: 'hands', file: `${outfit.hair}.png`, frame: [0, 0, 1024, 1536], longSleeves, handsOnly: longSleeves || outfit.top === 'top-school', armFit: outfit.top === 'dress-black' ? 'sleeveless' : outfit.top === 'poncho-strawberries' ? 'poncho' : '' },
    !top?.floorLength && findItem('shoes', outfit.shoes), findItem('head', outfit.head),
  ].filter(layer => layer?.file);
}

export function outfitDescription(value) {
  const outfit = normalizeOutfit(value);
  return `Lupe con ${categories.filter(group => group.id !== 'bottom' || !coversBottom(outfit)).map(group => findItem(group.id, outfit[group.id]).name.toLowerCase()).join(', ')}`;
}
