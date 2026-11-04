/* =====================================================================
   FILE: js/core/stars.js
   WHAT IT DOES: Two star helpers drawn on a <canvas>:
     1) FALLING stars (white stars that fall down the screen) - Intro screen.
     2) TWINKLING stars (stay in place and slowly blink) - other space screens.
   BELONGS TO: Intro, Customize, Destination, Travel, Quiz screens.
   HOW TO USE:  const stopper = Game.stars.start(canvas, "falling");   stopper();  // to stop
   WHAT TO CHANGE: number of stars, their speed, their size (look at "count").
   ===================================================================== */

Game.stars = {};

// Make a list of random stars. Each star has a position, size and speed.
Game.stars.makeList = function (count, width, height) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.6 + Math.random() * 2.2,
      speed: 40 + Math.random() * 120,         // falling speed (pixels per second)
      blinkSpeed: 0.8 + Math.random() * 2.5,   // twinkling speed
      blinkStart: Math.random() * 6
    });
  }
  return list;
};

// Draw falling stars: they move down and slightly left, then start again at the top.
Game.stars.drawFalling = function (ctx, list, seconds, deltaTime) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < list.length; i++) {
    const star = list[i];
    star.y += star.speed * deltaTime;
    star.x -= star.speed * 0.35 * deltaTime;
    if (star.y > h + 20) { star.y = -10; star.x = Math.random() * (w + 300); }
    if (star.x < -20) { star.x = w + 10; }
    // Fast stars get a little tail so they look like they are falling.
    const tail = star.speed * 0.12;
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = star.size * 0.7;
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(star.x + tail * 0.35, star.y - tail);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

// Draw twinkling stars: brightness goes up and down smoothly (a sine wave).
Game.stars.drawTwinkle = function (ctx, list, seconds) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < list.length; i++) {
    const star = list[i];
    const brightness = 0.45 + 0.55 * Math.sin(seconds * star.blinkSpeed + star.blinkStart);
    ctx.globalAlpha = Math.max(0.1, brightness);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// Start animating stars on a canvas. mode is "falling" or "twinkle".
// Returns a function: call it to stop.
Game.stars.start = function (canvas, mode) {
  const ctx = canvas.getContext("2d");
  const count = mode === "falling" ? 90 : 120;
  const list = Game.stars.makeList(count, canvas.width, canvas.height);
  let running = true;
  let lastTime = performance.now();

  function frame(now) {
    if (!running) { return; }
    const deltaTime = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (mode === "falling") {
      Game.stars.drawFalling(ctx, list, now / 1000, deltaTime);
    } else {
      Game.stars.drawTwinkle(ctx, list, now / 1000);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return function stop() { running = false; };
};
