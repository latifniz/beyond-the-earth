/* =====================================================================
   FILE: js/screens/settings.js
   WHAT IT DOES: The SETTINGS screen: Sound ON/OFF button and the volume line
   (click or drag on the line). Changes apply to music, effects and voices
   and are remembered.
   BELONGS TO: screen "settings" (css/settings.css).
   WHAT TO CHANGE: nothing normally. Default volume is in data/config.js.
   ===================================================================== */

Game.screens.settings = {};

// Make the buttons show what is saved right now.
Game.screens.settings.refresh = function () {
  const isOn = Game.save.data.soundOn;
  const toggle = document.getElementById("sound-toggle");
  toggle.classList.toggle("on", isOn);
  toggle.classList.toggle("off", !isOn);
  document.getElementById("sound-toggle-text").textContent = isOn ? Game.text.settings.on : Game.text.settings.off;
  const percent = Math.round(Game.save.data.volume * 100) + "%";
  document.getElementById("volume-fill").style.width = percent;
  document.getElementById("volume-knob").style.left = percent;
};

Game.screens.settings.onShow = function () { Game.screens.settings.refresh(); };

// Turn a mouse position on the line into a volume between 0 and 1.
Game.screens.settings.setVolumeFromPointer = function (event) {
  const line = document.getElementById("volume-line");
  const rect = line.getBoundingClientRect();
  let value = (event.clientX - rect.left) / rect.width;
  value = Math.max(0, Math.min(1, value));
  Game.audio.setVolume(value);
  Game.screens.settings.refresh();
};

document.getElementById("sound-toggle").addEventListener("click", function () {
  Game.audio.setSoundOn(!Game.save.data.soundOn);
  Game.screens.settings.refresh();
  if (Game.save.data.soundOn) { Game.audio.play("click"); }
});

// Dragging the volume line: press, move, release.
let draggingVolume = false;
document.getElementById("volume-line").addEventListener("pointerdown", function (event) {
  draggingVolume = true;
  Game.screens.settings.setVolumeFromPointer(event);
});
window.addEventListener("pointermove", function (event) {
  if (draggingVolume) { Game.screens.settings.setVolumeFromPointer(event); }
});
window.addEventListener("pointerup", function () {
  if (draggingVolume) { draggingVolume = false; Game.audio.play("click"); }
});

document.getElementById("settings-fullscreen").addEventListener("click", Game.toggleFullscreen);
// Back returns to the lab. The lab was never hidden, so the characters are still there.
document.getElementById("settings-back").addEventListener("click", function () { Game.showScreen("lab"); });
