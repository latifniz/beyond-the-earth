/* =====================================================================
   FILE: js/space/bodies.js
   WHAT IT DOES: Builds the 3D space objects: planets (Earth with clouds, Moon, Mars, Venus),
   the glowing atmosphere around a planet, the Sun, the Milky-Way star sky, orbit lines
   and name labels (like the NASA "Eyes on the Solar System" program).
   BELONGS TO: Travel screen and Destination cards.
   WHAT TO CHANGE: colors/strength of each planet's glow in "planetStyles".
   ===================================================================== */

Game.space.bodies = {};

// How each planet looks. "glow" is the atmosphere color (null = no atmosphere, like the Moon).
// glowPower: bigger = thinner glow hugging the edge. glowIntensity: how bright the glow is.
Game.space.planetStyles = {
  earth: { map: "earth-day", specular: "earth-specular", clouds: "earth-clouds", glow: 0x4aa8ff, glowPower: 2.6, glowIntensity: 1.7 },
  moon:  { map: "moon", bump: 0.18, glow: null },
  mars:  { map: "mars", bump: 0.22, glow: 0xff9966, glowPower: 3.6, glowIntensity: 0.9 },
  venus: { map: "venus", glow: 0xffd27a, glowPower: 2.0, glowIntensity: 1.5 }
};

// ===== ATMOSPHERE GLOW =====
// A slightly bigger invisible-in-the-middle ball that glows at its EDGE.
// "Fresnel effect": a ball seen from the side (at its edge) shines more than the middle.
// We also make the glow stronger on the side facing the Sun, weaker on the night side.
Game.space.bodies.makeAtmosphere = function (radius, color, power, intensity) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      power: { value: power },
      intensity: { value: intensity },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) }     // the Sun is at the center of our space
    },
    // The VERTEX shader runs once per corner of the shape. It passes data to the fragment shader.
    vertexShader: [
      "varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vWorldNormal; varying vec3 vWorldPos;",
      "void main() {",
      "  vNormal = normalize(normalMatrix * normal);                 // which way the surface faces (camera space)",
      "  vec4 viewPos = modelViewMatrix * vec4(position, 1.0);",
      "  vViewDir = normalize(-viewPos.xyz);                         // direction from the surface to the camera",
      "  vWorldNormal = normalize(mat3(modelMatrix) * normal);       // facing direction in world space",
      "  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;",
      "  gl_Position = projectionMatrix * viewPos;",
      "}"
    ].join("\n"),
    // The FRAGMENT shader runs once per pixel and decides its color.
    fragmentShader: [
      "uniform vec3 glowColor; uniform float power; uniform float intensity; uniform vec3 sunPosition;",
      "varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vWorldNormal; varying vec3 vWorldPos;",
      "void main() {",
      "  float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);   // 0 in the middle, 1 at the edge",
      "  float glow = pow(rim, power) * intensity;",
      "  vec3 toSun = normalize(sunPosition - vWorldPos);",
      "  float lit = clamp(dot(normalize(vWorldNormal), toSun) + 0.45, 0.0, 1.0);    // daylight side brighter",
      "  gl_FragColor = vec4(glowColor * glow * lit, glow * lit);",
      "}"
    ].join("\n"),
    transparent: true,
    blending: THREE.AdditiveBlending,     // add light on top (glow never makes things darker)
    depthWrite: false
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), material);
};

// ===== A PLANET =====
// Returns a Group: planet ball (+ cloud ball for Earth) (+ atmosphere glow).
// group.userData.spinner = the ball that rotates; group.userData.clouds = cloud ball (or null).
Game.space.bodies.makePlanet = function (name, radius) {
  const style = Game.space.planetStyles[name];
  const group = new THREE.Group();
  const sphere = new THREE.SphereGeometry(radius, 96, 64);     // more segments = rounder ball

  let material;
  if (name === "earth") {
    // Phong material can show a shiny "specular" highlight: oceans reflect the Sun, land does not.
    material = new THREE.MeshPhongMaterial({
      map: Game.space.tex(style.map),
      specularMap: Game.space.tex(style.specular),
      specular: new THREE.Color(0x4a5f7a),
      shininess: 22
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      map: Game.space.tex(style.map),
      color: name === "venus" ? 0xe6e0d0 : 0xffffff,     // Venus is very bright: tone it down a little
      roughness: 1,                                      // rough = not shiny (rock and cloud)
      metalness: 0,
      bumpMap: style.bump ? Game.space.tex(style.map) : null,   // reuse the picture as a bump map for craters
      bumpScale: style.bump || 0
    });
  }
  const body = new THREE.Mesh(sphere, material);
  group.add(body);
  group.userData.spinner = body;
  group.userData.clouds = null;

  if (style.clouds) {
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: Game.space.tex(style.clouds), transparent: true, opacity: 0.85, depthWrite: false
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 96, 64), cloudMaterial);
    group.add(clouds);
    group.userData.clouds = clouds;
  }
  if (style.glow) {
    group.add(Game.space.bodies.makeAtmosphere(radius * 1.045, style.glow, style.glowPower, style.glowIntensity));
  }
  return group;
};

// ===== A SOFT ROUND GLOW PICTURE (made by code) =====
// A circle that is bright in the middle and fades to transparent. Used for the Sun glow and ship glow.
Game.space.bodies.makeGlowTexture = function (innerColor, outerColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.35, outerColor);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
};

// A "sprite" is a flat picture that always faces the camera. We use it for glows.
Game.space.bodies.makeGlowSprite = function (innerColor, outerColor, size) {
  const material = new THREE.SpriteMaterial({
    map: Game.space.bodies.makeGlowTexture(innerColor, outerColor),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
};

// ===== THE SUN =====
// A ball with the real Sun picture that glows by itself (MeshBasicMaterial ignores light),
// plus two big soft glows around it. The bloom effect then makes it shine like a real photo.
Game.space.bodies.makeSun = function (radius) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ map: Game.space.tex("sun") });
  material.color.setRGB(2.6, 2.0, 1.3);            // colors above 1.0 are "brighter than white": the bloom effect then makes the Sun blaze
  const ball = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), material);
  group.add(ball);
  group.userData.spinner = ball;
  group.add(Game.space.bodies.makeGlowSprite("rgba(255,240,200,1)", "rgba(255,170,60,0.45)", radius * 6));
  group.add(Game.space.bodies.makeGlowSprite("rgba(255,200,120,0.4)", "rgba(255,120,40,0.08)", radius * 8));
  return group;
};

// ===== THE STAR SKY =====
// A HUGE ball around everything, painted with the Milky Way picture, seen from the INSIDE (BackSide).
// Then thousands of single stars (Points) are added on top for sparkle.
Game.space.bodies.makeStarfield = function () {
  const group = new THREE.Group();
  const skyMaterial = new THREE.MeshBasicMaterial({ map: Game.space.tex("milkyway"), side: THREE.BackSide, depthWrite: false });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 32), skyMaterial));

  const count = 2500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // pick a random direction on a sphere: random angles, then convert to x,y,z
    const angleA = Math.random() * Math.PI * 2;
    const angleB = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = 8000 * Math.sin(angleB) * Math.cos(angleA);
    positions[i * 3 + 1] = 8000 * Math.cos(angleB);
    positions[i * 3 + 2] = 8000 * Math.sin(angleB) * Math.sin(angleA);
    const warm = Math.random();                       // some stars bluish, some yellowish, like real stars
    colors[i * 3] = 0.75 + warm * 0.25;
    colors[i * 3 + 1] = 0.8 + Math.random() * 0.15;
    colors[i * 3 + 2] = 1.0 - warm * 0.35;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  // A tiny round soft dot picture, so stars are round (not square).
  const dot = document.createElement("canvas");
  dot.width = 32;
  dot.height = 32;
  const dotCtx = dot.getContext("2d");
  const dotGradient = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dotGradient.addColorStop(0, "rgba(255,255,255,1)");
  dotGradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
  dotGradient.addColorStop(1, "rgba(255,255,255,0)");
  dotCtx.fillStyle = dotGradient;
  dotCtx.fillRect(0, 0, 32, 32);
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 4.2, map: new THREE.CanvasTexture(dot), vertexColors: true, sizeAttenuation: false, depthWrite: false, transparent: true }));
  group.add(points);
  return group;
};

// ===== ORBIT LINE (a faint circle showing a planet's path around the Sun) =====
Game.space.bodies.makeOrbit = function (radius, color) {
  const points = [];
  for (let i = 0; i <= 160; i++) {
    const angle = i / 160 * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.3, depthWrite: false });
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
};

// ===== NAME LABEL (a word that floats next to a planet) =====
// The text is drawn on a hidden 2D canvas, then used as a sprite picture.
// sizeAttenuation:false = the label keeps the same size on screen however far the camera is.
Game.space.bodies.makeLabel = function (text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "600 34px Montserrat, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.shadowColor = "rgba(120,160,255,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillText(text, 128, 42);
  const material = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.2, 0.05, 1);
  return sprite;
};
