/* =====================================================================
   FILE: js/space/cards3d.js
   WHAT IT DOES: Shows REAL-LOOKING spinning 3D planets (Moon, Mars, Venus) on the
   Destination cards instead of flat pictures.
   BELONGS TO: Destination screen.
   HOW IT WORKS: ONE small hidden 3D renderer draws each planet in turn; after drawing, we COPY the
   result onto the 2D canvas of each card (drawImage). That way three cards need only one 3D context.
   WHAT TO CHANGE: spin speed (spinSpeed), light direction (the DirectionalLight position).
   ===================================================================== */

Game.cards3d = { built: false, running: false, spinSpeed: 0.25 };

// ===== BUILD (once) =====
Game.cards3d.build = function () {
  const C = Game.cards3d;
  const canvas = document.createElement("canvas");
  canvas.width = 460;
  canvas.height = 460;
  C.renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });   // alpha: transparent background
  C.renderer.setPixelRatio(1);
  C.renderer.setSize(460, 460, false);
  C.renderer.setClearColor(0x000000, 0);
  C.renderer.outputEncoding = THREE.sRGBEncoding;

  C.scene = new THREE.Scene();
  C.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  C.camera.position.set(0, 0, 7.4);      // far enough that the whole planet and its glow fit inside the picture

  // Light from the upper-left, a soft blue fill from the right, so the planet looks round and 3D.
  const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.55);
  sunLight.position.set(-4, 2.2, 4);
  C.scene.add(sunLight);
  C.scene.add(new THREE.AmbientLight(0x3a4a78, 0.4));
  const fill = new THREE.DirectionalLight(0x6a7cff, 0.35);
  fill.position.set(4, -1, 2);
  C.scene.add(fill);

  C.planets = {};
  const names = ["moon", "mars", "venus"];
  for (let i = 0; i < names.length; i++) {
    const planet = Game.space.bodies.makePlanet(names[i], 1.5);
    // tell the atmosphere shader where the light comes from (far away, in the direction of the light)
    planet.traverse(function (child) {
      if (child.material && child.material.uniforms && child.material.uniforms.sunPosition) {
        child.material.uniforms.sunPosition.value.set(-400, 220, 400);
      }
    });
    planet.rotation.z = 0.25;           // tilt the axis a little, like a real planet
    planet.visible = false;
    C.scene.add(planet);
    C.planets[names[i]] = planet;
  }
  C.built = true;
};

// ===== START / STOP the animation =====
Game.cards3d.start = function () {
  const C = Game.cards3d;
  if (!C.built) { C.build(); }
  C.running = true;
  C.startTime = performance.now();
  document.getElementById("screen-destination").classList.add("gl-on");
  requestAnimationFrame(C.frame);
};

Game.cards3d.stop = function () { Game.cards3d.running = false; };

// Draw every card's planet, once per frame.
Game.cards3d.frame = function (now) {
  const C = Game.cards3d;
  if (!C.running) { return; }
  const seconds = (now - C.startTime) / 1000;
  const cards = document.querySelectorAll(".planet-card");
  for (let i = 0; i < cards.length; i++) {
    const name = cards[i].getAttribute("data-planet");
    const target = cards[i].querySelector(".planet-gl");
    for (const key in C.planets) { C.planets[key].visible = (key === name); }      // show only this card's planet
    const planet = C.planets[name];
    planet.userData.spinner.rotation.y = seconds * C.spinSpeed + i * 2;
    C.renderer.render(C.scene, C.camera);
    const ctx = target.getContext("2d");
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(C.renderer.domElement, 0, 0, target.width, target.height);       // copy the 3D picture onto the card
  }
  requestAnimationFrame(C.frame);
};
