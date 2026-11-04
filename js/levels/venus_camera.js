/* =====================================================================
   FILE: js/levels/venus_camera.js
   WHAT IT DOES: The CAMERA MINI-GAME on Venus. A camera view appears with yellow
   clouds moving slowly. Suddenly a bright lightning-like flash appears. The
   player must click CAPTURE while the flash is visible. 3 photos are needed.
   BELONGS TO: Venus level, mission 2.
   WHAT TO CHANGE: how many photos and how long the flash lasts: data/config.js
   (photosNeeded, flashFlashWindow). Words: text.js (planets.venus).
   ===================================================================== */

Game.venusCamera = { running: false, photos: 0, flashStart: -1, nextFlashAt: 0, onDone: null, startTime: 0, bolt: null };

// Open the camera view.
Game.venusCamera.start = function (level, onDone) {
  const cam = Game.venusCamera;
  cam.running = true;
  cam.photos = 0;
  cam.onDone = onDone;
  cam.startTime = performance.now();
  cam.flashStart = -1;
  cam.nextFlashAt = 2.2;
  document.getElementById("camera-instruction").textContent = Game.text.planets.venus.cameraInstruction;
  document.getElementById("capture-button").textContent = Game.text.planets.venus.capture;
  document.getElementById("camera-view").classList.remove("hidden");
  const old = document.getElementById("camera-photos");
  if (old) { old.remove(); }
  const strip = document.createElement("div");
  strip.id = "camera-photos";
  strip.style.cssText = "position:absolute;left:30px;bottom:30px;display:flex;gap:10px;";
  document.getElementById("camera-view").appendChild(strip);
  Game.venusCamera.updateCount();
  requestAnimationFrame(Game.venusCamera.frame);
};

Game.venusCamera.updateCount = function () {
  document.getElementById("camera-count").textContent = Game.text.planets.venus.photos + " " + Game.venusCamera.photos + "/" + Game.config.photosNeeded;
};

// Every frame: draw clouds, and decide when a lightning flash appears.
Game.venusCamera.frame = function (now) {
  const cam = Game.venusCamera;
  if (!cam.running) { return; }
  const seconds = (now - cam.startTime) / 1000;
  if (cam.flashStart < 0 && seconds > cam.nextFlashAt) {
    cam.flashStart = seconds;
    cam.bolt = { x: 260 + Math.random() * 760, seed: Math.random() * 100 };
    Game.audio.play("crackle");
  }
  if (cam.flashStart >= 0 && seconds - cam.flashStart > Game.config.flashFlashWindow) {
    cam.flashStart = -1;                                      // the flash faded: wait for the next one
    cam.nextFlashAt = seconds + 1.5 + Math.random() * 2;
  }
  cam.draw(document.getElementById("camera-canvas").getContext("2d"), seconds);
  requestAnimationFrame(cam.frame);
};

// Draw yellow clouds, the lightning flash (if any) and the camera frame.
Game.venusCamera.draw = function (ctx, seconds) {
  const cam = Game.venusCamera;
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, "#c9861c"); sky.addColorStop(1, "#ffd97a");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1280, 720);
  for (let i = 0; i < 16; i++) {                               // slow clouds drifting
    const x = ((i * 190 + seconds * (14 + (i % 4) * 6)) % 1700) - 220;
    const y = 80 + (i * 83) % 560;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 190);
    g.addColorStop(0, "rgba(255,238,160,0.75)"); g.addColorStop(1, "rgba(255,238,160,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 260, 80, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (cam.flashStart >= 0) {                                   // the bright electrical flash
    const age = seconds - cam.flashStart;
    const fade = 1 - age / Game.config.flashFlashWindow;
    ctx.fillStyle = "rgba(255,255,200," + (0.35 * fade) + ")";
    ctx.fillRect(0, 0, 1280, 720);
    ctx.strokeStyle = "rgba(255,255,255," + fade + ")";
    ctx.lineWidth = 7; ctx.shadowColor = "#fff36a"; ctx.shadowBlur = 40;
    ctx.beginPath();
    let x = cam.bolt.x, y = 60;
    ctx.moveTo(x, y);
    for (let i = 0; i < 9; i++) { x += (Game.terrain.hash(cam.bolt.seed, i) - 0.5) * 110; y += 62; ctx.lineTo(x, y); }
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  // camera frame: dark edges, corner marks, red REC dot, center cross
  ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, 1280, 30); ctx.fillRect(0, 690, 1280, 30);
  ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 3;
  const m = 70, c = 46;
  const corners = [[m, m, 1, 1], [1280 - m, m, -1, 1], [m, 720 - m, 1, -1], [1280 - m, 720 - m, -1, -1]];
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(corners[i][0] + corners[i][2] * c, corners[i][1]); ctx.lineTo(corners[i][0], corners[i][1]); ctx.lineTo(corners[i][0], corners[i][1] + corners[i][3] * c); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(620, 360); ctx.lineTo(660, 360); ctx.moveTo(640, 340); ctx.lineTo(640, 380); ctx.stroke();
  ctx.fillStyle = Math.floor(seconds * 2) % 2 === 0 ? "#ff3b4a" : "rgba(255,59,74,0.3)";
  ctx.beginPath(); ctx.arc(1170, 70, 9, 0, Math.PI * 2); ctx.fill();
};

// CAPTURE pressed.
document.getElementById("capture-button").addEventListener("click", function () {
  const cam = Game.venusCamera;
  if (!cam.running) { return; }
  if (cam.flashStart < 0) {                                    // pressed with no lightning on screen
    Game.showToast(Game.text.planets.venus.missed);
    Game.audio.play("fail");
    return;
  }
  Game.audio.play("shutter");
  const flash = document.getElementById("camera-flash");       // camera flash animation
  flash.classList.remove("go");
  void flash.offsetWidth;                                      // restarts the CSS animation
  flash.classList.add("go");

  // Save a small copy of the picture on the left (the "photo").
  const thumb = document.createElement("canvas");
  thumb.width = 160; thumb.height = 90;
  thumb.getContext("2d").drawImage(document.getElementById("camera-canvas"), 0, 0, 160, 90);
  thumb.style.cssText = "border:3px solid #fff;border-radius:6px;box-shadow:0 0 12px #000;";
  document.getElementById("camera-photos").appendChild(thumb);

  cam.photos++;
  cam.flashStart = -1;
  cam.nextFlashAt = (performance.now() - cam.startTime) / 1000 + 1.6 + Math.random() * 1.6;
  cam.updateCount();
  if (cam.photos >= Game.config.photosNeeded) {
    cam.running = false;
    setTimeout(function () {
      document.getElementById("camera-view").classList.add("hidden");
      cam.onDone();
    }, 1200);
  }
});
