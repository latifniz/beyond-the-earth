/* =====================================================================
   FILE: js/drawing/props_rover.js
   WHAT IT DOES: Draws the things of Moon mission 3 (the lunar rover trip):
     - the LUNAR ROVER, seen from behind (parked, or with the astronaut sitting in it)
     - the glowing SCAN MARKER on the ground (blue ring + light beam, green when scanned)
     - the RESEARCH STATION (a dome with two modules and an antenna)
   BELONGS TO: Moon level (js/levels/moon.js and js/levels/rover.js use these).
   HOW IT WORKS: like props.js, every function is   draw(ctx, x, y, size, item, palette, time)
     x, y = bottom-center of the thing on the ground, size = how big on screen.
     "u" below = size / 100, so all numbers are in "percent of the size".
   WHAT TO CHANGE: colors and shapes. The sizes of the rover are in data/config.js (rover).
   ===================================================================== */

// ===== THE LUNAR ROVER (seen from behind) =====
// options: seat (0 to 1: how much the seated astronaut is visible), wheel (turning wheels),
//          scan (0 to 1: the scanner arm goes up), light (astronaut lighting), time,
//          glow (true = glowing beacon, used when it is a mission goal)
Game.props.drawRover = function (ctx, x, y, size, options) {
  const u = size / 100;
  const time = options.time || 0;
  Game.props.shadow(ctx, x, y + 2, 66 * u, 9 * u, 0.38);

  if (options.glow) { Game.props.drawBeacon(ctx, x, y, size * 1.2, "rgba(120,220,255,", time); }

  ctx.save();
  ctx.translate(x, y);

  // 1) the two rear wheels: dark tires with stripes that move when the wheels turn
  for (let side = -1; side <= 1; side += 2) {
    const wheelX = side * 54 * u;
    ctx.save();
    ctx.beginPath();
    Game.astronaut.roundRect(ctx, wheelX - 8 * u, -38 * u, 16 * u, 38 * u, 5 * u);
    ctx.clip();
    ctx.fillStyle = "#23222b";
    ctx.fillRect(wheelX - 9 * u, -38 * u, 18 * u, 38 * u);
    ctx.fillStyle = "#4a4958";
    const spacing = 8 * u;
    const shift = ((options.wheel || 0) * spacing) % spacing;
    for (let stripe = -1; stripe < 6; stripe++) {
      ctx.fillRect(wheelX - 9 * u, -38 * u + stripe * spacing + shift, 18 * u, 2.4 * u);
    }
    ctx.restore();
    ctx.fillStyle = "#8d90a3";                              // metal mudguard over the wheel
    Game.astronaut.roundRect(ctx, wheelX - 10 * u, -42 * u, 20 * u, 5 * u, 2 * u); ctx.fill();
  }

  // 2) the seat back (behind the astronaut)
  ctx.fillStyle = "#3a3b4d";
  Game.astronaut.roundRect(ctx, -17 * u, -58 * u, 34 * u, 30 * u, 5 * u); ctx.fill();

  // 3) the astronaut sitting in the seat (only the top half is visible: the body covers the legs)
  if (options.seat > 0) {
    ctx.save();
    ctx.globalAlpha *= options.seat;
    Game.astronaut.draw(ctx, {
      suit: Game.save.data.suit, view: "back", x: 0, feetY: -10 * u, height: 80 * u, flip: false,
      walkPhase: 0, moving: false, time: time, lean: 0, light: options.light
    });
    ctx.restore();
  }

  // 4) the antenna mast with a dish (left) and a blinking light
  ctx.strokeStyle = "#c8c4d8"; ctx.lineWidth = 2.2 * u;
  ctx.beginPath(); ctx.moveTo(-40 * u, -34 * u); ctx.lineTo(-40 * u, -96 * u); ctx.stroke();
  ctx.fillStyle = "#e9e6f2";
  ctx.beginPath(); ctx.ellipse(-40 * u, -98 * u, 15 * u, 6 * u, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#9a97ad"; ctx.lineWidth = 1 * u; ctx.stroke();
  ctx.fillStyle = Math.sin(time * 6) > 0 ? "#ff5b5b" : "#6a2c2c";
  ctx.beginPath(); ctx.arc(-40 * u, -104 * u, 2.6 * u, 0, Math.PI * 2); ctx.fill();

  // 5) the scanner arm (right): goes up while scanning, with a spinning blue lamp
  const scan = options.scan || 0;
  if (scan > 0) {
    const armTop = -52 * u - 46 * u * scan;
    ctx.strokeStyle = "#c8c4d8"; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.moveTo(40 * u, -34 * u); ctx.lineTo(40 * u, armTop); ctx.stroke();
    Game.terrain.drawGlow(ctx, 40 * u, armTop, 26 * u, "rgba(120,230,255,0.9)", "rgba(120,230,255,0)");
    ctx.fillStyle = "#bff3ff";
    ctx.beginPath(); ctx.arc(40 * u, armTop, 5 * u, 0, Math.PI * 2); ctx.fill();
  }

  // 6) the chassis body in FRONT of the astronaut's legs: metal tray, battery box, tail lights
  const body = ctx.createLinearGradient(0, -36 * u, 0, -12 * u);
  body.addColorStop(0, "#d6d8e2"); body.addColorStop(1, "#8b8fa2");
  ctx.fillStyle = body;
  Game.astronaut.roundRect(ctx, -47 * u, -36 * u, 94 * u, 24 * u, 6 * u); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";                 // shiny line on top
  ctx.fillRect(-42 * u, -34 * u, 84 * u, 2.4 * u);
  ctx.fillStyle = "#4b4e63";                                // battery box
  Game.astronaut.roundRect(ctx, 14 * u, -31 * u, 26 * u, 14 * u, 3 * u); ctx.fill();
  ctx.fillStyle = "#3dff8a"; ctx.fillRect(18 * u, -27 * u, 8 * u, 5 * u);
  ctx.fillStyle = "#ff3b4a";                                // red tail lights
  ctx.fillRect(-44 * u, -26 * u, 6 * u, 5 * u);
  ctx.fillRect(38 * u, -26 * u, 6 * u, 5 * u);

  // 7) the label above a rover that is a mission goal
  if (options.glow) {
    ctx.font = "700 " + Math.max(11, 15 * u) + 'px "Montserrat", sans-serif';
    ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(10,10,40,0.8)";
    ctx.fillStyle = "#bff3ff";
    ctx.strokeText("ROVER", 0, -122 * u + Math.sin(time * 3) * 3 * u);
    ctx.fillText("ROVER", 0, -122 * u + Math.sin(time * 3) * 3 * u);
  }
  ctx.restore();
};

// A tall soft column of light (so the goal can be seen from far away).
// colorStart is the first part of an rgba color, for example "rgba(120,220,255,".
Game.props.drawBeacon = function (ctx, x, y, height, colorStart, time) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 3);
  const beam = ctx.createLinearGradient(0, y - height * 1.6, 0, y);
  beam.addColorStop(0, colorStart + "0)");
  beam.addColorStop(1, colorStart + (0.5 * pulse) + ")");
  ctx.fillStyle = beam;
  ctx.fillRect(x - height * 0.07, y - height * 1.6, height * 0.14, height * 1.6);
};

// ===== THE PARKED ROVER (a standing object in the world) =====
Game.props.draw.moonRover = function (ctx, x, y, size, item, palette, time) {
  Game.props.drawRover(ctx, x, y, size, {
    seat: item.seat || 0, wheel: 0, scan: 0, time: time, glow: item.isMark, light: Game.level ? Game.level.planet.light : null
  });
};

// ===== THE SCAN MARKER (flat on the ground): blue ring + light beam; green after scanning =====
// item.scanning: 0 to 1 while the scan runs (a bright line sweeps across the ring); item.done = true after.
Game.props.draw.scanPoint = function (ctx, x, y, size, item, palette, time) {
  const pulse = 1 + 0.08 * Math.sin(time * 4);
  const done = item.done;
  const rgb = done ? "90,255,150" : "120,220,255";
  const rx = size * 1.1 * pulse;
  const ry = rx * 0.28;
  Game.props.drawBeacon(ctx, x, y, size * 1.1, "rgba(" + rgb + ",", time);
  ctx.fillStyle = "rgba(" + rgb + ",0.20)";
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(" + rgb + ",0.95)";
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
  if (item.scanning > 0 && item.scanning < 1) {                       // the sweeping scan line
    const sweepX = x - rx + rx * 2 * item.scanning;
    ctx.fillStyle = "rgba(220,250,255,0.85)";
    ctx.fillRect(sweepX - 2, y - ry, 4, ry * 2);
  }
};

// ===== THE RESEARCH STATION: a dome, two modules, a solar panel and an antenna =====
Game.props.draw.station = function (ctx, x, y, size, item, palette, time) {
  const u = size / 100;
  Game.props.shadow(ctx, x, y, 100 * u, 10 * u, 0.3);
  ctx.save();
  ctx.translate(x, y);
  // two side modules (cylinders seen from the front)
  for (let side = -1; side <= 1; side += 2) {
    const grad = ctx.createLinearGradient(0, -52 * u, 0, 0);
    grad.addColorStop(0, "#f1f2f8"); grad.addColorStop(1, "#a7abbd");
    ctx.fillStyle = grad;
    Game.astronaut.roundRect(ctx, side * 62 * u - 24 * u, -50 * u, 48 * u, 50 * u, 12 * u); ctx.fill();
    ctx.fillStyle = "#3b4a7a";                                       // round window
    ctx.beginPath(); ctx.arc(side * 62 * u, -30 * u, 9 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(160,220,255,0.55)";
    ctx.beginPath(); ctx.arc(side * 62 * u - 2 * u, -32 * u, 4 * u, 0, Math.PI * 2); ctx.fill();
  }
  // the big dome in the middle
  const dome = ctx.createLinearGradient(-40 * u, -80 * u, 40 * u, 0);
  dome.addColorStop(0, "#ffffff"); dome.addColorStop(1, "#aeb2c6");
  ctx.fillStyle = dome;
  ctx.beginPath(); ctx.arc(0, 0, 46 * u, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(60,70,110,0.35)"; ctx.lineWidth = 1.2 * u;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.arc(0, 0, 46 * u * i / 4, Math.PI, 0); ctx.stroke(); }
  // glowing door
  Game.terrain.drawGlow(ctx, 0, -14 * u, 34 * u, "rgba(255,230,150,0.8)", "rgba(255,230,150,0)");
  ctx.fillStyle = "#ffe9a6";
  Game.astronaut.roundRect(ctx, -9 * u, -26 * u, 18 * u, 26 * u, 8 * u); ctx.fill();
  // antenna with a blinking light, and a solar panel
  ctx.strokeStyle = "#d8d6e6"; ctx.lineWidth = 2.4 * u;
  ctx.beginPath(); ctx.moveTo(18 * u, -44 * u); ctx.lineTo(18 * u, -92 * u); ctx.stroke();
  ctx.fillStyle = Math.sin(time * 5) > 0 ? "#ff5b5b" : "#6a2c2c";
  ctx.beginPath(); ctx.arc(18 * u, -95 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26357a";
  ctx.fillRect(-92 * u, -72 * u, 38 * u, 4 * u);
  ctx.fillRect(-92 * u, -66 * u, 38 * u, 4 * u);
  ctx.restore();
};
