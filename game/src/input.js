// Keyboard and mouse for the cook: WASD or the arrow keys walk, E (or Space) works the nearest
// station, and a mouse click either walks the cook to a point on the floor or, when it lands on
// a station, sends the cook there to work it on arrival.

/** Create the input state and wire its listeners to the canvas. */
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    clicks: [],
    interactQueued: false,
    confirmQueued: false,
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (event.code === 'KeyE' || event.code === 'Space') input.interactQueued = true;
    if (event.code === 'Enter' || event.code === 'Space') input.confirmQueued = true;
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => input.keys.delete(event.code));
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicks.push({
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    });
    input.confirmQueued = true;
  });

  return input;
}

/** The walk direction the held keys ask for, as a unit-ish vector (not normalised diagonally). */
export function readWalkDirection(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  return { x, y };
}

/** Take the queued one-shot actions out of the input; call once a frame before stepping. */
export function drainInputEdges(input) {
  const edges = {
    interact: input.interactQueued,
    confirm: input.confirmQueued,
    clicks: input.clicks.splice(0, input.clicks.length),
  };
  input.interactQueued = false;
  input.confirmQueued = false;
  return edges;
}
