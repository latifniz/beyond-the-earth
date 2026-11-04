/* =====================================================================
   FILE: js/drawing/astronaut.js
   WHAT IT DOES: Draws the astronaut on a canvas, for any suit and any view
   (front, back, side). It FIRST tries the picture
   assets/images/astronaut/<suit>-<view>.png (e.g. purple-back.png).
   If that picture is missing, it DRAWS the astronaut with code instead,
   so the game always works.
   BELONGS TO: Customize screen and all planet levels.
   WHAT TO CHANGE: colors of the code-drawn suits in "suitColors"; to use
   a new picture, just put a file with the right name in that folder.
   VIEWS: "front" = she faces us (standing still), "back" = we see her back
   (walking forward), "side" = walking left or right (flip = true for left).
   ===================================================================== */

Game.astronaut = {
  suits: ["white-blue", "purple", "pink"],
  views: ["front", "back", "side"],
  images: {},      // loaded pictures, e.g. images["pink-back"]
  // Colors used when we draw the astronaut with code.
  suitColors: {
    "white-blue": { main: "#f1f4ff", shade: "#c9d0ea", accent: "#2f5fe0" },
    "purple":     { main: "#9b5cf0", shade: "#6f35c4", accent: "#3b1d86" },
    "pink":       { main: "#ffa6cc", shade: "#e078a8", accent: "#e0408a" }
  }
};

// ===== LOADING THE PICTURES =====

// Try to load every picture. A missing picture is NOT an error: it stays null.
Game.astronaut.loadImages = function (onDone) {
  let waiting = 0;
  function oneDone() { waiting--; if (waiting === 0 && onDone) { onDone(); } }
  for (let s = 0; s < Game.astronaut.suits.length; s++) {
    for (let v = 0; v < Game.astronaut.views.length; v++) {
      const viewName = Game.astronaut.views[v];
      if (viewName === "side" && !Game.config.hasSidePictures) { continue; }   // no side pictures yet
      const key = Game.astronaut.suits[s] + "-" + Game.astronaut.views[v];
      Game.astronaut.images[key] = null;
      waiting++;
      const image = new Image();
      image.onload = (function (k, img) { return function () { Game.astronaut.images[k] = img; oneDone(); }; })(key, image);
      image.onerror = oneDone;
      image.src = "assets/images/astronaut/" + key + ".png";
    }
  }
};

// Choose which picture to use. There is no side picture yet, so for "side"
// we reuse the back picture (squeezed a bit, see drawPicture).
Game.astronaut.findPicture = function (suit, view) {
  const exact = Game.astronaut.images[suit + "-" + view];
  if (exact) { return exact; }
  if (view === "side") { return Game.astronaut.images[suit + "-back"]; }
  return null;
};

// ===== MAIN DRAW FUNCTION =====

// options: suit, view, x (center), feetY, height, flip, walkPhase, moving, time, lean, armLeft, armRight
Game.astronaut.draw = function (ctx, options) {
  const picture = Game.astronaut.findPicture(options.suit, options.view);
  if (picture) {
    Game.astronaut.drawPicture(ctx, picture, options);
  } else {
    Game.astronaut.drawWithCode(ctx, options);
  }
};

// Draw the PNG picture and add motion: breathing when still, bobbing when walking.
Game.astronaut.drawPicture = function (ctx, picture, o) {
  const scaleToHeight = o.height / picture.height;
  let width = picture.width * scaleToHeight;
  let bob = 0;
  let stretch = 1;
  if (o.moving) {
    bob = Math.abs(Math.sin(o.walkPhase)) * o.height * 0.025;     // each step lifts the body a little
  } else {
    stretch = 1 + Math.sin(o.time * 2) * 0.008;                    // gentle breathing
  }
  if (o.view === "side") { width = width * 0.8; }                   // "turned" look
  const lean = (o.lean || 0) + (o.moving ? Math.sin(o.walkPhase) * 0.03 : 0) + (o.view === "side" ? 0.06 : 0);

  ctx.save();
  ctx.translate(o.x, o.feetY - bob);
  if (o.flip) { ctx.scale(-1, 1); }
  ctx.rotate(lean);
  ctx.scale(1, stretch);
  if (o.light) {
    ctx.drawImage(Game.astronaut.lightPicture(picture, width, o.height, o.light), -width / 2, -o.height, width, o.height);
  } else {
    ctx.drawImage(picture, -width / 2, -o.height, width, o.height);
  }
  ctx.restore();
};

// ===== LIGHTING ON THE PICTURE =====
// The astronaut pictures were made in a studio. To make her look like she is really standing on
// the Moon / Mars / Venus, we copy her onto a hidden canvas and paint colored LIGHT on top of her
// suit only ("source-atop" = paint only where the suit already is, not on the empty background):
//   - a color tint (the color of the air/sky of that planet)
//   - warm sunlight on the sunny (left) side, shade on the other side
//   - a darker bottom (dust and ground shadow)
Game.astronaut.lightCanvas = document.createElement("canvas");
Game.astronaut.lightPicture = function (picture, width, height, light) {
  const canvas = Game.astronaut.lightCanvas;
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  c.drawImage(picture, 0, 0, w, h);
  c.globalCompositeOperation = "source-atop";
  c.fillStyle = light.tint;                                  // overall color of the planet's air
  c.fillRect(0, 0, w, h);
  const side = c.createLinearGradient(0, 0, w, 0);          // sunlight from the left, shade on the right
  side.addColorStop(0, light.sun);
  side.addColorStop(0.5, "rgba(255,255,255,0)");
  side.addColorStop(1, light.shade);
  c.fillStyle = side;
  c.fillRect(0, 0, w, h);
  const ground = c.createLinearGradient(0, h * 0.6, 0, h);  // dust makes the legs a little darker
  ground.addColorStop(0, "rgba(0,0,0,0)");
  ground.addColorStop(1, light.ground);
  c.fillStyle = ground;
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  return canvas;
};

// ===== CODE-DRAWN ASTRONAUT (used when pictures are missing) =====

// Draw a rounded rectangle path (helper).
Game.astronaut.roundRect = function (ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Draw one limb (arm or leg) that swings from its top joint.
Game.astronaut.drawLimb = function (ctx, x, y, w, h, angle, color, tipColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  Game.astronaut.roundRect(ctx, -w / 2, 0, w, h, w * 0.45);
  ctx.fill();
  ctx.fillStyle = tipColor;                   // glove or boot
  Game.astronaut.roundRect(ctx, -w / 2 - 0.5, h - w * 0.9, w + 1, w * 0.95, w * 0.4);
  ctx.fill();
  ctx.restore();
};

// Draw the whole astronaut with shapes. Everything is measured in "u" = height / 100.
Game.astronaut.drawWithCode = function (ctx, o) {
  const c = Game.astronaut.suitColors[o.suit] || Game.astronaut.suitColors["white-blue"];
  const u = o.height / 100;
  // Legs swing one way, arms swing the other way: this is the walk cycle.
  const swing = o.moving ? Math.sin(o.walkPhase) * 0.55 : 0;
  const breathe = o.moving ? 0 : Math.sin(o.time * 2) * 0.4 * u;
  const view = o.view;
  const armLeft = o.armLeft !== undefined && o.armLeft !== null ? o.armLeft : swing;
  const armRight = o.armRight !== undefined && o.armRight !== null ? o.armRight : -swing;

  ctx.save();
  ctx.translate(o.x, o.feetY - (o.moving ? Math.abs(Math.sin(o.walkPhase)) * 2 * u : 0));
  if (o.flip) { ctx.scale(-1, 1); }
  ctx.rotate(o.lean || 0);
  const sideShift = view === "side" ? 0.55 : 1;      // in side view the body is narrower

  // legs
  Game.astronaut.drawLimb(ctx, -7 * u * sideShift, -38 * u, 13 * u, 38 * u, swing, c.shade, "#2b2540");
  Game.astronaut.drawLimb(ctx, 7 * u * sideShift, -38 * u, 13 * u, 38 * u, -swing, c.main, "#2b2540");

  // backpack (behind the body in side view, on top of it in back view)
  const packColor = o.suit === "white-blue" ? "#dfe5fb" : c.shade;
  if (view === "side") {
    ctx.fillStyle = packColor;
    Game.astronaut.roundRect(ctx, -22 * u, -80 * u, 14 * u, 36 * u, 4 * u);
    ctx.fill();
  }

  // body (torso)
  ctx.fillStyle = c.main;
  Game.astronaut.roundRect(ctx, -19 * u * sideShift, -80 * u + breathe, 38 * u * sideShift, 46 * u, 10 * u);
  ctx.fill();
  ctx.fillStyle = c.accent;
  ctx.fillRect(-19 * u * sideShift, -44 * u, 38 * u * sideShift, 5 * u);   // belt
  if (view === "back") {
    ctx.fillStyle = packColor;
    Game.astronaut.roundRect(ctx, -14 * u, -77 * u, 28 * u, 34 * u, 5 * u);
    ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(0, -62 * u, 6 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (view === "front") {
    ctx.fillStyle = c.accent;
    Game.astronaut.roundRect(ctx, -8 * u, -72 * u, 16 * u, 12 * u, 3 * u);
    ctx.fill();
  }

  // arms
  Game.astronaut.drawLimb(ctx, -21 * u * sideShift, -76 * u, 10 * u, 32 * u, armLeft, c.shade, "#2b2540");
  Game.astronaut.drawLimb(ctx, 21 * u * sideShift, -76 * u, 10 * u, 32 * u, armRight, c.main, "#2b2540");

  // helmet and visor
  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.arc(0, -90 * u + breathe, 16 * u, 0, Math.PI * 2);
  ctx.fill();
  if (view !== "back") {
    const visorX = view === "side" ? 5 * u : 0;
    ctx.fillStyle = "#1a1535";
    ctx.beginPath();
    ctx.ellipse(visorX, -90 * u + breathe, (view === "side" ? 8 : 11) * u, 9.5 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(visorX - 3 * u, -93 * u + breathe, 3 * u, 2 * u, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = c.accent;
    ctx.fillRect(-2 * u, -105 * u + breathe, 4 * u, 8 * u);
  }
  ctx.restore();
};

// A rough position of her hands (used by cutscenes to attach the flag).
Game.astronaut.handPosition = function (o) {
  const direction = o.flip ? -1 : 1;
  return { x: o.x + direction * o.height * 0.3, y: o.feetY - o.height * 0.42 };
};

// Where the backpack is (used to attach the folded flag).
Game.astronaut.backpackPosition = function (o) {
  return { x: o.x, y: o.feetY - o.height * 0.62 };
};
