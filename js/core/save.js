/* =====================================================================
   FILE: js/core/save.js
   WHAT IT DOES: Remembers the player's progress in the browser
   (localStorage): unlocked planets, chosen suit, sound on/off, volume.
   BELONGS TO: the whole game.
   WHAT TO CHANGE: add a new thing to remember by adding it to Game.save.data.
   NOTE: every localStorage call is wrapped in try/catch so the game still
   works if the browser blocks storage.
   ===================================================================== */

Game.save = {
  key: "beyondTheEarthSave",
  data: {
    unlocked: ["moon"],      // planets the player can visit
    completed: [],           // planets already finished
    suit: "white-blue",      // "white-blue", "purple" or "pink"
    soundOn: true,
    volume: 0.6
  }
};

// Read saved data from the browser (if there is any).
Game.save.load = function () {
  Game.save.data.volume = Game.config.defaultVolume;
  try {
    const text = localStorage.getItem(Game.save.key);
    if (text) {
      const saved = JSON.parse(text);
      for (const name in saved) {
        Game.save.data[name] = saved[name];
      }
    }
  } catch (error) {
    console.log("Could not read saved game (that is OK):", error);
  }
};

// Write the data to the browser.
Game.save.store = function () {
  try {
    localStorage.setItem(Game.save.key, JSON.stringify(Game.save.data));
  } catch (error) {
    console.log("Could not save the game (that is OK):", error);
  }
};

// True if the player may visit this planet.
Game.save.isUnlocked = function (planet) {
  return Game.save.data.unlocked.indexOf(planet) !== -1;
};

// Unlock a planet (and remember it).
Game.save.unlock = function (planet) {
  if (!Game.save.isUnlocked(planet)) {
    Game.save.data.unlocked.push(planet);
    Game.save.store();
  }
};

// Mark a planet as finished and unlock the next one: Moon -> Mars -> Venus.
Game.save.completePlanet = function (planet) {
  if (Game.save.data.completed.indexOf(planet) === -1) {
    Game.save.data.completed.push(planet);
  }
  const order = ["moon", "mars", "venus"];
  const next = order[order.indexOf(planet) + 1];
  if (next) { Game.save.unlock(next); }
  Game.save.store();
};

// Start again from the beginning (used by "Play Again").
Game.save.reset = function () {
  Game.save.data.unlocked = ["moon"];
  Game.save.data.completed = [];
  Game.save.store();
};
