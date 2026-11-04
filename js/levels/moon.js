/* =====================================================================
   FILE: js/levels/moon.js
   WHAT IT DOES: Describes the MOON level: colors, sky (Sun in the left corner,
   Earth in the sky), the two missions (3 stones, plant the flag) and the
   flag-planting cutscene. Walking, jumping and missions are done by
   walker.js and missions.js, so this file only says what is DIFFERENT.
   BELONGS TO: screen "level" when the planet is the Moon.
   WHAT TO CHANGE: colors in "palette", stone places in "items", the cutscene steps.
   ===================================================================== */

Game.planets.moon = {
  key: "moon",
  title: Game.text.planets.moon.title,
  subtitle: Game.text.planets.moon.subtitle,
  horizonY: 335,
  finish: "popup",

  // REAL-LOOKING PICTURES (see js/drawing/realistic.js). The backdrop already contains the Sun, the Earth and the hills.
  backdrop: { image: "assets/images/backdrops/moon-sky.jpg", scale: 0.85, panRange: 60 },
  groundTexture: { name: "moon-ground", tileSize: 450, fog: "rgb(104,99,102)", fogMid: "rgba(104,99,102,0.45)" },
  // The colors of the light on the astronaut (the Sun is on the left on the Moon).
  light: { tint: "rgba(150,170,230,0.07)", sun: "rgba(255,238,210,0.24)", shade: "rgba(10,10,40,0.30)", ground: "rgba(60,55,60,0.28)" },
  vignette: 0.38,

  // ----- colors and decorations -----
  palette: {
    sky: ["#0a090c", "#16151a"],
    stars: true,
    groundFar: "#8a8a94", groundMid: "#6f6f79", groundNear: "#4a4a53",
    band: "rgba(0,0,0,0.07)", haze: "rgba(190,190,210,0.28)",
    rockLight: "#b9afa7", rockDark: "#5a534e",
    craterRim: "#a2a2ac", craterDark: "#41414b", craterLight: "#7d7d88",
    hills: [
      { color: "#3d3d49", height: 34, amplitude: 70, parallax: 0.03, seed: 1.2 },
      { color: "#525260", height: 8, amplitude: 46, parallax: 0.07, seed: 4.6 },
      { color: "#6c6c7a", height: -2, amplitude: 22, parallax: 0.12, seed: 8.3 }
    ],
    decor: [
      { type: "rock", weight: 5, min: 45, max: 170 },
      { type: "crater", weight: 1, min: 70, max: 200 },
      { type: "pebbles", weight: 4, min: 30, max: 70 }
    ]
  },

  // Sun partly visible in the LEFT CORNER, and the Earth in the sky.
  drawSky: function (ctx, level, hasBackdrop) {
    if (hasBackdrop) { return; }          // the picture already has the Sun and the Earth
    Game.terrain.drawSunRays(ctx, -30, 150, 520, level.time);
    Game.terrain.drawGlow(ctx, -30, 150, 330, "rgba(255,240,200,0.95)", "rgba(255,200,120,0)");
    ctx.fillStyle = "#fffbe8";
    ctx.beginPath(); ctx.arc(-30, 150, 58, 0, Math.PI * 2); ctx.fill();
    const earthX = 850 - level.worldX * 0.02;                // far away: moves very little
    Game.terrain.drawGlow(ctx, earthX, 118, 120, "rgba(110,170,255,0.35)", "rgba(110,170,255,0)");
    Game.terrain.drawPlanetPicture(ctx, "earth", earthX, 118, 72);
  },

  // ----- the two missions -----
  missions: [
    {
      text: Game.text.planets.moon.mission1,
      stages: [{
        kind: "collect", id: "stone", label: Game.text.level.stonesLabel,
        hint: Game.text.planets.moon.hintStones,
        items: [
          { type: "stone", x: -110, z: 440, size: 180 },
          { type: "stone", x: 150, z: 860, size: 180 },
          { type: "stone", x: -70, z: 1290, size: 180 }
        ]
      }]
    },
    {
      text: Game.text.planets.moon.mission2,
      stages: [{
        kind: "act", id: "flag", mark: "redDot",
        hint: Game.text.planets.moon.hintFlag,
        message: Game.text.planets.moon.flagMessage,
        button: Game.text.level.interact,
        // The red dot is placed ahead of wherever she stands when mission 1 ends.
        place: function (level) { return { x: level.worldX + 60, z: level.worldZ + 640 }; },
        prepare: function (level) { level.carryingFlag = true; },     // folded flag on her backpack
        run: function (level, done) { Game.planets.moon.plantFlag(level, done); }
      }]
    }
  ],

  // ===== MISSION 2 CUTSCENE: PLANT THE FLAG =====
  // Each step lasts "time" seconds. During a step, p goes from 0 to 1.
  plantFlag: function (level, done) {
    const spot = level.stage.place;
    const mix = Game.cutscene.mix;
    let startX = 0, startZ = 0;
    // The planted flag is created now but hidden until step 5.
    const flag = { type: "flag", x: spot.x, z: spot.z, size: 185, openAmount: 0.3, waveAmount: 0, tilt: -1.1, hidden: true };
    level.objects.push(flag);

    Game.cutscene.play(level, [
      { time: 1.4,   // 0. She walks the last steps to the red dot.
        enter: function (lv) { startX = lv.worldX; startZ = lv.worldZ; lv.cutscene.autoMove = true; lv.pose.walking = true; },
        update: function (lv, p) { lv.worldX = mix(startX, spot.x + 80, p); lv.worldZ = mix(startZ, spot.z - 120, p); lv.speedX = 0; lv.speedZ = 0; lv.walkPhase += 0.25; },
        exit: function (lv) { lv.pose.walking = false; lv.cutscene.autoMove = false; } },
      { time: 0.9 },   // 1. The small folded flag is seen on the side of her backpack.
      { time: 1.2,     // 2. She reaches to the backpack and takes out the folded flag.
        enter: function (lv) { lv.carryingFlag = false; lv.hand = { type: "foldedFlag", fromBackpack: 0 }; },
        update: function (lv, p) { lv.hand.fromBackpack = p; lv.pose.armRight = mix(0, -2.4, p); lv.pose.lean = 0.05 * p; } },
      { time: 1.3,     // 3. The flag unfolds while she holds it.
        enter: function (lv) { lv.hand = { type: "flag", open: 0, tilt: 0 }; Game.audio.play("collect"); },
        update: function (lv, p) { lv.hand.open = p; } },
      { time: 1.2,     // 4. She turns toward the spot and bends slightly.
        update: function (lv, p) { lv.pose.squash = mix(1, 0.9, p); lv.pose.lean = mix(0.05, 0.14, p); lv.hand.tilt = mix(0, 0.7, p); lv.pose.armRight = mix(-2.4, -1.4, p); } },
      { time: 0.8,     // 5. She places the flagpole against the Moon's surface.
        enter: function (lv) { lv.hand = null; flag.hidden = false; Game.audio.play("thud"); },
        update: function (lv, p) { flag.openAmount = 0.3; lv.pose.armRight = mix(-1.4, -0.6, p); } },
      { time: 1.8,     // 6. The pole slowly sinks into the ground until it stands upright.
        update: function (lv, p) { flag.tilt = mix(-1.1, 0, p); },
        exit: function () { Game.audio.play("thud"); } },
      { time: 2.2,     // 7. The flag opens and gently waves.
        update: function (lv, p) { flag.openAmount = mix(0.3, 1, Math.min(1, p * 1.6)); flag.waveAmount = mix(0, 1, p); lv.pose.squash = mix(0.9, 1, p); lv.pose.lean = mix(0.14, 0, p); lv.pose.armRight = mix(-0.6, 0, p); },
        exit: function () { flag.waveAmount = 1; } },
      { time: 1.0 }    // 8. She stands beside the planted flag. (a short pause)
    ], done);
  }
};
