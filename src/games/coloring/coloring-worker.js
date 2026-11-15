import { detectRegions } from './coloring-regions.js';
self.onmessage = ({ data: { pixels, width, height, includeEdges } }) => {
  try { self.postMessage({ regions: detectRegions(new Uint8ClampedArray(pixels), width, height, { includeEdges }) }); }
  catch (error) { self.postMessage({ error: error.message }); }
};
