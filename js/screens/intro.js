/* =====================================================================
   FILE: js/screens/intro.js
   WHAT IT DOES: The INTRO screen. Starts the falling white stars and,
   when PLAY NOW is clicked, starts the music and opens the Lab screen.
   BELONGS TO: screen "intro" (css/intro.css).
   WHAT TO CHANGE: what happens on PLAY NOW (see the click function).
   ===================================================================== */

Game.screens.intro = {
  stopStars: null,

  // Runs every time the intro screen is shown.
  onShow: function () {
    Game.screens.intro.matchTitleWidths();
    Game.screens.intro.stopStars = Game.stars.start(document.getElementById("intro-stars"), "falling");
  },

  // Make "THE EARTH" exactly as wide as "BEYOND" by adjusting its letter-spacing.
  matchTitleWidths: function () {
    const line1 = document.querySelector(".title-line1");
    const line2 = document.querySelector(".title-line2");
    line2.style.letterSpacing = "0px";
    const missing = line1.offsetWidth - line2.offsetWidth;          // pixels we need to add
    const gaps = line2.textContent.length;                           // letter-spacing is added after every letter
    line2.style.letterSpacing = (missing / gaps) + "px";
    line2.style.marginRight = (-missing / gaps) + "px";              // the last letter's extra gap must not shift the centering
  },

  // Runs when we leave the intro screen: stop the star animation to save power.
  onHide: function () {
    if (Game.screens.intro.stopStars) { Game.screens.intro.stopStars(); }
  }
};

// PLAY NOW: this click is also the moment the browser lets us start sound.
document.getElementById("play-button").addEventListener("click", function () {
  Game.audio.ensureContext();
  Game.audio.startMusic();
  Game.screens.lab.reset();
  Game.showScreen("lab");
});

document.getElementById("intro-fullscreen").addEventListener("click", Game.toggleFullscreen);
