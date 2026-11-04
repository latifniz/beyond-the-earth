/* =====================================================================
   FILE: js/data/text.js
   WHAT IT DOES: Every sentence the player reads: titles, buttons,
   dialogue, hints, pop-ups, About text.
   WHO EDITS: Bushra (researcher) and anyone fixing spelling.
   HOW TO EDIT: change the words between the quote marks "like this".
   In index.html, an element with data-text="lab.letsGo" shows Game.text.lab.letsGo.
   ===================================================================== */

Game.text = {
  loading: { title: "Loading..." },

  intro: {
    line1: "BEYOND",
    line2: "THE EARTH",
    subtitle: "Classroom to Cosmos",
    tagline: "Explore the planets. Complete missions. Discover the unknown.",
    play: "PLAY NOW"
  },

  lab: {
    headerTitle: "SPACE EXPLORER",
    headerSub: "Your next adventure awaits",
    settings: "Settings",
    about: "About",
    letsGo: "Let's go",
    // The conversation: who speaks, and what they say (in order).
    dialogue: [
      { who: "teacher", text: "Congratulations! From our entire class, you have been selected for a special space exploration mission. You're so lucky!" },
      { who: "student", text: "Really, ma'am? I'm so excited! I've always wanted to explore space!" },
      { who: "teacher", text: "Then what are we waiting for? Let's go!" }
    ]
  },

  settings: { title: "Settings", sound: "Sound", on: "ON", off: "OFF", volume: "Volume", fullscreen: "Fullscreen", back: "Back" },

  about: {
    title: "About",
    // Each item is [type, text]. Types: h1, p, strong, h3
    body: [
      ["h1", "About Beyond The Earth"],
      ["p", "Beyond The Earth: Classroom to Cosmos is an educational space-exploration game created for our Class 9 STEAM Exhibition."],
      ["p", "The game follows a student's journey from her classroom into space, where she explores different planets, completes missions, collects discoveries, and learns fascinating facts about our Solar System."],
      ["p", "Our aim is to make learning science more interactive and enjoyable by combining education, exploration, and gaming."],
      ["strong", "Explore. Discover. Learn. Go Beyond The Earth."],
      ["h3", "Created by"],
      ["p", "A team of three Class 9 students and one teacher."],
      ["p", "Hadia as a developer<br>Aasiya as a graphic designer<br>Bushra as a researcher<br>Teacher: Miss Filza Nizamani"],
      ["h3", "Technologies"],
      ["p", "HTML, CSS and JavaScript."]
    ],
    back: "Back"
  },

  customize: {
    title: "Character Customization",
    subtitle: "Prepare your explorer for the journey!",
    suits: ["White & Blue", "Purple", "Pink"],
    next: "Next"
  },

  destination: {
    title: "CHOOSE YOUR DESTINATION",
    subtitle: "Your first space travel begins here.",
    back: "Back",
    missionLabel: "Mission",
    lockedHint: "Finish the previous mission to unlock this planet."
  },

  travel: {
    traveling: "Traveling to ",
    landed: "Landed at ",
    skip: "Skip ▶",
    venusCautionTitle: "⚠ Caution!",
    venusCaution: "We are in the upper atmosphere of Venus. We cannot land because the surface is too hot.",
    ok: "OK",
    // One true "Did you know?" fact for each planet.
    facts: {
      moon: "The Moon is slowly moving away from Earth, by about 3.8 centimetres every year.",
      mars: "Olympus Mons on Mars is the tallest volcano in our Solar System, about 22 km high.",
      venus: "A day on Venus is longer than its year: it spins very slowly."
    },
    didYouKnow: "Did you know? "
  },

  level: {
    missions: "Missions",
    missionsTitle: "Missions",
    back: "Back",
    walkCloser: "Walk closer!",
    interact: "INTERACT",
    controls: { left: "◀", right: "▶", forward: "▲", jump: "JUMP" },
    allDone: "All Missions Complete",
    allDoneText: "Great work, explorer! Now let's see what you learned.",
    nowQuiz: "Now Quiz",
    sendToEarth: "Send to Earth",
    dataSent: "Data sent to Earth!",
    stonesLabel: "Stones",
    partsLabel: "Parts",
    samplesLabel: "Samples"
  },


  // ----- Text inside the three planet levels -----
  planets: {
    moon: {
      title: "Moon Explorer",
      subtitle: "Explore the lunar surface and discover its secrets.",
      mission1: "Find Moon's special stones",
      mission2: "Plant your country's flag",
      hintStones: "Walk to the glowing purple stones and click them to collect.",
      hintFlag: "Walk to the red mark on the ground.",
      flagMessage: "You've reached the flag planting location!"
    },
    mars: {
      title: "Mars Explorer",
      subtitle: "Explore the red planet and uncover its secrets.",
      mission1: "Find a hidden lake in a Martian crater",
      mission2: "Repair the spacecraft",
      hintCrater: "Walk toward the big crater and reach the marked spot.",
      craterMessage: "You've reached the crater edge!",
      lakeText: "You have found a crater which was a water lake billions of years ago.",
      hintParts: "Find the battery and the spare part near the spacecraft.",
      hintRepair: "Return to the spacecraft.",
      repairMessage: "Parts ready! Repair the spacecraft.",
      activate: "ACTIVATE"
    },
    venus: {
      title: "Venus Explorer",
      subtitle: "Explore the clouds of Venus and discover its secrets.",
      mission1: "Collect a sample of Venus's clouds",
      mission2: "Take photos of lightning flashes of Venus clouds",
      hintSamples: "Walk to the three glowing marks and click each one.",
      hintTable: "Walk ahead to the equipment table.",
      tableMessage: "An equipment table with a camera!",
      takeCamera: "TAKE CAMERA",
      sprayTitle: "Cloud Spray",
      sprayText: "Humans can't stand on the clouds of Venus, so this spray will freeze the cloud vapor so you can walk.",
      cameraInstruction: "Watch carefully! Capture the electrical flashes!",
      capture: "CAPTURE",
      photos: "Photos",
      missed: "Too early! Wait for the bright flash.",
      allDoneVenus: "All Missions Complete"
    }
  },

  quiz: {
    title: "Quiz",
    questionWord: "Question",
    correct: "Correct",
    wrong: "Wrong",
    next: "Next",
    seeResult: "See Result",
    back: "Back",
    resultScore: "You got {n} out of 3 correct",
    // Result message for 3, 2, 1, 0 correct answers.
    results: ["Do hard work", "You need to study", "Learn more", "Great job!"]
  },

  finale: {
    title: "Mission Complete!",
    text: "You explored the Moon, Mars and Venus.",
    playAgain: "Play Again",
    back: "Back to Destinations"
  }
};
