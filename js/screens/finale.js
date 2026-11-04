/* =====================================================================
   FILE: js/screens/finale.js
   WHAT IT DOES: The final celebration after Venus: "Mission Complete!" with
   falling stars and a Play Again button.
   BELONGS TO: screen "finale" (css/quiz.css). Words: text.js (finale).
   ===================================================================== */

Game.screens.finale = { stopStars: null };

Game.screens.finale.onShow = function () {
  Game.screens.finale.stopStars = Game.stars.start(document.getElementById("finale-stars"), "falling");
  Game.audio.play("success");
};
Game.screens.finale.onHide = function () {
  if (Game.screens.finale.stopStars) { Game.screens.finale.stopStars(); }
};

document.getElementById("finale-back").addEventListener("click", function () { Game.showScreen("destination"); });
// Play Again: forget progress and start from the choice of suit.
document.getElementById("finale-again").addEventListener("click", function () {
  Game.save.reset();
  Game.showScreen("customize");
});
