/* =====================================================================
   FILE: js/levels/cutscene.js
   WHAT IT DOES: Plays a CUTSCENE: a list of steps, one after another, each with a
   duration. While a cutscene plays, the player cannot walk. Also draws things the
   astronaut carries (folded flag on her backpack, flag or camera in her hand).
   BELONGS TO: all planet levels. The steps themselves are written in the planet files
   (moon.js, mars.js, venus.js) so students can read them from top to bottom.
   HOW TO WRITE A CUTSCENE:
     Game.cutscene.play(level, [
        { time: 1.0, enter: function (level) {...}, update: function (level, p) {...} },
        { time: 2.0, update: function (level, p) {...} }      // p goes from 0 to 1 during the step
     ], function () { ...called when everything is finished... });
   ===================================================================== */

Game.cutscene = {};

// Start playing a list of steps.
Game.cutscene.play = function (level, steps, onDone) {
  level.cutscene = { steps: steps, index: -1, t: 0, onDone: onDone };
  level.pose = { view: "back", lean: 0, squash: 1, flip: false };
  Game.cutscene.nextStep(level);
};

// Move to the next step (or finish).
Game.cutscene.nextStep = function (level) {
  const scene = level.cutscene;
  if (scene.index >= 0 && scene.steps[scene.index].exit) { scene.steps[scene.index].exit(level); }
  scene.index++;
  scene.t = 0;
  if (scene.index >= scene.steps.length) {
    const onDone = scene.onDone;
    level.cutscene = null;
    level.pose = null;
    if (onDone) { onDone(); }
    return;
  }
  const step = scene.steps[scene.index];
  if (step.enter) { step.enter(level); }
};

// Called every frame by the level loop.
Game.cutscene.update = function (level, dt) {
  const scene = level.cutscene;
  if (!scene) { return; }
  const step = scene.steps[scene.index];
  scene.t += dt;
  const p = Math.min(1, scene.t / step.time);
  if (step.update) { step.update(level, p, dt); }
  if (scene.t >= step.time) { Game.cutscene.nextStep(level); }
};

// Smoothly go from a to b while p goes 0 -> 1.
Game.cutscene.mix = function (a, b, p) {
  const eased = p * p * (3 - 2 * p);
  return a + (b - a) * eased;
};

// Draw what she carries. info = { x, feetY, height } of the astronaut on screen.
//   level.carryingFlag = true      -> small folded flag on her backpack
//   level.hand = {type, open, ...} -> something in her hand (flag or camera)
Game.cutscene.drawCarried = function (ctx, level, info) {
  const options = { x: info.x, feetY: info.feetY, height: info.height, flip: false };
  const pack = Game.astronaut.backpackPosition(options);
  if (level.carryingFlag) {
    Game.props.drawFoldedFlag(ctx, pack.x + info.height * 0.17, pack.y + info.height * 0.05, info.height * 0.17);
  }
  const hand = level.hand;
  if (!hand) { return; }
  const spot = hand.fromBackpack ? { x: pack.x + (Game.astronaut.handPosition(options).x - pack.x) * hand.fromBackpack, y: pack.y + (Game.astronaut.handPosition(options).y - pack.y) * hand.fromBackpack } : Game.astronaut.handPosition(options);
  if (hand.type === "flag") {
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.rotate(hand.tilt || 0);
    const poleLength = info.height * 0.9;
    ctx.fillStyle = "#e8e8f2";
    ctx.fillRect(-2, -poleLength, 4, poleLength * 1.05);
    Game.props.drawFlagCloth(ctx, 2, -poleLength, info.height * 0.5, hand.open, 0.6, level.time);
    ctx.restore();
  } else if (hand.type === "foldedFlag") {
    Game.props.drawFoldedFlag(ctx, spot.x, spot.y, info.height * 0.17);
  } else if (hand.type === "camera") {
    ctx.save();
    ctx.translate(spot.x - info.height * (hand.raise || 0) * 0.08, spot.y - info.height * (hand.raise || 0) * 0.32);
    ctx.fillStyle = "#2b2b3a";
    Game.astronaut.roundRect(ctx, -16, -11, 32, 22, 4); ctx.fill();
    ctx.fillStyle = "#12121c"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6fb8ff"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
};
