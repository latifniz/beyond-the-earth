/* =====================================================================
   FILE: js/screens/destination.js
   WHAT IT DOES: The CHOOSE YOUR DESTINATION screen. Shows Moon, Mars and Venus
   cards. Locked planets are faded with a lock and cannot be opened. Clicking an
   open planet starts the travel animation.
   BELONGS TO: screen "destination" (css/destination.css).
   WHAT TO CHANGE: unlock rules are in save.js (completePlanet).
   ===================================================================== */

Game.screens.destination = { stopStars: null, order: ["moon", "mars", "venus"] };

// Update every card: locked or open, "Mission 1/2/3" text.
Game.screens.destination.refreshCards = function () {
  const cards = document.querySelectorAll(".planet-card");
  for (let i = 0; i < cards.length; i++) {
    const planet = cards[i].getAttribute("data-planet");
    cards[i].querySelector("p").textContent = Game.text.destination.missionLabel + " " + (i + 1);
    cards[i].classList.toggle("locked", !Game.save.isUnlocked(planet));
    cards[i].classList.toggle("done", Game.save.data.completed.indexOf(planet) !== -1);
  }
};

Game.screens.destination.onShow = function () {
  Game.screens.destination.refreshCards();
  Game.screens.destination.stopStars = Game.stars.start(document.getElementById("destination-stars"), "twinkle");
  // Real-looking spinning 3D planets on the cards (only if 3D works on this computer).
  if (Game.space.ready) {
    try { Game.cards3d.start(); } catch (error) { console.log("3D cards not available:", error); }
  }
};

Game.screens.destination.onHide = function () {
  if (Game.screens.destination.stopStars) { Game.screens.destination.stopStars(); }
  Game.cards3d.stop();
};

const planetCards = document.querySelectorAll(".planet-card");
for (let i = 0; i < planetCards.length; i++) {
  planetCards[i].addEventListener("click", function () {
    const planet = planetCards[i].getAttribute("data-planet");
    if (!Game.save.isUnlocked(planet)) {
      Game.showToast(Game.text.destination.lockedHint);
      return;
    }
    Game.showScreen("travel", { planet: planet });
  });
}
document.getElementById("destination-back").addEventListener("click", function () { Game.showScreen("customize"); });
