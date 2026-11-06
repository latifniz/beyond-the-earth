/* =====================================================================
   FILE: js/levels/world.js
   WHAT IT DOES: Makes the ENDLESS ground. The world is cut into "cells"
   (520 wide, 420 deep). When a cell comes close to the player we create its
   rocks/craters/clouds using a seeded random number (same cell = same rocks
   every time). Cells far behind are deleted. Then it draws everything
   (decorations + mission objects + the player) from far to near.
   BELONGS TO: all planet levels.
   WHAT TO CHANGE: how many things appear: "perCell". Which kinds and sizes
   appear is set in each planet file (palette.decor).
   ===================================================================== */

Game.world = { cellWidth: 520, cellDepth: 420, perCell: 4, viewDepth: 2700, behindDepth: 90,
  // Things lying FLAT on the ground. They are drawn first, so nothing standing up is ever covered by them.
  flatTypes: { cloud: true, dust: true, crater: true, specks: true, pebbles: true, redDot: true, ring: true, scanPoint: true } };

// Make (or get from memory) the decorations of one cell.
Game.world.getCell = function (level, cellX, cellZ) {
  const key = cellX + "_" + cellZ;
  if (level.cells[key]) { return level.cells[key]; }

  const items = [];
  const kinds = level.planet.palette.decor;
  let totalWeight = 0;
  for (let k = 0; k < kinds.length; k++) { totalWeight += kinds[k].weight; }

  const perCell = level.planet.palette.perCell || Game.world.perCell;       // a planet can ask for fewer decorations
  const count = perCell + Math.floor(Game.terrain.hash(cellX, cellZ) * 3);
  for (let i = 0; i < count; i++) {
    // pick a kind by its weight
    let roll = Game.terrain.hash(cellX * 7 + i, cellZ * 13 + 2) * totalWeight;
    let chosen = kinds[0];
    for (let k = 0; k < kinds.length; k++) {
      roll -= kinds[k].weight;
      if (roll <= 0) { chosen = kinds[k]; break; }
    }
    const sizeRandom = Game.terrain.hash(cellX * 5 + i, cellZ * 3 + 7);
    items.push({
      type: chosen.type,
      x: (cellX + Game.terrain.hash(cellX + i, cellZ * 2 + 1)) * Game.world.cellWidth,
      z: (cellZ + Game.terrain.hash(cellX * 3 + 9, cellZ + i)) * Game.world.cellDepth,
      size: chosen.min + sizeRandom * (chosen.max - chosen.min),
      seed: cellX * 31 + cellZ * 17 + i
    });
  }
  level.cells[key] = items;
  return items;
};

// Delete cells that are far behind us (so memory never grows).
Game.world.forgetOldCells = function (level) {
  const oldestZ = Math.floor((level.worldZ - 1500) / Game.world.cellDepth);
  for (const key in level.cells) {
    const cellZ = parseInt(key.split("_")[1], 10);
    if (cellZ < oldestZ) { delete level.cells[key]; }
  }
};

// Build the list of everything that must be drawn this frame.
Game.world.collectDrawables = function (level) {
  const list = [];
  const firstCellX = Math.floor((level.worldX - 1100) / Game.world.cellWidth);
  const lastCellX = Math.floor((level.worldX + 1100) / Game.world.cellWidth);
  const firstCellZ = Math.floor((level.worldZ - Game.world.behindDepth) / Game.world.cellDepth);
  const lastCellZ = Math.floor((level.worldZ + Game.world.viewDepth) / Game.world.cellDepth);

  for (let cx = firstCellX; cx <= lastCellX; cx++) {
    for (let cz = firstCellZ; cz <= lastCellZ; cz++) {
      const items = Game.world.getCell(level, cx, cz);
      for (let i = 0; i < items.length; i++) { list.push(items[i]); }
    }
  }
  for (let i = 0; i < level.objects.length; i++) {
    if (!level.objects[i].hidden) { list.push(level.objects[i]); }
  }
  list.push({ type: "__player__", z: level.worldZ, x: level.worldX });
  // Flat things first, then standing things. Inside each group: far first, near last.
  list.sort(function (a, b) {
    const groupA = Game.world.flatTypes[a.type] ? 0 : 1;
    const groupB = Game.world.flatTypes[b.type] ? 0 : 1;
    if (groupA !== groupB) { return groupA - groupB; }
    return b.z - a.z;
  });
  return list;
};

// Draw everything from far to near.
Game.world.drawAll = function (ctx, level) {
  const palette = level.planet.palette;
  const list = Game.world.collectDrawables(level);
  const focal = Game.config.focalLength;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const distance = item.z - level.worldZ;
    if (distance < -Game.world.behindDepth || distance > Game.world.viewDepth) { continue; }
    if (item.type === "__player__") { Game.walker.drawPlayer(ctx, level); continue; }

    const spot = Game.walker.worldToScreen(level, item.x, item.z);
    // A standing rock that has just walked past her must not appear in front of her body.
    if (distance < 0 && !Game.world.flatTypes[item.type] && !item.id && Math.abs(spot.x - 640) < 170) { continue; }
    const onScreenSize = (item.size || 100) * spot.scale;
    if (spot.x < -300 || spot.x > 1580) { continue; }

    // Far things fade into the haze. Things that pass BEHIND her fade out quickly (so a big rock never covers her).
    const farFade = (Game.world.viewDepth - distance) / 900;
    const behindFade = (distance + Game.world.behindDepth) / Game.world.behindDepth;
    ctx.globalAlpha = Math.max(0, Math.min(1, farFade, behindFade));
    const drawFunction = Game.props.draw[item.type];
    if (drawFunction) { drawFunction(ctx, spot.x, spot.y, onScreenSize, item, palette, level.time); }
    item.screenX = spot.x;          // remember where it is on screen (used for clicking)
    item.screenY = spot.y;
    item.screenSize = onScreenSize;
  }
  ctx.globalAlpha = 1;
};
