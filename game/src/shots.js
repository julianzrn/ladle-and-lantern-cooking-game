// Staged scenes for the screenshots, behind ?shot=cover|chop|fry|serve. Each one starts a real
// shift and arranges it with the game's own state — orders on the board, food on the boards and
// grills, plates half-built and finished — then lets the renderer paint exactly what a player
// would see. Nothing here draws; it only sets up honest mid-rush moments.
import { recipeById } from './recipes.js';
import { addPopup, startShift } from './kitchen.js';

/** Put an order on the board with a chosen recipe and patience. */
function stageOrder(state, recipeId, patience, patienceMax) {
  state.orders.push({ id: state.orderSequence, recipeId, patience, patienceMax });
  state.orderSequence += 1;
}

/** Lay an item on a board or grill slot at a chosen point in its prep. */
function stageSlot(state, stationId, item, progress, burn) {
  const slot = state.slots[stationId];
  slot.item = item;
  slot.progress = progress;
  slot.burn = burn || 0;
}

/** Move the cook and put something in their hands. */
function stageCook(state, x, y, faceX, faceY, carry) {
  state.player.x = x;
  state.player.y = y;
  state.player.faceX = faceX;
  state.player.faceY = faceY;
  state.player.carry = carry;
}

/** The cover: the whole rush in one frame — three orders, a patty grilling, a tomato chopped,
 *  one plate half-built on the counter and a finished Garden Burger on its way to the pass. */
function stageCover(state) {
  state.elapsed = 73;
  state.timeLeft = 107;
  state.score = 340;
  state.served = 3;
  stageOrder(state, 'deluxe', 38, 60);
  stageOrder(state, 'salad', 24, 55);
  stageOrder(state, 'fries', 46, 52);
  stageSlot(state, 'stove_a', { kind: 'item', type: 'patty', stage: 'raw' }, 0.62);
  stageSlot(state, 'board_a', { kind: 'item', type: 'tomato', stage: 'chopped' }, 1);
  stageSlot(state, 'board_b', { kind: 'item', type: 'lettuce', stage: 'chopped' }, 1);
  state.plates[0] = { components: ['bun', 'patty'] };
  stageCook(state, 1006, 622, 1, 0, { kind: 'plate', components: ['bun', 'patty', 'lettuce', 'tomato'] });
  addPopup(state, 1168, 618, '+135', '#ffe9a8');
  state.popups[0].age = 0.25;
}

/** Chopping: the cook at the board mid-tomato, a burger and fries on the board above. */
function stageChop(state) {
  state.elapsed = 30;
  state.timeLeft = 150;
  state.score = 120;
  state.served = 1;
  stageOrder(state, 'burger', 40, 58);
  stageOrder(state, 'fries', 50, 60);
  stageSlot(state, 'board_a', { kind: 'item', type: 'tomato', stage: 'raw' }, 0.45);
  stageCook(state, 287, 640, 0, 1, null);
}

/** Grilling: a patty done and waiting, fries halfway, the cook carrying a bun plate toward them. */
function stageFry(state) {
  state.elapsed = 95;
  state.timeLeft = 85;
  state.score = 260;
  state.served = 2;
  stageOrder(state, 'loaded', 30, 50);
  stageOrder(state, 'garden', 44, 58);
  stageSlot(state, 'stove_a', { kind: 'item', type: 'patty', stage: 'cooked' }, 1, 1.2);
  stageSlot(state, 'stove_b', { kind: 'item', type: 'potato', stage: 'chopped' }, 0.5);
  stageSlot(state, 'board_b', { kind: 'item', type: 'lettuce', stage: 'chopped' }, 1);
  stageCook(state, 614, 622, 0, 1, { kind: 'plate', components: ['bun'] });
}

/** Serving: a Lantern Deluxe at the pass for an order nearly out of patience, points landing. */
function stageServe(state) {
  state.elapsed = 140;
  state.timeLeft = 40;
  state.score = 515;
  state.served = 5;
  stageOrder(state, 'deluxe', 11, 55);
  stageOrder(state, 'burger', 33, 52);
  stageSlot(state, 'stove_a', { kind: 'item', type: 'patty', stage: 'cooked' }, 1, 0.6);
  state.plates[0] = { components: ['tomato', 'lettuce', 'cheese'] };
  state.plates[1] = { components: ['fries'] };
  stageCook(state, 1168, 630, 0, 1, { kind: 'plate', components: recipeById('deluxe').components });
  addPopup(state, 1052, 586, '+215', '#ffe9a8');
  state.popups[0].age = 0.12;
}

/** Set the kitchen to the named scene (cover by default) and return the state, ready to paint. */
export function stageShot(name, state) {
  startShift(state);
  if (name === 'chop') stageChop(state);
  else if (name === 'fry') stageFry(state);
  else if (name === 'serve') stageServe(state);
  else stageCover(state);
  return state;
}
