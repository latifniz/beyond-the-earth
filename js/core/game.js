/* =====================================================================
   FILE: js/core/game.js
   WHAT IT DOES: Creates the one global object "Game" that all files share,
   scales the 16:9 stage to fit the window, switches screens, fills in the
   text from text.js, and starts everything.
   BELONGS TO: the whole game (start-up).
   WHAT TO CHANGE: normally nothing here. To add a new screen: add a
   <section id="screen-NAME" class="screen"> in index.html, then register it
   with Game.screens.NAME = { onShow: function() {...}, onHide: function() {...} }.
   LOAD ORDER: this file must be loaded FIRST (see index.html).
   ===================================================================== */

// All the other files add their things to this one object.
const Game = {
  config: {},      // numbers (data/config.js)
  text: {},        // sentences (data/text.js)
  quizzes: {},     // questions (data/quizzes.js)
  screens: {},     // one object per screen: { onShow, onHide }
  planets: {},     // moon, mars, venus descriptions (levels/*.js)
  currentScreen: null,
  chosenPlanet: null,   // "moon", "mars" or "venus"

  // Settings and About open ON TOP of the lab. The lab stays alive behind them,
  // so the teacher and student never disappear or restart.
  overlayOn: { settings: "lab", about: "lab" }
};

// ===== SCREEN SWITCHING =====

// Show one screen and hide all the others (except the lab when we open an overlay).
Game.showScreen = function (name, params) {
  const keepBehind = Game.overlayOn[name];   // for settings/about this is "lab"
  const allScreens = document.querySelectorAll(".screen");

  for (let i = 0; i < allScreens.length; i++) {
    const screenName = allScreens[i].id.replace("screen-", "");
    if (screenName === name || screenName === keepBehind) {
      allScreens[i].classList.add("visible");
    } else {
      allScreens[i].classList.remove("visible");
    }
  }

  // Tell the old screen it is leaving (unless it stays behind an overlay).
  const old = Game.currentScreen;
  if (old && old !== name && old !== keepBehind && Game.screens[old] && Game.screens[old].onHide) {
    Game.screens[old].onHide();
  }
  Game.currentScreen = name;
  if (Game.screens[name] && Game.screens[name].onShow) {
    Game.screens[name].onShow(params || {});
  }
};

// ===== TEXT =====

// Look inside Game.text using a path like "lab.letsGo".
Game.getText = function (path) {
  const parts = path.split(".");
  let value = Game.text;
  for (let i = 0; i < parts.length; i++) {
    value = value[parts[i]];
  }
  return value;
};

// Fill every element that has data-text="..." with its sentence.
Game.applyText = function () {
  const items = document.querySelectorAll("[data-text]");
  for (let i = 0; i < items.length; i++) {
    items[i].textContent = Game.getText(items[i].getAttribute("data-text"));
  }
};

// ===== STAGE SCALING =====

// The stage is 1280x720. Scale it so it fits inside any window (letterboxed).
Game.fitStageToWindow = function () {
  const stage = document.getElementById("stage");
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform = "scale(" + scale + ")";
  Game.stageScale = scale;
};

// Turn a mouse/touch position on the page into a position on the 1280x720 stage.
Game.pointerToStage = function (event) {
  const rect = document.getElementById("stage").getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / Game.stageScale,
    y: (event.clientY - rect.top) / Game.stageScale
  };
};

// Show a short message ("Walk closer!") at the top for a moment.
Game.showToast = function (message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(Game.toastTimer);
  Game.toastTimer = setTimeout(function () { toast.classList.remove("show"); }, Game.config.hintTime * 1000);
};

// Turn fullscreen on or off (used by the Fullscreen button).
Game.toggleFullscreen = function () {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
};

// ===== START-UP =====

// Called once at the very end (from js/main.js) after every file has loaded.
Game.start = function () {
  Game.applyText();
  Game.fitStageToWindow();
  window.addEventListener("resize", Game.fitStageToWindow);
  Game.save.load();
  Game.audio.applySavedSettings();
  Game.audio.attachClickSounds();
  Game.preloadThenShowIntro();
};
