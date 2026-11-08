/* =====================================================================
   FILE: js/data/config.js
   WHAT IT DOES: All the NUMBERS of the game in one place: walking speed,
   gravity for each planet, jump power, volumes, how long things last.
   WHO EDITS: Hadia (developer).
   HOW TO EDIT: change a number and save. Do not change the names on the left.
   ===================================================================== */

Game.config = {
  // ----- walking (units are "world pixels"; speed is per second) -----
  walkSpeed: 300,          // how fast she walks forward
  sideSpeed: 260,          // how fast she walks left / right
  acceleration: 1100,      // how quickly she speeds up (bigger = snappier)
  friction: 1500,          // how quickly she slows down when you let go
  walkerRadius: 38,        // how wide she is when bumping into rocks (only where rocks block her)
  reachDistance: 230,      // how close she must be to pick something up
  focalLength: 300,        // how strong the 3D perspective is (see walker.js)

  // ----- jumping: gravity is how fast she is pulled back down -----
  // SMALLER gravity = she rises higher and stays in the air longer (floaty).
  // jumpSpeed is the push-off speed. Height = jumpSpeed^2 / (2 * gravity).
  jump: {
    moon:  { gravity: 380, jumpSpeed: 420 },   // very floaty  (Moon gravity is 1/6 of Earth)
    mars:  { gravity: 520, jumpSpeed: 470 },   // floaty       (Mars gravity is about 1/3 of Earth)
    venus: { gravity: 900, jumpSpeed: 520 }    // closer to normal
  },

  // ----- the dust storm (Mars mission 3) -----
  storm: {
    rampSeconds: 45        // how long the storm takes to become strong (it never hurts her: it just gets harder to see)
  },

  // ----- the lunar rover (Moon mission 3) -----
  rover: {
    speed: 520,            // forward speed (the astronaut walks at 300)
    sideSpeed: 360,        // steering sideways
    size: 270,             // how big the rover is on the screen
    bodyRadius: 58,        // how wide the rover is for bumping into rocks
    stopSpeed: 90          // below this speed counts as "stopped" (needed at the research point)
  },

  // ----- optional pictures and voices (set to true AFTER you add the files) -----
  hasSidePictures: false,      // true if assets/images/astronaut/<suit>-side.png exist
  useRecordedVoices: true,     // true if assets/audio/voice/teacher-1.mp3, student-1.mp3, teacher-2.mp3 exist

  // ----- sound -----
  defaultVolume: 0.6,
  musicLevel: 0.35,        // music is quieter than effects (0 to 1)

  // ----- timings (in seconds) -----
  flashTime: 0.35,         // how long the camera flash lasts
  hintTime: 2.5,           // how long "Walk closer!" shows
  readingSecondsPerWord: 0.38,   // used when voice is off: time to read a speech bubble
  minBubbleSeconds: 2.2,
  travelSeconds: 8,        // length of the flat 2D travel animation
  travelSeconds3d: 14,     // length of the 3D travel movie (Earth, whole space, destination)

  // ----- Venus camera mini-game -----
  photosNeeded: 3,
  flashFlashWindow: 1.4    // how many seconds a lightning flash stays on screen
};
