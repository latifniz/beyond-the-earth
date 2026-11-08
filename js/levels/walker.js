/* =====================================================================
   FILE: js/levels/walker.js
   WHAT IT DOES: The WALKING ENGINE shared by Moon, Mars and Venus: movement with
   smooth speed, low-gravity jumping, the 2.5D "worldToScreen" idea, drawing the
   whole level every frame, and the level screen itself.
   BELONGS TO: screen "level" (all planets).
   WHAT TO CHANGE: speeds and gravity are NOT here: they are in data/config.js.

   ===== THE BIG IDEA: worldToScreen (how a flat ground looks 3D) =====
   The astronaut always stays at the bottom-center of the screen. The WORLD moves.
   Every object has a place in the world: x (left-right) and z (how far ahead).

         horizon  ------------------------------   <- far things are HIGH and SMALL
                      . tree (far)
                          o rock (middle)
         ground line ---- [astronaut] ---------   <- near things are LOW and BIG

   distance ahead  = object.z - worldZ
   scale (size)    = focal / (focal + distance)      (1 when distance = 0, smaller when far)
   screen y        = horizon + (groundLine - horizon) * scale
   screen x        = center + (object.x - worldX) * scale
   We draw FAR objects first and NEAR objects last, so near ones cover far ones.
   ===================================================================== */

Game.walker = { groundLine: 620, astronautHeight: 235 };

// ===== THE 3D TRICK =====
// Convert a world place (x, z) into a screen place (x, y) and a size multiplier.
Game.walker.worldToScreen = function (level, x, z) {
  const focal = Game.config.focalLength;
  const distance = Math.max(z - level.worldZ, -focal + 40);     // never divide by zero
  const scale = focal / (focal + distance);
  return {
    x: 640 + (x - level.worldX) * scale,
    y: level.horizonY + (Game.walker.groundLine - level.horizonY) * scale,
    scale: scale
  };
};

// ===== CREATE A NEW LEVEL =====
Game.walker.newLevel = function (planet) {
  return {
    planet: planet, horizonY: planet.horizonY, time: 0,
    worldX: 0, worldZ: 0, speedX: 0, speedZ: 0,
    height: 0, velocityY: 0,                // height above the ground when jumping
    walkPhase: 0, lastStepSide: 0, facingLeft: false,
    input: { left: false, right: false, forward: false, back: false },
    frozen: false, cutscene: null, pose: null, hand: null, carryingFlag: false,
    driving: false, roverState: null, blockers: [], collideDecor: false, hopLift: 0, playerAlpha: 1,       // rocks she cannot cross, rover and hop animations (see rover.js)
    objects: [], cells: {}, effects: [], skyStars: null
  };
};

// Move a number toward a target by at most "amount".
Game.walker.approach = function (value, target, amount) {
  if (value < target) { return Math.min(target, value + amount); }
  return Math.max(target, value - amount);
};

// ===== MOVEMENT (runs every frame; dt = seconds since last frame) =====
Game.walker.update = function (level, dt) {
  const cfg = Game.config;
  level.time += dt;
  level.frozen = !!level.cutscene || Game.hud.isPopupOpen() || !!level.blocked;
  Game.cutscene.update(level, dt);

  // Where do we WANT to go? (0 when frozen)
  let wantZ = 0;
  let wantX = 0;
  if (!level.frozen) {
    const forwardSpeed = level.driving ? cfg.rover.speed : cfg.walkSpeed;       // the rover is faster than walking
    const sideSpeed = level.driving ? cfg.rover.sideSpeed : cfg.sideSpeed;
    if (level.input.forward) { wantZ += forwardSpeed; }
    if (level.input.back) { wantZ -= forwardSpeed * 0.85; }
    if (level.input.right) { wantX += sideSpeed; }
    if (level.input.left) { wantX -= sideSpeed; }
  }
  // Speed eases toward the wish: accelerate when pressing, friction when letting go.
  level.speedZ = Game.walker.approach(level.speedZ, wantZ, (wantZ === 0 ? cfg.friction : cfg.acceleration) * dt);
  level.speedX = Game.walker.approach(level.speedX, wantX, (wantX === 0 ? cfg.friction : cfg.acceleration) * dt);
  if (!level.cutscene || !level.cutscene.autoMove) {
    level.worldZ += level.speedZ * dt;
    level.worldX += level.speedX * dt;
  }
  if (level.speedX < -20) { level.facingLeft = true; }
  if (level.speedX > 20) { level.facingLeft = false; }

  Game.walker.updateJump(level, dt);
  Game.walker.updateWalkCycle(level, dt);
  Game.walker.bump(level, dt);                   // rocks she cannot walk through
  Game.rover.update(level, dt);                  // wheels and dust (only when driving)
  if (level.planet.onUpdate) { level.planet.onUpdate(level, dt); }
  Game.missions.update(level);
  Game.effects.update(level, dt);
  Game.world.forgetOldCells(level);
};

// ===== ROCKS SHE CANNOT WALK THROUGH =====
// level.blockers is a list of circles on the ground: { x, z, radius }. Missions put rocks in it.
// If level.collideDecor is true, the ordinary rocks of the ground (world.js) block her too.
// When she is inside a circle, she is pushed back out. The same code works for the walking
// astronaut and for the rover (the rover is wider: see config.js).
Game.walker.bump = function (level, dt) {
  level.bumpTimer = (level.bumpTimer || 0) - dt;
  if (level.cutscene) { return; }
  const circles = level.blockers.slice();
  if (level.collideDecor) {
    const cellX = Math.floor(level.worldX / Game.world.cellWidth);
    const cellZ = Math.floor(level.worldZ / Game.world.cellDepth);
    for (let cx = cellX - 1; cx <= cellX + 1; cx++) {
      for (let cz = cellZ - 1; cz <= cellZ + 1; cz++) {
        const items = Game.world.getCell(level, cx, cz);
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === "rock") { circles.push({ x: items[i].x, z: items[i].z, radius: items[i].size * 0.36 }); }
        }
      }
    }
  }
  const reach = level.driving ? Game.config.rover.bodyRadius : Game.config.walkerRadius;
  for (let i = 0; i < circles.length; i++) {
    const rock = circles[i];
    const dx = level.worldX - rock.x;
    const dz = level.worldZ - rock.z;
    const distance = Math.sqrt(dx * dx + dz * dz) || 0.01;
    const minimum = rock.radius + reach;
    if (distance < minimum) {
      level.worldX = rock.x + dx / distance * minimum;       // push her out of the rock
      level.worldZ = rock.z + dz / distance * minimum;
      level.speedZ *= 0.5; level.speedX *= 0.5;
      if (level.bumpTimer <= 0 && level.driving) { Game.audio.play("thud"); level.bumpTimer = 0.6; }
    }
  }
};

// ===== LOW-GRAVITY JUMP =====
// Each frame: height goes up by velocityY, and gravity pulls velocityY down.
// A SMALLER gravity pulls less, so she keeps rising longer and falls slower.
// That is why the Moon (gravity 380) feels floaty and Venus (900) feels normal.
Game.walker.startJump = function (level) {
  if (level.frozen || level.height > 0 || level.driving) { return; }     // a rover cannot jump
  level.velocityY = Game.config.jump[level.planet.key].jumpSpeed;
  level.height = 0.01;
  Game.audio.play("whoosh");
};

Game.walker.updateJump = function (level, dt) {
  if (level.height <= 0) { return; }
  const gravity = Game.config.jump[level.planet.key].gravity;
  level.velocityY -= gravity * dt;
  level.height += level.velocityY * dt;
  if (level.height <= 0) {                       // she touched the ground again
    level.height = 0;
    level.velocityY = 0;
    Game.audio.play("thud");
    Game.effects.addDust(level, 640, Game.walker.groundLine);
  }
};

// ===== WALK CYCLE and FOOTSTEPS =====
Game.walker.updateWalkCycle = function (level, dt) {
  const speed = Math.abs(level.speedZ) + Math.abs(level.speedX);
  level.isMoving = speed > 25 && level.height === 0;
  if (speed > 25) { level.walkPhase += speed * dt * 0.032; }
  const side = Math.sin(level.walkPhase) > 0 ? 1 : -1;
  if (level.isMoving && !level.driving && side !== level.lastStepSide) {         // each time a foot lands
    level.lastStepSide = side;
    Game.audio.play("step");
  }
  // Venus: white spray from the shoes while walking on clouds
  if (level.planet.spray && level.sprayOn && level.isMoving && Math.random() < 0.8) {
    Game.effects.addSpray(level, 640 + (side * 14), Game.walker.groundLine - 4);
  }
};

// Which picture does she show? front when still, back when going forward, side when going sideways.
Game.walker.chooseView = function (level) {
  if (level.pose) { return level.pose.view; }
  if (Math.abs(level.speedX) > 40 && Math.abs(level.speedZ) < 60) { return "side"; }
  if (level.speedZ > 20) { return "back"; }
  if (level.speedZ < -20) { return "front"; }
  return "front";
};

// ===== DRAW THE ASTRONAUT =====
Game.walker.drawPlayer = function (ctx, level) {
  if (level.driving) { Game.rover.drawDriving(ctx, level); return; }     // she is sitting in the rover
  const ground = Game.walker.groundLine;
  const pose = level.pose;
  // Shadow on the ground: smaller and fainter the higher she is.
  const shrink = Math.max(0.35, 1 - level.height / 520);
  // The Sun is on the LEFT, so her shadow falls a little to the RIGHT.
  Game.props.shadow(ctx, 662, ground + 4, 58 * shrink, 12 * shrink, 0.42 * shrink);

  const jumpLift = level.height + level.hopLift;        // hopLift = the hop into / out of the rover
  const info = { x: 640, feetY: ground - jumpLift, height: Game.walker.astronautHeight };
  const view = Game.walker.chooseView(level);
  ctx.save();
  ctx.globalAlpha *= level.playerAlpha;                 // fades while she climbs into the rover
  if (pose && pose.squash !== 1) {              // bending down: squash the body a little
    ctx.translate(0, ground);
    ctx.scale(1, pose.squash);
    ctx.translate(0, -ground);
  }
  Game.astronaut.draw(ctx, {
    suit: Game.save.data.suit, view: view, x: info.x, feetY: info.feetY, height: info.height,
    flip: pose ? pose.flip : level.facingLeft, walkPhase: level.walkPhase,
    moving: level.isMoving || (pose && pose.walking), time: level.time,
    lean: (pose ? pose.lean : level.speedX / Game.config.sideSpeed * 0.05) + (level.height > 0 ? -0.04 : 0),
    armRight: pose && pose.armRight !== undefined ? pose.armRight : null,
    armLeft: pose && pose.armLeft !== undefined ? pose.armLeft : null,
    light: level.planet.light            // colors of this planet's light (so she looks like she belongs there)
  });
  Game.cutscene.drawCarried(ctx, level, info);
  ctx.restore();
};

// ===== DRAW THE WHOLE LEVEL (back to front) =====
Game.walker.render = function (ctx, level) {
  const palette = level.planet.palette;
  Game.terrain.drawSky(ctx, palette, level.horizonY);
  // 1) Sky and far mountains: a real-looking picture if we have one, otherwise the drawn version.
  const hasBackdrop = Game.realistic.drawBackdrop(ctx, level);
  if (!hasBackdrop) {
    if (palette.stars) { Game.terrain.drawStars(ctx, level, level.horizonY); }
    for (let i = 0; i < palette.hills.length; i++) {
      Game.terrain.drawHills(ctx, palette.hills[i], level.worldX, level.horizonY);
    }
  }
  if (level.planet.drawSky) { level.planet.drawSky(ctx, level, hasBackdrop); }
  // 2) Ground: real ground picture in perspective, otherwise the drawn gradient ground.
  if (!Game.realistic.drawGround(ctx, level)) { Game.terrain.drawGround(ctx, level, palette); }
  // 3) Everything standing on the ground, far to near, with the astronaut in the right place.
  Game.world.drawAll(ctx, level);
  Game.effects.draw(ctx, level);
  Game.walker.drawPointers(ctx, level);
  if (level.planet.drawOverlay) { level.planet.drawOverlay(ctx, level); }
  Game.realistic.drawGrade(ctx, level);
};

// ===== GOAL POINTERS: a bouncing arrow above the next goal, or an edge arrow if it is off-screen =====
Game.walker.drawPointers = function (ctx, level) {
  if (level.frozen || Game.hud.isInteractVisible()) { return; }       // no arrow when she is already at the goal
  const targets = Game.missions.currentTargets(level);
  let nearest = null;
  for (let i = 0; i < targets.length; i++) {
    if (!nearest || Math.abs(targets[i].z - level.worldZ) < Math.abs(nearest.z - level.worldZ)) { nearest = targets[i]; }
  }
  if (!nearest) { return; }
  const spot = Game.walker.worldToScreen(level, nearest.x, nearest.z);
  const behind = nearest.z < level.worldZ - 40;
  const bounce = Math.sin(level.time * 5) * 7;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "rgba(120,40,200,0.9)";
  ctx.lineWidth = 2;
  if (!behind && spot.x > 70 && spot.x < 1210) {
    const topY = spot.y - (nearest.size || 120) * spot.scale - 16 + bounce;     // arrow pointing down at the goal
    ctx.beginPath();
    ctx.moveTo(spot.x, topY);
    ctx.lineTo(spot.x - 12, topY - 18);
    ctx.lineTo(spot.x + 12, topY - 18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else {
    const side = (behind ? spot.x : spot.x) < 640 ? -1 : 1;                      // arrow at the screen edge
    const edgeX = side < 0 ? 52 : 1228;
    const y = Math.max(150, Math.min(560, spot.y));
    ctx.beginPath();
    ctx.moveTo(edgeX + side * 16, y);
    ctx.lineTo(edgeX - side * 12, y - 18);
    ctx.lineTo(edgeX - side * 12, y + 18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
};

// ===== THE LEVEL SCREEN =====
Game.screens.level = { running: false, lastTime: 0 };

Game.screens.level.onShow = function (params) {
  const planet = Game.planets[params.planet || Game.chosenPlanet];
  Game.chosenPlanet = planet.key;
  const level = Game.walker.newLevel(planet);
  Game.level = level;
  if (planet.setup) { planet.setup(level); }
  Game.hud.setup(planet);
  Game.missions.start(level);
  Game.screens.level.running = true;
  Game.screens.level.lastTime = performance.now();
  requestAnimationFrame(Game.screens.level.frame);
};

Game.screens.level.onHide = function () {
  Game.screens.level.running = false;
  Game.audio.stopEngine();
};

// The game loop: update the world, then draw it. ~60 times per second.
Game.screens.level.frame = function (now) {
  const screen = Game.screens.level;
  if (!screen.running) { return; }
  const dt = Math.min(0.05, (now - screen.lastTime) / 1000);
  screen.lastTime = now;
  const ctx = document.getElementById("level-canvas").getContext("2d");
  Game.walker.update(Game.level, dt);
  Game.walker.render(ctx, Game.level);
  requestAnimationFrame(screen.frame);
};
