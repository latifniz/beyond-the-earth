/* =====================================================================
   FILE: js/levels/effects.js
   WHAT IT DOES: Small moving effects drawn ON the screen: the white spray from
   the shoes (Venus), dust puffs, and collected items that FLY to the progress
   bar on the right edge.
   BELONGS TO: all planet levels.
   HOW TO USE: Game.effects.addSpray(level, x, y);  Game.effects.flyToBar(level, x, y, "stone");
   WHAT TO CHANGE: how many particles, how fast, colors (in addSpray / draw).
   ===================================================================== */

Game.effects = {};

// A burst of white spray particles (Venus spray from the shoes).
Game.effects.addSpray = function (level, x, y) {
  for (let i = 0; i < 3; i++) {
    level.effects.push({ kind: "spray", x: x + (Math.random() - 0.5) * 50, y: y,
      vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 70, life: 0.9, age: 0, size: 5 + Math.random() * 8 });
  }
};

// A little dust puff when she lands.
Game.effects.addDust = function (level, x, y) {
  for (let i = 0; i < 8; i++) {
    level.effects.push({ kind: "dust", x: x + (Math.random() - 0.5) * 60, y: y,
      vx: (Math.random() - 0.5) * 200, vy: -20 - Math.random() * 40, life: 0.8, age: 0, size: 6 + Math.random() * 8 });
  }
};

// An item (stone, sample, part) flies from where it was to the progress bar.
Game.effects.flyToBar = function (level, x, y, sprite, onArrive) {
  level.effects.push({ kind: "fly", sprite: sprite, x: x, y: y, startX: x, startY: y, endX: 1228, endY: 360,
    life: 0.9, age: 0, onArrive: onArrive });
};

// Move all effects forward in time and remove finished ones.
Game.effects.update = function (level, dt) {
  for (let i = level.effects.length - 1; i >= 0; i--) {
    const e = level.effects[i];
    e.age += dt;
    if (e.kind === "spray" || e.kind === "dust") {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 60 * dt;
    }
    if (e.age >= e.life) {
      if (e.onArrive) { e.onArrive(); }
      level.effects.splice(i, 1);
    }
  }
};

// Draw all effects.
Game.effects.draw = function (ctx, level) {
  for (let i = 0; i < level.effects.length; i++) {
    const e = level.effects[i];
    const p = e.age / e.life;
    if (e.kind === "spray" || e.kind === "dust") {
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = e.kind === "spray" ? "#ffffff" : "rgba(200,190,180,0.9)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * (0.6 + p), 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === "fly") {
      const ease = p * p * (3 - 2 * p);
      const x = e.startX + (e.endX - e.startX) * ease;
      const y = e.startY + (e.endY - e.startY) * ease - Math.sin(p * Math.PI) * 120;
      ctx.globalAlpha = 1;
      Game.terrain.drawGlow(ctx, x, y, 46 * (1 - p * 0.5), "rgba(255,255,255,0.9)", "rgba(190,110,255,0)");
      ctx.fillStyle = e.sprite === "sample" ? "#fff6c8" : "#c58bff";
      ctx.beginPath();
      ctx.arc(x, y, 12 * (1 - p * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
};
