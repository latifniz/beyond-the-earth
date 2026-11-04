/* =====================================================================
   FILE: js/drawing/realistic.js
   WHAT IT DOES: Makes the planet levels look REAL by using real-looking pictures:
     1) BACKDROP: a wide picture of the sky and far mountains (Moon, Mars, Venus pictures).
     2) TEXTURED GROUND: a picture of real ground (moon dust, mars sand, venus clouds) is laid on
        the floor in PERSPECTIVE, so it slides toward us as we walk. (Old games called this "mode 7".)
     3) COLOR GRADE: a soft dark edge (vignette) and a color wash, like a movie camera.
   BELONGS TO: all planet levels (called from walker.js -> Game.walker.render).
   IF A PICTURE IS MISSING: these functions return false and the older drawn sky/ground is used.
   WHAT TO CHANGE: each planet file (moon.js, mars.js, venus.js) says which picture to use in
   "backdrop" and "groundTexture". Replace the pictures in assets/images/backdrops/ and
   assets/textures/ground/ to change how the planets look.
   ===================================================================== */

Game.realistic = {};

// Get a preloaded picture if it is ready, otherwise null.
Game.realistic.getImage = function (path) {
  const image = Game.loadedImages[path];
  if (image && image.complete && image.naturalWidth > 0) { return image; }
  return null;
};

// ===== 1. BACKDROP =====
// Draws the sky picture so that its BOTTOM edge sits exactly on the horizon line.
// When we walk left/right the picture slides a little (parallax). It uses sin() so the slide
// stays small and smooth even if we walk sideways forever.
Game.realistic.drawBackdrop = function (ctx, level) {
  const info = level.planet.backdrop;
  if (!info) { return false; }
  const image = Game.realistic.getImage(info.image);
  if (!image) { return false; }

  const width = image.naturalWidth * info.scale;
  const height = image.naturalHeight * info.scale;
  const pan = Math.sin(level.worldX / 3000) * info.panRange;       // slides between -panRange and +panRange
  ctx.drawImage(image, 640 - width / 2 + pan, level.horizonY - height + (info.offsetY || 0), width, height);

  // Extra things in the sky (for example the second planet in the Mars sky).
  const sprites = info.sprites || [];
  for (let i = 0; i < sprites.length; i++) {
    const sprite = sprites[i];
    const picture = Game.realistic.getImage(sprite.image);
    if (!picture) { continue; }
    const size = sprite.size;
    ctx.drawImage(picture, sprite.x - size / 2 + pan * sprite.parallax, sprite.y - size / 2, size, size * picture.naturalHeight / picture.naturalWidth);
  }
  return true;
};

// ===== 2. TEXTURED GROUND ("mode 7") =====
// Idea: for EVERY row of pixels below the horizon we know how far away that row is
// (it is the opposite of worldToScreen in walker.js):
//
//   screen row y  ->  scale s = (y - horizon) / (groundLine - horizon)
//                 ->  distance ahead = focal / s - focal
//
// Then, for each pixel of that row, we find which pixel of the ground PICTURE it should show, and copy it.
// The picture repeats forever (we just wrap the numbers around), so the ground never ends.
// We do this by hand with numbers ("ImageData") because it is MUCH faster than asking the browser
// to paint 400 stretched strips every frame. To keep it fast we draw at half width and let the
// browser stretch it to full width (smoothly).
//
// MIP LEVELS: far away, one screen pixel covers many picture pixels, which would flicker. So we
// keep smaller, pre-shrunk copies of the picture (512, 256, 128, 64 pixels) and use a smaller one
// for far rows. This is exactly what 3D graphics cards do ("mipmapping").
Game.realistic.TILE = 512;      // ground pictures are 512 x 512 so we can wrap numbers with a fast "& 511"

// Read the pixels of the ground picture and make the smaller copies. Returns null if we cannot.
Game.realistic.prepareGround = function (name) {
  const source = Game.groundData && Game.groundData[name];
  const image = Game.loadedGround[name];
  if (!source || !image || !image.complete) { return null; }
  try {
    const levels = [];
    let size = Game.realistic.TILE;
    for (let level = 0; level < 4; level++) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const c = canvas.getContext("2d", { willReadFrequently: true });   // we read its pixels, so keep it on the CPU
      c.imageSmoothingQuality = "high";
      c.drawImage(image, 0, 0, size, size);                       // the browser shrinks (averages) the picture for us
      levels.push({ size: size, mask: size - 1, pixels: new Uint32Array(c.getImageData(0, 0, size, size).data.buffer) });
      size = size / 2;
    }
    return levels;
  } catch (error) {
    console.log("Ground picture could not be read, using the drawn ground:", error);
    return null;
  }
};

// Load the ground pictures from data URIs (once). Called by main.js while the loading bar runs.
Game.loadedGround = {};
Game.realistic.loadGroundImages = function (onDone) {
  const names = Game.groundData ? Object.keys(Game.groundData) : [];
  let waiting = names.length;
  if (waiting === 0) { onDone(); return; }
  function oneDone() { waiting--; if (waiting === 0) { onDone(); } }
  for (let i = 0; i < names.length; i++) {
    const image = new Image();
    image.onload = image.onerror = oneDone;
    Game.loadedGround[names[i]] = image;
    image.src = Game.groundData[names[i]];
  }
};

Game.realistic.drawGround = function (ctx, level) {
  const info = level.planet.groundTexture;
  if (!info) { return false; }
  if (level.groundLevels === undefined) {
    level.groundLevels = Game.realistic.prepareGround(info.name);
    const rows = 720 - level.horizonY;
    level.groundCanvas = document.createElement("canvas");
    level.groundCanvas.width = 640;                                    // half width (see above)
    level.groundCanvas.height = rows;
    level.groundImage = level.groundCanvas.getContext("2d").createImageData(640, rows);
    level.groundPixels = new Uint32Array(level.groundImage.data.buffer);
  }
  if (!level.groundLevels) { return false; }

  const horizon = level.horizonY;
  const span = Game.walker.groundLine - horizon;
  const focal = Game.config.focalLength;
  const wpx = info.tileSize / Game.realistic.TILE;           // world units covered by one picture pixel
  const out = level.groundPixels;
  const rows = 720 - horizon;

  for (let row = 0; row < rows; row++) {
    const s = (row + 0.5) / span;                            // scale of this row (see worldToScreen)
    const rowStart = row * 640;
    if (s < 0.012) { for (let x = 0; x < 640; x++) { out[rowStart + x] = 0; } continue; }
    const distance = focal / s - focal;                      // how far ahead this row is
    const textureV = (level.worldZ + distance) / wpx;        // which picture row (can be any number; we wrap it)
    const stepU = 2 / (s * wpx);                             // picture pixels per half-width output pixel
    const stepV = focal / (span * s * s * wpx);              // picture rows covered by one output row
    // choose the mip level: the more picture pixels one output pixel covers, the smaller picture we use
    const footprint = Math.max(stepU, stepV);
    let mip = 0;
    if (footprint > 1.6) { mip = 1; }
    if (footprint > 3.2) { mip = 2; }
    if (footprint > 6.4) { mip = 3; }
    const tile = level.groundLevels[mip];
    const shift = 1 / (1 << mip);                            // the smaller picture has fewer pixels
    const rowBase = ((textureV * shift) & tile.mask) * tile.size;
    let u = ((level.worldX - 640 / s) / wpx) * shift;        // picture x for the left edge of the screen
    const du = stepU * shift;
    const pixels = tile.pixels;
    const mask = tile.mask;
    for (let x = 0; x < 640; x++) {
      out[rowStart + x] = pixels[rowBase + ((u | 0) & mask)];   // copy one pixel of the ground picture
      u += du;
    }
  }
  level.groundCanvas.getContext("2d").putImageData(level.groundImage, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(level.groundCanvas, 0, horizon, 1280, rows);    // stretch to full width

  // FOG: the far ground fades into the color of the horizon (the air is hazy in the distance).
  const fog = ctx.createLinearGradient(0, horizon - 2, 0, horizon + rows * 0.5);
  fog.addColorStop(0, info.fog);
  fog.addColorStop(0.35, info.fogMid || info.fog);
  fog.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, horizon - 2, 1280, rows * 0.5 + 2);
  return true;
};

// ===== 3. COLOR GRADE (like a movie camera) =====
// A dark soft edge (vignette) pulls the eye to the center. "grade" is an optional color wash.
Game.realistic.drawGrade = function (ctx, level) {
  const vignette = ctx.createRadialGradient(640, 380, 330, 640, 380, 800);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,10," + (level.planet.vignette || 0.35) + ")");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1280, 720);
  if (level.planet.grade) {
    ctx.fillStyle = level.planet.grade;
    ctx.fillRect(0, 0, 1280, 720);
  }
};
