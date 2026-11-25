// How food looks in Ladle & Lantern: every ingredient and finished component drawn with canvas
// shapes, big and readable — a red tomato with its green crown, a golden bun, a grilled patty
// with sear lines, a cheese slice with holes, ruffled lettuce, and fries in a red carton.

/** A soft round shadow under anything sitting on a counter or a plate. */
function drawShadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(40, 22, 8, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.55, r * 0.95, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The sesame bun: a domed top over a flat bottom half. */
export function drawBun(ctx, x, y, s) {
  drawShadow(ctx, x, y, s);
  ctx.fillStyle = '#e8a856';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.28, s, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4bc6a';
  ctx.beginPath();
  ctx.arc(x, y + s * 0.05, s * 0.92, Math.PI, 0);
  ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.52, x, y - s * 0.52);
  ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.52, x - s * 0.92, y + s * 0.05);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  for (const [dx, dy] of [[-0.35, -0.3], [0.05, -0.42], [0.4, -0.26], [-0.08, -0.18]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * s, y + dy * s, s * 0.09, s * 0.05, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The beef patty: raw pink-brown, grilled dark with sear lines, or blackened when burnt. */
export function drawPatty(ctx, x, y, s, stage) {
  drawShadow(ctx, x, y, s);
  ctx.fillStyle = stage === 'burnt' ? '#26201c' : stage === 'cooked' ? '#7a4522' : '#b06a52';
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  if (stage === 'cooked') {
    ctx.strokeStyle = 'rgba(46, 24, 10, 0.55)';
    ctx.lineWidth = Math.max(1.5, s * 0.09);
    for (const off of [-0.38, 0, 0.38]) {
      ctx.beginPath();
      ctx.moveTo(x - s * 0.7, y + off * s);
      ctx.lineTo(x + s * 0.7, y + off * s);
      ctx.stroke();
    }
  }
}

/** A cheese slice: a golden wedge with round holes, draped once chopped (sliced). */
export function drawCheese(ctx, x, y, s) {
  drawShadow(ctx, x, y, s);
  ctx.fillStyle = '#f7b731';
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.45);
  ctx.lineTo(x + s, y + s * 0.45);
  ctx.lineTo(x + s * 0.25, y - s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e09a1d';
  for (const [dx, dy, r] of [[-0.25, 0.18, 0.16], [0.32, 0.05, 0.12], [0.02, -0.28, 0.1]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A tomato: glossy red with a green star crown; chopped shows neat red slices instead. */
export function drawTomato(ctx, x, y, s, chopped) {
  drawShadow(ctx, x, y, s);
  if (chopped) {
    for (const dx of [-0.45, 0.05, 0.5]) {
      ctx.fillStyle = '#d63c2e';
      ctx.beginPath();
      ctx.ellipse(x + dx * s, y + 0.1 * s, s * 0.42, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2f7ce';
      ctx.beginPath();
      ctx.ellipse(x + dx * s, y + 0.1 * s, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const gradient = ctx.createRadialGradient(x - s * 0.3, y - s * 0.35, s * 0.2, x, y, s);
  gradient.addColorStop(0, '#ff7a5c');
  gradient.addColorStop(1, '#cf2f21');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, s * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f9e4d';
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.ellipse(x + Math.cos(angle) * s * 0.3, y - s * 0.78 + Math.sin(angle) * s * 0.12, s * 0.2, s * 0.09, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(x - s * 0.05, y - s * 1.05, s * 0.1, s * 0.22);
}

/** Lettuce: layered green ruffles; chopped is a tidy shredded pile. */
export function drawLettuce(ctx, x, y, s, chopped) {
  drawShadow(ctx, x, y, s);
  ctx.fillStyle = chopped ? '#69b84f' : '#57a83e';
  const bumps = chopped ? 5 : 7;
  for (let i = 0; i < bumps; i += 1) {
    const angle = (i / bumps) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * s * 0.45, y + Math.sin(angle) * s * 0.28, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#8fd06f';
  ctx.beginPath();
  ctx.arc(x, y, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

/** A potato: a plain tan oval whole, or a red carton of golden fries once cut and fried. */
export function drawPotatoOrFries(ctx, x, y, s, stage) {
  drawShadow(ctx, x, y, s);
  if (stage === 'raw') {
    ctx.fillStyle = '#c9a06b';
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.95, s * 0.68, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a67c4e';
    for (const [dx, dy] of [[-0.3, -0.1], [0.25, 0.15], [0.05, -0.3]]) {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const stickColour = stage === 'burnt' ? '#4a341f' : '#f6c453';
  ctx.fillStyle = stickColour;
  for (const [dx, tilt] of [[-0.5, -0.16], [-0.18, 0.06], [0.14, -0.05], [0.46, 0.15], [0, -0.22]]) {
    ctx.save();
    ctx.translate(x + dx * s, y - s * 0.35);
    ctx.rotate(tilt);
    ctx.fillRect(-s * 0.09, -s * 0.55, s * 0.18, s * 1.05);
    ctx.restore();
  }
  ctx.fillStyle = '#d63c2e';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.85, y - s * 0.1);
  ctx.lineTo(x + s * 0.85, y - s * 0.1);
  ctx.lineTo(x + s * 0.6, y + s * 0.75);
  ctx.lineTo(x - s * 0.6, y + s * 0.75);
  ctx.closePath();
  ctx.fill();
}

/** Draw a carried or stationed raw/prepping item by its type and stage. */
export function drawItem(ctx, item, x, y, s) {
  if (!item) return;
  if (item.type === 'bun') drawBun(ctx, x, y, s);
  else if (item.type === 'patty') drawPatty(ctx, x, y, s, item.stage);
  else if (item.type === 'cheese') drawCheese(ctx, x, y, s);
  else if (item.type === 'tomato') drawTomato(ctx, x, y, s, item.stage === 'chopped');
  else if (item.type === 'lettuce') drawLettuce(ctx, x, y, s, item.stage === 'chopped');
  else if (item.type === 'potato') drawPotatoOrFries(ctx, x, y, s, item.stage === 'raw' ? 'raw' : item.stage === 'burnt' ? 'burnt' : 'cooked');
}

/** Draw one finished plate component (what an order card and a built plate show). */
export function drawComponent(ctx, component, x, y, s) {
  if (component === 'bun') drawBun(ctx, x, y, s);
  else if (component === 'patty') drawPatty(ctx, x, y, s, 'cooked');
  else if (component === 'cheese') drawCheese(ctx, x, y, s);
  else if (component === 'tomato') drawTomato(ctx, x, y, s, true);
  else if (component === 'lettuce') drawLettuce(ctx, x, y, s, true);
  else if (component === 'fries') drawPotatoOrFries(ctx, x, y, s, 'cooked');
}

/** A white plate with its components stacked in a neat little pile. */
export function drawPlate(ctx, components, x, y, s) {
  ctx.fillStyle = 'rgba(40, 22, 8, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.5, s * 1.15, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.12, s * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfd4d9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.86, s * 0.44, 0, 0, Math.PI * 2);
  ctx.stroke();
  const offsets = [[0, 0.05], [-0.44, -0.1], [0.44, -0.1], [-0.2, -0.32], [0.24, -0.32]];
  components.slice(0, 5).forEach((component, index) => {
    const [dx, dy] = offsets[index];
    drawComponent(ctx, component, x + dx * s, y + dy * s, s * 0.58);
  });
}
