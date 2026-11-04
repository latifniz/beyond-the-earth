/* =====================================================================
   FILE: js/drawing/spacecraft.js
   WHAT IT DOES: Draws the spacecraft (a small rocket ship) with canvas shapes.
   BELONGS TO: Travel screen (and the Mars rover launch uses the flame).
   HOW TO USE: Game.spacecraft.draw(ctx, x, y, size, angle, seconds);
     angle = 0 means pointing straight up; angles turn it clockwise (in radians).
   WHAT TO CHANGE: the colors in the gradients below.
   ===================================================================== */

Game.spacecraft = {};

// Draw the flame coming out of the engine (flickers using the time).
Game.spacecraft.drawFlame = function (ctx, length, width, seconds) {
  const flicker = 0.85 + Math.sin(seconds * 40) * 0.15;
  const grad = ctx.createLinearGradient(0, 0, 0, length * flicker);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.3, "rgba(255,200,80,0.9)");
  grad.addColorStop(1, "rgba(255,80,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-width / 2, 0);
  ctx.quadraticCurveTo(0, length * flicker * 1.2, width / 2, 0);
  ctx.closePath();
  ctx.fill();
};

// Draw the whole ship. (x, y) is its center. size is its length in pixels.
Game.spacecraft.draw = function (ctx, x, y, size, angle, seconds) {
  const u = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // flame (behind the ship)
  ctx.save();
  ctx.translate(0, 42 * u);
  Game.spacecraft.drawFlame(ctx, 55 * u, 22 * u, seconds);
  ctx.restore();

  // fins
  ctx.fillStyle = "#c13cf2";
  ctx.beginPath();
  ctx.moveTo(-14 * u, 14 * u); ctx.lineTo(-34 * u, 46 * u); ctx.lineTo(-12 * u, 40 * u); ctx.closePath();
  ctx.moveTo(14 * u, 14 * u); ctx.lineTo(34 * u, 46 * u); ctx.lineTo(12 * u, 40 * u); ctx.closePath();
  ctx.fill();

  // body
  const body = ctx.createLinearGradient(-16 * u, 0, 16 * u, 0);
  body.addColorStop(0, "#b9b3e8");
  body.addColorStop(0.45, "#ffffff");
  body.addColorStop(1, "#9a93d4");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -50 * u);
  ctx.bezierCurveTo(22 * u, -26 * u, 18 * u, 20 * u, 14 * u, 44 * u);
  ctx.lineTo(-14 * u, 44 * u);
  ctx.bezierCurveTo(-18 * u, 20 * u, -22 * u, -26 * u, 0, -50 * u);
  ctx.fill();

  // nose cone
  ctx.fillStyle = "#d741ff";
  ctx.beginPath();
  ctx.moveTo(0, -50 * u);
  ctx.bezierCurveTo(10 * u, -40 * u, 14 * u, -30 * u, 15 * u, -22 * u);
  ctx.lineTo(-15 * u, -22 * u);
  ctx.bezierCurveTo(-14 * u, -30 * u, -10 * u, -40 * u, 0, -50 * u);
  ctx.fill();

  // window
  ctx.fillStyle = "#1c2f78";
  ctx.beginPath();
  ctx.arc(0, -5 * u, 8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(160,220,255,0.8)";
  ctx.beginPath();
  ctx.arc(-2.5 * u, -7.5 * u, 3 * u, 0, Math.PI * 2);
  ctx.fill();

  // engine
  ctx.fillStyle = "#59509a";
  ctx.fillRect(-9 * u, 44 * u, 18 * u, 5 * u);
  ctx.restore();
};
