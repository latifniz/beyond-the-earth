/* =====================================================================
   FILE: js/space/rocket3d.js
   WHAT IT DOES: Builds the 3D spacecraft from simple shapes (cylinder, cone, boxes, spheres).
   BELONGS TO: Travel screen.
   HOW TO USE: const rocket = Game.space.makeRocket();  scene.add(rocket);
     Every frame call Game.space.updateRocketFlame(rocket, seconds) to make the flame flicker.
   HOW THE SHAPE IS MADE: the rocket points UP the "y" axis (nose at the top). To make it fly
   toward a target we later turn it with a "quaternion" (a 3D rotation) in travel3d.js.
   WHAT TO CHANGE: colors (the numbers like 0xd741ff are colors in hexadecimal) and sizes.
   ===================================================================== */

Game.space.makeRocket = function () {
  const rocket = new THREE.Group();

  // Materials = the "skin" of each part. "metalness" and "roughness" decide how shiny it is.
  const whiteBody = new THREE.MeshStandardMaterial({ color: 0xf2f2fb, metalness: 0.35, roughness: 0.32 });
  const magenta = new THREE.MeshStandardMaterial({ color: 0xd741ff, metalness: 0.2, roughness: 0.4, emissive: 0x400a55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2540, metalness: 0.6, roughness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1c3a8a, metalness: 0.9, roughness: 0.1, emissive: 0x0a2a70 });

  // main body (a tube a bit wider at the bottom)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 2.2, 32), whiteBody);
  rocket.add(body);

  // nose cone on top
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 32), magenta);
  nose.position.y = 1.65;
  rocket.add(nose);

  // a magenta stripe around the body
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.49, 0.18, 32), magenta);
  stripe.position.y = -0.5;
  rocket.add(stripe);

  // round window on the front
  const window3d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), glass);
  window3d.position.set(0, 0.55, 0.38);
  window3d.scale.z = 0.5;
  rocket.add(window3d);

  // three fins around the bottom (copy the same fin 3 times, turning each by 120 degrees)
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.7), magenta);
    const angle = i * Math.PI * 2 / 3;
    fin.position.set(Math.sin(angle) * 0.62, -0.85, Math.cos(angle) * 0.62);
    fin.rotation.y = angle;
    rocket.add(fin);
  }

  // engine nozzle (dark cone, wide end down)
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.4, 24), dark);
  nozzle.position.y = -1.3;
  rocket.add(nozzle);

  // the flame: a see-through glowing cone pointing down. AdditiveBlending = it adds light.
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.2, 24), flameMaterial);
  flame.rotation.x = Math.PI;                  // flip the cone so the point faces down
  flame.position.y = -2.5;
  rocket.add(flame);
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.5, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  flameCore.rotation.x = Math.PI;
  flameCore.position.y = -2.15;
  rocket.add(flameCore);

  // a bright glow at the engine
  const glow = Game.space.bodies.makeGlowSprite("rgba(255,230,180,1)", "rgba(255,120,40,0.35)", 3.2);
  glow.position.y = -1.7;
  rocket.add(glow);

  rocket.userData.flame = flame;
  rocket.userData.flameCore = flameCore;
  return rocket;
};

// Make the flame flicker: its length changes quickly using sine waves of the time.
Game.space.updateRocketFlame = function (rocket, seconds) {
  const flicker = 0.85 + Math.sin(seconds * 45) * 0.1 + Math.sin(seconds * 31) * 0.08;
  rocket.userData.flame.scale.set(1, flicker, 1);
  rocket.userData.flameCore.scale.set(1, flicker * 1.1, 1);
};
