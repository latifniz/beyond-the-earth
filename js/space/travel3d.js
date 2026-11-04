/* =====================================================================
   FILE: js/space/travel3d.js
   WHAT IT DOES: The 3D TRAVEL MOVIE, inspired by NASA's "Eyes on the Solar System":
     1) Close to Earth: the rocket lifts off and we see the real Earth with clouds.
     2) The camera pulls far back: we see the whole space - the Sun, the orbits (circles),
        Venus, Earth, Mars, the Moon, all with name labels - and the rocket flying along its path.
     3) The camera swoops down to the destination planet; the rocket flies into it.
   BELONGS TO: Travel screen (js/screens/travel.js calls this every frame).
   WHAT TO CHANGE: planet sizes / distances in "layout"; camera moves in Game.travel3d.placeCamera.
   NOTE: sizes and distances are NOT to real scale (real space is too empty to look nice on screen).
   ===================================================================== */

Game.travel3d = { built: false, view: null };

// Where everything is. Distances are in "units". angle = position around the Sun in degrees.
Game.travel3d.layout = {
  sunRadius: 52,
  venus: { orbit: 230, angle: 72, radius: 16 },
  earth: { orbit: 340, angle: 0, radius: 20 },
  mars:  { orbit: 480, angle: -52, radius: 12 },
  moon:  { around: "earth", distance: 48, radius: 5.5 }
};

// ===== BUILD THE SCENE (only once) =====
Game.travel3d.build = function () {
  const T = Game.travel3d;
  T.view = Game.space.createView(document.getElementById("travel-gl"), { bloom: true });
  T.scene = new THREE.Scene();
  T.camera = new THREE.PerspectiveCamera(48, 1280 / 720, 0.3, 20000);   // 48 = field of view in degrees

  T.starfield = Game.space.bodies.makeStarfield();
  T.scene.add(T.starfield);

  T.sun = Game.space.bodies.makeSun(T.layout.sunRadius);
  T.scene.add(T.sun);

  // LIGHT: the Sun lights the planets. A PointLight sends light in all directions from one spot.
  // We also add a very dim AmbientLight so the night side is not pure black (stars/space glow).
  T.scene.add(new THREE.PointLight(0xfff2dd, 1.8, 0, 0));
  T.scene.add(new THREE.AmbientLight(0x30405f, 0.55));

  // The planets, each placed on its orbit circle.
  T.bodies = {};
  const names = ["venus", "earth", "mars"];
  for (let i = 0; i < names.length; i++) {
    const info = T.layout[names[i]];
    const planet = Game.space.bodies.makePlanet(names[i], info.radius);
    const angle = info.angle * Math.PI / 180;
    planet.position.set(Math.cos(angle) * info.orbit, 0, Math.sin(angle) * info.orbit);
    planet.add(Game.space.bodies.makeGlowSprite("rgba(190,220,255,0.35)", "rgba(120,160,255,0.08)", info.radius * 6));
    T.scene.add(planet);
    T.scene.add(Game.space.bodies.makeOrbit(info.orbit, 0x7fa8ff));
    T.bodies[names[i]] = { group: planet, radius: info.radius };
  }
  T.moon = Game.space.bodies.makePlanet("moon", T.layout.moon.radius);
  T.scene.add(T.moon);
  T.bodies.moon = { group: T.moon, radius: T.layout.moon.radius };

  // Name labels (like NASA Eyes).
  T.labels = {};
  const labelNames = { venus: "Venus", earth: "Earth", mars: "Mars", moon: "Moon" };
  for (const key in labelNames) {
    T.labels[key] = Game.space.bodies.makeLabel(labelNames[key]);
    T.scene.add(T.labels[key]);
  }
  const sunLabel = Game.space.bodies.makeLabel("Sun");
  sunLabel.position.set(0, T.layout.sunRadius + 26, 0);
  T.scene.add(sunLabel);
  T.labels.sun = sunLabel;

  // The rocket, a bright marker dot (so we can still see it from far away) and its path line.
  T.rocket = Game.space.makeRocket();
  T.scene.add(T.rocket);
  T.marker = Game.space.bodies.makeGlowSprite("rgba(255,255,255,1)", "rgba(215,65,255,0.5)", 0.05);
  T.marker.material.sizeAttenuation = false;
  T.scene.add(T.marker);
  T.trail = new THREE.Line(new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xe36bff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  T.scene.add(T.trail);
  T.built = true;
};

// ===== PREPARE FOR A NEW TRIP =====
// Called when the travel screen opens. planetName = "moon", "mars" or "venus".
Game.travel3d.start = function (planetName, flyEnd) {
  const T = Game.travel3d;
  if (!T.built) { T.build(); }
  T.target = planetName;
  T.flyEnd = flyEnd;
  T.moonAngleAtArrival = 2.1;      // where the Moon will be (around Earth) when the rocket arrives
  T.updatePlanets(0);

  // The PATH: a smooth curve (quadratic Bezier) from the Earth's surface to the target planet.
  const earthPos = T.bodies.earth.group.position.clone();
  const targetPos = T.bodies[planetName].group.position.clone();
  const targetRadius = T.bodies[planetName].radius;
  const earthRadius = T.bodies.earth.radius;
  const direction = targetPos.clone().sub(earthPos).normalize();
  T.p0 = earthPos.clone().add(direction.clone().multiplyScalar(earthRadius * 1.05));
  const length = targetPos.distanceTo(earthPos);
  // The middle "control point" pulls the path up and sideways so it curves instead of a straight line.
  T.pc = earthPos.clone().lerp(targetPos, 0.5).add(new THREE.Vector3(0, length * 0.22, 0))
    .add(new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(length * 0.12));
  const approach = targetPos.clone().sub(T.pc).normalize();
  T.p2 = targetPos.clone().sub(approach.multiplyScalar(targetRadius * 1.1));
  T.pathLength = length;

  // Pre-calculate 140 points of the path for the glowing trail line.
  T.pathPoints = [];
  for (let i = 0; i <= 140; i++) { T.pathPoints.push(T.bezier(i / 140)); }
  T.trail.geometry.setFromPoints(T.pathPoints);
  T.rocket.visible = true;
  T.marker.visible = true;
};

// A point on the path: u goes from 0 (start) to 1 (end).
// Bezier formula: (1-u)^2 * p0 + 2(1-u)u * control + u^2 * p2
Game.travel3d.bezier = function (u) {
  const T = Game.travel3d;
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return new THREE.Vector3(
    a * T.p0.x + b * T.pc.x + c * T.p2.x,
    a * T.p0.y + b * T.pc.y + c * T.p2.y,
    a * T.p0.z + b * T.pc.z + c * T.p2.z);
};

// ===== MOVE THE PLANETS A LITTLE EVERY FRAME =====
Game.travel3d.updatePlanets = function (seconds) {
  const T = Game.travel3d;
  const names = ["venus", "earth", "mars"];
  for (let i = 0; i < names.length; i++) {
    const group = T.bodies[names[i]].group;
    group.userData.spinner.rotation.y = seconds * 0.12 + i;           // planets spin slowly
    if (group.userData.clouds) { group.userData.clouds.rotation.y = seconds * 0.16; }   // clouds move a bit faster than the ground
  }
  T.moon.userData.spinner.rotation.y = seconds * 0.05;
  T.sun.userData.spinner.rotation.y = seconds * 0.03;
  // The Moon circles the Earth. We choose its angle so it is at a known place when the rocket arrives.
  const angle = T.moonAngleAtArrival + 0.22 * (seconds - T.flyEnd);
  const earthPos = T.bodies.earth.group.position;
  T.moon.position.set(earthPos.x + Math.cos(angle) * T.layout.moon.distance, 0, earthPos.z + Math.sin(angle) * T.layout.moon.distance);
};

// smoothstep: a number that goes from 0 to 1 smoothly between "from" and "to" (easy start and end).
Game.travel3d.smooth = function (value, from, to) {
  const x = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return x * x * (3 - 2 * x);
};

// ===== DRAW ONE FRAME =====
// seconds = time since the trip started. total = how long the whole screen lasts.
Game.travel3d.render = function (seconds) {
  const T = Game.travel3d;
  const u = Math.min(1, seconds / T.flyEnd);                    // 0 .. 1 = how far along the trip
  const eased = Game.travel3d.smooth(u, 0, 1) * 0.7 + u * 0.3;  // slow lift-off, faster cruise
  T.updatePlanets(seconds);

  // --- the rocket on its path, turned to face where it is going ---
  const position = T.bezier(eased);
  const ahead = T.bezier(Math.min(1, eased + 0.01));
  const tangent = ahead.clone().sub(position).normalize();
  T.rocket.position.copy(position);
  T.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);   // turn the nose (+y) toward "tangent"
  T.marker.position.copy(position);
  T.trail.geometry.setDrawRange(0, Math.max(2, Math.ceil(eased * 140)));
  Game.space.updateRocketFlame(T.rocket, seconds);

  T.placeCamera(seconds, u, position, tangent);

  // The rocket must stay visible: when the camera is far, we scale it up (but not too much).
  const cameraDistance = T.camera.position.distanceTo(position);
  const shipScale = Math.max(1, Math.min(3.2, cameraDistance / 55));
  T.rocket.scale.setScalar(u >= 1 ? 0.0001 : shipScale);        // gone when it enters the planet
  T.marker.visible = u < 1;
  T.marker.scale.set(0.035, 0.035, 1);

  T.updateOverlays(cameraDistance);
  T.starfield.position.copy(T.camera.position);                  // the sky travels with us, so it is always "far away"
  T.view.render(T.scene, T.camera);
};

// ===== THE CAMERA MOVIE =====
// Three camera positions are blended: CLOSE (behind the rocket at Earth), OVERVIEW (high above, seeing
// the whole space) and CHASE (near the rocket when it reaches the planet).
Game.travel3d.placeCamera = function (seconds, u, rocketPosition, tangent) {
  const T = Game.travel3d;
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

  // 1) CLOSE: next to the rocket, a little way OUT from the Earth's surface and to the side,
  //    so we see the rocket with the curved Earth below it. ("normal" = the direction straight up from the Earth.)
  const earthCenter = T.bodies.earth.group.position;
  const normal = rocketPosition.clone().sub(earthCenter).normalize();
  // The camera also stands on the SUNNY side of the Earth (toward the Sun at the center), so the Earth is lit, not dark.
  const towardSun = earthCenter.clone().multiplyScalar(-1).normalize();
  const close = rocketPosition.clone().add(normal.multiplyScalar(11)).add(towardSun.multiplyScalar(20)).add(side.clone().multiplyScalar(5)).add(up.clone().multiplyScalar(3));
  // 2) OVERVIEW: far away and high, looking at the middle of the path.
  const middle = T.p0.clone().lerp(T.p2, 0.5);
  const distance = Math.max(T.pathLength * 1.75, 200);
  const overview = middle.clone().add(new THREE.Vector3(0.25, 0.95, 0.7).normalize().multiplyScalar(distance));
  // 3) CHASE: near the rocket, looking at the target planet.
  const chase = rocketPosition.clone().add(tangent.clone().multiplyScalar(-9)).add(up.clone().multiplyScalar(3)).add(side.clone().multiplyScalar(-4));

  const toOverview = T.smooth(u, 0.12, 0.34);      // pull back
  const toChase = T.smooth(u, 0.66, 0.9);          // swoop in
  const position = close.clone().lerp(overview, toOverview).lerp(chase, toChase);
  // While close to Earth we look a bit BELOW the rocket (toward the Earth) so the planet fills the lower screen.
  const closeLook = rocketPosition.clone().lerp(earthCenter, 0.22);
  const lookAt = closeLook.lerp(middle, toOverview * (1 - toChase)).lerp(T.bodies[T.target].group.position, toChase * 0.8);

  // After arrival the camera dives toward the planet (the "landing") but stops just above its surface,
  // so we never end up INSIDE the ball (where we would see nothing).
  if (seconds > T.flyEnd) {
    const dive = Math.min(1, (seconds - T.flyEnd) / 2);
    const center = T.bodies[T.target].group.position;
    const away = position.clone().sub(center).normalize();
    const nearSurface = center.clone().add(away.multiplyScalar(T.bodies[T.target].radius * 1.9));
    position.lerp(nearSurface, dive);
  }
  // A little camera shake at lift-off feels powerful.
  if (seconds < 1.8) {
    const shake = (1 - seconds / 1.8) * 0.18;
    position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
  }
  T.camera.position.copy(position);
  T.camera.lookAt(lookAt);
};

// Labels and orbit lines fade in when the camera is far (overview) and fade out when it is close.
Game.travel3d.updateOverlays = function (cameraDistance) {
  const T = Game.travel3d;
  const farAmount = T.smooth(cameraDistance, 110, 260);
  for (const key in T.labels) {
    const label = T.labels[key];
    if (key !== "sun") {
      const body = T.bodies[key].group.position;
      label.position.set(body.x, body.y + T.bodies[key].radius * 1.9 + 4, body.z);
    }
    label.material.opacity = farAmount;
  }
  T.scene.children.forEach(function (child) {
    if (child.isLineLoop) { child.material.opacity = 0.32 * farAmount; }
  });
};
