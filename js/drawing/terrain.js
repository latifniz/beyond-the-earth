/* =====================================================================
   FILE: js/drawing/terrain.js
   WHAT IT DOES: Draws the BACKDROP of a planet level: sky, stars, sun glow,
   far hills and the ground. Each planet gives its own colors (a "palette").
   BELONGS TO: all planet levels (moon.js, mars.js, venus.js choose the colors).
   WHAT TO CHANGE: the numbers inside the functions to change how the hills look.
   PARALLAX IDEA: things that are FAR away move slowly when we walk sideways;
   things that are CLOSE move fast. So each hill layer has a "parallax" number:
   small number = far and slow.
   ===================================================================== */

Game.terrain = {};

// A small repeatable "random-looking" number from a seed (always gives the same answer for the same seed).
Game.terrain.hash = function (a, b) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// Sky: a vertical gradient from the top color to the color at the horizon.
Game.terrain.drawSky = function (ctx, palette, horizonY) {
  const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
  for (let i = 0; i < palette.sky.length; i++) {
    grad.addColorStop(i / (palette.sky.length - 1), palette.sky[i]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, horizonY + 2);
};

// Twinkling stars. They shift only a tiny bit when we walk sideways (very far away).
Game.terrain.drawStars = function (ctx, level, horizonY) {
  if (!level.skyStars) {
    level.skyStars = Game.stars.makeList(170, 1280, horizonY);
  }
  const list = level.skyStars;
  for (let i = 0; i < list.length; i++) {
    const star = list[i];
    const x = ((star.x - level.worldX * 0.01) % 1280 + 1280) % 1280;
    ctx.globalAlpha = (0.35 + 0.5 * Math.sin(level.time * star.blinkSpeed + star.blinkStart)) * (1 - star.y / horizonY * 0.6);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, star.y, star.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// A glowing circle (Sun or hazy light). Draw with big radius for a soft glow.
Game.terrain.drawGlow = function (ctx, x, y, radius, innerColor, outerColor) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(1, outerColor);
  ctx.fillStyle = grad;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

// Sun rays (long thin triangles around a point), used for the Moon's Sun.
Game.terrain.drawSunRays = function (ctx, x, y, length, seconds) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2 + seconds * 0.02;
    const long = length * (0.55 + 0.45 * Terrain_noise(i));
    ctx.fillStyle = "rgba(255,225,170,0.16)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle - 0.03) * long, Math.sin(angle - 0.03) * long);
    ctx.lineTo(Math.cos(angle + 0.03) * long, Math.sin(angle + 0.03) * long);
    ctx.fill();
  }
  ctx.restore();
};
function Terrain_noise(i) { return Game.terrain.hash(i, 3.3); }

// Draw an image planet (Earth, Moon...) or, if the picture is missing, a shaded ball.
Game.terrain.drawPlanetPicture = function (ctx, name, x, y, radius) {
  const image = Game.loadedImages["assets/images/planets/" + name + ".png"];
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    Game.terrain.drawFallbackPlanet(ctx, name, x, y, radius);
  }
};

// A code-drawn planet: a ball with light from the upper left.
Game.terrain.drawFallbackPlanet = function (ctx, name, x, y, radius) {
  const colors = { moon: ["#d8d8d8", "#6c6c70"], mars: ["#e08a55", "#6a2a14"], venus: ["#f3d27a", "#a8671c"], earth: ["#5aa0ff", "#0b2a6a"] };
  const pair = colors[name] || colors.moon;
  const grad = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, radius * 0.1, x, y, radius);
  grad.addColorStop(0, pair[0]);
  grad.addColorStop(1, pair[1]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

// One layer of far hills: a wavy silhouette made by adding sine waves.
// layer = { color, height, amplitude, parallax, seed }
Game.terrain.drawHills = function (ctx, layer, worldX, horizonY) {
  const shift = worldX * layer.parallax;
  ctx.fillStyle = layer.color;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 3);
  for (let x = 0; x <= 1280; x += 16) {
    const p = (x + shift) / 220 + layer.seed;
    const wave = Math.sin(p) * 0.5 + Math.sin(p * 2.3 + 1.7) * 0.3 + Math.sin(p * 4.1 + 0.4) * 0.2;
    ctx.lineTo(x, horizonY - layer.height - wave * layer.amplitude);
  }
  ctx.lineTo(1280, horizonY + 3);
  ctx.closePath();
  ctx.fill();
};

// The ground: color gradient (far = hazy, near = detailed) + bands that slide toward us.
Game.terrain.drawGround = function (ctx, level, palette) {
  const horizonY = level.horizonY;
  const grad = ctx.createLinearGradient(0, horizonY, 0, 720);
  grad.addColorStop(0, palette.groundFar);
  grad.addColorStop(0.35, palette.groundMid);
  grad.addColorStop(1, palette.groundNear);
  ctx.fillStyle = grad;
  ctx.fillRect(0, horizonY, 1280, 720 - horizonY);

  // Stripes at fixed world distances. When we walk, they slide down the screen: this is
  // what makes us FEEL the movement even on an empty plain.
  const bandSize = 260;
  const first = Math.floor((level.worldZ - 200) / bandSize);
  for (let k = first; k < first + 16; k++) {
    if (k % 2 !== 0) { continue; }
    const top = Game.walker.worldToScreen(level, 0, (k + 1) * bandSize).y;
    const bottom = Game.walker.worldToScreen(level, 0, k * bandSize).y;
    if (bottom < horizonY || top > 720) { continue; }
    ctx.fillStyle = palette.band;
    ctx.fillRect(0, Math.max(top, horizonY), 1280, Math.min(bottom, 720) - Math.max(top, horizonY));
  }
  // a soft haze line at the horizon hides the join between hills and ground
  const haze = ctx.createLinearGradient(0, horizonY - 18, 0, horizonY + 40);
  haze.addColorStop(0, "rgba(0,0,0,0)");
  haze.addColorStop(0.4, palette.haze);
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizonY - 18, 1280, 58);
};
