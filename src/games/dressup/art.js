import { asset, CANVAS, outfitLayers } from './wardrobe.js';

// Clothing is fitted to anatomical landmarks, not stretched as one rectangle.
// Coordinates always refer to the same 1024 × 1536 doll, including PNG export.
const loaded = new Map();
const rendered = new Map();
const surface = (width = CANVAS.width, height = CANVAS.height) => {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
};

function cropToAlpha(image, area = [0, 0, image.width, image.height]) {
  const canvas = surface(area[2], area[3]), ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, ...area, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 24) { left = Math.min(left, x); right = Math.max(right, x + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1); }
  }
  if (left >= right) return canvas;
  const trimmed = surface(right - left, bottom - top);
  trimmed.getContext('2d').drawImage(canvas, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}

async function source(file) {
  if (!loaded.has(file)) loaded.set(file, (async () => {
    const image = new Image(); image.src = asset(file); await image.decode(); return image;
  })().catch(error => { loaded.delete(file); throw error; }));
  return loaded.get(file);
}

// Draw one affine triangle, expanding its clip slightly to avoid subpixel cracks.
function triangle(ctx, image, from, to) {
  const [s0, s1, s2] = from, [d0, d1, d2] = to;
  const sx1 = s1[0] - s0[0], sy1 = s1[1] - s0[1], sx2 = s2[0] - s0[0], sy2 = s2[1] - s0[1];
  const det = sx1 * sy2 - sx2 * sy1;
  const dx1 = d1[0] - d0[0], dy1 = d1[1] - d0[1], dx2 = d2[0] - d0[0], dy2 = d2[1] - d0[1];
  const a = (dx1 * sy2 - dx2 * sy1) / det, c = (dx2 * sx1 - dx1 * sx2) / det;
  const b = (dy1 * sy2 - dy2 * sy1) / det, d = (dy2 * sx1 - dy1 * sx2) / det;
  const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3;
  ctx.save(); ctx.beginPath();
  to.forEach(([x, y], i) => { const distance = Math.hypot(x - cx, y - cy); ctx[i ? 'lineTo' : 'moveTo'](x + (x - cx) / distance * .65, y + (y - cy) / distance * .65); });
  ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]);
  ctx.drawImage(image, 0, 0); ctx.restore();
}

function mesh(ctx, image, xs, ys, points) {
  for (let row = 0; row < ys.length - 1; row++) for (let col = 0; col < (Array.isArray(xs[0]) ? xs[0].length : xs.length) - 1; col++) {
    const corners = [[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]];
    for (const indexes of [[0, 1, 2], [0, 2, 3]]) triangle(ctx, image,
      indexes.map(i => [(Array.isArray(xs[0]) ? xs[corners[i][1]][corners[i][0]] : xs[corners[i][0]]) * image.width, ys[corners[i][1]] * image.height]),
      indexes.map(i => points[corners[i][1]][corners[i][0]]));
  }
}

function silhouette(ctx, image, rows) {
  mesh(ctx, image, [0, .5, 1], rows.map(row => row[0]), rows.map(([, y, width, center = 490]) => [[center - width / 2, y], [center, y], [center + width / 2, y]]));
}

function blouse(ctx, image, id) {
  // Each row follows the sleeve edges and side seams of this particular garment.
  // Columns: margin, outer sleeve, inner sleeve, torso, center, and mirror side.
  const flower = id === 'top-flowers';
  const ys = flower ? [0, .1, .18, .38, .5, .68, .9, 1] : [0, .1, .18, .38, .55, .7, .9, .96, 1];
  const seams = flower ? [
    [.24, .30, .38, .62, .70, .76], [.275, .32, .38, .62, .68, .725],
    [.244, .32, .38, .62, .675, .752], [.186, .32, .33, .67, .68, .807],
    [.149, .293, .322, .670, .699, .846], [.088, .229, .31, .683, .764, .908],
    [.008, .132, .282, .709, .862, .991], [.001, .10, .276, .715, .90, .999],
  ] : id === 'top-knit' ? [
    [.24, .30, .38, .62, .70, .76], [.265, .31, .38, .62, .69, .735],
    [.231, .31, .37, .63, .69, .765], [.159, .29, .31, .68, .70, .834],
    [.096, .268, .282, .696, .710, .895], [.035, .218, .25, .73, .76, .963],
    [.006, .154, .179, .793, .825, .995], [.065, .11, .20, .78, .88, .93],
    [.06, .11, .20, .78, .88, .94],
  ] : [
    [.24, .30, .38, .62, .70, .76], [.231, .29, .38, .62, .70, .758],
    [.186, .29, .37, .63, .70, .798], [.125, .265, .29, .71, .735, .851],
    [.076, .25, .26, .73, .74, .912], [.027, .213, .23, .76, .78, .97],
    [.016, .139, .181, .802, .853, .98], [.06, .11, .19, .80, .89, .94],
    [.06, .11, .19, .80, .89, .94],
  ];
  const sourceColumns = seams.map(([a,b,c,d,e,f]) => [a,b,c,.5,d,e,f]);
  const anchors = [
    [464, 464, 320, 370, 418, 563, 610, 660],
    [505, 505, 325, 375, 418, 563, 607, 655],
    [550, 550, 303, 380, 405, 575, 610, 679],
    [680, 680, 284, 365, 366, 613, 614, 694],
    [750, 740, 268, 352, 355, 624, 626, 710],
    [825, 810, 248, 329, 340, 640, 651, 732],
    [925, 870, 235, 307, 332, 648, 673, 744],
    [950, flower ? 890 : 905, 235, 307, 332, 648, 673, 744],
    [965, 918, 235, 307, 332, 648, 673, 744],
  ];
  const points = ys.map((_, i) => {
    const [sleeveY, torsoY, a,b,c,d,e,f] = anchors[i];
    return [[a,sleeveY],[b,sleeveY],[c,torsoY],[490,torsoY],[d,torsoY],[e,sleeveY],[f,sleeveY]];
  });
  mesh(ctx, image, sourceColumns, ys, points);
}

const dressRows = {
  'dress-blue-flowers': [[0, 465, 590], [.1, 550, 630], [.33, 805, 820], [.78, 1160, 680], [1, 1270, 650]],
  'dress-flowers': [[0, 465, 510], [.1, 550, 560], [.305, 805, 700], [1, 1240, 520]],
  'dress-red-black': [[0, 465, 550], [.15, 560, 580], [.42, 805, 740], [1, 1235, 550]],
  'dress-blush': [[0, 465, 595], [.1, 560, 625], [.285, 805, 720], [1, 1355, 550]],
  'dress-hearts': [[0, 460, 590], [.15, 555, 610], [.37, 805, 720], [1, 1260, 580]],
  'dress-plaid': [[0, 460, 540], [.12, 550, 560], [.32, 745, 600], [1, 1260, 580]],
  'dress-embroidered': [[0, 460, 540], [.12, 555, 540], [.35, 805, 660], [1, 1335, 530]],
  'dress-black': [[0, 452, 480], [.10, 527, 470], [.18, 610, 470], [.28, 700, 525], [.38, 800, 600], [1, 1220, 480]],
};

function icePrincessDress(ctx, image) {
  // Keep the neckline, sleeve seams and cuffs on their own anatomical anchors.
  // The source retains its full canvas so transparent neck/arm openings stay put.
  const rows = [
    [530, 460, [395, 420, 437, 512, 585, 605, 630], [325, 380, 414, 490, 568, 605, 655]],
    [550, 485, [395, 415, 437, 512, 585, 605, 630], [320, 380, 414, 490, 568, 605, 660]],
    [575, 510, [365, 395, 400, 512, 624, 627, 657], [310, 375, 385, 490, 595, 605, 675]],
    [650, 610, [333, 393, 405, 512, 615, 628, 687], [290, 375, 385, 490, 595, 610, 696]],
    [700, 690, [317, 390, 406, 512, 613, 629, 702], [280, 366, 373, 490, 610, 616, 704]],
    [800, 805, [280, 353, 394, 512, 623, 664, 738], [247, 338, 343, 490, 637, 642, 740]],
    [850, 865, [266, 332, 362, 512, 653, 684, 752], [237, 318, 330, 490, 650, 662, 748]],
    [925, 945, [243, 305, 325, 512, 689, 711, 774], [232, 310, 320, 490, 660, 670, 748]],
    [940, 960, [243, 305, 318, 512, 697, 711, 774], [232, 310, 320, 490, 660, 670, 748]],
    [1536, 1490, [40, 120, 300, 512, 724, 904, 984], [28, 108, 288, 490, 692, 872, 952]],
  ];
  mesh(ctx, image, rows.map(([, , xs]) => [0, ...xs.map(x => x / 1024), 1]),
    rows.map(([y]) => y / 1536),
    rows.map(([, y, , xs]) => [[0, y], ...xs.map(x => [x, y]), [1024, y]]));
}

function swimsuit(ctx, image) {
  // Fit the cuffs independently from the waist ruffle and one-piece bottom.
  const ys = [0, .1, .2, .35, .5, .62, .75, .82, 1];
  const columns = [
    [.24, .30, .38, .5, .62, .70, .76],
    [.265, .32, .38, .5, .62, .68, .735],
    [.225, .31, .33, .5, .67, .69, .775],
    [.16, .28, .307, .5, .693, .72, .84],
    [.10, .23, .31, .5, .69, .77, .90],
    [.045, .175, .287, .5, .713, .825, .955],
    [0, .10, .22, .5, .78, .90, 1],
    [0, .10, .28, .5, .72, .90, 1],
    [0, .10, .28, .5, .72, .90, 1],
  ];
  const anchors = [
    [460, 460, 320, 370, 418, 563, 610, 660],
    [510, 510, 320, 375, 410, 570, 610, 660],
    [570, 570, 300, 378, 395, 585, 610, 680],
    [690, 690, 280, 365, 366, 614, 615, 700],
    [790, 780, 258, 342, 348, 632, 638, 724],
    [865, 850, 242, 324, 337, 643, 660, 740],
    [945, 997, 235, 307, 315, 665, 673, 744],
    [965, 1035, 235, 307, 330, 650, 673, 744],
    [1110, 1110, 235, 307, 330, 650, 673, 744],
  ];
  mesh(ctx, image, columns, ys, anchors.map(([sy, ty, a, b, c, d, e, f]) =>
    [[a, sy], [b, sy], [c, ty], [490, ty], [d, ty], [e, sy], [f, sy]]));
}

function schoolPolo(ctx, image) {
  // The back of the folded collar belongs behind the neck. Keep its front
  // leaves, but expose the uninterrupted neck through the central opening.
  const cloth = surface(image.width, image.height), cc = cloth.getContext('2d');
  cc.drawImage(image, 0, 0); cc.save(); cc.scale(cloth.width, cloth.height);
  cc.globalCompositeOperation = 'destination-out'; cc.beginPath();
  const opening = [[.34, -.01], [.66, -.01], [.66, .045], [.64, .055],
    [.621, .07], [.596, .09], [.567, .11], [.529, .13], [.5, .145],
    [.473, .13], [.433, .11], [.403, .09], [.375, .07], [.357, .055], [.34, .045]];
  opening.forEach(([x, y], i) => cc[i ? 'lineTo' : 'moveTo'](x, y));
  cc.closePath(); cc.fill(); cc.restore();
  // Collar meets the actual neckline; cuffs sit around the upper arms. Keep
  // enough torso length for a relaxed polo without widening the shoulders.
  silhouette(ctx, cloth, [[0, 445, 425], [.15, 505, 440], [.5, 650, 425], [1, 882, 410]]);
}

function pair(ctx, image, id) {
  const lowSneaker = id === 'shoes-sport' || id === 'shoes-stripes';
  for (let side = 0; side < 2; side++) {
    const half = cropToAlpha(image, [Math.floor(image.width * side / 2), 0, Math.floor(image.width / 2), image.height]);
    if (lowSneaker || id === 'shoes-high') {
      // These catalog images show an EMPTY shoe: the rear collar, heel tab and
      // dark interior are visible. When worn, the ankle occludes that rear part,
      // while the curved front tongue and side walls remain in front of it.
      // Open the channel all the way through the back rim so the real leg,
      // selected sock or trouser can continue into the shoe without a black oval.
      const hc = half.getContext('2d'); hc.save(); hc.scale(half.width, half.height);
      hc.globalCompositeOperation = 'destination-out'; hc.beginPath();
      if (lowSneaker) {
        hc.moveTo(.22, -.01); hc.lineTo(.78, -.01); hc.lineTo(.78, .355);
        hc.bezierCurveTo(.68, .285, .60, .26, .50, .26);
        hc.bezierCurveTo(.40, .26, .32, .285, .22, .355);
      } else {
        hc.moveTo(.20, -.01); hc.lineTo(.80, -.01); hc.lineTo(.80, .21);
        hc.bezierCurveTo(.69, .145, .61, .10, .50, .10);
        hc.bezierCurveTo(.39, .10, .31, .145, .20, .21);
      }
      hc.closePath(); hc.fill(); hc.restore();
    }
    if (id === 'shoes-pink') {
      // The catalog shoe contains an empty beige insole. Its two openings must
      // reveal the actual foot or sock when worn; keep the strap and shoe rim.
      const hc = half.getContext('2d'); hc.save(); hc.scale(half.width, half.height);
      hc.globalCompositeOperation = 'destination-out'; hc.beginPath();
      hc.moveTo(.23, .28); hc.bezierCurveTo(.25, .025, .77, .025, .80, .28); hc.closePath();
      hc.moveTo(.235, .405); hc.bezierCurveTo(.40, .385, .65, .385, .78, .405);
      hc.lineTo(.755, .515); hc.bezierCurveTo(.72, .575, .29, .575, .245, .515); hc.closePath();
      hc.fill(); hc.restore();
    }
    const ankle = side ? 581 : 383, toe = side ? 598 : 370;
    // Campus-style sneakers need room for their taller upper and thick sole.
    const shoeTop = id === 'shoes-stripes' ? 1320 : id === 'shoes-high' ? 1325 : lowSneaker ? 1350 : 1365;
    const rows = [[0, shoeTop, 120, ankle], [1, 1520, 126, toe]];
    silhouette(ctx, half, rows);
  }
}

function socks(ctx, image, body, id) {
  const mask = surface(), mc = mask.getContext('2d', { willReadFrequently: true });
  const top = id === 'socks-white' ? 1310 : 1190, bottom = 1510;
  mc.drawImage(body, 0, 0, CANVAS.width, CANVAS.height);
  const skin = mc.getImageData(0, 0, CANVAS.width, CANVAS.height).data;
  for (let side = 0; side < 2; side++) {
    const cloth = cropToAlpha(image, [Math.floor(image.width * side / 2), 0, Math.floor(image.width / 2), image.height]);
    const pixels = cloth.getContext('2d').getImageData(0, 0, cloth.width, cloth.height).data;
    const rowBounds = [];
    for (let y = 0; y < cloth.height; y++) {
      let left = cloth.width, right = -1;
      for (let x = 0; x < cloth.width; x++) if (pixels[(y * cloth.width + x) * 4 + 3] > 100) { left = Math.min(left, x); right = x; }
      rowBounds.push(right > left ? [left, right + 1] : null);
    }
    for (let y = top; y < bottom; y++) {
      const sy = Math.min(cloth.height - 2, Math.floor((.02 + .96 * (y - top) / (bottom - top)) * cloth.height));
      const bounds = rowBounds[sy]; if (!bounds) continue;
      let left = 1024, right = -1;
      for (let x = side ? 500 : 300; x < (side ? 690 : 480); x++) if (skin[(y * 1024 + x) * 4 + 3] > 100) { left = Math.min(left, x); right = x; }
      if (right <= left) continue;
      // Draw actual opaque cloth across the leg before clipping its outer edge.
      // Never replace a transparent source pixel's alpha with skin alpha: that
      // was the cause of black rims on the previous socks.
      ctx.drawImage(cloth, bounds[0], sy, bounds[1] - bounds[0], 1, left - 2, y, right - left + 5, 1);
    }
  }
  ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0); ctx.restore();
}

function hands(ctx, image, handsOnly, armFit) {
  ctx.save(); ctx.beginPath();
  if (handsOnly) { ctx.rect(230, 945, 90, 85); ctx.rect(659, 945, 95, 85); }
  else if (armFit) {
    // Follow the inner arm continuously from its armhole, or emerge along
    // the poncho's sloping sleeve hem instead of making a horizontal cut.
    const left = armFit === 'sleeveless'
      ? [[280, 640], [362, 640], [356, 705], [338, 780], [320, 850], [318, 1030], [228, 1030], [239, 870]]
      : [[270, 700], [360, 747], [343, 780], [325, 850], [318, 1030], [228, 1030], [239, 870]];
    for (const points of [left, left.map(([x, y]) => [980 - x, y])]) {
      points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath();
    }
  }
  else {
    for (const points of [
      [[290, 705], [370, 715], [332, 850], [318, 1030], [228, 1030], [239, 870]],
      [[607, 715], [688, 705], [738, 870], [754, 1030], [658, 1030], [647, 850]],
    ]) { points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath(); }
  }
  ctx.clip(); ctx.drawImage(image, 0, 0, CANVAS.width, CANVAS.height); ctx.restore();
}

const princessOffsets = {
  'dress-anna-cape': [-10, -30], 'dress-anna-green': [-5, -10],
  'dress-belle': [-20, -30], 'dress-aurora': [-10, -48],
  'dress-snow-white': [-5, -32], 'dress-rapunzel': [-15, -20],
  'dress-tiana': [-20, -25],
};


async function layerCanvas(layer) {
  const key = `${layer.id}:${layer.file}:${layer.figureFile || ''}:${Boolean(layer.handsOnly)}:${Boolean(layer.swimsuitBase)}:${Boolean(layer.fittedBody)}:${layer.armFit || ''}`;
  if (!rendered.has(key)) rendered.set(key, (async () => {
    const image = await source(layer.file), canvas = surface(), ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (layer.id.startsWith('hair-') || layer.fitted) {
      const [dx, dy] = princessOffsets[layer.id] || [0, 0];
      ctx.drawImage(image, dx, dy, CANVAS.width, CANVAS.height);
      // The fitted swimsuit includes its own hands and upper thighs. Remove
      // the underlying shorts and arms here so they cannot peek around its
      // leg openings or narrower sleeves; keep the original head and legs.
      if (layer.swimsuitBase) ctx.clearRect(200, 550, 580, 470);
      if (layer.id.startsWith('hair-') && layer.fittedBody) {
        // These gowns include fitted shoulders, arms and hands. Retain the
        // original neck above the curved join and the legs below the hem.
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.moveTo(425, 460);
        ctx.quadraticCurveTo(490, 550, 565, 460);
        ctx.lineTo(616, 482); ctx.quadraticCurveTo(653, 493, 668, 545);
        ctx.lineTo(790, 1050); ctx.lineTo(790, 1320);
        ctx.lineTo(190, 1320); ctx.lineTo(190, 1050);
        ctx.lineTo(312, 545); ctx.quadraticCurveTo(327, 495, 373, 482);
        ctx.closePath(); ctx.fill(); ctx.restore();
      } else if (layer.fittedBody) {
        // Keep Lupe's own uninterrupted neck, rather than pasting a second
        // neck over it. Blend the chest into the original curved neckline.
        const neck = ctx.getImageData(0, 0, 1024, 520);
        for (let y = 0; y < 520; y++) for (let x = 0; x < 1024; x++) {
          let opacity = y < 440 ? 0 : 1;
          if (x >= 425 && x <= 565) {
            // Solve x(t) for the quadratic neckline used by the base mask.
            const t = (-130 + Math.sqrt(16900 + 40 * (x - 425))) / 20;
            const edge = 460 + 180 * t * (1 - t);
            opacity *= Math.max(0, Math.min(1, (y - edge + 18) / 18));
          }
          neck.data[(y * 1024 + x) * 4 + 3] *= opacity;
        }
        ctx.putImageData(neck, 0, 0);
      }
    }
    else if (layer.id === 'dress-ice-princess') icePrincessDress(ctx, image);
    else if (layer.id === 'hands') hands(ctx, image, layer.handsOnly, layer.armFit);
    else if (layer.id.startsWith('shoes-')) pair(ctx, image, layer.id);
    else if (layer.id.startsWith('socks-')) socks(ctx, image, await source(layer.figureFile), layer.id);
    else {
      const trimmed = cropToAlpha(image);
      if (['poncho-strawberries', 'dress-black', 'top-peterpan'].includes(layer.id)) {
        // Put the rear neckline behind the original neck, keeping its front.
        const cc = trimmed.getContext('2d'); cc.save(); cc.scale(trimmed.width, trimmed.height);
        cc.globalCompositeOperation = 'destination-out'; cc.beginPath();
        const depth = layer.id === 'poncho-strawberries' ? .057 : .073;
        cc.moveTo(.35, 0); cc.lineTo(.65, 0);
        cc.bezierCurveTo(.64, .035, .58, depth, .5, depth);
        cc.bezierCurveTo(.42, depth, .36, .035, .35, 0);
        cc.fill(); cc.restore();
      }
      if (layer.id === 'swimsuit-unicorns') swimsuit(ctx, trimmed);
      else if (layer.id === 'top-school') schoolPolo(ctx, trimmed);
      else if (layer.id === 'top-peterpan') silhouette(ctx, trimmed, [[0, 460, 440], [.13, 520, 440], [.30, 640, 435], [.70, 815, 400], [1, 910, 370]]);
      else if (layer.id === 'poncho-strawberries') silhouette(ctx, trimmed, [[0, 455, 520], [.10, 530, 680], [.26, 680, 600], [.40, 805, 580], [1, 1250, 580]]);
      else if (dressRows[layer.id]) {
        // This dress has an open square neck above the neutral crew-neck base.
        if (layer.id === 'dress-hearts') ctx.drawImage(await source('neckline-hearts.png'), 390, 452, 210, 116);
        silhouette(ctx, trimmed, dressRows[layer.id]);
      }
      else if (['top-knit', 'top-flowers', 'top-ivory'].includes(layer.id)) blouse(ctx, trimmed, layer.id);
      else if (layer.id === 'bottom-orange') silhouette(ctx, trimmed, [[0, 838, 820], [.2, 910, 670], [1, 1175, 530]]);
      else if (layer.id === 'bottom-school') silhouette(ctx, trimmed, [[0, 838, 520], [.2, 900, 470], [1, 1128, 400]]);
      else if (layer.id === 'bottom-pink') silhouette(ctx, trimmed, [[0, 842, 440], [.27, 1000, 400], [.65, 1220, 340], [1, 1435, 370]]);
      else if (layer.id === 'bottom-jeans') mesh(ctx, trimmed, [0, .25, .5, .75, 1], [0, .25, .55, 1], [
        [[332, 845], [411, 845], [490, 845], [570, 845], [650, 845]],
        [[330, 1010], [409, 1010], [490, 1010], [570, 1010], [650, 1010]],
        [[324, 1180], [383, 1180], [490, 1180], [591, 1180], [650, 1180]],
        [[332, 1422], [383, 1422], [490, 1422], [581, 1422], [640, 1422]],
      ]);
      else ctx.drawImage(trimmed, ...layer.frame);
    }
    return canvas;
  })().catch(error => { rendered.delete(key); throw error; }));
  return rendered.get(key);
}

export async function drawOutfit(canvas, outfit, { background, isCurrent = () => true } = {}) {
  const layers = await Promise.all(outfitLayers(outfit).map(layerCanvas));
  if (!isCurrent()) return false;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  for (const layer of layers) ctx.drawImage(layer, 0, 0, canvas.width, canvas.height);
  canvas.dataset.ready = 'true';
  return true;
}

export function clearArtCache() { loaded.clear(); rendered.clear(); }
