/* =====================================================================
   FILE: js/levels/rover.js
   WHAT IT DOES: Everything about driving the LUNAR ROVER in Moon mission 3:
     - Game.rover.enter  : cutscene, the astronaut hops into the rover
     - Game.rover.update : while driving: turn the wheels and make dust
     - Game.rover.drawDriving : draws the rover (with the astronaut inside) instead of the walker
     - Game.rover.scan   : cutscene, the scanner arm goes up and scans the marker
     - Game.rover.exit   : cutscene, the astronaut hops out and stands beside the rover
   BELONGS TO: Moon level (the steps are used by the stages in js/levels/moon.js).
   HOW DRIVING WORKS: nothing new! The camera still follows level.worldX / worldZ,
     exactly as when walking. While level.driving is true:
       - walker.js uses the faster rover speeds from data/config.js,
       - walker.js calls drawDriving() (this file) instead of drawing the walker,
       - the arrow keys / buttons steer the rover the same way they move the astronaut.
   WHAT TO CHANGE: speeds and size are in data/config.js (rover).
   ===================================================================== */

Game.rover = {};

// ===== ENTER THE ROVER (cutscene) =====
// The parked rover is the marker object of the current stage (level.stage.mark).
Game.rover.enter = function (level, done) {
  const mix = Game.cutscene.mix;
  const parked = level.stage.mark;
  let startX = 0, startZ = 0;

  Game.cutscene.play(level, [
    { time: 1.3,    // 0. She walks to the back of the rover.
      enter: function (lv) { startX = lv.worldX; startZ = lv.worldZ; lv.cutscene.autoMove = true; lv.pose.walking = true; },
      update: function (lv, p) { lv.worldX = mix(startX, parked.x, p); lv.worldZ = mix(startZ, parked.z - 80, p); lv.speedX = 0; lv.speedZ = 0; lv.walkPhase += 0.25; },
      exit: function (lv) { lv.pose.walking = false; startZ = lv.worldZ; } },
    { time: 1.4,    // 1. She hops up. The seated astronaut slowly appears in the seat.
      enter: function () { Game.audio.play("whoosh"); },
      update: function (lv, p) {
        lv.hopLift = Math.sin(p * Math.PI) * 90;
        lv.worldZ = mix(startZ, parked.z, p);
        lv.playerAlpha = 1 - Game.cutscene.clamp01((p - 0.55) / 0.35);
        parked.seat = Game.cutscene.clamp01((p - 0.45) / 0.55);
      },
      exit: function (lv) {
        // The parked rover becomes "the player": same place, same size, so nothing jumps.
        lv.hopLift = 0; lv.playerAlpha = 1;
        parked.hidden = true;
        lv.worldX = parked.x; lv.worldZ = parked.z;
        lv.driving = true;
        lv.roverState = { wheel: 0, scan: 0, dustTimer: 0 };
        Game.audio.play("thud");
      } },
    { time: 1.0,    // 2. A short pause: "you are in the driver's seat".
      enter: function () { Game.audio.play("powerup"); } }
  ], done);
};

// ===== EXIT THE ROVER (cutscene) =====
Game.rover.exit = function (level, done) {
  const mix = Game.cutscene.mix;
  const parked = { type: "moonRover", x: level.worldX, z: level.worldZ + 4, size: Game.config.rover.size, id: "parkedrover", seat: 1 };
  let startX = 0;

  Game.cutscene.play(level, [
    { time: 1.3,    // 0. The astronaut hops out of the seat. The parked rover stays where it is.
      enter: function (lv) {
        level.objects.push(parked);
        lv.driving = false; lv.playerAlpha = 0; lv.speedX = 0; lv.speedZ = 0;
        Game.audio.play("hiss");
      },
      update: function (lv, p) {
        lv.hopLift = Math.sin(p * Math.PI) * 90;
        lv.playerAlpha = Game.cutscene.clamp01(p / 0.45);
        parked.seat = 1 - Game.cutscene.clamp01(p / 0.5);
      },
      exit: function (lv) { lv.hopLift = 0; lv.playerAlpha = 1; parked.seat = 0; startX = lv.worldX; Game.audio.play("thud"); } },
    { time: 1.1,    // 1. She walks a few steps to the left and stands beside the rover.
      enter: function (lv) { lv.cutscene.autoMove = true; lv.pose.walking = true; lv.pose.flip = true; },
      update: function (lv, p) { lv.worldX = mix(startX, startX - 190, p); lv.speedX = 0; lv.speedZ = 0; lv.walkPhase += 0.25; },
      exit: function (lv) { lv.pose.walking = false; lv.cutscene.autoMove = false; } },
    { time: 0.8 }   // 2. She stands beside the rover. (a short pause)
  ], done);
};

// ===== SCAN (cutscene) =====
// The scanner arm goes up, a blue sweep runs over the marker, the marker turns green, a message appears.
Game.rover.scan = function (level, message, done) {
  const mark = level.stage.mark;
  const state = level.roverState;
  Game.cutscene.play(level, [
    { time: 0.6,    // 0. The scanner arm rises.
      enter: function () { Game.audio.play("scan"); },
      update: function (lv, p) { state.scan = p; } },
    { time: 2.0,    // 1. The scan: a bright line sweeps over the marker.
      update: function (lv, p) { mark.scanning = p; } },
    { time: 0.6,    // 2. Finished! The marker turns green and the arm goes down.
      enter: function () { mark.scanning = 0; mark.done = true; Game.showToast(message); Game.audio.play("success"); },
      update: function (lv, p) { state.scan = 1 - p; } }
  ], done);
};

// ===== EVERY FRAME while driving =====
Game.rover.update = function (level, dt) {
  if (!level.driving || !level.roverState) { return; }
  const state = level.roverState;
  const speed = Math.abs(level.speedZ) + Math.abs(level.speedX) * 0.5;

  // The wheels turn faster when the rover goes faster.
  state.wheel += level.speedZ * dt * 0.05;

  // Moon dust behind the wheels.
  state.dustTimer -= dt;
  if (speed > 150 && state.dustTimer <= 0) {
    Game.effects.addDust(level, 640 + (Math.random() * 2 - 1) * 70, Game.walker.groundLine);
    state.dustTimer = 0.09;
  }
};

// ===== DRAW THE ROVER AS THE PLAYER =====
Game.rover.drawDriving = function (ctx, level) {
  const state = level.roverState;
  const size = Game.config.rover.size;
  const ground = Game.walker.groundLine;
  const bounce = level.isMoving ? Math.sin(level.time * 14) * 1.2 : 0;       // tiny shaking while driving

  // The rover leans a little into the turn.
  ctx.save();
  ctx.translate(640, ground);
  ctx.rotate(level.speedX / Game.config.rover.sideSpeed * 0.05);
  Game.props.drawRover(ctx, 0, bounce, size, {
    seat: 1, wheel: state.wheel, scan: state.scan, time: level.time, light: level.planet.light
  });
  ctx.restore();

  if (state.scan > 0) { Game.rover.drawScanBeam(ctx, level, size); }
};

// A blue beam from the scanner arm to the marker on the ground.
Game.rover.drawScanBeam = function (ctx, level, size) {
  const mark = level.stage && level.stage.mark;
  if (!mark || mark.screenX === undefined || !mark.scanning) { return; }
  const u = size / 100;
  const fromX = 640 + 40 * u;
  const fromY = Game.walker.groundLine - (52 + 46 * level.roverState.scan) * u;
  const toX = mark.screenX;
  const toY = mark.screenY;
  const wide = mark.screenSize * 0.9;
  ctx.fillStyle = "rgba(120,230,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX - wide, toY);
  ctx.lineTo(toX + wide, toY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(200,250,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
};
