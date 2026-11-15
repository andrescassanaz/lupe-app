export const FLAVORS = Object.freeze([
  { id: 'frutilla', name: 'Frutilla', color: '#ed91a9', ingredient: 'strawberry' },
  { id: 'chocolate', name: 'Chocolate', color: '#865540', ingredient: 'chocolate' },
  { id: 'vainilla', name: 'Vainilla', color: '#f4deb0', ingredient: 'vanilla' },
  { id: 'arandanos', name: 'Arándanos', color: '#9281bd' },
  { id: 'crema', name: 'Crema americana', color: '#fffdf7' },
  { id: 'pistacho', name: 'Pistacho', color: '#a7bd83' },
  { id: 'naranja', name: 'Naranja', color: '#efa45f' },
  { id: 'cielo', name: 'Crema del cielo', color: '#8fc9e5' },
  { id: 'oreo', name: 'Oreo', color: '#eee9e2' },
]);
export const MAX_SCOOPS = 4;

export function createOrder(random = Math.random) {
  const count = random() < 0.5 ? 3 : MAX_SCOOPS;
  return Array.from({ length: count }, () => FLAVORS[Math.floor(random() * FLAVORS.length)].id);
}

export function addScoop(scoops, flavor) {
  return scoops.length < MAX_SCOOPS && FLAVORS.some(item => item.id === flavor) ? [...scoops, flavor] : scoops;
}

export function orderMatches(order, scoops) {
  return order.length === scoops.length && [...order].sort().every((flavor, i) => flavor === [...scoops].sort()[i]);
}

export function orderAudio(order) {
  if (order.every(id => ['frutilla', 'chocolate', 'vainilla'].includes(id))) {
    return `order-${[...order].sort().join('-')}`;
  }
  return ['order-intro', ...order.map(id => `scoop-${id}`)];
}
