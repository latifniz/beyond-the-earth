/* =====================================================================
   FILE: js/drawing/props_objects.js
   WHAT IT DOES: Draws the special objects of the missions: the Pakistan flag
   (folded, open, waving), the big Mars crater with its lake, the broken rover,
   the equipment table with the camera, the battery and the spare part.
   BELONGS TO: Moon, Mars and Venus levels.
   WHAT TO CHANGE: colors and shapes. Same drawing rule as props.js: (x, y) is the
   bottom-center on the screen and "size" is the on-screen size.
   ===================================================================== */

// ===== PAKISTAN FLAG =====

// Draw the flag picture once on a hidden canvas, then reuse it (faster than redrawing).
Game.props.getFlagTexture = function () {
  if (Game.props.flagTexture) { return Game.props.flagTexture; }
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 200;
  const c = canvas.getContext("2d");
  c.fillStyle = "#01411c";                  // dark green field
  c.fillRect(0, 0, 300, 200);
  c.fillStyle = "#ffffff";                  // white stripe on the pole side (1/4 of the flag)
  c.fillRect(0, 0, 75, 200);
  c.fillStyle = "#ffffff";                  // crescent: a white circle with a green circle cut out
  c.beginPath(); c.arc(185, 102, 52, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#01411c";
  c.beginPath(); c.arc(205, 92, 44, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffffff";                  // five-pointed star
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? 24 : 10;
    const angle = -Math.PI / 2 + i * Math.PI / 5 + 0.3;
    c.lineTo(232 + Math.cos(angle) * radius, 70 + Math.sin(angle) * radius);
  }
  c.closePath(); c.fill();
  Game.props.flagTexture = canvas;
  return canvas;
};

// Draw the cloth as thin vertical strips; each strip moves up and down a little = waving.
// poleX, poleTopY = where the cloth is attached; openAmount: 0 = folded, 1 = fully open.
Game.props.drawFlagCloth = function (ctx, poleX, poleTopY, width, openAmount, waveAmount, time) {
  const texture = Game.props.getFlagTexture();
  const height = width * 2 / 3;
  const drawWidth = Math.max(2, width * openAmount);
  const strips = 24;
  for (let i = 0; i < strips; i++) {
    const t = i / strips;
    const wave = Math.sin(time * 5 - t * 6) * waveAmount * t * height * 0.12;
    ctx.drawImage(texture, t * 300, 0, 300 / strips + 1, 200,
      poleX + t * drawWidth, poleTopY + wave, drawWidth / strips + 1, height);
  }
};

// The flag on its pole. item: { openAmount, waveAmount, tilt }. y = where the pole touches the ground.
Game.props.draw.flag = function (ctx, x, y, size, item, palette, time) {
  const poleHeight = size * 1.3;
  Game.props.shadow(ctx, x, y, size * 0.5, size * 0.06, 0.25);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(item.tilt || 0);
  ctx.fillStyle = "#e8e8f2";
  ctx.fillRect(-size * 0.02, -poleHeight, size * 0.04, poleHeight);
  ctx.fillStyle = "#ffe27a";
  ctx.beginPath(); ctx.arc(0, -poleHeight, size * 0.035, 0, Math.PI * 2); ctx.fill();
  Game.props.drawFlagCloth(ctx, size * 0.02, -poleHeight + size * 0.02, size * 0.75, item.openAmount === undefined ? 1 : item.openAmount,
    item.waveAmount === undefined ? 1 : item.waveAmount, time);
  ctx.restore();
};

// A small folded flag (a rolled-up bundle) - attached to the backpack or held in the hand.
Game.props.drawFoldedFlag = function (ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.25);
  ctx.fillStyle = "#01411c";
  ctx.fillRect(-size * 0.5, -size * 0.12, size, size * 0.24);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-size * 0.5, -size * 0.12, size * 0.28, size * 0.24);
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.strokeRect(-size * 0.5, -size * 0.12, size, size * 0.24);
  ctx.restore();
};

// ===== MARS: BIG CRATER WITH A HIDDEN LAKE =====
Game.props.draw.bigCrater = function (ctx, x, y, size, item, palette, time) {
  const w = size * 3;
  const h = size * 0.7;
  ctx.fillStyle = "#6e2f1c";                                   // outer rim
  ctx.beginPath(); ctx.ellipse(x, y - h * 0.45, w / 2 * 1.08, h / 2 * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  const bowl = ctx.createLinearGradient(x, y - h, x, y);
  bowl.addColorStop(0, "#2a0f0a");
  bowl.addColorStop(1, "#8a4426");
  ctx.fillStyle = bowl;
  ctx.beginPath(); ctx.ellipse(x, y - h * 0.4, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
  if (item.showLake) {
    ctx.fillStyle = "rgba(70,150,230,0.85)";
    ctx.beginPath(); ctx.ellipse(x, y - h * 0.32, w * 0.36, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
};

// ===== MARS: THE INACTIVE ROVER / SPACECRAFT =====
// item.power: 0 = dead (dark lights), 1 = active. item.liftOff: how far it has flown up (0 to 1).
Game.props.draw.rover = function (ctx, x, y, size, item, palette, time) {
  const lift = (item.liftOff || 0);
  const flyY = y - lift * lift * 900 * (size / 160);
  const u = size / 100;
  if (lift === 0) { Game.props.shadow(ctx, x, y, size * 0.7, size * 0.1, 0.3); }
  ctx.save();
  ctx.translate(x + Math.sin(time * 40) * (item.shake || 0) * u, flyY);
  ctx.globalAlpha = Math.max(0, 1 - lift * 0.9);
  if (lift > 0) {                                              // rocket flame when flying away
    ctx.save(); ctx.translate(0, -2 * u);
    Game.spacecraft.drawFlame(ctx, 90 * u * lift + 30 * u, 36 * u, time);
    ctx.restore();
  }
  // wheels
  ctx.fillStyle = "#26242e";
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath(); ctx.arc(i * 42 * u, -12 * u, 12 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6f6c7c"; ctx.beginPath(); ctx.arc(i * 42 * u, -12 * u, 5 * u, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#26242e";
  }
  // body
  const body = ctx.createLinearGradient(0, -70 * u, 0, -14 * u);
  body.addColorStop(0, "#e9e6f2"); body.addColorStop(1, "#a9a4bd");
  ctx.fillStyle = body;
  Game.astronaut.roundRect(ctx, -52 * u, -62 * u, 104 * u, 44 * u, 10 * u); ctx.fill();
  // solar panel
  ctx.fillStyle = "#26357a";
  ctx.fillRect(-48 * u, -78 * u, 96 * u, 14 * u);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 1; i < 4; i++) { ctx.fillRect(-48 * u + i * 24 * u, -78 * u, 1.5 * u, 14 * u); }
  // window and lights (they glow when power is on)
  ctx.fillStyle = item.power > 0 ? "#7fe0ff" : "#2c3250";
  ctx.beginPath(); ctx.arc(-20 * u, -42 * u, 10 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = item.power > 0 ? "#3dff8a" : "#5a2a2a";
  ctx.beginPath(); ctx.arc(22 * u, -44 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = item.power > 0.5 ? "#ffd84a" : "#4a3a2a";
  ctx.beginPath(); ctx.arc(36 * u, -44 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
  // antenna
  ctx.strokeStyle = "#c8c4d8"; ctx.lineWidth = 2 * u;
  ctx.beginPath(); ctx.moveTo(30 * u, -78 * u); ctx.lineTo(34 * u, -100 * u); ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
};

// ===== VENUS: EQUIPMENT TABLE WITH A CAMERA =====
Game.props.draw.table = function (ctx, x, y, size, item, palette, time) {
  const u = size / 100;
  Game.props.shadow(ctx, x, y, size * 0.6, size * 0.08, 0.2);
  ctx.fillStyle = "#6b5a8c";                                   // legs
  ctx.fillRect(x - 44 * u, y - 50 * u, 6 * u, 50 * u);
  ctx.fillRect(x + 38 * u, y - 50 * u, 6 * u, 50 * u);
  ctx.fillStyle = "#9b86c8";                                   // table top
  Game.astronaut.roundRect(ctx, x - 52 * u, y - 58 * u, 104 * u, 10 * u, 4 * u); ctx.fill();
  if (!item.cameraTaken) {
    ctx.fillStyle = "#2b2b3a";                                 // camera body
    Game.astronaut.roundRect(ctx, x - 14 * u, y - 80 * u, 36 * u, 22 * u, 4 * u); ctx.fill();
    ctx.fillStyle = "#12121c"; ctx.beginPath(); ctx.arc(x + 4 * u, y - 69 * u, 8 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6fb8ff"; ctx.beginPath(); ctx.arc(x + 4 * u, y - 69 * u, 4 * u, 0, Math.PI * 2); ctx.fill();
    Game.terrain.drawGlow(ctx, x + 4 * u, y - 69 * u, 40 * u * (0.8 + 0.2 * Math.sin(time * 3)), "rgba(255,255,255,0.45)", "rgba(255,255,255,0)");
  }
  ctx.fillStyle = "#c9b8f0";                                   // small equipment box
  ctx.fillRect(x - 40 * u, y - 70 * u, 18 * u, 12 * u);
};

// ===== MARS: BATTERY and SPARE PART (collectibles) =====
Game.props.draw.battery = function (ctx, x, y, size, item, palette, time) {
  const u = size / 100;
  const lift = Math.sin(time * 2 + item.z) * 4 * u;
  Game.props.shadow(ctx, x, y, size * 0.3, size * 0.05, 0.3);
  Game.terrain.drawGlow(ctx, x, y - 40 * u + lift, 70 * u * (0.85 + 0.15 * Math.sin(time * 3)), "rgba(120,255,160,0.6)", "rgba(120,255,160,0)");
  ctx.fillStyle = "#2a2f3c"; Game.astronaut.roundRect(ctx, x - 20 * u, y - 70 * u + lift, 40 * u, 56 * u, 6 * u); ctx.fill();
  ctx.fillStyle = "#3dff8a"; ctx.fillRect(x - 14 * u, y - 60 * u + lift, 28 * u, 36 * u);
  ctx.fillStyle = "#9aa0b4"; ctx.fillRect(x - 8 * u, y - 76 * u + lift, 16 * u, 7 * u);
  ctx.fillStyle = "#12351f"; ctx.beginPath();                  // lightning bolt
  ctx.moveTo(x + 3 * u, y - 58 * u + lift); ctx.lineTo(x - 8 * u, y - 42 * u + lift); ctx.lineTo(x - 1 * u, y - 42 * u + lift);
  ctx.lineTo(x - 4 * u, y - 28 * u + lift); ctx.lineTo(x + 8 * u, y - 46 * u + lift); ctx.lineTo(x + 1 * u, y - 46 * u + lift); ctx.closePath(); ctx.fill();
};
Game.props.draw.part = function (ctx, x, y, size, item, palette, time) {
  const u = size / 100;
  const lift = Math.sin(time * 2 + item.z) * 4 * u;
  Game.props.shadow(ctx, x, y, size * 0.3, size * 0.05, 0.3);
  Game.terrain.drawGlow(ctx, x, y - 38 * u + lift, 70 * u * (0.85 + 0.15 * Math.sin(time * 3 + 1)), "rgba(255,210,120,0.6)", "rgba(255,210,120,0)");
  ctx.save(); ctx.translate(x, y - 38 * u + lift); ctx.rotate(time * 0.6);   // a turning gear
  ctx.fillStyle = "#c8ccd8";
  for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-5 * u, -26 * u, 10 * u, 10 * u); }
  ctx.beginPath(); ctx.arc(0, 0, 20 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#555a6e"; ctx.beginPath(); ctx.arc(0, 0, 8 * u, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};

// ===== MARS: THE SHELTER (a rocky cave opening with a warm light inside) =====
// It looks different from ordinary rocks: big red rock arch, dark opening with a warm glow,
// two blinking lamps, a sign and a glowing amber light column so it can be seen from far away.
Game.props.draw.shelter = function (ctx, x, y, size, item, palette, time) {
  const u = size / 100;
  Game.props.shadow(ctx, x, y, 140 * u, 12 * u, 0.3);
  Game.props.drawBeacon(ctx, x, y - 70 * u, size * 1.1, "rgba(255,190,80,", time);

  ctx.save();
  ctx.translate(x, y);
  // the big rock mass: a lumpy dome
  ctx.beginPath();
  ctx.moveTo(-130 * u, 0);
  for (let i = 0; i <= 12; i++) {
    const angle = Math.PI + (i / 12) * Math.PI;
    const bump = 0.86 + Game.terrain.hash(i, 77) * 0.2;
    ctx.lineTo(Math.cos(angle) * 130 * u * bump, Math.sin(angle) * 118 * u * bump);
  }
  ctx.lineTo(130 * u, 0);
  ctx.closePath();
  const rock = ctx.createLinearGradient(-110 * u, -118 * u, 110 * u, 0);
  rock.addColorStop(0, "#d48a55"); rock.addColorStop(0.55, "#9b522c"); rock.addColorStop(1, "#5a2a16");
  ctx.fillStyle = rock; ctx.fill();
  ctx.strokeStyle = "rgba(40,10,0,0.35)"; ctx.lineWidth = 2 * u; ctx.stroke();
  // cracks
  ctx.strokeStyle = "rgba(255,225,190,0.18)"; ctx.lineWidth = 1.5 * u;
  ctx.beginPath(); ctx.moveTo(-70 * u, -60 * u); ctx.lineTo(-48 * u, -92 * u); ctx.moveTo(60 * u, -70 * u); ctx.lineTo(82 * u, -42 * u); ctx.stroke();

  // the cave opening: dark, with a warm light on the floor
  ctx.beginPath();
  ctx.moveTo(-40 * u, 0); ctx.lineTo(-40 * u, -42 * u);
  ctx.quadraticCurveTo(-40 * u, -80 * u, 0, -80 * u);
  ctx.quadraticCurveTo(40 * u, -80 * u, 40 * u, -42 * u);
  ctx.lineTo(40 * u, 0); ctx.closePath();
  const cave = ctx.createLinearGradient(0, -80 * u, 0, 0);
  cave.addColorStop(0, "#1a0b06"); cave.addColorStop(0.6, "#3a1a0c"); cave.addColorStop(1, "#ffcf7a");
  ctx.fillStyle = cave; ctx.fill();
  ctx.strokeStyle = "#f0b27a"; ctx.lineWidth = 3 * u; ctx.stroke();      // bright rim

  // two blinking lamps beside the opening
  for (let side = -1; side <= 1; side += 2) {
    const on = Math.sin(time * 5 + side) > 0;
    ctx.fillStyle = on ? "#ffd24a" : "#7a5a1a";
    ctx.beginPath(); ctx.arc(side * 52 * u, -34 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
  }
  // the sign
  ctx.font = "700 " + Math.max(11, 15 * u) + 'px "Montserrat", sans-serif';
  ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(40,10,0,0.85)"; ctx.fillStyle = "#ffe29a";
  ctx.strokeText("SHELTER", 0, -92 * u); ctx.fillText("SHELTER", 0, -92 * u);
  ctx.restore();
};
