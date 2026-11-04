/* =====================================================================
   FILE: js/main.js
   WHAT IT DOES: The last file loaded. It preloads pictures and fonts while a
   progress bar fills (loading screen), then opens the intro. If you add a
   new picture that the game must have ready, add it to the list below.
   BELONGS TO: start-up.
   ===================================================================== */

// Pictures the game loads before starting (so nothing pops in late).
Game.preloadList = [
  "assets/images/intro-bg.jpg", "assets/images/lab-bg.jpg", "assets/images/teacher.png",
  "assets/images/student.png", "assets/images/stone.png",
  "assets/images/planets/moon.png", "assets/images/planets/mars.png", "assets/images/planets/venus.png",
  "assets/images/planets/earth.png", "assets/images/planets/saturn.png",
  // real-looking backdrops and ground pictures for the planet levels
  "assets/images/backdrops/moon-sky.jpg", "assets/images/backdrops/mars-sky.png", "assets/images/backdrops/mars-sky-planet.png",
  "assets/images/backdrops/venus-sky.jpg", "assets/images/backdrops/venus-surface.jpg"
];
Game.loadedImages = {};   // path -> Image (levels use these for the Earth, stones, ...)

// Load everything, move the progress bar, then show the intro.
Game.preloadThenShowIntro = function () {
  Game.showScreen("loading");
  const total = Game.preloadList.length + 5;    // +5 = astronaut pictures, two fonts, 3D textures, ground pictures
  let done = 0;
  function oneDone() {
    done++;
    document.getElementById("loading-fill").style.width = Math.round(done / total * 100) + "%";
    if (done === total) { setTimeout(function () { Game.showScreen("intro"); }, 350); }
  }
  for (let i = 0; i < Game.preloadList.length; i++) {
    const image = new Image();
    image.onload = image.onerror = oneDone;
    Game.loadedImages[Game.preloadList[i]] = image;
    image.src = Game.preloadList[i];
  }
  Game.astronaut.loadImages(oneDone);
  Game.realistic.loadGroundImages(oneDone);   // ground pictures of the planet levels
  Game.space.loadTextures(oneDone);          // 3D planet pictures (does nothing if 3D is not available)
  // Wait for the fonts too. A failed font is OK (the browser uses a backup font).
  document.fonts.load('700 40px "Fredoka One"').then(oneDone, oneDone);
  document.fonts.load('500 20px "Montserrat"').then(oneDone, oneDone);
};

// ===== DEMO PANEL (only when the address ends with ?demo=1) =====
// A small box to unlock everything or jump to any level, for presenting quickly.
Game.addDemoPanel = function () {
  const panel = document.createElement("div");
  panel.id = "demo-panel";
  document.getElementById("stage").appendChild(panel);
  function addButton(label, action) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    panel.appendChild(button);
  }
  addButton("Unlock all", function () { Game.save.unlock("mars"); Game.save.unlock("venus"); Game.screens.destination.refreshCards(); });
  addButton("Intro", function () { Game.showScreen("intro"); });
  addButton("Destinations", function () { Game.showScreen("destination"); });
  const planets = ["moon", "mars", "venus"];
  for (let i = 0; i < planets.length; i++) {
    (function (planet) {
      addButton("Level: " + planet, function () { Game.showScreen("level", { planet: planet }); });
      addButton("Quiz: " + planet, function () { Game.showScreen("quiz", { planet: planet }); });
    })(planets[i]);
  }
};
if (window.location.search.indexOf("demo=1") !== -1) { Game.addDemoPanel(); }

Game.start();
