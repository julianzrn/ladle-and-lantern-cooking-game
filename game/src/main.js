// Boot and the one loop of Ladle & Lantern: input is read every frame, the kitchen advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game sits on a title card until
// the player clicks or presses Enter, and offers another shift when the timer runs out.
//
// ?shot=cover|chop|fry|serve stages a mid-rush scene instead of running the loop, paints it
// twice and sets window.__shotReady so a screenshot can be taken of the real game.
import { createInput, drainInputEdges, readWalkDirection } from './input.js';
import { createKitchen, startShift, stepKitchen } from './kitchen.js';
import { drawScene } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
/** The longest frame the loop catches up on; a longer stall is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = createKitchen();
window.__gameState = state;

function runShot(name) {
  stageShot(name, state);
  let painted = 0;
  function paint() {
    drawScene(ctx, state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    const edges = drainInputEdges(input);
    if (state.phase !== 'play' && edges.confirm) startShift(state);
    const direction = readWalkDirection(input);
    while (accumulator >= STEP) {
      stepKitchen(state, direction, edges, STEP);
      edges.interact = false;
      edges.clicks = [];
      accumulator -= STEP;
    }
    drawScene(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
