// The kitchen itself: the state of one shift and every rule that moves it. The cook walks the
// floor, carries one thing at a time, preps ingredients at the boards and grills, builds plates
// on the plating counter and serves them at the pass against the orders on the board. Orders
// arrive faster and impatience grows as the shift wears on.
import {
  BURN_SECONDS, CHOP_SECONDS, COOK_SECONDS, FLOOR, INTERACT_RANGE, MAX_ORDERS,
  PLAYER_SPEED, SHIFT_SECONDS, STATIONS, stationCentre, stationFront,
} from './config.js';
import {
  canChopItem, canCookItem, componentOfItem, recipeById, recipeForComponents, sameComponents,
} from './recipes.js';

/** A fresh shift: empty counters, a cook mid-floor, and the first order about to arrive. */
export function createKitchen() {
  const slots = {};
  for (const station of STATIONS) {
    if (station.kind === 'board' || station.kind === 'stove') slots[station.id] = { item: null, progress: 0, burn: 0 };
  }
  return {
    phase: 'title',
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    missed: 0,
    player: { x: 660, y: 430, faceX: 0, faceY: 1, carry: null, walkTarget: null, pendingStation: null },
    slots,
    plates: [null, null],
    orders: [],
    nextOrderIn: 1.4,
    orderSequence: 1,
    popups: [],
    toast: null,
    flash: 0,
  };
}

/** Begin (or restart) the shift from the title or the final bell. */
export function startShift(state) {
  const fresh = createKitchen();
  fresh.phase = 'play';
  Object.assign(state, fresh);
}

/** Add a floating note over the kitchen: points won, food burnt, an order lost. */
export function addPopup(state, x, y, text, colour) {
  state.popups.push({ x, y, text, colour: colour || '#ffe9a8', age: 0 });
}

/** Show a short instruction line at the bottom of the screen. */
export function showToast(state, text) {
  state.toast = { text, age: 0 };
}

/** Put a new order on the board; the recipe pool widens as the shift heats up. */
export function spawnOrder(state, random) {
  const early = ['fries', 'burger', 'salad'];
  const full = ['fries', 'burger', 'salad', 'loaded', 'garden', 'sunset', 'deluxe'];
  const pool = state.elapsed < 45 ? early : full;
  const recipe = recipeById(pool[Math.floor(random() * pool.length)]);
  const patience = Math.max(40, 68 - state.elapsed * 0.12) + random() * 8;
  state.orders.push({
    id: state.orderSequence,
    recipeId: recipe.id,
    patience,
    patienceMax: patience,
  });
  state.orderSequence += 1;
}

/** The station whose centre is nearest the cook, when it is within reach; else null. */
export function nearestStation(state) {
  let best = null;
  let bestDistance = INTERACT_RANGE;
  for (const station of STATIONS) {
    const centre = stationCentre(station);
    const distance = Math.hypot(state.player.x - centre.x, state.player.y - centre.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return best;
}

/** The station a point falls inside, for mouse clicks; else null. */
export function stationAtPoint(x, y) {
  for (const station of STATIONS) {
    if (x >= station.x && x <= station.x + station.w && y >= station.y && y <= station.y + station.h) return station;
  }
  return null;
}

/** Work the nearest station: the one key (or click) that does everything, by context. */
export function interactWithNearestStation(state) {
  const station = nearestStation(state);
  if (!station) return;
  const player = state.player;
  const centre = stationCentre(station);

  if (station.kind === 'bin') {
    if (player.carry) return showToast(state, 'Hands full — put that down first');
    player.carry = { kind: 'item', type: station.item, stage: station.item === 'bun' ? 'ready' : 'raw' };
    return;
  }

  if (station.kind === 'board') {
    const slot = state.slots[station.id];
    if (!slot.item && canChopItem(player.carry)) {
      slot.item = player.carry;
      slot.progress = 0;
      player.carry = null;
    } else if (slot.item && !player.carry && slot.progress >= 1) {
      player.carry = slot.item;
      slot.item = null;
      slot.progress = 0;
    } else if (slot.item && !player.carry) {
      showToast(state, 'Still chopping — stay close and it finishes faster');
    } else if (!slot.item && player.carry) {
      showToast(state, 'That does not need the knife');
    }
    return;
  }

  if (station.kind === 'stove') {
    const slot = state.slots[station.id];
    if (!slot.item && canCookItem(player.carry)) {
      slot.item = player.carry;
      slot.progress = 0;
      slot.burn = 0;
      player.carry = null;
    } else if (slot.item && !player.carry && slot.item.stage !== 'raw' && slot.item.stage !== 'chopped') {
      player.carry = slot.item;
      slot.item = null;
      slot.progress = 0;
      slot.burn = 0;
    } else if (slot.item && !player.carry) {
      showToast(state, 'Still sizzling on the grill…');
    } else if (!slot.item && player.carry) {
      showToast(state, 'That cannot go on the grill');
    }
    return;
  }

  if (station.kind === 'assembly') {
    interactAtAssembly(state);
    return;
  }

  if (station.kind === 'pass') {
    if (player.carry && player.carry.kind === 'plate') servePlate(state, centre);
    else showToast(state, 'Bring a finished plate to the pass to serve it');
    return;
  }

  if (station.kind === 'trash') {
    if (player.carry) {
      player.carry = null;
      addPopup(state, centre.x, centre.y - 30, 'Binned', '#c9d4e8');
    }
  }
}

/** Plating rules: add a prepared component to a plate, start a plate, or pick a plate up. */
function interactAtAssembly(state) {
  const player = state.player;
  if (player.carry && player.carry.kind === 'plate') {
    const free = state.plates.indexOf(null);
    if (free === -1) return showToast(state, 'Both plates are already on the counter');
    state.plates[free] = { components: player.carry.components };
    player.carry = null;
    return;
  }
  if (player.carry && player.carry.kind === 'item') {
    const component = componentOfItem(player.carry);
    if (!component) return showToast(state, 'Prep it first — that is not ready for a plate');
    let plate = state.plates.find((entry) => entry && !entry.components.includes(component));
    if (!plate) {
      const free = state.plates.indexOf(null);
      if (free === -1) return showToast(state, 'No plate can take that — serve or bin one');
      plate = { components: [] };
      state.plates[free] = plate;
    }
    plate.components.push(component);
    player.carry = null;
    addPopup(state, 960, 640, '+ ' + component, '#b8f1c9');
    return;
  }
  if (!player.carry) {
    const matching = state.plates.findIndex(
      (entry) => entry && state.orders.some((order) => sameComponents(recipeById(order.recipeId).components, entry.components)),
    );
    const first = state.plates.findIndex((entry) => entry && entry.components.length > 0);
    const pick = matching !== -1 ? matching : first;
    if (pick === -1) return showToast(state, 'No plate here yet — bring a prepared ingredient');
    player.carry = { kind: 'plate', components: state.plates[pick].components };
    state.plates[pick] = null;
  }
}

/** Serve the carried plate at the pass: score its recipe plus a tip for time to spare. */
function servePlate(state, centre) {
  const player = state.player;
  const recipe = recipeForComponents(player.carry.components);
  const orderIndex = recipe
    ? state.orders.findIndex((order) => order.recipeId === recipe.id)
    : -1;
  if (!recipe || orderIndex === -1) {
    state.flash = 0.35;
    return showToast(state, 'No order on the board matches that plate');
  }
  const order = state.orders[orderIndex];
  const tip = Math.round((order.patience / order.patienceMax) * 40);
  state.score += recipe.points + tip;
  state.served += 1;
  addPopup(state, centre.x, centre.y - 44, '+' + (recipe.points + tip), '#ffe9a8');
  state.orders.splice(orderIndex, 1);
  player.carry = null;
}

/** Advance everything by dt seconds: walking, prep, cooking, orders and the clock. */
export function stepKitchen(state, input, edges, dt) {
  if (state.phase !== 'play') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  if (state.timeLeft <= 0) {
    state.phase = 'over';
    return;
  }
  stepPlayer(state, input, edges, dt);
  stepStations(state, dt);
  stepOrders(state, dt);
  if (edges.interact) interactWithNearestStation(state);
  for (const popup of state.popups) popup.age += dt;
  state.popups = state.popups.filter((popup) => popup.age < 1.4);
  if (state.toast) {
    state.toast.age += dt;
    if (state.toast.age > 2.6) state.toast = null;
  }
  if (state.flash > 0) state.flash -= dt;
}

/** Walking: held keys win; otherwise the cook walks to a clicked point or station front. */
function stepPlayer(state, input, edges, dt) {
  const player = state.player;
  for (const click of edges.clicks) {
    const station = stationAtPoint(click.x, click.y);
    if (station) {
      player.walkTarget = stationFront(station);
      player.pendingStation = station.id;
    } else {
      player.walkTarget = {
        x: Math.min(FLOOR.right, Math.max(FLOOR.left, click.x)),
        y: Math.min(FLOOR.bottom, Math.max(FLOOR.top, click.y)),
      };
      player.pendingStation = null;
    }
  }

  let moveX = input.x;
  let moveY = input.y;
  if (moveX !== 0 || moveY !== 0) {
    player.walkTarget = null;
    player.pendingStation = null;
  } else if (player.walkTarget) {
    const dx = player.walkTarget.x - player.x;
    const dy = player.walkTarget.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) {
      player.walkTarget = null;
      if (player.pendingStation) {
        player.pendingStation = null;
        interactWithNearestStation(state);
      }
    } else {
      moveX = dx / distance;
      moveY = dy / distance;
    }
  }

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    player.x += (moveX / length) * PLAYER_SPEED * dt;
    player.y += (moveY / length) * PLAYER_SPEED * dt;
    player.faceX = moveX;
    player.faceY = moveY;
    player.x = Math.min(FLOOR.right, Math.max(FLOOR.left, player.x));
    player.y = Math.min(FLOOR.bottom, Math.max(FLOOR.top, player.y));
  }
}

/** Boards chop while the cook stays close; grills cook on their own and burn if forgotten. */
function stepStations(state, dt) {
  for (const station of STATIONS) {
    const slot = state.slots[station.id];
    if (!slot || !slot.item) continue;
    const centre = stationCentre(station);
    if (station.kind === 'board' && slot.progress < 1) {
      const near = Math.hypot(state.player.x - centre.x, state.player.y - centre.y) < 130;
      if (near) {
        slot.progress = Math.min(1, slot.progress + dt / CHOP_SECONDS);
        if (slot.progress >= 1) slot.item.stage = 'chopped';
      }
    }
    if (station.kind === 'stove') {
      const cookable = slot.item.type === 'patty' || slot.item.type === 'potato';
      if (cookable && slot.item.stage !== 'cooked' && slot.item.stage !== 'burnt') {
        slot.progress = Math.min(1, slot.progress + dt / COOK_SECONDS[slot.item.type]);
        if (slot.progress >= 1) slot.item.stage = 'cooked';
      } else if (slot.item.stage === 'cooked') {
        slot.burn += dt;
        if (slot.burn >= BURN_SECONDS) {
          slot.item.stage = 'burnt';
          addPopup(state, centre.x, centre.y - 56, 'Burnt!', '#ff9d8a');
        }
      }
    }
  }
}

/** Orders tick down — faster in the last minute of the shift — and leave angry at zero. */
function stepOrders(state, dt) {
  const drain = state.elapsed > 120 ? dt * 1.25 : dt;
  for (const order of state.orders) order.patience -= drain;
  const expired = state.orders.filter((order) => order.patience <= 0);
  for (const order of expired) {
    state.missed += 1;
    state.score = Math.max(0, state.score - 30);
    addPopup(state, 120 + state.orders.indexOf(order) * 226, 128, 'Walked out! −30', '#ff9d8a');
  }
  state.orders = state.orders.filter((order) => order.patience > 0);
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state, Math.random);
    state.nextOrderIn = Math.max(3.6, 8.5 - state.elapsed * 0.032);
  }
}
