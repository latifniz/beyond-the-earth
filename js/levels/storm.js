/* =====================================================================
   FILE: js/levels/storm.js
   WHAT IT DOES: The DUST STORM of Mars mission 3 "Find shelter":
     - the storm slowly gets stronger (more dust, less to see, a rusty tint)
     - messages from the Control Centre and a warning bar at the top-left
     - the rocks and the shelter that are placed in the world
     - the short cutscene when she walks into the shelter, and the completion pop-up
   BELONGS TO: Mars level (js/levels/mars.js calls these functions).
   HOW IT WORKS: level.storm holds the storm: time, intensity (0 = calm, 1 = strongest)
     and the flying dust particles. update() runs every frame, draw() paints the dust
     on top of the level (mars.js calls it from drawOverlay).
     The storm never hurts her: it only makes it harder to see. So the mission
     is always possible. Walking, jumping and bumping into rocks are the normal ones
     from walker.js.
   WHAT TO CHANGE: how fast the storm grows: Game.config.storm.rampSeconds (data/config.js).
     The messages: Game.text.planets.mars.stormWarnings (data/text.js).
   ===================================================================== */

Game.storm = { maxParticles: 260 };

// ===== START THE STORM (called when mission 3 begins) =====
Game.storm.start = function (level) {
  level.collideDecor = true;                   // the ordinary rocks on the ground now block her too
  level.storm = { time: 0, intensity: 0.08, particles: [], spawn: 0, nextWarning: 0, paused: false, calm: false, safe: 0 };
  Game.hud.showStorm("", 0.08);
};

// ===== EVERY FRAME =====
Game.storm.update = function (level, dt) {
  const storm = level.storm;
  if (!storm || storm.paused) { return; }

  if (storm.calm) {
    storm.intensity = Math.max(0, storm.intensity - dt * 0.8);           // the storm fades away
    if (storm.intensity === 0 && storm.particles.length === 0) { storm.paused = true; }
  } else {
    storm.time += dt;
    const target = Math.min(1, 0.08 + storm.time / Game.config.storm.rampSeconds * 0.92);
    storm.intensity += (target - storm.intensity) * Math.min(1, dt * 2);   // grows smoothly
    Game.storm.showWarnings(storm);
  }
  Game.hud.setStorm("", storm.intensity);
  Game.storm.moveDust(storm, dt);
};

// Show the next message from the Control Centre when its time has come.
Game.storm.showWarnings = function (storm) {
  const warnings = Game.text.planets.mars.stormWarnings;
  const next = warnings[storm.nextWarning];
  if (next && storm.time >= next.at) {
    Game.hud.setStorm(next.label, storm.intensity);
    Game.showToast(next.message);
    storm.nextWarning++;
  }
};

// Make new dust grains at the right edge and blow them to the left.
Game.storm.moveDust = function (storm, dt) {
  if (!storm.calm) {
    storm.spawn += (15 + 250 * storm.intensity) * dt;             // more dust when the storm is stronger
    while (storm.spawn >= 1 && storm.particles.length < Game.storm.maxParticles) {
      storm.spawn -= 1;
      storm.particles.push({
        x: 1300 + Math.random() * 120, y: 70 + Math.random() * 650,
        speed: (420 + Math.random() * 520) * (0.6 + storm.intensity),
        drift: Math.random() * 70 - 15, length: 18 + Math.random() * 60,
        alpha: 0.2 + Math.random() * 0.45, width: 1 + Math.random() * 2.4
      });
    }
    storm.spawn = Math.min(storm.spawn, 1);
  }
  for (let i = storm.particles.length - 1; i >= 0; i--) {
    const grain = storm.particles[i];
    grain.x -= grain.speed * dt;
    grain.y += grain.drift * dt;
    if (grain.x < -120) { storm.particles.splice(i, 1); }
  }
};

// ===== DRAW THE STORM on top of the level =====
Game.storm.draw = function (ctx, level) {
  const storm = level.storm;
  if (!storm) { return; }
  const strength = storm.intensity;

  if (strength > 0.005) {
    // 1) a rusty tint over the whole picture: the background changes a little as the storm grows
    ctx.fillStyle = "rgba(205,115,65," + (0.38 * strength) + ")";
    ctx.fillRect(0, 0, 1280, 720);
    // 2) less visibility: the dust is thicker toward the edges; the middle stays clear longer
    const clearRadius = Math.max(260, 600 - 340 * strength);
    const fog = ctx.createRadialGradient(640, 470, clearRadius * 0.5, 640, 470, clearRadius + 480);
    fog.addColorStop(0, "rgba(175,100,58,0)");
    fog.addColorStop(1, "rgba(175,100,58," + (0.55 * strength) + ")");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, 1280, 720);
  }

  // 3) the flying dust
  ctx.lineCap = "round";
  for (let i = 0; i < storm.particles.length; i++) {
    const grain = storm.particles[i];
    ctx.strokeStyle = "rgba(240,180,125," + grain.alpha + ")";
    ctx.lineWidth = grain.width;
    ctx.beginPath(); ctx.moveTo(grain.x, grain.y); ctx.lineTo(grain.x + grain.length, grain.y - grain.length * 0.06); ctx.stroke();
  }

  // 4) inside the shelter: the screen gets dark and warm, and "SAFE!" appears
  if (storm.safe > 0) {
    ctx.fillStyle = "rgba(25,8,3," + (0.62 * storm.safe) + ")";
    ctx.fillRect(0, 0, 1280, 720);
    const glow = ctx.createRadialGradient(640, 430, 20, 640, 430, 420);
    glow.addColorStop(0, "rgba(255,205,125," + (0.35 * storm.safe) + ")");
    glow.addColorStop(1, "rgba(255,205,125,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.globalAlpha = Math.min(1, storm.safe * 1.4);
    ctx.font = '72px "Fredoka One", sans-serif'; ctx.textAlign = "center";
    ctx.lineWidth = 8; ctx.strokeStyle = "rgba(60,20,0,0.8)"; ctx.fillStyle = "#ffe9a6";
    ctx.strokeText(Game.text.planets.mars.safeText, 640, 300);
    ctx.fillText(Game.text.planets.mars.safeText, 640, 300);
    ctx.globalAlpha = 1;
  }
};

// ===== THE WORLD OF MISSION 3: boulders on the way, the shelter and the rocks around it =====
// Everything is placed relative to where she stands when the mission starts.
// Rocks that block her are also written into level.blockers.
Game.storm.placeShelter = function (level, place) {
  const startX = level.worldX;
  const startZ = level.worldZ;
  function boulder(x, z, size, seed) {
    level.objects.push({ type: "rock", x: x, z: z, size: size, seed: seed, id: "boulder" + seed });
    level.blockers.push({ x: x, z: z, radius: size * 0.4 });
  }
  // Boulders on the way. She can always walk around them.
  boulder(startX - 110, startZ + 900, 210, 81);
  boulder(startX + 170, startZ + 1500, 230, 82);
  boulder(startX - 40, startZ + 2100, 210, 83);
  boulder(place.x - 40, startZ + 2800, 220, 84);

  // The shelter: a big rock arch. The two rocks beside it make a way in, and she walks between them.
  level.shelter = { type: "shelter", x: place.x, z: place.z + 90, size: 190, id: "shelter" };
  level.objects.push(level.shelter);
  boulder(place.x - 300, place.z + 40, 240, 85);
  boulder(place.x + 310, place.z + 60, 250, 86);
};

// ===== SHE WALKS INTO THE SHELTER (cutscene), then the completion pop-up =====
Game.storm.enterShelter = function (level, done) {
  const text = Game.text.planets.mars;
  const shelter = level.shelter;
  const storm = level.storm;
  const mix = Game.cutscene.mix;
  let startX = 0, startZ = 0;

  Game.cutscene.play(level, [
    { time: 1.6,    // 0. She walks into the opening and disappears into the dark.
      enter: function (lv) { startX = lv.worldX; startZ = lv.worldZ; lv.cutscene.autoMove = true; lv.pose.walking = true; },
      update: function (lv, p) {
        lv.worldX = mix(startX, shelter.x, p); lv.worldZ = mix(startZ, shelter.z - 10, p);
        lv.speedX = 0; lv.speedZ = 0; lv.walkPhase += 0.25;
        lv.playerAlpha = 1 - Game.cutscene.clamp01((p - 0.45) / 0.5);
      },
      exit: function (lv) { lv.pose.walking = false; lv.cutscene.autoMove = false; lv.playerAlpha = 0; Game.audio.play("thud"); } },
    { time: 1.2,    // 1. Inside: the screen gets dark and warm. "SAFE!" and the storm starts to calm down.
      enter: function () { storm.calm = true; Game.audio.play("success"); },
      update: function (lv, p) { storm.safe = p; } },
    { time: 1.5,    // 2. The storm is gone. She comes back to the opening and stands there.
      update: function (lv, p) { storm.safe = 1 - p * 0.8; lv.playerAlpha = Game.cutscene.clamp01((p - 0.4) / 0.5); },
      exit: function (lv) { lv.playerAlpha = 1; storm.safe = 0; } }
  ], function () {
    // The mission-completed pop-up: message + fact about Martian dust storms + Continue.
    level.collideDecor = false;
    Game.hud.hideStorm();
    Game.hud.showPopup(text.doneTitle, text.doneText + "\n\n" + text.dustFact, text.continueButton, done);
  });
};
