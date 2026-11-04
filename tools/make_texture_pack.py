"""
FILE: tools/make_texture_pack.py
WHAT IT DOES: Packs the 3D planet pictures (assets/textures/3d/*) and the ground tiles (assets/textures/ground/*) into ONE JavaScript file
(js/data/textures.js). Each picture becomes a long text called a "data URI".

WHY WE NEED IT: When the game is opened by double-clicking index.html (file://), Chrome does not
allow WebGL (the 3D part) to use normal picture files as textures ("cross-origin" security rule).
A data URI is part of the JavaScript itself, so Chrome allows it. No server needed.

HOW TO USE: after you replace or add a picture in assets/textures/3d/, run:
    python3 tools/make_texture_pack.py
Then refresh the game. (Needs only Python 3, nothing to install.)
"""
import base64, os, sys

here = os.path.dirname(os.path.abspath(__file__))
folder = os.path.join(here, "..", "assets", "textures", "3d")
output = os.path.join(here, "..", "js", "data", "textures.js")

lines = [
    "/* =====================================================================",
    "   FILE: js/data/textures.js   (GENERATED - do not edit by hand)",
    "   WHAT IT DOES: the 3D planet pictures as data URIs, so WebGL can use them even from file://.",
    "   HOW TO REGENERATE: python3 tools/make_texture_pack.py",
    "   ===================================================================== */",
    "Game.textureData = {"]
names = sorted(os.listdir(folder))
for name in names:
    kind = "image/png" if name.endswith(".png") else "image/jpeg"
    with open(os.path.join(folder, name), "rb") as f:
        text = base64.b64encode(f.read()).decode("ascii")
    key = os.path.splitext(name)[0]                     # "earth-day.jpg" -> "earth-day"
    lines.append('  "%s": "data:%s;base64,%s",' % (key, kind, text))
lines.append("};")

# The ground tiles of the planet levels are packed too (the game reads their pixels to draw the floor,
# which Chrome also forbids for normal picture files opened from file://).
ground_folder = os.path.join(here, "..", "assets", "textures", "ground")
lines.append("Game.groundData = {")
for name in sorted(os.listdir(ground_folder)):
    with open(os.path.join(ground_folder, name), "rb") as f:
        text = base64.b64encode(f.read()).decode("ascii")
    lines.append('  "%s": "data:image/jpeg;base64,%s",' % (os.path.splitext(name)[0], text))
lines.append("};")
with open(output, "w") as f:
    f.write("\n".join(lines) + "\n")
print("Packed %d pictures into js/data/textures.js (%d KB)" % (len(names), os.path.getsize(output) // 1024))
