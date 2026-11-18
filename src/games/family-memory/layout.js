// Fit compact portrait cards into both dimensions, keeping a useful touch area.
export function fitMemoryGrid(count, width, height, gap = 6) {
  const minWidth = 44, minHeight = 48, ratio = .9, maxHeight = 260;
  let best;
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const availableWidth = (width - gap * (columns - 1)) / columns;
    const availableHeight = (height - gap * (rows - 1)) / rows;
    const cardHeight = Math.min(maxHeight, availableHeight, availableWidth / ratio);
    const cardWidth = cardHeight * ratio;
    if (cardWidth < minWidth || cardHeight < minHeight) continue;
    const empty = columns * rows - count;
    if (!best || cardHeight > best.cardHeight + .01 ||
      (Math.abs(cardHeight - best.cardHeight) <= .01 && (empty < best.empty || (empty === best.empty && rows < best.rows)))) {
      best = { columns, rows, cardWidth, cardHeight, empty, scroll: false };
    }
  }
  if (best) return best;
  // Only exceptionally small screens need scrolling; never shrink tap targets.
  const columns = Math.max(1, Math.min(count, Math.floor((width + gap) / (minWidth + gap))));
  const cardWidth = Math.max(minWidth, Math.min(110, (width - gap * (columns - 1)) / columns));
  return { columns, rows: Math.ceil(count / columns), cardWidth, cardHeight: Math.max(minHeight, cardWidth / ratio), scroll: true };
}
