/* =====================================================================
   FILE: js/levels/hud.js
   WHAT IT DOES: Everything the player SEES on top of the level that is made of
   HTML (not canvas): the title bar, Missions button and list with check boxes,
   the vertical progress bar on the right, the hint line, the INTERACT box,
   the "Send to Earth" button and the purple pop-ups.
   BELONGS TO: all planet levels (css/level.css).
   WHAT TO CHANGE: look in css/level.css; words in js/data/text.js.
   ===================================================================== */

Game.hud = { popupCallback: null, interactCallback: null, sendCallback: null };

const hudById = function (id) { return document.getElementById(id); };

// Set up the HUD for a planet: title, sub-heading and the (empty) missions list.
Game.hud.setup = function (planet) {
  hudById("level-title").textContent = planet.title;
  hudById("level-subtitle").textContent = planet.subtitle;
  const list = hudById("missions-list");
  list.innerHTML = "";
  for (let i = 0; i < planet.missions.length; i++) {
    const item = document.createElement("li");
    item.innerHTML = '<span class="checkbox" id="mission-box-' + i + '"></span><span>' + (i + 1) + ". " + planet.missions[i].text + "</span>";
    list.appendChild(item);
  }
  hudById("missions-panel").classList.add("hidden");
  Game.hud.hideInteract();
  Game.hud.hideProgress();
  Game.hud.hideStorm();
  Game.hud.hidePopup();
  hudById("send-button").classList.add("hidden");
  hudById("hint-text").textContent = "";
  hudById("lake-view").classList.add("hidden");
  hudById("camera-view").classList.add("hidden");
};

// Turn a mission's check box green.
Game.hud.checkMission = function (index) {
  const box = hudById("mission-box-" + index);
  box.classList.add("done");
  box.textContent = "✔";
};

Game.hud.setHint = function (text) { hudById("hint-text").textContent = text; };

// ----- the INTERACT box (message + button) at the bottom center -----
Game.hud.showInteract = function (message, buttonLabel, callback) {
  hudById("interact-message").textContent = message;
  hudById("interact-button").textContent = buttonLabel;
  Game.hud.interactCallback = callback;
  hudById("interact-box").classList.remove("hidden");
};
Game.hud.hideInteract = function () {
  hudById("interact-box").classList.add("hidden");
  Game.hud.interactCallback = null;
};
Game.hud.isInteractVisible = function () { return !hudById("interact-box").classList.contains("hidden"); };

// ----- the vertical progress bar on the right edge (for 3 stones, 2 parts, 3 samples) -----
Game.hud.showProgress = function (label, total) {
  Game.hud.progressTotal = total;
  hudById("progress-bar").classList.remove("hidden");
  hudById("progress-label").classList.remove("hidden");
  hudById("progress-label").textContent = label + " 0/" + total;
  hudById("progress-bar").setAttribute("data-label", label);
  hudById("progress-fill").style.height = "0%";
};
Game.hud.setProgress = function (count) {
  const total = Game.hud.progressTotal;
  hudById("progress-fill").style.height = Math.round(count / total * 100) + "%";
  hudById("progress-label").textContent = hudById("progress-bar").getAttribute("data-label") + " " + count + "/" + total;
};
Game.hud.hideProgress = function () {
  hudById("progress-bar").classList.add("hidden");
  hudById("progress-label").classList.add("hidden");
};

// ----- the dust storm warning (Mars mission 3): a label and a bar from 0 to 1 -----
Game.hud.showStorm = function (label, amount) {
  hudById("storm-meter").classList.remove("hidden");
  Game.hud.setStorm(label, amount);
};
Game.hud.setStorm = function (label, amount) {
  if (label) { hudById("storm-label").textContent = label; }
  hudById("storm-fill").style.width = Math.round(amount * 100) + "%";
};
Game.hud.hideStorm = function () { hudById("storm-meter").classList.add("hidden"); };

// ----- purple pop-up with one button -----
Game.hud.showPopup = function (title, text, buttonLabel, callback) {
  hudById("popup-title").textContent = title;
  hudById("popup-text").textContent = text;
  hudById("popup-button").textContent = buttonLabel;
  Game.hud.popupCallback = callback;
  hudById("popup-layer").classList.remove("hidden");
};
Game.hud.hidePopup = function () {
  hudById("popup-layer").classList.add("hidden");
  Game.hud.popupCallback = null;
};
Game.hud.isPopupOpen = function () { return !hudById("popup-layer").classList.contains("hidden"); };

// ----- "Send to Earth" button (Venus) -----
Game.hud.showSend = function (callback) {
  Game.hud.sendCallback = callback;
  hudById("send-button").classList.remove("hidden");
};
Game.hud.hideSend = function () { hudById("send-button").classList.add("hidden"); };

// ----- button clicks -----
hudById("missions-button").addEventListener("click", function () { hudById("missions-panel").classList.toggle("hidden"); });
hudById("interact-button").addEventListener("click", function () {
  const callback = Game.hud.interactCallback;
  if (callback) { Game.hud.hideInteract(); callback(); }
});
hudById("popup-button").addEventListener("click", function () {
  const callback = Game.hud.popupCallback;
  Game.hud.hidePopup();
  if (callback) { callback(); }
});
hudById("send-button").addEventListener("click", function () {
  Game.hud.hideSend();
  if (Game.hud.sendCallback) { Game.hud.sendCallback(); }
});
