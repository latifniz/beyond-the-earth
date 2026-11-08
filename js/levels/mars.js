/* =====================================================================
   FILE: js/levels/mars.js
   WHAT IT DOES: Describes the MARS level: rusty sky, red ground, a big crater far
   away with a hidden lake (mission 1) and a broken spacecraft that the player
   repairs with a battery and a spare part (mission 2).
   BELONGS TO: screen "level" when the planet is Mars.
   WHAT TO CHANGE: colors in "palette"; places of crater / parts / spacecraft in
   "setup" and "missions"; the lake picture in drawLake().
   ===================================================================== */

Game.planets.mars = {
  key: "mars",
  title: Game.text.planets.mars.title,
  subtitle: Game.text.planets.mars.subtitle,
  horizonY: 300,
  finish: "popup",

  // REAL-LOOKING PICTURES (see js/drawing/realistic.js). The little planet in the sky is cut from the painting.
  backdrop: { image: "assets/images/backdrops/mars-sky.png", scale: 1.0, panRange: 14,
    sprites: [{ image: "assets/images/backdrops/mars-sky-planet.png", x: 930, y: 130, size: 120, parallax: 0.35 }] },
  groundTexture: { name: "mars-ground", tileSize: 520, fog: "rgb(212,126,76)", fogMid: "rgba(212,126,76,0.4)" },
  light: { tint: "rgba(255,150,90,0.12)", sun: "rgba(255,210,160,0.22)", shade: "rgba(90,30,10,0.30)", ground: "rgba(150,70,30,0.35)" },
  grade: "rgba(255,140,60,0.04)",
  vignette: 0.32,

  palette: {
    sky: ["#c26238", "#d97e48", "#ee9f5e", "#f4b97c"],     // rusty, dusty, pinkish-orange haze
    stars: false,
    groundFar: "#d29567", groundMid: "#b06a3c", groundNear: "#7a3b1e",
    band: "rgba(60,15,0,0.07)", haze: "rgba(255,205,160,0.4)",
    rockLight: "#c4713f", rockDark: "#612c18",
    craterRim: "#d9a070", craterDark: "#6b3018", craterLight: "#a8613a",
    hills: [
      { color: "#b46c52", height: 30, amplitude: 60, parallax: 0.03, seed: 2.4 },
      { color: "#a15a3e", height: 6, amplitude: 42, parallax: 0.07, seed: 5.9 },
      { color: "#8a4a30", height: -2, amplitude: 20, parallax: 0.12, seed: 9.1 }
    ],
    decor: [
      { type: "rock", weight: 6, min: 70, max: 230 },
      { type: "dust", weight: 3, min: 100, max: 260 },
      { type: "pebbles", weight: 4, min: 30, max: 70 },
      { type: "crater", weight: 1, min: 80, max: 200 }
    ]
  },

  // A small pale sun, hazy light.
  drawSky: function (ctx, level, hasBackdrop) {
    Game.terrain.drawGlow(ctx, 330 - level.worldX * 0.02, 120, 260, "rgba(255,240,215,0.85)", "rgba(255,210,170,0)");
    ctx.fillStyle = "rgba(255,246,228,0.95)";
    ctx.beginPath(); ctx.arc(330 - level.worldX * 0.02, 120, 22, 0, Math.PI * 2); ctx.fill();
  },

  // Dusty haze drifts over everything near the bottom.
  drawOverlay: function (ctx, level) {
    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, "rgba(230,140,100,0.08)");
    grad.addColorStop(1, "rgba(120,50,20,0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    Game.storm.draw(ctx, level);              // the dust storm of mission 3 (nothing before the mission starts)
  },

  // Runs every frame: moves the dust of the storm.
  onUpdate: function (level, dt) { Game.storm.update(level, dt); },

  // Place the big crater and the broken spacecraft in the world when the level starts.
  setup: function (level) {
    level.crater = { type: "bigCrater", x: -120, z: 1800, size: 360, showLake: false, id: "crater" };
    level.rover = { type: "rover", x: 190, z: 2900, size: 240, power: 0, liftOff: 0, shake: 0, id: "rover" };
    level.objects.push(level.crater);
    level.objects.push(level.rover);
  },

  missions: [
    {
      text: Game.text.planets.mars.mission1,
      stages: [{
        kind: "act", id: "lake", mark: "ring", keepMark: false,
        hint: Game.text.planets.mars.hintCrater,
        message: Game.text.planets.mars.craterMessage,
        button: Game.text.level.interact,
        place: function () { return { x: -120, z: 1440 }; },
        run: function (level, done) { Game.planets.mars.showLake(level, done); }
      }]
    },
    {
      text: Game.text.planets.mars.mission2,
      stages: [
        {
          kind: "collect", id: "part", label: Game.text.level.partsLabel,
          hint: Game.text.planets.mars.hintParts,
          items: [
            { type: "battery", x: -190, z: 2420, size: 110 },
            { type: "part", x: 250, z: 2620, size: 110 }
          ]
        },
        {
          kind: "act", id: "repair", mark: "ring",
          hint: Game.text.planets.mars.hintRepair,
          message: Game.text.planets.mars.repairMessage,
          button: Game.text.planets.mars.activate,
          radius: 230,
          place: function () { return { x: 10, z: 2760 }; },
          run: function (level, done) { Game.planets.mars.repairAndLaunch(level, done); }
        }
      ]
    },
    {
      // MISSION 3: a dust storm is coming. Walk to the shelter and press E. (see js/levels/storm.js)
      text: Game.text.planets.mars.mission3,
      stages: [{
        kind: "act", id: "shelter", mark: "ring", radius: 190,
        hint: Game.text.planets.mars.hintShelter,
        message: Game.text.planets.mars.shelterMessage,
        button: Game.text.planets.mars.enterShelter,
        prepare: function (level) { Game.storm.start(level); },
        // The shelter is far ahead, a little to the side.
        place: function (level) { return { x: level.worldX + 120, z: level.worldZ + 3600 }; },
        scenery: function (level, place) { Game.storm.placeShelter(level, place); },
        run: function (level, done) { Game.storm.enterShelter(level, done); }
      }]
    }
  ],

  // ===== MISSION 1: THE HIDDEN LAKE (a full-screen picture with text) =====
  showLake: function (level, done) {
    level.blocked = true;
    level.crater.showLake = true;
    Game.audio.play("success");
    document.getElementById("lake-text").textContent = Game.text.planets.mars.lakeText;
    document.getElementById("lake-view").classList.remove("hidden");
    const started = performance.now();
    const canvas = document.getElementById("lake-canvas");
    function frame(now) {
      if (document.getElementById("lake-view").classList.contains("hidden")) { return; }
      Game.planets.mars.drawLake(canvas.getContext("2d"), (now - started) / 1000);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // Close after 5.5 seconds (or when the player clicks), then go back to the astronaut.
    let closed = false;
    function close() {
      if (closed) { return; }
      closed = true;
      document.getElementById("lake-view").classList.add("hidden");
      document.getElementById("lake-view").onclick = null;
      level.blocked = false;
      done();
    }
    setTimeout(close, 5500);
    setTimeout(function () { document.getElementById("lake-view").onclick = close; }, 1500);
  },

  // Paint the lake: sky, far rim, blue water with moving sparkles.
  drawLake: function (ctx, seconds) {
    const sky = ctx.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, "#8d4a58"); sky.addColorStop(1, "#f0b184");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#6b3220";                                  // far crater rim
    ctx.beginPath(); ctx.moveTo(0, 340);
    for (let x = 0; x <= 1280; x += 20) { ctx.lineTo(x, 330 - Math.sin(x / 90) * 18 - Math.sin(x / 33) * 8); }
    ctx.lineTo(1280, 420); ctx.lineTo(0, 420); ctx.fill();
    const water = ctx.createLinearGradient(0, 380, 0, 720);     // the water
    water.addColorStop(0, "#74c2ff"); water.addColorStop(1, "#0f4f9c");
    ctx.fillStyle = water; ctx.fillRect(0, 380, 1280, 340);
    for (let i = 0; i < 70; i++) {                               // sparkles
      const x = (i * 97) % 1280;
      const y = 400 + ((i * 53) % 300);
      const a = 0.3 + 0.5 * Math.sin(seconds * 2 + i);
      ctx.fillStyle = "rgba(255,255,255," + Math.max(0, a) + ")";
      ctx.fillRect(x + Math.sin(seconds + i) * 10, y, 26 + (i % 5) * 8, 2);
    }
    ctx.fillStyle = "rgba(0,0,0,0.18)";                         // dark edges (vignette)
    ctx.fillRect(0, 0, 1280, 60); ctx.fillRect(0, 660, 1280, 60);
  },

  // ===== MISSION 2 CUTSCENE: ACTIVATE AND LAUNCH THE SPACECRAFT =====
  repairAndLaunch: function (level, done) {
    const rover = level.rover;
    const mix = Game.cutscene.mix;
    Game.cutscene.play(level, [
      { time: 1.4,   // She puts the battery and the part into the spacecraft.
        update: function (lv, p) { lv.pose.lean = 0.08 * Math.sin(p * Math.PI); rover.power = mix(0, 0.5, p); },
        exit: function () { Game.audio.play("collect"); } },
      { time: 1.8,   // The spacecraft wakes up: lights on, it shakes.
        enter: function () { Game.audio.play("powerup"); },
        update: function (lv, p) { rover.power = mix(0.5, 1, p); rover.shake = mix(0, 2.2, p); } },
      { time: 3.2,   // It lifts off and flies away.
        enter: function () { Game.audio.play("launch"); },
        update: function (lv, p) { rover.liftOff = p; rover.shake = mix(2.2, 0.5, p); },
        exit: function () { rover.hidden = true; } },
      { time: 0.8 }
    ], done);
  }
};
