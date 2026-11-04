/* =====================================================================
   FILE: js/screens/quiz.js
   WHAT IT DOES: The QUIZ for every planet (3 questions, 4 options each).
   After each answer it shows Correct (green tick) or Wrong (red cross) with the
   explanation. At the end it shows the result message and unlocks the next planet.
   BELONGS TO: screen "quiz" (css/quiz.css). Questions are in data/quizzes.js.
   WHAT TO CHANGE: result messages are in text.js (quiz.results).
   ===================================================================== */

Game.screens.quiz = { planet: "moon", questions: [], index: 0, score: 0, answered: false, stopStars: null };

Game.screens.quiz.onShow = function (params) {
  const q = Game.screens.quiz;
  q.planet = params.planet || Game.chosenPlanet;
  q.questions = Game.quizzes[q.planet];
  q.index = 0;
  q.score = 0;
  document.getElementById("quiz-result").classList.add("hidden");
  document.querySelector(".quiz-box").classList.remove("hidden");
  q.stopStars = Game.stars.start(document.getElementById("quiz-stars"), "twinkle");
  q.showQuestion();
};

Game.screens.quiz.onHide = function () {
  if (Game.screens.quiz.stopStars) { Game.screens.quiz.stopStars(); }
};

// Show the current question and its 4 option buttons.
Game.screens.quiz.showQuestion = function () {
  const q = Game.screens.quiz;
  const question = q.questions[q.index];
  q.answered = false;
  document.getElementById("quiz-progress").textContent = Game.text.quiz.questionWord.toUpperCase() + " " + (q.index + 1) + " / " + q.questions.length;
  document.getElementById("quiz-question").textContent = question.question;
  document.getElementById("quiz-feedback").classList.add("hidden");
  document.getElementById("quiz-next").classList.add("hidden");

  const box = document.getElementById("quiz-options");
  box.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  for (let i = 0; i < question.options.length; i++) {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.textContent = letters[i] + ".  " + question.options[i];
    button.addEventListener("click", function () { q.answer(i); });
    box.appendChild(button);
  }
};

// The player picked option number "choice".
Game.screens.quiz.answer = function (choice) {
  const q = Game.screens.quiz;
  if (q.answered) { return; }
  q.answered = true;
  const question = q.questions[q.index];
  const isRight = choice === question.correct;
  if (isRight) { q.score++; }
  Game.audio.play(isRight ? "success" : "fail");

  const buttons = document.querySelectorAll(".quiz-option");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
    if (i === question.correct) { buttons[i].classList.add("right"); }
    if (i === choice && !isRight) { buttons[i].classList.add("wrong"); }
  }
  const verdict = document.getElementById("quiz-verdict");
  verdict.className = isRight ? "right" : "wrong";
  verdict.textContent = isRight ? "✔ " + Game.text.quiz.correct : "✖ " + Game.text.quiz.wrong;
  document.getElementById("quiz-explanation").textContent = question.explanation;
  document.getElementById("quiz-feedback").classList.remove("hidden");

  const isLast = q.index === q.questions.length - 1;
  const next = document.getElementById("quiz-next");
  next.textContent = isLast ? Game.text.quiz.seeResult : Game.text.quiz.next;
  next.classList.remove("hidden");
};

// Next question, or the result after the last one.
Game.screens.quiz.goNext = function () {
  const q = Game.screens.quiz;
  q.index++;
  if (q.index >= q.questions.length) { q.showResult(); } else { q.showQuestion(); }
};

// Result: 3 = Great job!, 2 = Learn more, 1 = You need to study, 0 = Do hard work.
Game.screens.quiz.showResult = function () {
  const q = Game.screens.quiz;
  document.querySelector(".quiz-box").classList.add("hidden");
  document.getElementById("result-message").textContent = Game.text.quiz.results[q.score];
  document.getElementById("result-score").textContent = Game.text.quiz.resultScore.replace("{n}", q.score);
  let stars = "";
  for (let i = 0; i < 3; i++) { stars += i < q.score ? "★" : "☆"; }
  document.getElementById("result-stars").textContent = stars;
  document.getElementById("quiz-result").classList.remove("hidden");
  Game.audio.play(q.score >= 2 ? "success" : "fail");
  Game.save.completePlanet(q.planet);      // finishing the planet unlocks the next one
};

document.getElementById("quiz-next").addEventListener("click", function () { Game.screens.quiz.goNext(); });
document.getElementById("quiz-back").addEventListener("click", function () {
  // After Venus, the last planet, we show the celebration; otherwise back to the destinations.
  Game.showScreen(Game.screens.quiz.planet === "venus" ? "finale" : "destination");
});
