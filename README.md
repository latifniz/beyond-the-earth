# Beyond The Earth: Classroom to Cosmos

## 1. What the game is
A space game made by three Class 9 girls and their teacher for the STEAM Exhibition. A student is chosen for a space mission. She picks a space suit and visits the **Moon**, **Mars** and **Venus**. On each planet she completes missions (the Moon and Mars have three each, including a rover drive and a dust storm) and then answers a 3-question quiz. Finishing a planet unlocks the next one.

Made with only **HTML, CSS and JavaScript**. No internet is needed to play.

## 2. How to run it
- **Easiest:** double-click `index.html`. Use **Google Chrome** (or Edge).
- Or in VS Code: install "Live Server", right-click `index.html` -> "Open with Live Server".
- Tip for presenting: press **F11** (fullscreen) or use the Fullscreen button in Settings.
- Presenting tip: open `index.html?demo=1`. A small box appears at the top-left: **Unlock all** and jump to any level or quiz. Remove `?demo=1` for the real game.

## 2b. Realistic 3D graphics
This version uses **Three.js** (a 3D library for the browser) to show real-looking space:
- **Travel screen:** a movie like NASA's "Eyes on the Solar System". The rocket lifts off from a real-looking Earth with clouds, the camera pulls back to show the Sun, planet orbits and names, then dives down to the Moon, Mars or Venus.
- **Destination screen:** spinning 3D planets with glowing atmospheres.
- **Planet levels:** real-looking sky pictures, ground pictures laid on the floor in perspective, and lighting on the astronaut.
If the computer cannot do 3D, the game automatically falls back to the flat 2D version, so it always works.

**Files for this:** `js/space/` (the 3D code, with comments), `js/drawing/realistic.js` (backdrops and ground), `assets/vendor/` (Three.js), `assets/textures/` (planet pictures), `tools/make_texture_pack.py`.
**If you change a picture in `assets/textures/3d/` or `assets/textures/ground/`** run `python3 tools/make_texture_pack.py` and refresh. (Chrome does not let 3D use normal picture files when you double-click `index.html`, so the pictures are packed into `js/data/textures.js`.)

## 3. How to play
1. Click **PLAY NOW**. Listen to the teacher and the student. Click **Let's go**.
2. Pick a suit and click **Next**. Pick the **Moon**.
3. Move in all four directions with the on-screen buttons (hold them) or the keyboard:
   - **Arrow keys / W A S D** = walk, **Space** = jump, **E** = INTERACT
4. Click glowing items when you are close. Walk to marked spots and press **INTERACT** (or **ACTIVATE**, **TAKE CAMERA**).
5. Press **Missions** (top right) to see your list. Finish all the missions, press **Now Quiz**. (On Mars, mission 3 is a dust storm: find the shelter before it gets too thick, then press **E** to go in. On the Moon, mission 3 is the rover trip: walk to the rover, press **E** to get in, drive to the three glowing markers and press **E** to scan, then drive back to the station and press **E** to get out.)

## 4. Folder map
```
index.html          the only page (all screens are inside it)
css/                how things LOOK (one file per screen)
  variables.css       ALL colors, fonts, sizes
js/
  space/              3D space: space3d.js, bodies.js (planets, Sun, stars), rocket3d.js, travel3d.js, cards3d.js
  data/               config.js (numbers) - text.js (words) - quizzes.js (questions)
  core/               game.js (start + screen switching) - audio.js (music, sounds)
                      voice.js (talking) - save.js (remembering) - stars.js (star animations)
  screens/            one file per screen: intro, lab, settings, about, customize,
                      destination, travel, quiz, finale
  levels/             walker.js (walking engine) - world.js (endless ground)
                      missions.js - hud.js - cutscene.js - effects.js - controls.js
                      rover.js - storm.js - moon.js - mars.js - venus.js - venus_camera.js
  drawing/            astronaut.js - spacecraft.js - terrain.js - props.js - props_objects.js - props_rover.js
  main.js             loads pictures, then starts the game
assets/images/        pictures    assets/fonts/   fonts    assets/audio/voice/  (optional voices)
```

## 5. Who edits what
| Person | Files |
|---|---|
| **Hadia** (developer) | everything in `js/`, especially `levels/` and `core/`; numbers in `js/data/config.js` |
| **Aasiya** (designer) | `css/variables.css` (colors), other `css/` files, pictures in `assets/images/` |
| **Bushra** (researcher) | `js/data/quizzes.js` (questions), `js/data/text.js` (words) |

## 6. How to change common things
- **A title or sentence:** `js/data/text.js`. Change the words between the quote marks.
- **A dialogue line in the lab:** `text.js` -> `lab` -> `dialogue`.
- **A color:** `css/variables.css`, e.g. `--neon-magenta: #D741FF;`.
- **The default volume:** `js/data/config.js` -> `defaultVolume` (0 to 1).
- **Add a quiz question:** in `js/data/quizzes.js` copy one `{ question, options, correct, explanation }` block. `correct` counts from 0 (0 = first option). The quiz asks **all** questions in the list, so keep 3 per planet (the result messages are made for 3).
- **Change a planet's gravity / jump:** `js/data/config.js` -> `jump` -> `moon` -> `gravity` (smaller = floatier) and `jumpSpeed` (bigger = higher).
- **Walking speed:** `config.js` -> `walkSpeed`.
- **Replace an image:** put a new file in `assets/images/` with the **same name**.
- **Use real astronaut side pictures:** add `assets/images/astronaut/<suit>-side.png` (suits: `white-blue`, `purple`, `pink`; facing right, transparent background), then set `hasSidePictures: true` in `js/data/config.js`.

## 7. Sound and voice help
- Browsers block sound until the first click. The **PLAY NOW** click starts the music.
- Music and effects are made by the computer (`js/core/audio.js`). No sound files needed.
- The talking voices come from your computer (the "speechSynthesis" feature of the browser). **Voices are different on every computer.** Chrome on Windows has nice ones. If the teacher and student sound the same, that computer has only one English voice.
- **Recorded voices:** the game now plays real recordings from `assets/audio/voice/` (`teacher-1.mp3`, `student-1.mp3`, `teacher-2.mp3`), so it sounds the same on every computer. To use your own recordings, replace those files (same names). If a file is missing the game falls back to the computer voice. To switch recordings off, set `useRecordedVoices: false` in `js/data/config.js`.
- Sound OFF in Settings mutes music, effects **and** voices. The speech bubbles still appear and move on by themselves.

## 8. Troubleshooting
| Problem | Fix |
|---|---|
| No sound | Click once on the page first. Check Settings: Sound ON, volume not zero. Check the computer volume. |
| No voice, only text | Your browser has no English voice. Use Chrome, or add recorded voices (section 7). |
| Pictures or fonts look wrong | Make sure the whole folder is kept together (do not move `index.html` alone). |
| Everything is stuck on "Loading..." | Press F12 -> Console and read the red message. Usually a file name was changed. |
| Game looks small | The game keeps a 16:9 shape; the black bars are normal. Press F11 for fullscreen. |
| Progress is wrong while testing | Open the browser console and type `localStorage.clear()` then refresh. |

## 9. Publish for free on GitHub Pages
1. Create a free account on github.com and click **New repository**. Name it e.g. `beyond-the-earth`. Keep it **Public**.
2. Click **uploading an existing file**, drag in **all** files and folders of this project (so `index.html` is at the top), and click **Commit changes**.
3. Go to **Settings -> Pages**. Under "Branch" choose `main` and `/ (root)`, then **Save**.
4. After 1 to 2 minutes your game is at `https://YOUR-NAME.github.io/beyond-the-earth/`.

## 10. Credits
Team: Hadia (developer), Aasiya (graphic designer), Bushra (researcher), teacher Miss Filza Nizamani. Space photos from NASA. Fonts Fredoka and Montserrat (SIL Open Font License). Full list in `CREDITS.md`.
