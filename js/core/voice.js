/* =====================================================================
   FILE: js/core/voice.js
   WHAT IT DOES: Makes the teacher and the student TALK, one at a time.
   It first tries a recorded file (assets/audio/voice/teacher-1.mp3 ...).
   If the file is missing it uses the computer's own voice (speechSynthesis).
   BELONGS TO: the Lab screen.
   HOW TO USE:  Game.voice.speak("teacher", 1, "Hello!", function () { ...when finished... });
   WHAT TO CHANGE: the list of preferred voice names (voiceHints), the pitch
   and speed of each character (characters).
   KEY IDEA: only ONE thing may speak at a time. Every call stops the old
   voice first, and a "ticket number" makes sure an old, late "finished"
   message can never trigger the next line twice.
   ===================================================================== */

Game.voice = {
  voices: [],            // all voices installed on this computer
  ticket: 0,             // goes up every time we speak; protects against double-calls
  currentAudio: null,    // the recorded-voice file that is playing (if any)
  timerId: null,         // backup timer
  // Names of nice female English voices, best first. (They differ per computer.)
  voiceHints: ["Google UK English Female", "Aria", "Jenny", "Samantha", "Zira", "Hazel", "Susan", "Female"],
  characters: {
    teacher: { pitch: 0.95, rate: 0.93, hintIndex: 0 },
    student: { pitch: 1.3, rate: 1.0, hintIndex: 1 }
  }
};

// Voices load late in Chrome, so we read the list again when it changes.
Game.voice.loadVoices = function () {
  if (!window.speechSynthesis) { return; }
  Game.voice.voices = window.speechSynthesis.getVoices();
};
if (window.speechSynthesis) {
  Game.voice.loadVoices();
  window.speechSynthesis.onvoiceschanged = Game.voice.loadVoices;
}

// Find the best English female voice. "skipName" lets the student pick a different one.
Game.voice.pickVoice = function (skipName) {
  const list = Game.voice.voices;
  for (let h = 0; h < Game.voice.voiceHints.length; h++) {
    for (let i = 0; i < list.length; i++) {
      const isEnglish = list[i].lang.indexOf("en") === 0;
      if (isEnglish && list[i].name.indexOf(Game.voice.voiceHints[h]) !== -1 && list[i].name !== skipName) {
        return list[i];
      }
    }
  }
  for (let i = 0; i < list.length; i++) {
    if (list[i].lang.indexOf("en") === 0 && list[i].name !== skipName) { return list[i]; }
  }
  return null;
};

// Stop everything that is talking right now.
Game.voice.stop = function () {
  Game.voice.ticket++;
  clearTimeout(Game.voice.timerId);
  if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
  if (Game.voice.currentAudio) {
    Game.voice.currentAudio.pause();
    Game.voice.currentAudio = null;
  }
};

// How long a bubble should stay if there is no voice: based on number of words.
Game.voice.readingSeconds = function (text) {
  const words = text.split(" ").length;
  return Math.max(Game.config.minBubbleSeconds, words * Game.config.readingSecondsPerWord + 1);
};

// Speak one line. "number" is the line number (1, 2, 3) used for recorded files.
// onDone is called exactly once when the line has finished.
Game.voice.speak = function (who, number, text, onDone) {
  Game.voice.stop();
  const myTicket = Game.voice.ticket;
  let finished = false;

  // Call onDone only once, and only if nobody started a newer line.
  function finish() {
    if (finished || myTicket !== Game.voice.ticket) { return; }
    finished = true;
    clearTimeout(Game.voice.timerId);
    onDone();
  }

  // If sound is OFF: just wait for the reading time.
  if (!Game.save.data.soundOn || Game.save.data.volume === 0) {
    Game.voice.timerId = setTimeout(finish, Game.voice.readingSeconds(text) * 1000);
    return;
  }
  // Backup timer: if "onend" never arrives, move on after a long enough time.
  Game.voice.timerId = setTimeout(finish, (Game.voice.readingSeconds(text) + 4) * 1000);

  // 1) Try the recorded file first (only if config.useRecordedVoices is true).
  if (!Game.config.useRecordedVoices) {
    Game.voice.speakWithComputerVoice(who, text, myTicket, finish);
    return;
  }
  const audio = new Audio("assets/audio/voice/" + who + "-" + number + ".mp3");
  audio.volume = Game.save.data.volume;
  let fileWorked = false;
  audio.onplaying = function () { fileWorked = true; clearTimeout(Game.voice.timerId); };
  audio.onended = finish;
  audio.onerror = function () {
    if (!fileWorked && myTicket === Game.voice.ticket) { Game.voice.speakWithComputerVoice(who, text, myTicket, finish); }
  };
  Game.voice.currentAudio = audio;
  audio.play().catch(function () { /* the error handler above takes over */ });
};

// 2) The computer's own voice.
Game.voice.speakWithComputerVoice = function (who, text, myTicket, finish) {
  if (!window.speechSynthesis) { return; }   // the backup timer will move on
  const settings = Game.voice.characters[who];
  const teacherVoice = Game.voice.pickVoice(null);
  // The student tries to use a different voice from the teacher.
  const voice = (who === "student" && teacherVoice) ? (Game.voice.pickVoice(teacherVoice.name) || teacherVoice) : teacherVoice;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  try {
    if (voice) { utterance.voice = voice; }
  } catch (error) {
    console.log("Could not use that voice, using the default one.", error);
  }
  utterance.lang = "en-US";
  utterance.pitch = settings.pitch;
  utterance.rate = settings.rate;
  utterance.volume = Game.save.data.volume;
  utterance.onend = finish;
  // If the computer cannot speak (error), do NOT rush: wait the normal reading time instead.
  // ("interrupted" just means we stopped it on purpose, so ignore that one.)
  utterance.onerror = function (event) {
    if (event.error === "interrupted" || event.error === "canceled") { return; }
    clearTimeout(Game.voice.timerId);
    Game.voice.timerId = setTimeout(finish, Game.voice.readingSeconds(text) * 1000);
  };
  if (myTicket === Game.voice.ticket) { window.speechSynthesis.speak(utterance); }
};
