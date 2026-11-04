/* =====================================================================
   FILE: js/space/space3d.js
   WHAT IT DOES: The foundation of the REAL-LOOKING 3D SPACE (made with the Three.js
   library, which draws 3D with the graphics card using "WebGL").
   It (1) checks that 3D works on this computer, (2) loads the planet pictures
   ("textures") and (3) creates a "view" = a 3D drawing area with a glow effect (bloom).
   BELONGS TO: the Travel screen and the planet cards on the Destination screen.
   IF 3D DOES NOT WORK (old computer, or the library is missing): Game.space.ready stays
   false and the game automatically uses the older flat 2D pictures instead. So the game
   never breaks.

   SOME 3D WORDS (for beginners):
     scene    = the 3D world that holds all objects (planets, stars, the rocket)
     camera   = our eye; we choose where it stands and what it looks at
     mesh     = an object = a shape (geometry) + a skin (material)
     texture  = a picture wrapped around a shape (like a world map wrapped around a ball)
     light    = without light everything is black; the Sun is our light
     renderer = the painter that draws the scene as seen by the camera
   ===================================================================== */

Game.space = {
  ready: false,        // true when 3D works AND all textures are loaded
  textures: {},        // name -> THREE.Texture   (e.g. textures["earth-day"])
  failedReason: ""
};

// ===== 1. CAN WE DO 3D? =====

// Returns true if the library, the picture pack and WebGL are all available.
Game.space.isSupported = function () {
  if (typeof THREE === "undefined") { Game.space.failedReason = "Three.js library missing"; return false; }
  if (!Game.textureData) { Game.space.failedReason = "textures.js missing"; return false; }
  try {
    const test = document.createElement("canvas");
    const gl = test.getContext("webgl2") || test.getContext("webgl");
    if (!gl) { Game.space.failedReason = "WebGL not available"; return false; }
  } catch (error) {
    Game.space.failedReason = "WebGL error: " + error;
    return false;
  }
  return true;
};

// ===== 2. LOADING THE PICTURES =====

// Pictures that are COLOR pictures (they need "sRGB" so colors look right).
// The normal map and the specular map are data, not colors, so they are not in this list.
Game.space.colorTextures = ["earth-day", "earth-clouds", "moon", "mars", "venus", "sun", "milkyway"];

// Turn every data-URI picture of textures.js into a THREE.Texture. Calls onDone() when finished.
// (We use data URIs because Chrome blocks normal picture files in WebGL when the page is opened
//  by double-clicking it. See tools/make_texture_pack.py.)
Game.space.loadTextures = function (onDone) {
  if (!Game.space.isSupported()) { onDone(); return; }
  const names = Object.keys(Game.textureData);
  let waiting = names.length;
  function oneDone() {
    waiting--;
    if (waiting === 0) { Game.space.ready = true; onDone(); }
  }
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const image = new Image();
    image.onload = function () {
      const texture = new THREE.Texture(image);
      if (Game.space.colorTextures.indexOf(name) !== -1) { texture.encoding = THREE.sRGBEncoding; }
      texture.anisotropy = 4;                 // keeps pictures sharp when seen at an angle
      texture.needsUpdate = true;             // tells Three.js to send the picture to the graphics card
      Game.space.textures[name] = texture;
      oneDone();
    };
    image.onerror = function () { console.log("Could not load 3D texture", name); oneDone(); };
    image.src = Game.textureData[name];
  }
};

// Get a loaded texture by name (may be undefined if it failed to load).
Game.space.tex = function (name) { return Game.space.textures[name]; };

// ===== 3. A "VIEW": a 3D drawing area =====

// Create a renderer on a canvas. options: { alpha: true/false, bloom: true/false }
// Returns an object with render(scene, camera) and a bloom (glow) effect if asked.
Game.space.createView = function (canvas, options) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: !!options.alpha });
  renderer.setPixelRatio(1);                          // the stage is already scaled by CSS
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x000000, options.alpha ? 0 : 1);

  const view = { renderer: renderer, composer: null, width: canvas.width, height: canvas.height };

  if (options.bloom && THREE.EffectComposer && THREE.UnrealBloomPass) {
    // BLOOM = bright things (the Sun, glowing atmospheres) bleed light around them, like a real camera lens.
    // We draw the scene into the "composer", add the bloom pass, then a final pass that fixes the colors for the screen.
    view.composer = new THREE.EffectComposer(renderer);
    view.renderPass = new THREE.RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    view.composer.addPass(view.renderPass);
    view.composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(canvas.width, canvas.height), 0.55, 0.7, 0.82));
    // Colors inside the composer are "linear"; screens need "gamma" colors. This tiny shader converts them.
    view.composer.addPass(new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 clean = max(c.rgb - 0.004, 0.0); /* removes tiny noise in the dark */ gl_FragColor = vec4(pow(clean, vec3(1.0 / 2.2)), 1.0); }"
    }));
  } else {
    renderer.outputEncoding = THREE.sRGBEncoding;     // no composer: Three.js fixes the colors itself
  }

  // Draw one frame of "scene" as seen by "camera".
  view.render = function (scene, camera) {
    if (view.composer) {
      view.renderPass.scene = scene;
      view.renderPass.camera = camera;
      view.composer.render();
    } else {
      renderer.render(scene, camera);
    }
  };
  return view;
};
