/* =====================================================================
   FILE: js/core/audio.js
   WHAT IT DOES: Makes ALL the music and sound effects of the game using the
   Web Audio API (the computer "draws" the sounds with math, so we need no
   sound files and it works offline).
   BELONGS TO: the whole game.
   HOW TO USE FROM OTHER FILES:  Game.audio.play("click");  Game.audio.startMusic();
   WHAT TO CHANGE: the musical notes (chords list) or how a sound is built in
   the "SOUND EFFECTS" section. Volume and ON/OFF come from Settings.
   NOTE: browsers block sound until the player clicks once. The PLAY NOW click
   calls ensureContext() + startMusic().
   ===================================================================== */

Game.audio = {
  ctx: null,            // the AudioContext (created on first click)
  master: null,         // master volume knob
  musicGain: null,      // music volume knob
  noise: null,          // a buffer of random noise (used for whoosh, steps, spray)
  musicRunning: false,
  engine: null          // the looping spaceship sound while traveling
};

// ===== SETUP =====

// Create the audio system. Must be called from a click.
Game.audio.ensureContext = function () {
  if (Game.audio.ctx) {
    if (Game.audio.ctx.state === "suspended") { Game.audio.ctx.resume(); }
    return;
  }
  const AudioClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioClass) { return; }
  const ctx = new AudioClass();
  Game.audio.ctx = ctx;
  Game.audio.master = ctx.createGain();
  // A "compressor" works like a limiter: it squashes sudden loud peaks so nothing is ever painfully loud.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -24;
  limiter.ratio.value = 12;
  Game.audio.master.connect(limiter);
  limiter.connect(ctx.destination);
  Game.audio.musicGain = ctx.createGain();
  Game.audio.musicGain.gain.value = Game.config.musicLevel;
  Game.audio.musicGain.connect(Game.audio.master);

  // One second of random noise, reused by many sounds.
  const length = ctx.sampleRate;
  Game.audio.noise = ctx.createBuffer(1, length, ctx.sampleRate);
  const samples = Game.audio.noise.getChannelData(0);
  for (let i = 0; i < length; i++) { samples[i] = Math.random() * 2 - 1; }
  Game.audio.updateMasterVolume();
};

// Master volume = 0 when sound is OFF, otherwise the volume slider value.
Game.audio.updateMasterVolume = function () {
  if (!Game.audio.master) { return; }
  const level = Game.save.data.soundOn ? Game.save.data.volume : 0;
  Game.audio.master.gain.setTargetAtTime(level, Game.audio.ctx.currentTime, 0.05);
};

// Called at start-up (settings were loaded from save).
Game.audio.applySavedSettings = function () { Game.audio.updateMasterVolume(); };

Game.audio.setVolume = function (value) {
  Game.save.data.volume = value;
  Game.save.store();
  Game.audio.updateMasterVolume();
};

Game.audio.setSoundOn = function (isOn) {
  Game.save.data.soundOn = isOn;
  Game.save.store();
  Game.audio.updateMasterVolume();
  if (!isOn && window.speechSynthesis) { window.speechSynthesis.cancel(); }
};

// Every <button> (and anything with class "clickable") makes a click sound.
Game.audio.attachClickSounds = function () {
  document.addEventListener("pointerdown", function (event) {
    Game.audio.ensureContext();
    if (event.target.closest && event.target.closest("button, .clickable")) {
      Game.audio.play("click");
    }
  });
};

// ===== SMALL BUILDING BLOCKS =====

// Play one musical tone. slideTo makes the pitch glide to another frequency.
Game.audio.tone = function (freq, seconds, type, volume, delay, slideTo, output) {
  const ctx = Game.audio.ctx;
  if (!ctx) { return; }
  const start = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) { osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds); }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(output || Game.audio.master);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
};

// Play a burst of filtered noise (wind, whoosh, hiss, footstep...).
Game.audio.noiseBurst = function (seconds, filterType, freqStart, freqEnd, volume, delay) {
  const ctx = Game.audio.ctx;
  if (!ctx) { return; }
  const start = ctx.currentTime + (delay || 0);
  const source = ctx.createBufferSource();
  source.buffer = Game.audio.noise;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freqStart, start);
  filter.frequency.exponentialRampToValueAtTime(freqEnd, start + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.05, seconds / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(Game.audio.master);
  source.start(start);
  source.stop(start + seconds + 0.05);
};

// ===== SOUND EFFECTS =====

// Play a sound effect by name.
Game.audio.play = function (name) {
  if (!Game.audio.ctx || !Game.save.data.soundOn) { return; }
  const a = Game.audio;
  if (name === "click") {
    a.tone(880, 0.09, "triangle", 0.3);
    a.tone(1320, 0.07, "sine", 0.12, 0.02);
  } else if (name === "whoosh") {
    a.noiseBurst(1.6, "bandpass", 300, 1400, 0.1);
  } else if (name === "step") {
    a.noiseBurst(0.12, "lowpass", 500, 120, 0.5);
  } else if (name === "collect") {
    a.tone(660, 0.18, "sine", 0.35);
    a.tone(990, 0.22, "sine", 0.3, 0.09);
    a.tone(1320, 0.3, "sine", 0.25, 0.18);
  } else if (name === "thud") {
    a.tone(110, 0.3, "sine", 0.3, 0, 45);
    a.noiseBurst(0.15, "lowpass", 400, 100, 0.15);
  } else if (name === "hiss") {
    a.noiseBurst(0.9, "highpass", 3000, 6000, 0.35);
  } else if (name === "shutter") {
    a.noiseBurst(0.05, "highpass", 2000, 4000, 0.6);
    a.noiseBurst(0.07, "highpass", 1500, 3000, 0.5, 0.09);
  } else if (name === "crackle") {
    for (let i = 0; i < 6; i++) { a.noiseBurst(0.04, "highpass", 1500 + i * 400, 5000, 0.4, i * 0.05 + Math.random() * 0.03); }
    a.tone(180, 0.3, "sawtooth", 0.15, 0, 60);
  } else if (name === "success") {
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) { a.tone(notes[i], 0.5, "triangle", 0.3, i * 0.13); }
  } else if (name === "fail") {
    a.tone(330, 0.25, "sawtooth", 0.2);
    a.tone(220, 0.4, "sawtooth", 0.2, 0.2);
  } else if (name === "powerup") {
    a.tone(200, 1.2, "sine", 0.1, 0, 700);
    a.noiseBurst(1.2, "lowpass", 200, 700, 0.08);
  } else if (name === "launch") {
    a.noiseBurst(3, "lowpass", 250, 900, 0.14);
    a.tone(70, 3, "sine", 0.12, 0, 160);
  } else if (name === "send") {
    a.tone(500, 1.2, "sine", 0.3, 0, 1800);
    a.tone(750, 1.2, "sine", 0.2, 0.15, 2200);
  } else if (name === "scan") {
    a.tone(400, 1.8, "sine", 0.1, 0, 1500);           // a soft rising "scanner" sweep
    a.tone(800, 1.8, "triangle", 0.04, 0.1, 1900);
  } else if (name === "land") {
    a.noiseBurst(1, "lowpass", 600, 150, 0.12);
    a.tone(90, 0.8, "sine", 0.2, 0.4, 40);
  }
};

// ----- the spaceship engine: a low rumble that keeps going until we stop it -----
Game.audio.startEngine = function () {
  const ctx = Game.audio.ctx;
  if (!ctx || Game.audio.engine) { return; }
  const source = ctx.createBufferSource();
  source.buffer = Game.audio.noise;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 160;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 55;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 1.5);
  source.connect(filter);
  filter.connect(gain);
  osc.connect(gain);
  gain.connect(Game.audio.master);
  source.start();
  osc.start();
  Game.audio.engine = { source: source, osc: osc, gain: gain };
};

Game.audio.stopEngine = function () {
  const engine = Game.audio.engine;
  if (!engine) { return; }
  const now = Game.audio.ctx.currentTime;
  engine.gain.gain.cancelScheduledValues(now);
  engine.gain.gain.setValueAtTime(engine.gain.gain.value, now);
  engine.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  engine.source.stop(now + 0.7);
  engine.osc.stop(now + 0.7);
  Game.audio.engine = null;
};

// ===== SPACE MUSIC =====
// A slow ambient "pad": soft chords that change every 8 seconds,
// plus a few high, bell-like notes. All made from simple sine waves.

Game.audio.chords = [
  [110.0, 164.8, 220.0, 261.6],   // A minor
  [87.3, 130.8, 174.6, 220.0],    // F major
  [130.8, 196.0, 261.6, 329.6],   // C major
  [98.0, 146.8, 196.0, 246.9]     // G major
];
Game.audio.bellNotes = [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5];   // pentatonic: always sounds nice
Game.audio.chordIndex = 0;

// Start the music (does nothing if it is already running).
Game.audio.startMusic = function () {
  if (!Game.audio.ctx || Game.audio.musicRunning) { return; }
  Game.audio.musicRunning = true;
  Game.audio.playNextChord();
};

// Play one chord (4 slow notes) and 5 bells, then schedule the next chord.
Game.audio.playNextChord = function () {
  const ctx = Game.audio.ctx;
  const chord = Game.audio.chords[Game.audio.chordIndex % Game.audio.chords.length];
  Game.audio.chordIndex++;
  const now = ctx.currentTime;

  for (let i = 0; i < chord.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = chord[i];
    osc.detune.value = (i - 1.5) * 4;      // a tiny difference makes the sound wide and warm
    filter.type = "lowpass";
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 3);
    gain.gain.linearRampToValueAtTime(0.0001, now + 9.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(Game.audio.musicGain);
    osc.start(now);
    osc.stop(now + 10);
  }

  for (let b = 0; b < 5; b++) {
    const note = Game.audio.bellNotes[Math.floor(Math.random() * Game.audio.bellNotes.length)];
    Game.audio.tone(note, 2.2, "sine", 0.06, 0.8 + b * 1.5 + Math.random(), null, Game.audio.musicGain);
  }
  setTimeout(Game.audio.playNextChord, 8000);
};
