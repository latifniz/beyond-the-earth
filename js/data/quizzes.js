/* =====================================================================
   FILE: js/data/quizzes.js
   WHAT IT DOES: All quiz questions for Moon, Mars and Venus.
   WHO EDITS: Bushra (researcher).

   >>> NOTE FOR THE RESEARCHER: please double-check every fact below with a
   >>> trusted source (NASA, ESA, your science book) before the exhibition.

   HOW TO EDIT:
   - "options" is the list of 4 answers.
   - "correct" is the NUMBER of the right option. Counting starts at 0:
       0 = first option, 1 = second, 2 = third, 3 = fourth.
   - "explanation" is shown after the player answers (1 or 2 short lines).
   ===================================================================== */

Game.quizzes = {

  // ===== MOON =====
  moon: [
    {
      question: "How strong is the Moon's gravity compared to Earth's?",
      options: ["The same as Earth's", "About one sixth of Earth's", "About twice Earth's", "The Moon has no gravity"],
      correct: 1,
      explanation: "The Moon's gravity is about one sixth of Earth's. That is why astronauts can jump so high there!"
    },
    {
      question: "What is the Moon called, because it moves around the Earth?",
      options: ["A star", "A comet", "A natural satellite", "A planet"],
      correct: 2,
      explanation: "The Moon is Earth's only natural satellite. It travels around the Earth in about 27 days."
    },
    {
      question: "Why is the sky black on the Moon, even in the daytime?",
      options: ["The Moon has almost no atmosphere to scatter sunlight", "It is always night on the Moon", "The Moon's clouds are black", "The Moon is too far from the Sun"],
      correct: 0,
      explanation: "Earth's blue sky comes from air scattering sunlight. The Moon has almost no air, so the sky stays black."
    }
  ],

  // ===== MARS =====
  mars: [
    {
      question: "Why does Mars look red?",
      options: ["It is covered in red paint-like lava lakes", "Its soil and dust contain iron oxide (rust)", "It is very close to the Sun", "It is covered by red oceans"],
      correct: 1,
      explanation: "Mars's soil has a lot of iron oxide, which is rust. That gives the planet its red-orange color."
    },
    {
      question: "What did scientists find evidence of on Mars?",
      options: ["Cities built by people", "Thick green forests", "Rivers and lakes of water, long ago", "A huge ocean of lava today"],
      correct: 2,
      explanation: "Rovers found dried-up river beds and lake craters. Mars had flowing water billions of years ago."
    },
    {
      question: "How strong is gravity on Mars compared to Earth?",
      options: ["The same as Earth", "About 38% of Earth's (a bit more than one third)", "About three times Earth's", "There is no gravity on Mars"],
      correct: 1,
      explanation: "Mars has about 38% of Earth's gravity, so you would weigh much less there and jump higher."
    }
  ],

  // ===== VENUS =====
  venus: [
    {
      question: "Why is Venus the hottest planet in our Solar System?",
      options: ["It is the closest planet to the Sun", "Its thick carbon dioxide atmosphere traps heat", "It is made of hot lava inside only", "It has no clouds"],
      correct: 1,
      explanation: "Venus has a very thick atmosphere of carbon dioxide (CO₂). It traps heat like a blanket, so it is hotter than even Mercury."
    },
    {
      question: "What are the clouds of Venus mostly made of?",
      options: ["Water drops, like Earth's clouds", "Sand and dust", "Droplets of sulfuric acid", "Pure oxygen"],
      correct: 2,
      explanation: "The clouds of Venus are mostly droplets of sulfuric acid. They are not like the rain clouds of Earth."
    },
    {
      question: "About how hot is the surface of Venus?",
      options: ["About 15 °C, like Earth", "About 100 °C, like boiling water", "About 465 °C, hot enough to melt lead", "About -100 °C"],
      correct: 2,
      explanation: "The surface of Venus is about 465 °C. That is hot enough to melt lead, so no spacecraft can stay there long."
    }
  ]
};
