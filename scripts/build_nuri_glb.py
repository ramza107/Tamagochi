"""
Single-mesh smooth Nuri — one icosphere, soft falloff bulges (true continuity).
Pastel cute dragon look.
"""
import bpy
import bmesh
import math
from mathutils import Vector
import os

OUT_GLB = "/workspace/assets/nuri3d/nuri.glb"
OUT_PREVIEW = "/workspace/assets/nuri3d/nuri_preview.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 48
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

MINT = (0.60, 0.85, 0.90)
PEACH = (0.98, 0.70, 0.60)
PEACH_SOFT = (1.0, 0.82, 0.74)
TEAL = (0.15, 0.52, 0.60)
DEEP = (0.38, 0.68, 0.76)

def mat(name, rgb, roughness=0.6, metallic=0.0, emit=None, emit_s=0.0, transmission=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if emit is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = emit_s
    if transmission and "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.18
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    if alpha < 1:
        m.blend_method = "BLEND"
    return m

mat_body = mat("Body", MINT, 0.68)
mat_peach = mat("Peach", PEACH, 0.55)
mat_peach_soft = mat("PeachSoft", PEACH_SOFT, 0.5)
mat_deep = mat("Deep", DEEP, 0.6)
mat_eye_w = mat("EyeW", (0.98, 0.99, 1.0), 0.2)
mat_iris = mat("Iris", TEAL, 0.3, emit=(0.06, 0.25, 0.3), emit_s=0.06)
mat_pupil = mat("Pupil", (0.05, 0.08, 0.1), 0.5)
mat_shine = mat("Shine", (0.9, 0.94, 0.98), 0.15)
mat_crystal = mat("Crystal", (0.55, 0.85, 0.95), 0.22, metallic=0.05, emit=(0.4, 0.7, 0.85), emit_s=0.12, transmission=0.15)
mat_lash = mat("Lash", (0.2, 0.28, 0.32), 0.7)
mat_blush = mat("Blush", (1.0, 0.55, 0.58), 0.8, emit=(1.0, 0.4, 0.45), emit_s=0.04, alpha=0.35)
mat_mouth = mat("Mouth", (0.48, 0.26, 0.28), 0.55)

def smooth(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()

def parent(o, p):
    o.parent = p

def apply_scale(o):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

def falloff(d, radius):
    if d >= radius:
        return 0.0
    t = d / radius
    # smoothstep
    return (1 - t * t * (3 - 2 * t)) ** 2

def bulge(bm, center, radius, amount, axis_scale=(1, 1, 1)):
    c = Vector(center)
    sx, sy, sz = axis_scale
    for v in bm.verts:
        p = v.co
        q = Vector(((p.x - c.x) / sx, (p.y - c.y) / sy, (p.z - c.z) / sz))
        d = q.length
        w = falloff(d, radius)
        if w <= 0:
            continue
        # push along from center
        direction = (p - c)
        if direction.length < 1e-6:
            direction = Vector((0, 1, 0))
        direction.normalize()
        v.co += direction * amount * w

# --- root ---
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
root = bpy.context.object
root.name = "NuriRoot"
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0.05))
body_pivot = bpy.context.object
body_pivot.name = "BodyPivot"
parent(body_pivot, root)

# Base soft sphere
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=0.85, location=(0, 0.1, 0.55))
body = bpy.context.object
body.name = "NuriBody"
bm = bmesh.new()
bm.from_mesh(body.data)
bm.verts.ensure_lookup_table()

# Sculpt continuous silhouette (face +Y)
# head mass up
bulge(bm, (0, 0.15, 1.05), 0.85, 0.42, (1.05, 1.0, 0.95))
# belly forward-down
bulge(bm, (0, 0.25, 0.05), 0.9, 0.38, (1.15, 1.0, 1.0))
# cheeks
bulge(bm, (-0.45, 0.45, 0.95), 0.35, 0.18, (1, 1, 1))
bulge(bm, (0.45, 0.45, 0.95), 0.35, 0.18, (1, 1, 1))
# ears
bulge(bm, (-0.7, 0.05, 1.25), 0.4, 0.28, (0.9, 0.7, 1.2))
bulge(bm, (0.7, 0.05, 1.25), 0.4, 0.28, (0.9, 0.7, 1.2))
# snout
bulge(bm, (0, 0.7, 0.85), 0.28, 0.14, (1.1, 1.0, 0.9))
# arms
bulge(bm, (-0.55, 0.35, 0.35), 0.4, 0.22, (1, 1, 1.1))
bulge(bm, (0.55, 0.35, 0.35), 0.4, 0.22, (1, 1, 1.1))
# paws forward
bulge(bm, (-0.28, 0.55, 0.15), 0.28, 0.12, (1, 1, 1))
bulge(bm, (0.28, 0.55, 0.15), 0.28, 0.12, (1, 1, 1))
# thighs / feet
bulge(bm, (-0.32, 0.25, -0.25), 0.42, 0.22, (1, 1.1, 0.9))
bulge(bm, (0.32, 0.25, -0.25), 0.42, 0.22, (1, 1.1, 0.9))
bulge(bm, (-0.34, 0.4, -0.5), 0.35, 0.16, (1.1, 1.2, 0.7))
bulge(bm, (0.34, 0.4, -0.5), 0.35, 0.16, (1.1, 1.2, 0.7))
# tail
bulge(bm, (0.5, -0.25, 0.0), 0.35, 0.2, (1, 1, 1))
bulge(bm, (0.7, -0.35, 0.15), 0.28, 0.14, (1, 1, 1))
bulge(bm, (0.82, -0.2, 0.32), 0.22, 0.1, (1, 1, 1))

# slight overall pear squash
for v in bm.verts:
    v.co.x *= 0.98
    v.co.y *= 0.96
    # lift base a bit
    if v.co.z < -0.35:
        v.co.z += (v.co.z + 0.35) * 0.15

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(body.data)
bm.free()
body.data.update()

# Polish
smooth_mod = body.modifiers.new("Smooth", "SMOOTH")
smooth_mod.factor = 0.5
smooth_mod.iterations = 8
bpy.ops.object.modifier_apply(modifier="Smooth")

sub = body.modifiers.new("Subsurf", "SUBSURF")
sub.levels = 1
bpy.ops.object.modifier_apply(modifier="Subsurf")
smooth(body)

# materials + belly
body.data.materials.append(mat_body)
body.data.materials.append(mat_peach)
vg = body.vertex_groups.new(name="Belly")
for v in body.data.vertices:
    w = 0.0
    if v.co.y > 0.15 and -0.35 < v.co.z < 0.55:
        dx, dy, dz = v.co.x, v.co.y - 0.4, v.co.z - 0.05
        d = math.sqrt(dx * dx * 1.2 + dy * dy + dz * dz * 0.9)
        w = max(0.0, 1.0 - d / 0.48)
    if w > 0.1:
        vg.add([v.index], w, "REPLACE")
for poly in body.data.polygons:
    ws = []
    for vi in poly.vertices:
        try:
            ws.append(vg.weight(vi))
        except RuntimeError:
            ws.append(0.0)
    poly.material_index = 1 if sum(ws) / max(len(ws), 1) > 0.4 else 0

parent(body, body_pivot)
print("BODY_VERTS", len(body.data.vertices))

# --- accents ---
def sph(name, loc, scale, material, seg=40, ring=28):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    apply_scale(o)
    o.data.materials.append(material)
    s = o.modifiers.new("S", "SUBSURF")
    s.levels = 1
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier="S")
    smooth(o)
    return o

def cone(name, loc, scale, material, verts=14):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=1, radius2=0.1, depth=2, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    apply_scale(o)
    o.data.materials.append(material)
    smooth(o)
    return o

horn_l = cone("HornL", (-0.24, 0.15, 1.55), (0.08, 0.08, 0.17), mat_peach)
horn_r = cone("HornR", (0.24, 0.15, 1.55), (0.08, 0.08, 0.17), mat_peach)
horn_l.rotation_euler = (math.radians(-10), math.radians(-12), 0)
horn_r.rotation_euler = (math.radians(-10), math.radians(12), 0)
parent(horn_l, body_pivot)
parent(horn_r, body_pivot)

inner_l = sph("EarInnerL", (-0.68, 0.16, 1.2), (0.1, 0.04, 0.16), mat_peach, 28, 18)
inner_r = sph("EarInnerR", (0.68, 0.16, 1.2), (0.1, 0.04, 0.16), mat_peach, 28, 18)
parent(inner_l, body_pivot)
parent(inner_r, body_pivot)

for i, x in enumerate([-0.09, 0, 0.09]):
    g = cone(f"Gem{i}", (x, 0.5, 1.4), (0.035, 0.035, 0.07), mat_crystal, 6)
    g.rotation_euler.x = math.radians(12)
    parent(g, body_pivot)

blush_l = sph("BlushL", (-0.38, 0.58, 0.9), (0.1, 0.028, 0.065), mat_blush, 20, 12)
blush_r = sph("BlushR", (0.38, 0.58, 0.9), (0.1, 0.028, 0.065), mat_blush, 20, 12)
parent(blush_l, body_pivot)
parent(blush_r, body_pivot)

def make_eye(side, x):
    g = bpy.data.objects.new(f"Eye{side}", None)
    bpy.context.collection.objects.link(g)
    g.empty_display_type = "PLAIN_AXES"
    # sit eyes slightly OUTSIDE surface so they read clearly
    g.location = (x, 0.72, 1.02)
    parent(g, body_pivot)
    white = sph(f"Eye{side}W", (0, 0, 0), (0.24, 0.19, 0.22), mat_eye_w)
    iris = sph(f"Eye{side}I", (0, 0.085, -0.015), (0.14, 0.12, 0.13), mat_iris, 32, 24)
    pup = sph(f"Eye{side}P", (0, 0.15, -0.015), (0.065, 0.055, 0.055), mat_pupil, 20, 14)
    shine = sph(f"Eye{side}S", (0.055, 0.2, 0.045), (0.04, 0.034, 0.034), mat_shine, 16, 12)
    shine2 = sph(f"Eye{side}S2", (-0.04, 0.17, -0.025), (0.016, 0.013, 0.013), mat_shine, 12, 8)
    for i, (lx, lz) in enumerate([(-0.11, 0.15), (0.0, 0.2), (0.1, 0.15)]):
        lash = sph(f"Lash{side}{i}", (lx, 0.09, lz), (0.011, 0.008, 0.045), mat_lash, 10, 8)
        parent(lash, g)
    for o in (white, iris, pup, shine, shine2):
        parent(o, g)
    return g

make_eye("L", -0.28)
make_eye("R", 0.28)

lid_l = sph("LidL", (-0.28, 0.7, 1.18), (0.26, 0.08, 0.12), mat_body, 28, 18)
lid_r = sph("LidR", (0.28, 0.7, 1.18), (0.26, 0.08, 0.12), mat_body, 28, 18)
parent(lid_l, body_pivot)
parent(lid_r, body_pivot)

bpy.ops.mesh.primitive_torus_add(major_radius=0.095, minor_radius=0.013, location=(0, 0.75, 0.72))
mouth = bpy.context.object
mouth.name = "Mouth"
mouth.rotation_euler = (math.radians(100), 0, 0)
mouth.scale = (1.0, 0.34, 1.0)
apply_scale(mouth)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
mouth.data.materials.append(mat_mouth)
smooth(mouth)
parent(mouth, body_pivot)

# soft wing membranes — simple smooth ellipsoids (no jagged remesh)
def make_wing(side, x):
    g = bpy.data.objects.new(f"Wing{side}", None)
    bpy.context.collection.objects.link(g)
    g.empty_display_type = "PLAIN_AXES"
    g.location = (x, 0.0, 0.4)
    parent(g, body_pivot)
    mem = sph(f"WingMem{side}", (0.32 * (1 if x > 0 else -1), 0.05, 0.02), (0.26, 0.04, 0.3), mat_peach, 36, 24)
    bone = sph(f"WingBone{side}", (0.18 * (1 if x > 0 else -1), 0.0, 0.12), (0.05, 0.04, 0.22), mat_deep, 24, 16)
    tip = sph(f"WingTip{side}", (0.45 * (1 if x > 0 else -1), 0.02, 0.2), (0.05, 0.03, 0.07), mat_deep, 16, 12)
    for o in (mem, bone, tip):
        parent(o, g)
    g.rotation_euler = (math.radians(-8), math.radians(22 if x > 0 else -22), math.radians(18 if x > 0 else -18))
    return g

wing_l = make_wing("L", -0.55)
wing_r = make_wing("R", 0.55)

for side, x in (("L", -0.34), ("R", 0.34)):
    for i in range(3):
        claw = sph(f"Claw{side}{i}", (x + (i - 1) * 0.07, 0.55, -0.48), (0.028, 0.04, 0.025), mat_peach_soft, 12, 8)
        parent(claw, root)

for i, (lx, ly, lz) in enumerate([(0.58, -0.3, 0.12), (0.72, -0.28, 0.24), (0.8, -0.14, 0.34)]):
    sp = cone(f"TailSpike{i}", (lx, ly, lz), (0.028, 0.028, 0.06), mat_crystal, 5)
    sp.rotation_euler.x = math.radians(-30)
    parent(sp, root)

pebble = sph("Pebble", (0.8, 0.45, -0.45), (0.06, 0.05, 0.045), mat("Pebble", (0.5, 0.48, 0.45), 0.95), 12, 8)
parent(pebble, root)

# anim
def key_rot(obj, fr, e):
    obj.rotation_euler = e
    obj.keyframe_insert("rotation_euler", frame=fr)

def key_loc(obj, fr, loc):
    obj.location = loc
    obj.keyframe_insert("location", frame=fr)

def key_scale(obj, fr, s):
    obj.scale = s
    obj.keyframe_insert("scale", frame=fr)

for fr, sz, ry in [(1, 1.0, -0.04), (30, 1.018, 0.0), (60, 1.0, 0.04), (90, 1.018, 0.0), (120, 1.0, -0.04)]:
    key_scale(root, fr, (1.0, 1.0, sz))
    key_rot(root, fr, (0, ry, 0))

bp0 = body_pivot.location.copy()
for fr, dy in [(1, 0), (30, 0.015), (60, 0), (90, 0.015), (120, 0)]:
    key_loc(body_pivot, fr, (bp0.x, bp0.y, bp0.z + dy))

zl, zr = lid_l.location.z, lid_r.location.z
yl, yr = lid_l.location.y, lid_r.location.y
for fr, close in [(1, 0), (42, 0), (45, 1), (48, 0), (96, 0), (99, 1), (102, 0), (120, 0)]:
    key_loc(lid_l, fr, (lid_l.location.x, yl + 0.02 * close, zl - 0.14 * close))
    key_loc(lid_r, fr, (lid_r.location.x, yr + 0.02 * close, zr - 0.14 * close))

for fr, a in [(1, -8), (30, -2), (60, -8), (90, -2), (120, -8)]:
    key_rot(wing_l, fr, (math.radians(a), math.radians(-22), math.radians(-18)))
    key_rot(wing_r, fr, (math.radians(a), math.radians(22), math.radians(18)))

# preview
bpy.ops.object.light_add(type="AREA", location=(2.5, 3.6, 3.8))
key = bpy.context.object
key.data.energy = 380
key.data.size = 4.5
key.data.color = (1.0, 0.98, 0.96)

bpy.ops.object.light_add(type="AREA", location=(-2.8, 2.8, 2.5))
fill = bpy.context.object
fill.data.energy = 150
fill.data.size = 3.5
fill.data.color = (0.9, 0.95, 1.0)

bpy.ops.object.light_add(type="AREA", location=(0.2, -2.6, 2.0))
rim = bpy.context.object
rim.data.energy = 110
rim.data.size = 2.8
rim.data.color = (1.0, 0.9, 0.88)

bpy.ops.object.camera_add(location=(0, 5.8, 1.15), rotation=(math.radians(78), 0, math.radians(180)))
cam = bpy.context.object
cam.data.lens = 55
scene.camera = cam

bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -0.6))
ground = bpy.context.object
ground.name = "PreviewGround"
ground.data.materials.append(mat("Ground", (0.96, 0.97, 0.98), 0.98))

world = bpy.data.worlds.new("Studio")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.94, 0.95, 0.96, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.05

bpy.ops.render.render(write_still=True)
print("PREVIEW", OUT_PREVIEW, os.path.getsize(OUT_PREVIEW))

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
)
print("GLB", OUT_GLB, os.path.getsize(OUT_GLB))
