/* =====================================================================
   FILE: js/levels/venus.js
   WHAT IT DOES: Describes the VENUS level: bright yellow-orange sky, a very bright
   Sun, cloud "ground", lightning in the sky, the spray from her shoes, the cloud
   samples (mission 1), the camera table (mission 2) and "Send to Earth".
   The camera mini-game itself is in venus_camera.js.
   BELONGS TO: screen "level" when the planet is Venus.
   WHAT TO CHANGE: colors in "palette", places of samples/table, lightning timing.
   ===================================================================== */

Game.planets.venus = {
  key: "venus",
  title: Game.text.planets.venus.title,
  subtitle: Game.text.planets.venus.subtitle,
  horizonY: 340,
  finish: "send",

  // REAL-LOOKING PICTURES (see js/drawing/realistic.js): hazy sky with the first cloud banks, and cloud ground.
  backdrop: { image: "assets/images/backdrops/venus-sky.jpg", scale: 1.55, panRange: 70 },
  groundTexture: { name: "venus-ground", tileSize: 620, fog: "rgb(203,176,102)", fogMid: "rgba(203,176,102,0.45)" },
  light: { tint: "rgba(255,215,120,0.15)", sun: "rgba(255,245,200,0.2)", shade: "rgba(140,90,20,0.22)", ground: "rgba(210,160,70,0.3)" },
  grade: "rgba(255,200,80,0.05)",
  vignette: 0.3,
  spray: true,          // white spray from the shoes (see walker.js)

  palette: {
    sky: ["#a18b58", "#b99b5c", "#cdb06c", "#d8bb78"],
    stars: false,
    groundFar: "#fff1c4", groundMid: "#fbdc8e", groundNear: "#efbd55",
    band: "rgba(255,255,255,0.14)", haze: "rgba(255,246,210,0.55)",
    rockLight: "#fff3cf", rockDark: "#e2b55a",
    craterRim: "#fff1c4", craterDark: "#e6b95a", craterLight: "#f7d684",
    hills: [      // far cloud banks
      { color: "#ffe9a6", height: 26, amplitude: 36, parallax: 0.03, seed: 3.1 },
      { color: "#ffe08c", height: 4, amplitude: 28, parallax: 0.07, seed: 6.2 },
      { color: "#fdd678", height: -3, amplitude: 14, parallax: 0.12, seed: 1.7 }
    ],
    perCell: 2,        // fewer puffs: the ground picture already shows the clouds
    decor: [
      { type: "cloud", weight: 10, min: 120, max: 340 }
    ]
  },

  setup: function (level) {
    level.table = { type: "table", x: 40, z: 2350, size: 190, cameraTaken: false, id: "table" };
    level.objects.push(level.table);
    level.nextLightning = 2;
    level.lightning = null;
    level.sprayShown = false;
    level.sprayOn = false;
  },

  // Very bright Sun, soft cloud streaks and yellow lightning in the sky.
  drawSky: function (ctx, level, hasBackdrop) {
    // a very bright Sun glowing through the haze
    Game.terrain.drawGlow(ctx, 640, 120, 560, hasBackdrop ? "rgba(255,250,225,0.8)" : "rgba(255,255,240,0.95)", "rgba(255,230,120,0)");
    ctx.fillStyle = "#fffef4";
    ctx.beginPath(); ctx.arc(640, 120, 46, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < (hasBackdrop ? 0 : 7); i++) {      // drifting cloud streaks (only needed when there is no sky picture)          // warm yellow cloud streaks that drift
      const x = ((i * 233 + level.time * 6 - level.worldX * 0.05) % 1600 + 1600) % 1600 - 160;
      ctx.fillStyle = "rgba(255,240,170,0.35)";
      ctx.beginPath(); ctx.ellipse(x, 60 + (i * 37) % 180, 170, 18 + (i % 3) * 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    Game.planets.venus.drawLightning(ctx, level);
  },

  // Lightning bolts appear every few seconds (just for looks and mood).
  drawLightning: function (ctx, level) {
    if (!level.lightning && level.time > level.nextLightning) {
      level.lightning = { x: 200 + Math.random() * 880, age: 0, seed: Math.random() * 100 };
      level.nextLightning = level.time + 3 + Math.random() * 4;
      if (Math.random() < 0.6) { Game.audio.play("crackle"); }
    }
    const bolt = level.lightning;
    if (!bolt) { return; }
    bolt.age += 0.016;
    if (bolt.age > 0.5) { level.lightning = null; return; }
    const alpha = 1 - bolt.age / 0.5;
    ctx.strokeStyle = "rgba(255,255,150," + alpha + ")";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ffe94a"; ctx.shadowBlur = 24;
    ctx.beginPath();
    let x = bolt.x, y = 20;
    ctx.moveTo(x, y);
    for (let i = 0; i < 7; i++) { x += (Game.terrain.hash(bolt.seed, i) - 0.5) * 70; y += 38; ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.shadowBlur = 0;
  },

  // First time she walks: spray + explanation pop-up.
  onUpdate: function (level) {
    if (!level.sprayShown && level.speedZ > 30) {
      level.sprayShown = true;
      level.sprayOn = true;
      Game.audio.play("hiss");
      Game.hud.showPopup(Game.text.planets.venus.sprayTitle, Game.text.planets.venus.sprayText, Game.text.travel.ok, function () {});
    }
  },

  missions: [
    {
      text: Game.text.planets.venus.mission1,
      stages: [{
        kind: "collect", id: "sample", label: Game.text.level.samplesLabel,
        hint: Game.text.planets.venus.hintSamples,
        items: [
          { type: "sample", x: -140, z: 760, size: 120 },
          { type: "sample", x: 30, z: 880, size: 120 },
          { type: "sample", x: 190, z: 770, size: 120 }
        ]
      }]
    },
    {
      text: Game.text.planets.venus.mission2,
      stages: [{
        kind: "act", id: "camera", mark: "ring",
        hint: Game.text.planets.venus.hintTable,
        message: Game.text.planets.venus.tableMessage,
        button: Game.text.planets.venus.takeCamera,
        place: function () { return { x: 40, z: 2190 }; },
        run: function (level, done) { Game.planets.venus.takeCameraScene(level, done); }
      }]
    }
  ],

  // ===== CUTSCENE: take the camera, raise it, then the camera mini-game =====
  takeCameraScene: function (level, done) {
    const mix = Game.cutscene.mix;
    Game.cutscene.play(level, [
      { time: 1.2,    // She takes the camera from the table.
        enter: function (lv) { lv.table.cameraTaken = true; lv.hand = { type: "camera", raise: 0 }; Game.audio.play("collect"); },
        update: function (lv, p) { lv.pose.armRight = mix(0, -1.2, p); } },
      { time: 1.4,    // She raises it and looks toward the yellow clouds.
        update: function (lv, p) { lv.hand.raise = p; lv.pose.armRight = mix(-1.2, -2.6, p); lv.pose.lean = -0.03 * p; } }
    ], function () {
      level.blocked = true;
      Game.venusCamera.start(level, function () { level.blocked = false; level.hand = null; done(); });
    });
  },

  // ===== "SEND TO EARTH": a beam of light goes up to the sky =====
  sendToEarth: function (level, done) {
    Game.audio.play("send");
    level.blocked = true;
    const start = level.time;
    level.planet.drawOverlay = function (ctx, lv) {
      const p = Math.min(1, (lv.time - start) / 2.6);
      ctx.fillStyle = "rgba(255,255,255," + (0.6 * (1 - p)) + ")";
      ctx.fillRect(610 + p * 20, 0, 60 - p * 40, 640 * (1 - p * 0.3));
      ctx.font = "700 42px Fredoka One, sans-serif"; ctx.textAlign = "center";
      ctx.globalAlpha = Math.sin(Math.min(1, p) * Math.PI);
      ctx.fillStyle = "rgba(60,20,120,0.8)";                      // dark pill so the white text can be read
      Game.astronaut.roundRect(ctx, 400, 205, 480, 66, 33); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(Game.text.level.dataSent, 640, 252);
      ctx.globalAlpha = 1; ctx.textAlign = "left";
    };
    setTimeout(function () { level.planet.drawOverlay = null; level.blocked = false; done(); }, 2800);
  }
};
