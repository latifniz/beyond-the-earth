/* =====================================================================
   FILE: js/screens/travel.js
   WHAT IT DOES: The TRAVEL ANIMATION (same for Moon, Mars, Venus). The planet
   gets bigger, a spacecraft flies into it, text says "Traveling to ..." then
   "Landed at ...", then the level opens. Venus shows a caution pop-up instead.
   BELONGS TO: screen "travel" (css/travel.css).
   WHAT TO CHANGE: how long it takes: Game.config.travelSeconds. The facts are in text.js.
   HOW THE "COMING CLOSER" FEELING WORKS: the planet's size grows with time, and
   the spaceship shrinks (it is getting farther from us while flying into the planet).
   ===================================================================== */

Game.screens.travel = { planet: "moon", startTime: 0, running: false, stars: [], finished: false, landedPlayed: false };

Game.screens.travel.onShow = function (params) {
  const t = Game.screens.travel;
  t.planet = params.planet || "moon";
  Game.chosenPlanet = t.planet;
  t.startTime = performance.now();
  t.running = true;
  t.finished = false;
  t.landedPlayed = false;
  t.stars = Game.stars.makeList(160, 1280, 720);
  // Use the real-looking 3D movie if this computer can do 3D; otherwise the flat 2D animation.
  t.use3d = false;
  t.total = Game.config.travelSeconds;
  if (Game.space.ready) {
    try {
      t.total = Game.config.travelSeconds3d;
      Game.travel3d.start(t.planet, t.total - 2.2);
      t.use3d = true;
    } catch (error) {
      console.log("3D travel not available, using 2D:", error);
      t.total = Game.config.travelSeconds;
    }
  }
  document.getElementById("travel-gl").classList.toggle("hidden", !t.use3d);
  document.getElementById("travel-canvas").classList.toggle("hidden", t.use3d);
  document.getElementById("travel-flash").classList.remove("go");
  const name = Game.screens.travel.planetName();
  document.getElementById("travel-text").textContent = Game.text.travel.traveling + name;
  document.getElementById("travel-text").style.opacity = 1;
  document.getElementById("travel-fact").textContent = Game.text.travel.didYouKnow + Game.text.travel.facts[t.planet];
  document.getElementById("travel-fact").classList.remove("show");
  document.getElementById("caution-layer").classList.add("hidden");
  Game.audio.startEngine();
  Game.audio.play("whoosh");
  requestAnimationFrame(t.frame);
};

Game.screens.travel.onHide = function () {
  Game.screens.travel.running = false;
  Game.audio.stopEngine();
};

Game.screens.travel.planetName = function () {
  const planet = Game.screens.travel.planet;
  return planet.charAt(0).toUpperCase() + planet.slice(1);
};

// Smooth start and end for a number going from 0 to 1.
Game.screens.travel.ease = function (p) { return p * p * (3 - 2 * p); };

// Runs every frame of the animation.
Game.screens.travel.frame = function (now) {
  const t = Game.screens.travel;
  if (!t.running) { return; }
  const seconds = (now - t.startTime) / 1000;
  const total = t.total;
  const flyEnd = total - 2.2;                       // the ship reaches the planet here
  if (t.use3d) {
    Game.travel3d.render(seconds);
  } else {
    const ctx = document.getElementById("travel-canvas").getContext("2d");
    t.drawBackground(ctx, seconds);
    t.drawPlanetAndShip(ctx, seconds, flyEnd);
  }

  if (seconds > 1.2) { document.getElementById("travel-fact").classList.add("show"); }
  if (seconds > flyEnd && !t.landedPlayed) { t.arrive(); }
  if (seconds > total && !t.finished) { t.finishIfNotVenus(); }
  requestAnimationFrame(t.frame);
};

// Dark purple space with stars that drift past (we are moving!).
Game.screens.travel.drawBackground = function (ctx, seconds) {
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, "#0c0630");
  grad.addColorStop(1, "#2a0f5c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  const stars = Game.screens.travel.stars;
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const x = (star.x - seconds * star.speed * 0.5 + 1280 * 4) % 1280;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(seconds * star.blinkSpeed + star.blinkStart);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, star.y, star.size * 1.4 + star.speed / 70, star.size);
  }
  ctx.globalAlpha = 1;
};

// The planet (with a soft glow) and the flying spacecraft.
Game.screens.travel.drawPlanetAndShip = function (ctx, seconds, flyEnd) {
  const t = Game.screens.travel;
  const progress = Math.min(1, seconds / flyEnd);
  const grow = t.ease(progress);
  const radius = 120 + grow * 190;               // planet grows: it feels closer
  const centerX = 840;
  const centerY = 340;

  // glow
  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.9, centerX, centerY, radius * 1.5);
  glow.addColorStop(0, "rgba(170,120,255,0.45)");
  glow.addColorStop(1, "rgba(170,120,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(centerX - radius * 1.6, centerY - radius * 1.6, radius * 3.2, radius * 3.2);
  const image = Game.loadedImages["assets/images/planets/" + t.planet + ".png"];
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, centerX - radius, centerY - radius, radius * 2, radius * 2);
  } else {
    Game.terrain.drawFallbackPlanet(ctx, t.planet, centerX, centerY, radius);
  }

  // spacecraft: moves along a curve from the lower left to the planet center
  const startX = 170, startY = 600;
  const curve = t.ease(Math.min(1, seconds / flyEnd));
  const shipX = startX + (centerX - startX) * curve + Math.sin(curve * Math.PI) * -90;
  const shipY = startY + (centerY - startY) * curve + Math.sin(curve * Math.PI) * 20;
  const size = 220 - curve * 185;                // it gets smaller as it flies away from us
  const nextCurve = t.ease(Math.min(1, (seconds + 0.05) / flyEnd));
  const nextX = startX + (centerX - startX) * nextCurve + Math.sin(nextCurve * Math.PI) * -90;
  const nextY = startY + (centerY - startY) * nextCurve + Math.sin(nextCurve * Math.PI) * 20;
  const angle = Math.atan2(nextX - shipX, -(nextY - shipY));
  if (seconds < flyEnd) {
    Game.spacecraft.draw(ctx, shipX, shipY, Math.max(size, 22), angle, seconds);
  } else {
    // a bright flash where the ship went in
    const flash = Math.max(0, 1 - (seconds - flyEnd) * 1.6);
    ctx.fillStyle = "rgba(255,255,255," + (flash * 0.8) + ")";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * (0.2 + (1 - flash) * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
};

// The ship went into the planet: show the "Landed" text (or the Venus warning).
Game.screens.travel.arrive = function () {
  const t = Game.screens.travel;
  t.landedPlayed = true;
  Game.audio.stopEngine();
  if (t.use3d) { document.getElementById("travel-flash").classList.add("go"); }   // white flash: we entered the atmosphere
  if (t.planet === "venus") {
    document.getElementById("travel-text").style.opacity = 0;
    document.getElementById("caution-layer").classList.remove("hidden");
    Game.audio.play("fail");
    t.finished = true;                         // wait for the OK button instead
  } else {
    document.getElementById("travel-text").textContent = Game.text.travel.landed + t.planetName();
    Game.audio.play("land");
  }
};

Game.screens.travel.finishIfNotVenus = function () {
  Game.screens.travel.finished = true;
  Game.screens.travel.openLevel();
};

Game.screens.travel.openLevel = function () {
  Game.showScreen("level", { planet: Game.screens.travel.planet });
};

document.getElementById("caution-ok").addEventListener("click", function () {
  document.getElementById("caution-layer").classList.add("hidden");
  Game.screens.travel.openLevel();
});
// Skip: jump straight to the end of the animation.
document.getElementById("travel-skip").addEventListener("click", function () {
  const t = Game.screens.travel;
  if (t.planet === "venus" && t.landedPlayed) { return; }
  t.startTime = performance.now() - (t.total - 2.1) * 1000 - 100;
});
