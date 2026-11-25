// The painter: one function draws a whole frame of Ladle & Lantern — the board of order cards
// under the clock, the wood floor, every counter with its food on it, the cook with whatever
// they are carrying, and the floating score notes. Counters must read at a glance, so each
// station gets its own colour, label and the real item sitting on it.
import { RUG, STATIONS, stationCentre } from './config.js';
import { INGREDIENTS, recipeById, recipeForComponents } from './recipes.js';
import { drawComponent, drawItem, drawPlate } from './drawFood.js';
import { nearestStation } from './kitchen.js';

const INK = '#2b1a10';
const PAPER = '#fff8ea';

/** A rounded rectangle path (fill and stroke are the caller's job). */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A labelled progress bar: green filling, red when nearly out of time or patience. */
function drawProgressBar(ctx, x, y, w, h, fraction, urgent) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e5483c' : fraction > 0.99 ? '#57c256' : '#f2b13c';
  if (fraction > 0.01) {
    roundRect(ctx, x + 1.5, y + 1.5, (w - 3) * Math.min(1, fraction), h - 3, (h - 3) / 2);
    ctx.fill();
  }
}

/** The top strip: the diner's name, the big shift clock, and the score so far. */
function drawHud(ctx, state) {
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 0, 1280, 56);
  ctx.fillStyle = '#f7b731';
  ctx.font = 'bold 25px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('LADLE & LANTERN', 18, 29);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '13px Verdana, sans-serif';
  ctx.fillText('night kitchen', 20, 47);

  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px Verdana, sans-serif';
  ctx.fillStyle = state.timeLeft < 30 ? '#ff8a76' : '#ffffff';
  ctx.fillText(minutes + ':' + String(seconds).padStart(2, '0'), 640, 28);
  ctx.font = '11px Verdana, sans-serif';
  ctx.fillStyle = '#d8c39a';
  ctx.fillText('SHIFT TIMER', 640, 49);

  ctx.textAlign = 'right';
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Score ' + state.score, 1262, 24);
  ctx.font = '13px Verdana, sans-serif';
  ctx.fillStyle = '#d8c39a';
  ctx.fillText('Served ' + state.served + ' · Walked out ' + state.missed, 1262, 45);
}

/** The order board: one card per waiting customer, recipe icons and a draining patience bar. */
function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#59391d';
  roundRect(ctx, 8, 62, 1264, 106, 10);
  ctx.fill();
  ctx.strokeStyle = '#2e1c0d';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (state.orders.length === 0) {
    ctx.fillStyle = '#e8d5ae';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('The board is clear — the next order is on its way…', 640, 115);
    return;
  }
  state.orders.forEach((order, index) => {
    const recipe = recipeById(order.recipeId);
    const x = 16 + index * 250;
    const y = 70;
    ctx.fillStyle = PAPER;
    roundRect(ctx, x, y, 238, 90, 8);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = 'bold 16px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.name, x + 12, y + 19);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#a8741a';
    ctx.font = 'bold 15px Verdana, sans-serif';
    ctx.fillText(recipe.points + ' pts', x + 226, y + 19);
    recipe.components.forEach((component, i) => {
      drawComponent(ctx, component, x + 26 + i * 42, y + 48, 15);
    });
    const fraction = Math.max(0, order.patience / order.patienceMax);
    drawProgressBar(ctx, x + 12, y + 72, 214, 9, fraction, fraction < 0.3);
  });
}

/** The wood floor: warm planks with a soft rug under the cook's main run. */
function drawFloor(ctx) {
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(0, 168, 1280, 632);
  ctx.strokeStyle = 'rgba(70, 42, 16, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 208; y < 800; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  for (let x = 90; x < 1280; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, 168);
    ctx.lineTo(x, 800);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(122, 32, 32, 0.45)';
  roundRect(ctx, RUG.x, RUG.y, RUG.w, RUG.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.22)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, RUG.x + 12, RUG.y + 12, RUG.w - 24, RUG.h - 24, 10);
  ctx.stroke();
}

/** One ingredient bin: a wooden crate, a pile of its ingredient, and its name. */
function drawBin(ctx, station) {
  ctx.fillStyle = '#6d4423';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#845631';
  roundRect(ctx, station.x + 5, station.y + 5, station.w - 10, station.h - 26, 6);
  ctx.fill();
  drawItem(ctx, { kind: 'item', type: station.item, stage: station.item === 'bun' ? 'ready' : 'raw' }, station.x + station.w / 2 - 14, station.y + 30, 15);
  drawItem(ctx, { kind: 'item', type: station.item, stage: station.item === 'bun' ? 'ready' : 'raw' }, station.x + station.w / 2 + 16, station.y + 34, 13);
  drawStationLabel(ctx, station);
}

/** The label under a station's working surface. */
function drawStationLabel(ctx, station) {
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label.toUpperCase(), station.x + station.w / 2, station.y + station.h - 9);
}

/** A chopping board: pale wood, a knife that rocks while work is under way, the item, its bar. */
function drawBoard(ctx, state, station) {
  ctx.fillStyle = '#7a4e26';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#e8cf9e';
  roundRect(ctx, station.x + 10, station.y + 8, station.w - 20, station.h - 34, 6);
  ctx.fill();
  const slot = state.slots[station.id];
  if (slot && slot.item) {
    drawItem(ctx, slot.item, station.x + station.w / 2 - 8, station.y + 30, 17);
    const rocking = slot.progress < 1 ? Math.sin(state.elapsed * 18) * 0.35 : 0;
    ctx.save();
    ctx.translate(station.x + station.w / 2 + 26, station.y + 26);
    ctx.rotate(-0.5 + rocking);
    ctx.fillStyle = '#c7ccd4';
    ctx.fillRect(-3, -16, 6, 30);
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(-3.5, -26, 7, 11);
    ctx.restore();
    drawProgressBar(ctx, station.x + 12, station.y + station.h - 22, station.w - 24, 8, slot.progress, false);
  }
  drawStationLabel(ctx, station);
}

/** A grill: dark top, a pan, the cooking item, its progress, steam — and smoke once burnt. */
function drawStove(ctx, state, station) {
  ctx.fillStyle = '#3c3f45';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#23252a';
  ctx.beginPath();
  ctx.ellipse(station.x + station.w / 2, station.y + 32, 40, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  const slot = state.slots[station.id];
  if (slot && slot.item) {
    const cooking = slot.item.stage !== 'cooked' && slot.item.stage !== 'burnt';
    if (cooking || slot.item.stage === 'cooked') {
      ctx.strokeStyle = '#e5483c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(station.x + station.w / 2, station.y + 32, 34, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawItem(ctx, slot.item, station.x + station.w / 2, station.y + 30, 19);
    if (cooking) {
      drawProgressBar(ctx, station.x + 12, station.y + station.h - 22, station.w - 24, 8, slot.progress, false);
      drawSteam(ctx, state, station.x + station.w / 2, station.y + 8, false);
    } else if (slot.item.stage === 'cooked') {
      drawProgressBar(ctx, station.x + 12, station.y + station.h - 22, station.w - 24, 8, 1 - slot.burn / 5, slot.burn > 3);
      drawSteam(ctx, state, station.x + station.w / 2, station.y + 8, false);
    } else {
      drawSteam(ctx, state, station.x + station.w / 2, station.y + 8, true);
    }
  }
  drawStationLabel(ctx, station);
}

/** Little rising puffs over a hot pan; dark smoke when the food is burnt. */
function drawSteam(ctx, state, x, y, burnt) {
  ctx.fillStyle = burnt ? 'rgba(60, 55, 50, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 3; i += 1) {
    const phase = (state.elapsed * 0.9 + i * 0.37) % 1;
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 14 + Math.sin(state.elapsed * 3 + i) * 3, y - phase * 22, 4 + phase * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The plating counter: steel top and up to two plates being built, component by component. */
function drawAssembly(ctx, state, station) {
  ctx.fillStyle = '#9aa3ab';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#c3ccd2';
  roundRect(ctx, station.x + 5, station.y + 5, station.w - 10, station.h - 28, 6);
  ctx.fill();
  state.plates.forEach((plate, index) => {
    const x = station.x + 46 + index * 84;
    if (plate) drawPlate(ctx, plate.components, x, station.y + 30, 24);
    else {
      ctx.strokeStyle = 'rgba(90, 100, 108, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, station.y + 30, 26, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  drawStationLabel(ctx, station);
}

/** The serving pass: a warm hatch with a bell; it glows when a carried plate matches an order. */
function drawPass(ctx, state, station) {
  const carry = state.player.carry;
  const ready = Boolean(carry && carry.kind === 'plate' && recipeForComponents(carry.components)
    && state.orders.some((order) => order.recipeId === recipeForComponents(carry.components).id));
  ctx.fillStyle = '#5d3a1c';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  if (ready) {
    ctx.strokeStyle = '#7be382';
    ctx.lineWidth = 3.5;
    roundRect(ctx, station.x - 3, station.y - 3, station.w + 6, station.h + 6, 10);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffca7a';
  roundRect(ctx, station.x + 8, station.y + 6, station.w - 16, station.h - 30, 6);
  ctx.fill();
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(station.x + 8, station.y + 24, station.w - 16, 4);
  ctx.fillStyle = '#f7b731';
  ctx.beginPath();
  ctx.arc(station.x + station.w / 2, station.y + 40, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(station.x + station.w / 2 - 12, station.y + 40, 24, 3);
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE →', station.x + station.w / 2, station.y + 16);
  drawStationLabel(ctx, station);
}

/** The rubbish bin by the back door. */
function drawTrash(ctx, station) {
  ctx.fillStyle = '#4c565e';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#39424a';
  roundRect(ctx, station.x + 14, station.y + 12, station.w - 28, station.h - 38, 6);
  ctx.fill();
  ctx.fillStyle = '#5b6770';
  roundRect(ctx, station.x + 8, station.y + 4, station.w - 16, 9, 4);
  ctx.fill();
  drawStationLabel(ctx, station);
}

/** The cook: white hat and apron over a teal shirt, facing the way they last walked. */
function drawPlayer(ctx, state) {
  const player = state.player;
  const x = player.x;
  const y = player.y;
  ctx.fillStyle = 'rgba(40, 22, 8, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 30, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7f86';
  roundRect(ctx, x - 15, y - 6, 30, 34, 9);
  ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  roundRect(ctx, x - 11, y + 2, 22, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#f2c894';
  ctx.beginPath();
  ctx.arc(x, y - 18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 14, y - 34, 28, 10, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y - 36, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  const lookX = Math.sign(player.faceX) * 3;
  const lookY = player.faceY > 0 ? 2 : 0;
  ctx.beginPath();
  ctx.arc(x - 5 + lookX, y - 18 + lookY, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5 + lookX, y - 18 + lookY, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (player.carry) {
    if (player.carry.kind === 'plate') drawPlate(ctx, player.carry.components, x, y - 52, 20);
    else drawItem(ctx, player.carry, x, y - 50, 16);
  }
}

/** Floating notes: points and warnings rise and fade over the kitchen. */
function drawPopups(ctx, state) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 19px Verdana, sans-serif';
  for (const popup of state.popups) {
    ctx.globalAlpha = Math.max(0, 1 - popup.age / 1.4);
    ctx.fillStyle = popup.colour;
    ctx.fillText(popup.text, popup.x, popup.y - popup.age * 34);
  }
  ctx.globalAlpha = 1;
}

/** The hint line that tells the cook what went wrong or what to do next. */
function drawToast(ctx, state) {
  if (!state.toast) return;
  ctx.font = '15px Verdana, sans-serif';
  const width = ctx.measureText(state.toast.text).width + 36;
  ctx.fillStyle = 'rgba(30, 18, 8, 0.88)';
  roundRect(ctx, 640 - width / 2, 648, width, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.fillText(state.toast.text, 640, 664);
}

/** The title card over a dimmed kitchen. */
function drawTitleOverlay(ctx) {
  ctx.fillStyle = 'rgba(24, 13, 5, 0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = PAPER;
  roundRect(ctx, 340, 210, 600, 330, 16);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a8741a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('LADLE & LANTERN', 640, 285);
  ctx.fillStyle = INK;
  ctx.font = '17px Georgia, serif';
  ctx.fillText('A night-kitchen rush: take orders, prep, grill, plate and serve', 640, 322);
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('WASD / arrow keys — walk        E — work a station', 640, 372);
  ctx.fillText('Click a counter to walk there and work it', 640, 400);
  ctx.fillText('Chop at the boards, grill patties and fries, build the plate', 640, 428);
  ctx.fillText('on the plating counter, then carry it to the SERVE pass.', 640, 452);
  ctx.fillText('Orders walk out when their patience bar empties — tips reward speed.', 640, 480);
  ctx.fillStyle = '#a8741a';
  ctx.font = 'bold 18px Verdana, sans-serif';
  ctx.fillText('Click or press Enter to open the kitchen', 640, 518);
}

/** The final bell: the shift's takings over a dimmed kitchen. */
function drawOverOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(24, 13, 5, 0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = PAPER;
  roundRect(ctx, 390, 240, 500, 260, 16);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a8741a';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.fillText('SHIFT OVER', 640, 305);
  ctx.fillStyle = INK;
  ctx.font = '20px Verdana, sans-serif';
  ctx.fillText('Score  ' + state.score, 640, 360);
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillText('Plates served: ' + state.served + '      Customers lost: ' + state.missed, 640, 398);
  ctx.fillStyle = '#a8741a';
  ctx.font = 'bold 16px Verdana, sans-serif';
  ctx.fillText('Click or press Enter to cook another shift', 640, 452);
}

/** Draw one whole frame of the game. */
export function drawScene(ctx, state) {
  drawFloor(ctx);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state);
  const active = state.phase === 'play' ? nearestStation(state) : null;
  for (const station of STATIONS) {
    if (active && station.id === active.id) {
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 3;
      roundRect(ctx, station.x - 4, station.y - 4, station.w + 8, station.h + 8, 10);
      ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 13px Verdana, sans-serif';
      ctx.textAlign = 'center';
      const centre = stationCentre(station);
      ctx.fillText('E', centre.x, station.y > 600 ? station.y - 12 : station.y + station.h + 16);
    }
    if (station.kind === 'bin') drawBin(ctx, station);
    else if (station.kind === 'board') drawBoard(ctx, state, station);
    else if (station.kind === 'stove') drawStove(ctx, state, station);
    else if (station.kind === 'assembly') drawAssembly(ctx, state, station);
    else if (station.kind === 'pass') drawPass(ctx, state, station);
    else if (station.kind === 'trash') drawTrash(ctx, station);
  }
  drawPlayer(ctx, state);
  drawPopups(ctx, state);
  drawToast(ctx, state);
  if (state.flash > 0) {
    ctx.fillStyle = 'rgba(229, 72, 60, ' + Math.min(0.22, state.flash) + ')';
    ctx.fillRect(0, 0, 1280, 800);
  }
  if (state.phase === 'title') drawTitleOverlay(ctx);
  if (state.phase === 'over') drawOverOverlay(ctx, state);
}
