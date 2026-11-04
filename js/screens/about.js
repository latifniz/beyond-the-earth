/* =====================================================================
   FILE: js/screens/about.js
   WHAT IT DOES: The ABOUT screen. Builds the text box from text.js (about.body)
   and has a Back button to the lab (the lab characters are still there).
   BELONGS TO: screen "about" (css/settings.css).
   WHAT TO CHANGE: the About words are in js/data/text.js.
   ===================================================================== */

Game.screens.about = {};

// Build the About text once. Each item is [type, text].
Game.screens.about.build = function () {
  const box = document.getElementById("about-box");
  box.innerHTML = "";
  const items = Game.text.about.body;
  for (let i = 0; i < items.length; i++) {
    const type = items[i][0];
    const element = document.createElement(type === "strong" ? "strong" : type);
    element.innerHTML = items[i][1];
    box.appendChild(element);
  }
};

Game.screens.about.onShow = function () {
  if (document.getElementById("about-box").children.length === 0) { Game.screens.about.build(); }
};

document.getElementById("about-back").addEventListener("click", function () { Game.showScreen("lab"); });
