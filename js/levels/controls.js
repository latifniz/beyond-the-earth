/* =====================================================================
   FILE: js/levels/controls.js
   WHAT IT DOES: Reads the player's input in a level: the on-screen buttons
   (hold to move, works with mouse and touch), the keyboard (arrows / WASD,
   Space = jump, E = interact) and clicks on the canvas (to pick up items).
   BELONGS TO: all planet levels.
   WHAT TO CHANGE: the key names in the two lists below.
   ===================================================================== */

// Hold a button to move: pressed = true, released = false.
function holdButton(buttonId, inputName) {
  const button = document.getElementById(buttonId);
  function press(event) { event.preventDefault(); if (Game.level) { Game.level.input[inputName] = true; } button.classList.add("pressed"); }
  function release() { if (Game.level) { Game.level.input[inputName] = false; } button.classList.remove("pressed"); }
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
}
holdButton("btn-left", "left");
holdButton("btn-right", "right");
holdButton("btn-forward", "forward");
holdButton("btn-backward", "back");

document.getElementById("btn-jump").addEventListener("pointerdown", function (event) {
  event.preventDefault();
  if (Game.level) { Game.walker.startJump(Game.level); }
});

// Keyboard
const keyToInput = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "forward", w: "forward", W: "forward", ArrowDown: "back", s: "back", S: "back" };

window.addEventListener("keydown", function (event) {
  if (Game.currentScreen !== "level" || !Game.level) { return; }
  if (keyToInput[event.key]) { Game.level.input[keyToInput[event.key]] = true; event.preventDefault(); }
  if (event.key === " ") { Game.walker.startJump(Game.level); event.preventDefault(); }
  if ((event.key === "e" || event.key === "E") && Game.hud.isInteractVisible()) { document.getElementById("interact-button").click(); }
});
window.addEventListener("keyup", function (event) {
  if (Game.level && keyToInput[event.key]) { Game.level.input[keyToInput[event.key]] = false; }
});

// Clicking the canvas: try to pick up an item under the pointer.
document.getElementById("level-canvas").addEventListener("pointerdown", function (event) {
  if (!Game.level) { return; }
  Game.missions.tryCollect(Game.level, Game.pointerToStage(event));
});

// Back button: leave the level and return to the destination screen.
document.getElementById("level-back").addEventListener("click", function () {
  if (Game.level) { Game.level.input = { left: false, right: false, forward: false, back: false }; }
  Game.showScreen("destination");
});

// If the window loses focus while a key is held, the "keyup" never arrives: reset so she does not walk forever.
window.addEventListener("blur", function () {
  if (Game.level) { Game.level.input = { left: false, right: false, forward: false, back: false }; }
});
