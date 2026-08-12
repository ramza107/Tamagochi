"""
Cute pastel baby-dragon Nuri matching the user reference:
mint-blue body, peach belly/wings/horns, huge glossy teal eyes, sitting pose.
"""
import bpy
import bmesh
import math
import os

OUT_GLB = "/workspace/assets/nuri3d/nuri.glb"
OUT_PREVIEW = "/workspace/assets/nuri3d/nuri_preview.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.cycles.use_denoising = True
try:
    scene.cycles.device = "CPU"
except Exception:
    pass
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.filepath = OUT_PREVIEW
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = True
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 120

# palette from reference
MINT = (0.62, 0.88, 0.92)
MINT_DEEP = (0.42, 0.74, 0.82)
PEACH = (0.99, 0.68, 0.58)
PEACH_SOFT = (1.0, 0.8, 0.72)
TEAL_EYE = (0.12, 0.58, 0.66)
CRYSTAL = (0.6, 0.9, 0.98)
BLUSH = (1.0, 0.5, 0.55)

def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m, bsdf

def paint(bsdf, rgb, roughness=0.45, metallic=0.0, emit=None, emit_s=0.0):
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emit is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = emit_s
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.45
    if "Coat Weight" in bsdf.inputs and roughness < 0.25:
        bsdf.inputs["Coat Weight"].default_value = 0.7
        bsdf.inputs["Coat Roughness"].default_value = 0.08

def soft_skin(name, rgb, roughness=0.55):
    m, bsdf = new_mat(name)
    paint(bsdf, rgb, roughness=roughness)
    # subtle subsurface-ish via sheen
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.25
    return m

mat_body = soft_skin("BodyMint", MINT, 0.58)
mat_deep = soft_skin("BodyDeep", MINT_DEEP, 0.62)
mat_peach = soft_skin("Peach", PEACH, 0.5)
mat_peach_soft = soft_skin("PeachSoft", PEACH_SOFT, 0.48)
mat_crystal, c_bsdf = new_mat("Crystal")
paint(c_bsdf, CRYSTAL, roughness=0.12, metallic=0.15, emit=CRYSTAL, emit_s=0.8)
if "Transmission Weight" in c_bsdf.inputs:
    c_bsdf.inputs["Transmission Weight"].default_value = 0.35
mat_eye_w, ew = new_mat("EyeWhite")
paint(ew, (0.98, 0.99, 1.0), roughness=0.12)
mat_iris, ir = new_mat("Iris")
paint(ir, TEAL_EYE, roughness=0.22, emit=(0.1, 0.4, 0.45), emit_s=0.25)
mat_pupil, pu = new_mat("Pupil")
paint(pu, (0.05, 0.08, 0.1), roughness=0.35)
mat_shine, sh = new_mat("Shine")
paint(sh, (1, 1, 1), roughness=0.05, emit=(1, 1, 1), emit_s=0.5)
mat_lash, la = new_mat("Lash")
paint(la, (0.12, 0.18, 0.22), roughness=0.6)
mat_blush, bl = new_mat("Blush")
paint(bl, BLUSH, roughness=0.7, emit=BLUSH, emit_s=0.15)
if "Alpha" in bl.inputs:
    bl.inputs["Alpha"].default_value = 0.45
mat_blush.blend_method = "BLEND"
mat_mouth, mo = new_mat("Mouth")
paint(mo, (0.55, 0.28, 0.32), roughness=0.55)

def smooth(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()

def parent(o, p):
    o.parent = p

def apply_scale(o):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

def sphere(name, loc, scale, mat, seg=48, ring=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    apply_scale(o)
    o.data.materials.append(mat)
    smooth(o)
    return o

def cone(name, loc, scale, mat, verts=16):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=1, radius2=0.05, depth=2, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    apply_scale(o)
    o.data.materials.append(mat)
    smooth(o)
    return o

# --- hierarchy ---
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
root = bpy.context.object
root.name = "NuriRoot"

bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0.55))
body_pivot = bpy.context.object
body_pivot.name = "BodyPivot"
parent(body_pivot, root)

# sitting pear body — chibi: big head
belly = sphere("Belly", (0, 0.05, -0.15), (0.7, 0.65, 0.58), mat_body, 64, 48)
tummy = sphere("Tummy", (0, 0.42, -0.18), (0.45, 0.26, 0.48), mat_peach, 48, 32)
for i, z in enumerate([-0.32, -0.15, 0.02]):
    plate = sphere(f"Plate{i}", (0, 0.55, z), (0.36 - i * 0.02, 0.07, 0.09), mat_peach_soft, 24, 16)
    parent(plate, body_pivot)
head = sphere("Head", (0, 0.12, 0.95), (0.88, 0.8, 0.82), mat_body, 64, 48)
cheek_l = sphere("CheekL", (-0.55, 0.5, 0.82), (0.24, 0.18, 0.2), mat_body, 24, 16)
cheek_r = sphere("CheekR", (0.55, 0.5, 0.82), (0.24, 0.18, 0.2), mat_body, 24, 16)
for o in (belly, tummy, head, cheek_l, cheek_r):
    parent(o, body_pivot)

# blush
blush_l = sphere("BlushL", (-0.4, 0.55, 0.62), (0.12, 0.04, 0.08), mat_blush, 16, 12)
blush_r = sphere("BlushR", (0.4, 0.55, 0.62), (0.12, 0.04, 0.08), mat_blush, 16, 12)
parent(blush_l, body_pivot)
parent(blush_r, body_pivot)

# horns (peach) — clearly on top
horn_l = cone("HornL", (-0.28, 0.05, 1.65), (0.1, 0.1, 0.22), mat_peach, 12)
horn_r = cone("HornR", (0.28, 0.05, 1.65), (0.1, 0.1, 0.22), mat_peach, 12)
horn_l.rotation_euler = (math.radians(-18), math.radians(-18), 0)
horn_r.rotation_euler = (math.radians(-18), math.radians(18), 0)
parent(horn_l, body_pivot)
parent(horn_r, body_pivot)

# fin ears
ear_l = sphere("EarL", (-0.7, 0.05, 1.05), (0.22, 0.1, 0.32), mat_body, 24, 16)
ear_r = sphere("EarR", (0.7, 0.05, 1.05), (0.22, 0.1, 0.32), mat_body, 24, 16)
ear_l.rotation_euler.z = math.radians(25)
ear_r.rotation_euler.z = math.radians(-25)
inner_l = sphere("EarInnerL", (-0.72, 0.12, 1.05), (0.14, 0.05, 0.22), mat_peach, 16, 12)
inner_r = sphere("EarInnerR", (0.72, 0.12, 1.05), (0.14, 0.05, 0.22), mat_peach, 16, 12)
for o in (ear_l, ear_r, inner_l, inner_r):
    parent(o, body_pivot)

# forehead crystals
for i, x in enumerate([-0.12, 0.0, 0.12]):
    gem = cone(f"ForeGem{i}", (x, 0.55, 1.28), (0.05, 0.05, 0.09), mat_crystal, 6)
    gem.rotation_euler.x = math.radians(20)
    parent(gem, body_pivot)

# huge eyes
def make_eye(side, x):
    g = bpy.data.objects.new(f"Eye{side}", None)
    bpy.context.collection.objects.link(g)
    g.empty_display_type = "PLAIN_AXES"
    g.location = (x, 0.7, 1.0)
    parent(g, body_pivot)
    white = sphere(f"Eye{side}W", (0, 0, 0), (0.3, 0.24, 0.28), mat_eye_w, 32, 24)
    iris = sphere(f"Eye{side}I", (0, 0.12, -0.02), (0.18, 0.15, 0.17), mat_iris, 28, 20)
    pup = sphere(f"Eye{side}P", (0, 0.2, -0.02), (0.09, 0.08, 0.08), mat_pupil, 16, 12)
    shine = sphere(f"Eye{side}S", (0.08, 0.26, 0.07), (0.06, 0.05, 0.05), mat_shine, 12, 8)
    shine2 = sphere(f"Eye{side}S2", (-0.06, 0.22, -0.04), (0.025, 0.02, 0.02), mat_shine, 10, 8)
    for i, (lx, lz) in enumerate([(-0.14, 0.2), (-0.02, 0.26), (0.12, 0.2)]):
        lash = sphere(f"Lash{side}{i}", (lx, 0.14, lz), (0.018, 0.012, 0.07), mat_lash, 8, 6)
        parent(lash, g)
    for o in (white, iris, pup, shine, shine2):
        parent(o, g)
    return g

eye_l = make_eye("L", -0.34)
eye_r = make_eye("R", 0.34)

# lids for blink
lid_l = sphere("LidL", (-0.34, 0.72, 1.2), (0.32, 0.12, 0.16), mat_body, 24, 16)
lid_r = sphere("LidR", (0.34, 0.72, 1.2), (0.32, 0.12, 0.16), mat_body, 24, 16)
parent(lid_l, body_pivot)
parent(lid_r, body_pivot)

# soft smile
bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.018, location=(0, 0.68, 0.58))
mouth = bpy.context.object
mouth.name = "Mouth"
mouth.rotation_euler = (math.radians(100), 0, 0)
mouth.scale = (1.0, 0.4, 1.0)
apply_scale(mouth)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
mouth.data.materials.append(mat_mouth)
parent(mouth, body_pivot)

# snout tip
snout = sphere("Snout", (0, 0.72, 0.7), (0.16, 0.12, 0.1), mat_peach_soft, 24, 16)
parent(snout, body_pivot)

# arms (paws together cute pose)
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(-0.28, 0.35, 0.15))
arm_l = bpy.context.object
arm_l.name = "ArmL"
parent(arm_l, root)
al = sphere("ArmLMesh", (0, 0, 0), (0.16, 0.18, 0.28), mat_body, 24, 16)
paw_l = sphere("PawL", (0.08, 0.12, -0.28), (0.14, 0.12, 0.12), mat_peach, 16, 12)
parent(al, arm_l)
parent(paw_l, arm_l)

bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.28, 0.35, 0.15))
arm_r = bpy.context.object
arm_r.name = "ArmR"
parent(arm_r, root)
ar = sphere("ArmRMesh", (0, 0, 0), (0.16, 0.18, 0.28), mat_body, 24, 16)
paw_r = sphere("PawR", (-0.08, 0.12, -0.28), (0.14, 0.12, 0.12), mat_peach, 16, 12)
parent(ar, arm_r)
parent(paw_r, arm_r)
# slight inward rotation so paws meet
arm_l.rotation_euler = (math.radians(25), 0, math.radians(18))
arm_r.rotation_euler = (math.radians(25), 0, math.radians(-18))

# feet sitting
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(-0.32, 0.25, -0.55))
foot_l = bpy.context.object
foot_l.name = "FootL"
parent(foot_l, root)
fl = sphere("FootLMesh", (0, 0, 0), (0.22, 0.28, 0.14), mat_body, 20, 12)
parent(fl, foot_l)
for i in range(3):
    claw = sphere(f"ClawL{i}", ((i - 1) * 0.08, 0.22, -0.02), (0.04, 0.06, 0.035), mat_peach, 10, 8)
    parent(claw, foot_l)

bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.32, 0.25, -0.55))
foot_r = bpy.context.object
foot_r.name = "FootR"
parent(foot_r, root)
fr = sphere("FootRMesh", (0, 0, 0), (0.22, 0.28, 0.14), mat_body, 20, 12)
parent(fr, foot_r)
for i in range(3):
    claw = sphere(f"ClawR{i}", ((i - 1) * 0.08, 0.22, -0.02), (0.04, 0.06, 0.035), mat_peach, 10, 8)
    parent(claw, foot_r)

# tiny wings
def make_wing(side, x):
    g = bpy.data.objects.new(f"Wing{side}", None)
    bpy.context.collection.objects.link(g)
    g.empty_display_type = "PLAIN_AXES"
    g.location = (x, -0.05, 0.4)
    parent(g, body_pivot)
    bone = sphere(f"WingBone{side}", (0.22 * (1 if x > 0 else -1), 0, 0.15), (0.07, 0.06, 0.28), mat_deep, 12, 8)
    membrane = sphere(f"WingMem{side}", (0.42 * (1 if x > 0 else -1), 0.08, 0.02), (0.32, 0.05, 0.36), mat_peach, 16, 12)
    tip = sphere(f"WingTip{side}", (0.55 * (1 if x > 0 else -1), 0.05, 0.25), (0.08, 0.05, 0.1), mat_deep, 12, 8)
    parent(bone, g)
    parent(membrane, g)
    parent(tip, g)
    g.rotation_euler = (math.radians(-15), math.radians(30 if x > 0 else -30), math.radians(25 if x > 0 else -25))
    return g

wing_l = make_wing("L", -0.55)
wing_r = make_wing("R", 0.55)

# curly tail
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.35, -0.35, -0.35))
tail = bpy.context.object
tail.name = "Tail"
parent(tail, root)
t0 = sphere("Tail0", (0, 0, 0), (0.18, 0.18, 0.18), mat_body, 20, 12)
t1 = sphere("Tail1", (0.18, -0.12, 0.05), (0.15, 0.15, 0.15), mat_body, 16, 12)
t2 = sphere("Tail2", (0.32, -0.05, 0.12), (0.12, 0.12, 0.12), mat_body, 16, 12)
t3 = sphere("Tail3", (0.38, 0.12, 0.18), (0.1, 0.1, 0.1), mat_body, 14, 10)
for o in (t0, t1, t2, t3):
    parent(o, tail)
for i, (lx, ly, lz) in enumerate([(0.1, -0.05, 0.12), (0.25, -0.08, 0.16), (0.35, 0.0, 0.22)]):
    spike = cone(f"TailSpike{i}", (lx, ly, lz), (0.04, 0.04, 0.08), mat_crystal, 5)
    spike.rotation_euler.x = math.radians(-40)
    parent(spike, tail)

# ankle crystals from reference
for side, x in (("L", -0.32), ("R", 0.32)):
    for i in range(2):
        gem = cone(f"AnkleGem{side}{i}", (x + (i - 0.5) * 0.08, 0.35, -0.4), (0.035, 0.035, 0.07), mat_crystal, 5)
        gem.rotation_euler.x = math.radians(30)
        parent(gem, root)

# walk pebble (hidden unless walk)
pebble = sphere("Pebble", (0.7, 0.4, -0.55), (0.08, 0.07, 0.06), soft_skin("PebbleMat", (0.5, 0.48, 0.45), 0.95), 12, 8)
parent(pebble, root)

# --- animations ---
def key_rot(obj, fr, e):
    obj.rotation_euler = e
    obj.keyframe_insert("rotation_euler", frame=fr)

def key_loc(obj, fr, loc):
    obj.location = loc
    obj.keyframe_insert("location", frame=fr)

def key_scale(obj, fr, s):
    obj.scale = s
    obj.keyframe_insert("scale", frame=fr)

# breath + sway
for fr, sz, ry in [(1, 1.0, -0.06), (30, 1.03, 0.0), (60, 1.0, 0.06), (90, 1.03, 0.0), (120, 1.0, -0.06)]:
    key_scale(root, fr, (1.0, 1.0, sz))
    key_rot(root, fr, (0, ry, 0))

bp0 = body_pivot.location.copy()
for fr, dy in [(1, 0), (30, 0.025), (60, 0), (90, 0.025), (120, 0)]:
    key_loc(body_pivot, fr, (bp0.x, bp0.y, bp0.z + dy))

# blink
zl, zr = lid_l.location.z, lid_r.location.z
yl, yr = lid_l.location.y, lid_r.location.y
for fr, close in [(1, 0), (38, 0), (41, 1), (44, 0), (92, 0), (95, 1), (98, 0), (120, 0)]:
    key_loc(lid_l, fr, (lid_l.location.x, yl + 0.04 * close, zl - 0.2 * close))
    key_loc(lid_r, fr, (lid_r.location.x, yr + 0.04 * close, zr - 0.2 * close))

# wing flutter
for fr, a in [(1, -20), (30, -8), (60, -20), (90, -8), (120, -20)]:
    key_rot(wing_l, fr, (math.radians(a), math.radians(-25), math.radians(-20)))
    key_rot(wing_r, fr, (math.radians(a), math.radians(25), math.radians(20)))

# tail wag
for fr, rz in [(1, -0.15), (30, 0.2), (60, -0.15), (90, 0.2), (120, -0.15)]:
    key_rot(tail, fr, (0, 0, rz))

# cute wave (right arm)
base_r = tuple(arm_r.rotation_euler)
for fr, rx, rz in [
    (1, base_r[0], base_r[2]),
    (70, base_r[0], base_r[2]),
    (80, math.radians(-20), math.radians(-1.0)),
    (90, math.radians(-10), math.radians(-0.3)),
    (100, math.radians(-20), math.radians(-1.0)),
    (110, base_r[0], base_r[2]),
    (120, base_r[0], base_r[2]),
]:
    key_rot(arm_r, fr, (rx, 0, rz))

# --- preview studio ---
# Face features are on +Y → camera must sit on +Y looking back at origin
bpy.ops.object.light_add(type="AREA", location=(2.5, 3.2, 3.5))
key = bpy.context.object
key.data.energy = 320
key.data.size = 3.5
key.data.color = (1.0, 0.98, 0.95)
key.rotation_euler = (math.radians(50), 0, math.radians(200))

bpy.ops.object.light_add(type="AREA", location=(-2.8, 2.5, 2.2))
fill = bpy.context.object
fill.data.energy = 120
fill.data.size = 2.8
fill.data.color = (0.88, 0.94, 1.0)

bpy.ops.object.light_add(type="AREA", location=(0.2, -2.2, 1.6))
rim = bpy.context.object
rim.data.energy = 90
rim.data.size = 2.2
rim.data.color = (1.0, 0.88, 0.85)

bpy.ops.object.camera_add(location=(0, 5.6, 1.35), rotation=(math.radians(78), 0, math.radians(180)))
cam = bpy.context.object
cam.data.lens = 60
scene.camera = cam

bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.72))
ground = bpy.context.object
ground.name = "PreviewGround"
gm, gbsdf = new_mat("Ground")
paint(gbsdf, (0.96, 0.96, 0.97), 0.98)
ground.data.materials.append(gm)

world = bpy.data.worlds.new("Studio")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.95, 0.96, 0.97, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

bpy.ops.render.render(write_still=True)
print("PREVIEW", OUT_PREVIEW)

# strip preview-only before export
for obj in list(bpy.data.objects):
    if obj.type in {"LIGHT", "CAMERA"} or obj.name == "PreviewGround":
        bpy.data.objects.remove(obj, do_unlink=True)
scene.world = None

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    export_animations=True,
    export_force_sampling=True,
    export_apply=False,
    export_yup=True,
    export_materials="EXPORT",
    export_image_format="AUTO",
)
print("GLB", OUT_GLB, os.path.getsize(OUT_GLB))
