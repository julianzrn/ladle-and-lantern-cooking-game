// Layout and pacing for Ladle & Lantern: where every station stands, the floor the cook may
// walk on, and the numbers that pace a shift (order patience, chopping and grilling times).
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;

/** The walkable floor: the cook stays inside this rectangle and works the counters at its edges. */
export const FLOOR = { left: 150, top: 176, right: 1256, bottom: 692 };

/** The woven rug in the middle of the floor, under the cook's main run between the counters. */
export const RUG = { x: 330, y: 262, w: 560, h: 330 };

export const SHIFT_SECONDS = 180;
export const PLAYER_SPEED = 278;
export const INTERACT_RANGE = 118;
export const CHOP_SECONDS = 1.5;
export const BURN_SECONDS = 5;
export const MAX_ORDERS = 5;

/** Seconds on the grill for each cookable item, keyed by ingredient name. */
export const COOK_SECONDS = { patty: 6, potato: 5 };

/**
 * Every station in the kitchen. Bins down the left wall hold the raw ingredients; the bottom
 * counter run holds the chopping boards, the grills, the plating counter and the serving pass.
 */
export const STATIONS = [
  { id: 'bin_bun', kind: 'bin', item: 'bun', label: 'Buns', x: 26, y: 188, w: 106, h: 72 },
  { id: 'bin_patty', kind: 'bin', item: 'patty', label: 'Beef', x: 26, y: 272, w: 106, h: 72 },
  { id: 'bin_cheese', kind: 'bin', item: 'cheese', label: 'Cheese', x: 26, y: 356, w: 106, h: 72 },
  { id: 'bin_tomato', kind: 'bin', item: 'tomato', label: 'Tomato', x: 26, y: 440, w: 106, h: 72 },
  { id: 'bin_lettuce', kind: 'bin', item: 'lettuce', label: 'Lettuce', x: 26, y: 524, w: 106, h: 72 },
  { id: 'bin_potato', kind: 'bin', item: 'potato', label: 'Potato', x: 26, y: 608, w: 106, h: 72 },
  { id: 'board_a', kind: 'board', label: 'Chop', x: 226, y: 694, w: 122, h: 80 },
  { id: 'board_b', kind: 'board', label: 'Chop', x: 366, y: 694, w: 122, h: 80 },
  { id: 'stove_a', kind: 'stove', label: 'Grill', x: 548, y: 694, w: 122, h: 80 },
  { id: 'stove_b', kind: 'stove', label: 'Grill', x: 688, y: 694, w: 122, h: 80 },
  { id: 'assembly', kind: 'assembly', label: 'Plating', x: 872, y: 694, w: 176, h: 80 },
  { id: 'pass', kind: 'pass', label: 'Serve', x: 1084, y: 694, w: 168, h: 80 },
  { id: 'trash', kind: 'trash', label: 'Bin', x: 1128, y: 188, w: 118, h: 72 },
];

/** The point in front of a station where the cook stands to work it. */
export function stationFront(station) {
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  if (station.kind === 'bin') return { x: cx + 92, y: cy };
  if (station.y > 600) return { x: cx, y: cy - 88 };
  return { x: cx, y: cy + 92 };
}

/** The station's centre point, used for range checks and labels. */
export function stationCentre(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}
