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
export const CONTAINERS = Object.freeze([
  { id: 'cone', name: 'Cucurucho', capacity: 2 },
  { id: 'cup', name: 'Vasito', capacity: 2 },
  { id: 'basket', name: 'Canastita', capacity: 3 },
  { id: 'quarter', name: 'Cuarto de helado', capacity: 4 },
  { id: 'super', name: 'Súper cucurucho', capacity: 6, special: true },
]);
export const MAX_SCOOPS = 6;
export const POPSICLES = Object.freeze([
  { id: 'corazon', name: 'Corazón' },
  { id: 'huellita', name: 'Huellita' },
  { id: 'carita', name: 'Carita con granas' },
  { id: 'minion', name: 'Minion' },
  { id: 'chanchito', name: 'Chanchito' },
  { id: 'panda', name: 'Panda' },
  { id: 'chocolate', name: 'Chocolate crocante' },
  { id: 'coco', name: 'Coco y caramelo' },
]);
export const MAX_POPSICLES = 4;
export const containerById = id => CONTAINERS.find(item => item.id === id);

export function createOrder(random = Math.random, containerId) {
  const roll = random();
  if (containerId === 'popsicle' || (!containerById(containerId) && roll >= .84 && roll < .92)) {
    const quantity = 1 + Math.floor(random() * MAX_POPSICLES);
    return { container: 'popsicle', flavors: [], popsicles: Array.from({ length: quantity }, () => POPSICLES[Math.floor(random() * POPSICLES.length)].id) };
  }
  const container = containerById(containerId) || CONTAINERS[roll >= .92 ? 4 : Math.floor(roll / .92 * 4)];
  const available = FLAVORS.map(flavor => flavor.id);
  const flavors = Array.from({ length: container.capacity }, () => available.splice(Math.floor(random() * available.length), 1)[0]);
  return { container: container.id, flavors };
}

export function addPopsicle(popsicles, id) {
  return popsicles.length < MAX_POPSICLES && POPSICLES.some(item => item.id === id) ? [...popsicles, id] : popsicles;
}

export function addScoop(scoops, flavor, containerId = 'cone') {
  const container = containerById(containerId);
  return container && scoops.length < container.capacity && !scoops.includes(flavor) && FLAVORS.some(item => item.id === flavor) ? [...scoops, flavor] : scoops;
}

export function changeContainer(scoops, containerId) {
  const container = containerById(containerId);
  return container ? scoops.slice(0, container.capacity) : scoops;
}

export function orderMatches(order, scoops, containerId, popsicles = []) {
  if (order.container !== containerId) return false;
  if (order.container === 'popsicle' ? scoops.length : popsicles.length) return false;
  const requested = order.container === 'popsicle' ? order.popsicles : order.flavors;
  const prepared = order.container === 'popsicle' ? popsicles : scoops;
  return requested.length === prepared.length && [...requested].sort().every((id, i) => id === [...prepared].sort()[i]);
}

export function orderAudio(order) {
  if (order.container === 'popsicle') return [`popsicle-order-${order.popsicles.length}`, ...order.popsicles.map(id => `popsicle-${id}`)];
  return [`container-${order.container}`, ...order.flavors.map(id => `scoop-${id}`)];
}
