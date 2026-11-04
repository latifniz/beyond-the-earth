/* =====================================================================
   FILE: js/screens/customize.js
   WHAT IT DOES: The CHARACTER CUSTOMIZATION screen. Three tall cards show the
   suits (white & blue, purple, pink). Click one: it shows BIG on the right and
   is saved as the player's suit. Next goes to the destination screen.
   BELONGS TO: screen "customize" (css/customize.css).
   WHAT TO CHANGE: suit names are in text.js. Suit pictures are in
   assets/images/astronaut/ (see astronaut.js).
   ===================================================================== */

Game.screens.customize = { stopStars: null, animating: false };

// Draw the three small astronauts and the big one (called every frame, so they "breathe").
Game.screens.customize.drawAll = function (seconds) {
  const cards = document.querySelectorAll(".suit-card");
  for (let i = 0; i < cards.length; i++) {
    const canvas = cards[i].querySelector("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Game.astronaut.draw(ctx, { suit: cards[i].getAttribute("data-suit"), view: "front", x: canvas.width / 2,
      feetY: canvas.height - 6, height: canvas.height - 14, time: seconds + i });
  }
  const big = document.getElementById("suit-big-canvas");
  const bigCtx = big.getContext("2d");
  bigCtx.clearRect(0, 0, big.width, big.height);
  Game.astronaut.draw(bigCtx, { suit: Game.save.data.suit, view: "front", x: big.width / 2, feetY: big.height - 14,
    height: big.height - 40, time: seconds });
};

// Highlight the chosen card.
Game.screens.customize.markSelected = function () {
  const cards = document.querySelectorAll(".suit-card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.toggle("selected", cards[i].getAttribute("data-suit") === Game.save.data.suit);
  }
};

Game.screens.customize.onShow = function () {
  const cards = document.querySelectorAll(".suit-card");
  for (let i = 0; i < cards.length; i++) { cards[i].querySelector("span").textContent = Game.text.customize.suits[i]; }
  Game.screens.customize.markSelected();
  Game.screens.customize.stopStars = Game.stars.start(document.getElementById("customize-stars"), "twinkle");
  Game.screens.customize.animating = true;
  function frame(now) {
    if (!Game.screens.customize.animating) { return; }
    Game.screens.customize.drawAll(now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

Game.screens.customize.onHide = function () {
  Game.screens.customize.animating = false;
  if (Game.screens.customize.stopStars) { Game.screens.customize.stopStars(); }
};

// Clicking a card chooses that suit.
const suitCards = document.querySelectorAll(".suit-card");
for (let i = 0; i < suitCards.length; i++) {
  suitCards[i].addEventListener("click", function () {
    Game.save.data.suit = suitCards[i].getAttribute("data-suit");
    Game.save.store();
    Game.screens.customize.markSelected();
  });
}
document.getElementById("customize-next").addEventListener("click", function () { Game.showScreen("destination"); });
