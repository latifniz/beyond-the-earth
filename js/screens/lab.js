/* =====================================================================
   FILE: js/screens/lab.js
   WHAT IT DOES: The LAB screen. The teacher and the student talk, one at a
   time: show bubble -> speak -> when the voice finishes, show the next
   bubble. After the last line the "Let's go" button appears.
   BELONGS TO: screen "lab" (css/lab.css). The words are in text.js (lab.dialogue).
   WHAT TO CHANGE: the pause between lines (pauseMs below).
   IMPORTANT: Settings and About open ON TOP of this screen, so this screen
   is never hidden or reset by them. The conversation keeps going.
   ===================================================================== */

Game.screens.lab = {
  started: false,      // has the conversation begun?
  lineIndex: 0,
  pauseMs: 450         // small silence between two lines
};

// Prepare a fresh conversation (called by PLAY NOW).
Game.screens.lab.reset = function () {
  Game.voice.stop();
  Game.screens.lab.started = false;
  Game.screens.lab.lineIndex = 0;
  document.getElementById("bubble-teacher").classList.remove("show");
  document.getElementById("bubble-student").classList.remove("show");
  document.getElementById("lets-go-button").classList.add("hidden");
};

// Runs when the lab is shown. If we are only coming BACK from Settings/About,
// started is already true, so we do nothing and the characters stay as they were.
Game.screens.lab.onShow = function () {
  if (Game.screens.lab.started) { return; }
  Game.screens.lab.started = true;
  setTimeout(function () { Game.screens.lab.showLine(0); }, 900);
};

// Show line number "index": bubble appears, voice speaks, then the next line.
Game.screens.lab.showLine = function (index) {
  const dialogue = Game.text.lab.dialogue;
  if (index >= dialogue.length) {
    document.getElementById("lets-go-button").classList.remove("hidden");   // the last line is done
    return;
  }
  const line = dialogue[index];

  // Only one bubble is visible at a time.
  document.getElementById("bubble-teacher").classList.remove("show");
  document.getElementById("bubble-student").classList.remove("show");
  const bubble = document.getElementById("bubble-" + line.who);
  bubble.textContent = line.text;
  bubble.classList.add("show");

  document.querySelector(".character.teacher").classList.toggle("speaking", line.who === "teacher");
  document.querySelector(".character.student").classList.toggle("speaking", line.who === "student");

  // Which number is this line for this speaker? (teacher-1, student-1, teacher-2)
  let numberForSpeaker = 0;
  for (let i = 0; i <= index; i++) {
    if (dialogue[i].who === line.who) { numberForSpeaker++; }
  }

  Game.voice.speak(line.who, numberForSpeaker, line.text, function () {
    document.querySelector(".character.teacher").classList.remove("speaking");
    document.querySelector(".character.student").classList.remove("speaking");
    setTimeout(function () { Game.screens.lab.showLine(index + 1); }, Game.screens.lab.pauseMs);
  });
};

// ----- buttons -----
document.getElementById("open-settings").addEventListener("click", function () { Game.showScreen("settings"); });
document.getElementById("open-about").addEventListener("click", function () { Game.showScreen("about"); });
document.getElementById("lets-go-button").addEventListener("click", function () {
  Game.voice.stop();
  Game.showScreen("customize");
});
