/* =====================================================================
   FILE: js/drawing/props.js
   WHAT IT DOES: Draws the small things lying on the ground: rocks, craters,
   pebbles, cloud puffs, plants, glowing stones, markers (red dot / ring).
   BELONGS TO: all planet levels (world.js calls these).
   HOW IT WORKS: every function is   draw(ctx, x, y, size, item, palette, time)
     x, y   = where its BOTTOM-CENTER touches the ground on the screen
     size   = how big it should be on screen (already made smaller for far things)
     item   = the object info (item.seed makes each rock a different shape)
   LIGHT: light always comes from the upper-left, so shadows fall to the lower-right.
   WHAT TO CHANGE: the shapes and colors. Colors for each planet come from the palette.
   ===================================================================== */

Game.props = { draw: {} };

// A soft dark oval under things (a shadow on the ground).
Game.props.shadow = function (ctx, x, y, width, height, alpha) {
  ctx.fillStyle = "rgba(0,0,0," + alpha + ")";
  ctx.beginPath();
  ctx.ellipse(x + width * 0.12, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
};

// ----- ROCK: a lumpy polygon. The seed gives each rock its own shape. -----
Game.props.draw.rock = function (ctx, x, y, size, item, palette) {
  const points = 9;
  const w = size * (0.9 + Game.terrain.hash(item.seed, 1) * 0.5);
  const h = size * (0.55 + Game.terrain.hash(item.seed, 2) * 0.4);
  Game.props.shadow(ctx, x, y, w * 0.62, h * 0.16, 0.28);
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = Math.PI + (i / (points - 1)) * Math.PI;        // top half of an oval
    const bump = 0.8 + Game.terrain.hash(item.seed, i + 5) * 0.28;
    ctx.lineTo(x + Math.cos(angle) * w / 2 * bump, y + Math.sin(angle) * h * bump);   // sin is negative here, so the rock bulges UP
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y);     // light upper-left, dark lower-right
  grad.addColorStop(0, palette.rockLight);
  grad.addColorStop(1, palette.rockDark);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.stroke();
  // a couple of cracks / highlights
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.2, y - h * 0.75);
  ctx.lineTo(x + w * 0.05, y - h * 0.5);
  ctx.stroke();
};

// ----- CRATER: a flat oval dent: dark inside, bright rim on the far side. -----
Game.props.draw.crater = function (ctx, x, y, size, item, palette) {
  const w = size * 1.5;
  const h = size * 0.3;
  const cy = y - h * 0.5;
  ctx.fillStyle = "rgba(0,0,0,0.16)";                          // soft dark halo around the dent
  ctx.beginPath();
  ctx.ellipse(x, cy, w / 2 + size * 0.1, h / 2 + size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.craterRim;                            // thin bright rim
  ctx.beginPath();
  ctx.ellipse(x, cy, w / 2 + size * 0.03, h / 2 + size * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  const inner = ctx.createLinearGradient(x, cy - h / 2, x, cy + h / 2);
  inner.addColorStop(0, palette.craterDark);
  inner.addColorStop(1, palette.craterLight);
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(x, cy + h * 0.04, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
};

// ----- SPECKS: tiny dark and light dots, give the ground a grainy texture and a feeling of speed. -----
Game.props.draw.specks = function (ctx, x, y, size, item, palette) {
  for (let i = 0; i < 9; i++) {
    const px = x + (Game.terrain.hash(item.seed, i) - 0.5) * size * 3;
    const py = y + (Game.terrain.hash(item.seed, i + 20) - 0.5) * size * 0.5;
    ctx.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(px, py, Math.max(1, size * 0.06), Math.max(0.6, size * 0.03), 0, 0, Math.PI * 2);
    ctx.fill();
  }
};

// ----- PEBBLES: three tiny rocks together. -----
Game.props.draw.pebbles = function (ctx, x, y, size, item, palette) {
  for (let i = 0; i < 3; i++) {
    const px = x + (i - 1) * size * 0.5 + (Game.terrain.hash(item.seed, i) - 0.5) * size * 0.3;
    const py = y + (Game.terrain.hash(item.seed, i + 9) - 0.5) * size * 0.15;
    ctx.fillStyle = palette.rockDark;
    ctx.beginPath();
    ctx.ellipse(px, py, size * 0.22, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.rockLight;
    ctx.beginPath();
    ctx.ellipse(px - size * 0.03, py - size * 0.03, size * 0.16, size * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};

// ----- CLOUD PUFF (Venus ground): soft white-yellow blobs lying flat. -----
Game.props.draw.cloud = function (ctx, x, y, size, item, palette) {
  const w = size * 2.2;
  const h = size * 0.45;
  const grad = ctx.createRadialGradient(x, y - h * 0.4, 0, x, y - h * 0.4, w / 2);
  grad.addColorStop(0, "rgba(255,248,214,0.95)");
  grad.addColorStop(0.6, "rgba(255,226,140,0.55)");
  grad.addColorStop(1, "rgba(255,210,110,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.4, w / 2, h, 0, 0, Math.PI * 2);
  ctx.fill();
};

// ----- DUST PATCH (Mars): a flat, slightly lighter oval. -----
Game.props.draw.dust = function (ctx, x, y, size, item, palette) {
  ctx.fillStyle = "rgba(255,200,150,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.05, size * 1.2, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
};

// ----- GLOWING STONE / SAMPLE / PART: collectible sprites (they pulse). -----
Game.props.draw.stone = function (ctx, x, y, size, item, palette, time) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 3 + item.x);
  const lift = Math.sin(time * 2 + item.z) * size * 0.04;
  Game.props.shadow(ctx, x, y, size * 0.4, size * 0.07, 0.3);
  Game.terrain.drawGlow(ctx, x, y - size * 0.45 + lift, size * 0.9 * pulse, "rgba(190,110,255,0.65)", "rgba(190,110,255,0)");
  const image = Game.loadedImages["assets/images/stone.png"];
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x - size / 2, y - size * 0.95 + lift, size, size * (image.height / image.width));
  } else {
    // fallback: a purple crystal drawn with 3 triangles
    ctx.fillStyle = "#8a3cf0";
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.95 + lift);
    ctx.lineTo(x + size * 0.28, y - size * 0.1);
    ctx.lineTo(x - size * 0.28, y - size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c58bff";
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.95 + lift);
    ctx.lineTo(x + size * 0.1, y - size * 0.1);
    ctx.lineTo(x - size * 0.28, y - size * 0.1);
    ctx.closePath();
    ctx.fill();
  }
};

// Venus cloud sample: a glowing white orb with an orange rim, so it stands out on the yellow clouds.
Game.props.draw.sample = function (ctx, x, y, size, item, palette, time) {
  const pulse = 0.8 + 0.2 * Math.sin(time * 3.4 + item.x);
  const lift = Math.sin(time * 2 + item.z) * size * 0.08;
  const cy = y - size * 0.55 + lift;
  Game.props.shadow(ctx, x, y, size * 0.35, size * 0.06, 0.25);
  Game.terrain.drawGlow(ctx, x, cy, size * 0.9 * pulse, "rgba(255,255,255,0.95)", "rgba(255,150,40,0)");
  ctx.strokeStyle = "rgba(255,255,255,0.9)";                      // turning sparkle rays
  ctx.lineWidth = Math.max(1, size * 0.03);
  for (let i = 0; i < 4; i++) {
    const angle = time * 0.8 + i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle) * size * 0.5 * pulse, cy - Math.sin(angle) * size * 0.5 * pulse);
    ctx.lineTo(x + Math.cos(angle) * size * 0.5 * pulse, cy + Math.sin(angle) * size * 0.5 * pulse);
    ctx.stroke();
  }
  ctx.fillStyle = "#fffdf0";
  ctx.strokeStyle = "#ff9a1f";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath(); ctx.arc(x, cy, size * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
};

// ----- MARKERS: red dot (flag spot) and ring (other action spots), drawn FLAT on the ground. -----
Game.props.draw.redDot = function (ctx, x, y, size, item, palette, time) {
  const pulse = 1 + 0.12 * Math.sin(time * 4);
  ctx.fillStyle = "rgba(255,60,80,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.9 * pulse, size * 0.9 * 0.28 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff2e47";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.42, size * 0.42 * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.stroke();
};
Game.props.draw.ring = function (ctx, x, y, size, item, palette, time) {
  const pulse = 1 + 0.1 * Math.sin(time * 4);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.8 * pulse, size * 0.8 * 0.28 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(127,212,255,0.3)";
  ctx.fill();
};
