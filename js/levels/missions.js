/* =====================================================================
   FILE: js/levels/missions.js
   WHAT IT DOES: The shared MISSION system for Moon, Mars and Venus. A planet file
   only DESCRIBES its missions; this file runs them:
     - "collect" stages: glowing items on the ground; click one when close -> it
       flies into the progress bar on the right.
     - "act" stages: a marked spot on the ground; when she is close, the INTERACT
       box appears; clicking runs a cutscene.
   A mission has one or more stages that happen in order. When all missions are
   done: pop-up "All Missions Complete" (or "Send to Earth" on Venus) -> Quiz.
   BELONGS TO: all planet levels.
   HOW TO ADD A MISSION: add an object to "missions" in the planet file (see moon.js).
   ===================================================================== */

Game.missions = {};

// Begin the first mission of the level.
Game.missions.start = function (level) {
  level.missionIndex = 0;
  level.stageIndex = 0;
  level.missionDone = [];
  level.stage = null;
  Game.missions.activateStage(level);
};

// Get the stage that is running now.
Game.missions.currentStageInfo = function (level) {
  return level.planet.missions[level.missionIndex].stages[level.stageIndex];
};

// Create the objects of the current stage and set the hint text.
Game.missions.activateStage = function (level) {
  const info = Game.missions.currentStageInfo(level);
  level.stage = { info: info, collected: 0, items: [], place: null, interactShown: false };
  if (info.prepare) { info.prepare(level); }

  if (info.kind === "collect") {
    const spots = info.setup ? info.setup(level) : info.items;
    for (let i = 0; i < spots.length; i++) {
      const object = { type: spots[i].type, x: spots[i].x, z: spots[i].z, size: spots[i].size || 140, collectible: true, collected: false, id: info.id + i };
      level.objects.push(object);
      level.stage.items.push(object);
    }
    Game.hud.showProgress(info.label, spots.length);
  } else if (info.kind === "act") {
    level.stage.place = info.place(level);
    level.stage.mark = { type: info.mark, x: level.stage.place.x, z: level.stage.place.z, size: info.markSize || 150, id: info.id + "mark", isMark: true };
    level.objects.push(level.stage.mark);
    if (info.scenery) { info.scenery(level, level.stage.place); }      // extra things around the marker (craters, rocks...)
  }
  Game.hud.setHint(info.hint);
};

// Run every frame: for "act" stages, check if she is close enough to the spot.
Game.missions.update = function (level) {
  const stage = level.stage;
  if (!stage || level.frozen || stage.info.kind !== "act") { return; }
  const dx = level.worldX - stage.place.x;
  const dz = level.worldZ - stage.place.z;
  const radius = stage.info.radius || 170;
  // Some stages ("needStop") also want the vehicle to be standing still.
  const speed = Math.abs(level.speedX) + Math.abs(level.speedZ);
  const isNear = Math.sqrt(dx * dx + dz * dz) < radius && (!stage.info.needStop || speed < Game.config.rover.stopSpeed);
  if (isNear && !stage.interactShown && !stage.running) {
    stage.interactShown = true;
    Game.audio.play("collect");
    Game.hud.showInteract(stage.info.message, stage.info.button, function () { Game.missions.runAction(level); });
  } else if (!isNear && stage.interactShown) {
    stage.interactShown = false;
    Game.hud.hideInteract();
  }
};

// The INTERACT button was pressed: run the cutscene of this stage.
Game.missions.runAction = function (level) {
  level.stage.running = true;
  level.stage.interactShown = false;
  level.stage.info.run(level, function () { Game.missions.finishStage(level); });
};

// The player clicked on the canvas: did she click an item? Returns true if yes.
Game.missions.tryCollect = function (level, point) {
  const stage = level.stage;
  if (!stage || level.frozen || stage.info.kind !== "collect") { return false; }
  for (let i = 0; i < stage.items.length; i++) {
    const item = stage.items[i];
    if (item.collected || item.screenX === undefined) { continue; }
    const half = Math.max(item.screenSize * 0.6, 30);
    const centerY = item.screenY - item.screenSize * 0.45;
    const hit = Math.abs(point.x - item.screenX) < half && Math.abs(point.y - centerY) < half;
    if (!hit) { continue; }

    const dx = Math.abs(item.x - level.worldX);
    const dz = Math.abs(item.z - level.worldZ);
    if (dx > Game.config.reachDistance || dz > Game.config.reachDistance) {
      Game.showToast(Game.text.level.walkCloser);
      return true;
    }
    Game.missions.collectItem(level, item);
    return true;
  }
  return false;
};

// Pick up an item: it flies to the bar; when it arrives the bar fills.
Game.missions.collectItem = function (level, item) {
  item.collected = true;
  item.hidden = true;
  Game.audio.play("collect");
  const sprite = item.type === "sample" ? "sample" : "stone";
  Game.effects.flyToBar(level, item.screenX, item.screenY - item.screenSize * 0.45, sprite, function () {
    level.stage.collected++;
    Game.hud.setProgress(level.stage.collected);
    Game.audio.play("collect");
    if (level.stage.collected === level.stage.items.length) { Game.missions.finishStage(level); }
  });
};

// All of this stage is done: next stage, or the mission is complete.
Game.missions.finishStage = function (level) {
  const mission = level.planet.missions[level.missionIndex];
  const info = level.stage.info;
  if (level.stage.mark && !info.keepMark) { level.stage.mark.hidden = true; }
  if (info.onComplete) { info.onComplete(level); }
  level.stage = null;
  Game.hud.hideInteract();
  Game.hud.hideProgress();
  level.stageIndex++;
  if (level.stageIndex < mission.stages.length) {
    Game.missions.activateStage(level);
  } else {
    Game.missions.finishMission(level);
  }
};

// A whole mission is done: green check, sound, then the next mission (or the ending).
Game.missions.finishMission = function (level) {
  Game.hud.checkMission(level.missionIndex);
  Game.audio.play("success");
  level.missionDone[level.missionIndex] = true;
  level.missionIndex++;
  level.stageIndex = 0;
  if (level.missionIndex < level.planet.missions.length) {
    Game.missions.activateStage(level);
    return;
  }
  Game.hud.setHint("");
  if (level.planet.finish === "send") {
    Game.hud.showSend(function () { level.planet.sendToEarth(level, function () { Game.missions.showAllComplete(level); }); });
  } else {
    setTimeout(function () { Game.missions.showAllComplete(level); }, 900);
  }
};

// The purple pop-up: "All Missions Complete" + Now Quiz.
Game.missions.showAllComplete = function (level) {
  const t = Game.text.level;
  Game.audio.play("success");
  Game.hud.showPopup(t.allDone, t.allDoneText, t.nowQuiz, function () {
    Game.showScreen("quiz", { planet: level.planet.key });
  });
};

// Where are the next goals? (the level draws arrows toward them)
Game.missions.currentTargets = function (level) {
  const stage = level.stage;
  const list = [];
  if (!stage) { return list; }
  if (stage.info.kind === "collect") {
    for (let i = 0; i < stage.items.length; i++) {
      if (!stage.items[i].collected) { list.push(stage.items[i]); }
    }
  } else if (stage.place && !stage.running) {
    list.push(stage.mark);
  }
  return list;
};
