"""
Build a cute polished realtime Nuri character (GLB) for Pulsepet.

Soft mossy olive-green pear body, glassy amber eyes, axolotl leaf-frills,
faceted amber heart gem, stubby limbs + toes, gentle smile + blush.
Animations: breath, sway, blink lids, wave arm, heart pulse.
"""
from __future__ import annotations

import math
import os
import sys

import bpy
from mathutils import Vector

OUT_GLB = "/workspace/assets/nuri3d/nuri.glb"
OUT_PNG = "/workspace/assets/nuri3d/nuri_preview.png"
FPS = 30
FRAME_END = 90

# Bright cute greens — NOT dark muddy
BODY_COLOR = (0.48, 0.70, 0.36, 1.0)  # soft moss olive (bright)
BELLY_COLOR = (0.62, 0.80, 0.48, 1.0)  # lighter belly
AMBER = (1.0, 0.58, 0.12, 1.0)
AMBER_EMIT = (1.0, 0.52, 0.08, 1.0)
BLUSH = (0.95, 0.45, 0.55, 1.0)
SCLERA = (0.99, 0.99, 0.97, 1.0)
IRIS = (0.92, 0.50, 0.08, 1.0)
PUPIL = (0.04, 0.03, 0.03, 1.0)
MOUTH = (0.35, 0.22, 0.22, 1.0)


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = FRAME_END
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    # Prefer EEVEE for accurate amber emission color in preview
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        try:
            scene.render.engine = "BLENDER_EEVEE"
        except Exception:
            scene.render.engine = "CYCLES"
            scene.cycles.samples = 64


def principled(name: str, **kwargs) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    out.location = (280, 0)

    def set_in(key: str, value) -> None:
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = value

    if "base" in kwargs:
        set_in("Base Color", kwargs["base"])
    if "rough" in kwargs:
        set_in("Roughness", kwargs["rough"])
    if "metal" in kwargs:
        set_in("Metallic", kwargs["metal"])
    if "spec" in kwargs:
        # Blender 4 uses Specular IOR Level
        if "Specular IOR Level" in bsdf.inputs:
            set_in("Specular IOR Level", kwargs["spec"])
        elif "Specular" in bsdf.inputs:
            set_in("Specular", kwargs["spec"])
    if "alpha" in kwargs:
        set_in("Alpha", kwargs["alpha"])
        mat.blend_method = "BLEND"
        if hasattr(mat, "shadow_method"):
            mat.shadow_method = "HASHED"
    if "transmission" in kwargs:
        if "Transmission Weight" in bsdf.inputs:
            set_in("Transmission Weight", kwargs["transmission"])
        elif "Transmission" in bsdf.inputs:
            set_in("Transmission", kwargs["transmission"])
    if "ior" in kwargs:
        set_in("IOR", kwargs["ior"])
    if "emit" in kwargs:
        color, strength = kwargs["emit"]
        if "Emission Color" in bsdf.inputs:
            set_in("Emission Color", color)
            set_in("Emission Strength", strength)
        elif "Emission" in bsdf.inputs:
            set_in("Emission", color)
            # older blender strength separate sometimes
    if "coat" in kwargs:
        if "Coat Weight" in bsdf.inputs:
            set_in("Coat Weight", kwargs["coat"])
            set_in("Coat Roughness", kwargs.get("coat_rough", 0.2))

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def shade_smooth(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.select_set(False)


def apply_subsurf(obj: bpy.types.Object, levels: int = 2) -> None:
    mod = obj.modifiers.new("Subsurf", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Subsurf")


def make_uv_sphere(name: str, radius: float, location, segments=32, rings=16) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=location, segments=segments, ring_count=rings
    )
    obj = bpy.context.object
    obj.name = name
    shade_smooth(obj)
    return obj


def make_ico(name: str, radius: float, location, subdivisions=2) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=radius, location=location, subdivisions=subdivisions
    )
    obj = bpy.context.object
    obj.name = name
    shade_smooth(obj)
    return obj


def squash(obj: bpy.types.Object, sx=1.0, sy=1.0, sz=1.0) -> None:
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def parent(child: bpy.types.Object, parent_obj: bpy.types.Object) -> None:
    child.parent = parent_obj


def key_scale(obj, fr, s):
    obj.scale = s
    obj.keyframe_insert("scale", frame=fr)


def key_rot(obj, fr, e):
    obj.rotation_euler = e
    obj.keyframe_insert("rotation_euler", frame=fr)


def key_loc(obj, fr, loc):
    obj.location = loc
    obj.keyframe_insert("location", frame=fr)


def make_leaf_frill(name: str, side: float, index: int, mats: dict) -> bpy.types.Object:
    """Translucent glowing amber leaf-frill (axolotl style)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.14, location=(0, 0, 0))
    leaf = bpy.context.object
    leaf.name = name
    squash(leaf, 0.5, 0.16, 1.45)
    mesh = leaf.data
    for v in mesh.vertices:
        x, y, z = float(v.co.x), float(v.co.y), float(v.co.z)
        t = max(0.0, min(1.0, (z + 0.18) / 0.36))
        v.co = Vector((x * (1.0 - 0.6 * t), y * (1.0 - 0.3 * t), z * 1.08))
    shade_smooth(leaf)
    leaf.data.materials.append(mats["amber_frill"])

    # Fan around head: 3 per side — more outward so amber reads clearly
    elev = [0.86, 0.68, 0.50]
    out = 0.58 + index * 0.03
    z = elev[index]
    y = -0.12
    x = side * out
    leaf.location = (x, y, z)
    leaf.rotation_euler = (
        math.radians(8 + index * 10),
        math.radians(side * (35 + index * 12)),
        math.radians(side * (25 + index * 8)),
    )
    s = 1.15 - index * 0.1
    leaf.scale = (s, s * 0.95, s * (1.15 - index * 0.06))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return leaf


def make_heart(name: str, mats: dict) -> bpy.types.Object:
    """Faceted glowing amber heart gem on chest."""
    # Heart outline via two lobes + pointed tip, then decimate for facets
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.07, location=(-0.045, 0, 0.04))
    a = bpy.context.object
    a.name = name + "_A"
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.07, location=(0.045, 0, 0.04))
    b = bpy.context.object
    b.name = name + "_B"
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.085, radius2=0.0, depth=0.14, location=(0, 0, -0.06))
    c = bpy.context.object
    c.name = name + "_C"
    c.rotation_euler = (math.radians(180), 0, 0)

    for o in (a, b, c):
        o.select_set(True)
    bpy.context.view_layer.objects.active = a
    bpy.ops.object.join()
    heart = bpy.context.object
    heart.name = name

    # Boolean-ish merge via voxel remesh then slight decimate for facets
    rem = heart.modifiers.new("Remesh", "REMESH")
    rem.mode = "VOXEL"
    rem.voxel_size = 0.018
    bpy.ops.object.modifier_apply(modifier="Remesh")
    dec = heart.modifiers.new("Decimate", "DECIMATE")
    dec.decimate_type = "DISSOLVE"
    dec.angle_limit = math.radians(12)
    bpy.ops.object.modifier_apply(modifier="Decimate")

    for poly in heart.data.polygons:
        poly.use_smooth = False

    heart.data.materials.append(mats["amber_gem"])
    bpy.context.view_layer.objects.active = heart
    heart.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    heart.location = (0.0, -0.55, 0.2)
    heart.scale = (1.55, 0.85, 1.55)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    heart.rotation_euler = (math.radians(6), 0, 0)
    return heart


def make_eye(name: str, side: float, mats: dict) -> tuple:
    """Big glassy eye with amber iris + highlights. Returns (group empty, lid)."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(side * 0.24, -0.52, 0.74))
    eye_root = bpy.context.object
    eye_root.name = name

    # sclera / eyeball — slightly flattened toward camera (-Y)
    ball = make_uv_sphere(f"{name}_Ball", 0.145, (0, 0, 0), segments=28, rings=16)
    squash(ball, 1.08, 0.78, 1.12)
    ball.data.materials.append(mats["sclera"])
    parent(ball, eye_root)

    # Amber iris as a front-facing disc — sit ON the sclera surface
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.085, depth=0.025, location=(0, -0.12, 0.012))
    iris = bpy.context.object
    iris.name = f"{name}_Iris"
    iris.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    shade_smooth(iris)
    iris.data.materials.append(mats["iris"])
    parent(iris, eye_root)

    # pupil disc
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.04, depth=0.022, location=(0, -0.135, 0.018))
    pupil = bpy.context.object
    pupil.name = f"{name}_Pupil"
    pupil.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    shade_smooth(pupil)
    pupil.data.materials.append(mats["pupil"])
    parent(pupil, eye_root)

    # highlight sparkles on front
    hi1 = make_uv_sphere(f"{name}_Hi1", 0.032, (0.045, -0.15, 0.055), segments=12, rings=8)
    hi1.data.materials.append(mats["highlight"])
    parent(hi1, eye_root)
    hi2 = make_uv_sphere(f"{name}_Hi2", 0.016, (-0.04, -0.145, 0.008), segments=10, rings=6)
    hi2.data.materials.append(mats["highlight"])
    parent(hi2, eye_root)

    # soft eyelid (blink) — nearly invisible when open
    lid = make_uv_sphere(f"{name}_Lid", 0.155, (0, -0.06, 0.02), segments=24, rings=12)
    squash(lid, 1.15, 0.7, 0.55)
    shade_smooth(lid)
    lid.data.materials.append(mats["lid"])
    # Open: collapse so eyes stay fully visible
    lid.scale = (0.01, 0.01, 0.01)
    lid.location = (0, -0.06, 0.16)
    parent(lid, eye_root)

    return eye_root, lid


def make_arm(name: str, side: float, mats: dict) -> tuple:
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(side * 0.55, -0.05, 0.18))
    arm_root = bpy.context.object
    arm_root.name = name

    # stubby upper
    arm = make_uv_sphere(f"{name}_Mesh", 0.14, (side * 0.08, 0.0, -0.05), segments=20, rings=12)
    squash(arm, 0.75, 0.7, 1.15)
    arm.data.materials.append(mats["body"])
    parent(arm, arm_root)

    # hand / toes
    hand = make_uv_sphere(f"{name}_Hand", 0.09, (side * 0.12, -0.02, -0.22), segments=16, rings=10)
    squash(hand, 1.1, 0.85, 0.7)
    hand.data.materials.append(mats["body"])
    parent(hand, arm_root)

    for i, ox in enumerate([-0.05, 0.0, 0.05]):
        toe = make_uv_sphere(f"{name}_Toe{i}", 0.028, (side * 0.12 + ox, -0.06, -0.28), segments=10, rings=6)
        squash(toe, 0.9, 1.1, 0.7)
        toe.data.materials.append(mats["body"])
        parent(toe, arm_root)

    return arm_root, arm


def make_foot(name: str, side: float, mats: dict) -> bpy.types.Object:
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(side * 0.22, 0.02, -0.72))
    foot_root = bpy.context.object
    foot_root.name = name

    foot = make_uv_sphere(f"{name}_Mesh", 0.13, (0, -0.04, 0.0), segments=18, rings=10)
    squash(foot, 1.15, 1.35, 0.55)
    foot.data.materials.append(mats["body"])
    parent(foot, foot_root)

    for i, ox in enumerate([-0.055, 0.0, 0.055]):
        toe = make_uv_sphere(f"{name}_Toe{i}", 0.032, (ox, -0.14, -0.02), segments=10, rings=6)
        squash(toe, 0.85, 1.15, 0.7)
        toe.data.materials.append(mats["body"])
        parent(toe, foot_root)

    return foot_root


def build_character() -> dict:
    mats = {
        "body": principled(
            "NuriBody",
            base=BODY_COLOR,
            rough=0.72,
            spec=0.35,
            coat=0.15,
            coat_rough=0.45,
        ),
        "belly": principled("NuriBelly", base=BELLY_COLOR, rough=0.68, spec=0.3),
        # Solid emissive amber — modest strength so color stays saturated (not white blowout)
        "amber_frill": principled(
            "AmberFrill",
            base=(1.0, 0.55, 0.1, 1.0),
            rough=0.28,
            transmission=0.0,
            emit=((1.0, 0.45, 0.05, 1.0), 1.8),
            coat=0.35,
            coat_rough=0.2,
        ),
        "amber_gem": principled(
            "AmberHeart",
            base=(1.0, 0.48, 0.06, 1.0),
            rough=0.15,
            metal=0.2,
            transmission=0.0,
            emit=((1.0, 0.4, 0.04, 1.0), 2.4),
            coat=0.55,
            coat_rough=0.08,
        ),
        "sclera": principled("Sclera", base=SCLERA, rough=0.15, coat=0.55, coat_rough=0.1),
        "iris": principled(
            "Iris",
            base=(0.95, 0.42, 0.05, 1.0),
            rough=0.3,
            emit=((1.0, 0.45, 0.06, 1.0), 0.9),
        ),
        "pupil": principled("Pupil", base=PUPIL, rough=0.4),
        "highlight": principled(
            "Highlight",
            base=(1, 1, 1, 1),
            rough=0.05,
            emit=((1, 1, 1, 1), 3.0),
        ),
        "blush": principled("Blush", base=BLUSH, rough=0.7, alpha=0.55, emit=(BLUSH, 0.15)),
        "mouth": principled("Mouth", base=MOUTH, rough=0.55),
        "lid": principled("Lid", base=BODY_COLOR, rough=0.72, spec=0.35),
    }

    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = bpy.context.object
    root.name = "NuriRoot"

    # --- Pear body (scaled UV sphere + soft top) ---
    body = make_uv_sphere("NuriBody", 0.62, (0, 0, 0.05), segments=40, rings=24)
    # pear: wider bottom, narrower top
    for v in body.data.vertices:
        x, y, z = float(v.co.x), float(v.co.y), float(v.co.z)
        t = max(0.0, min(1.0, (z + 0.62) / 1.24))  # 0 bottom -> 1 top
        widen = float(1.15 - 0.35 * (t ** 1.4))
        nx = x * widen * 0.92
        ny = y * widen
        if ny < 0:
            ny *= 1.0 + 0.12 * (1.0 - t)
        nz = z * 1.08
        v.co = Vector((nx, ny, nz))
    shade_smooth(body)
    apply_subsurf(body, 1)
    body.data.materials.append(mats["body"])
    parent(body, root)

    # soft belly patch (keep behind heart gem)
    belly = make_uv_sphere("NuriBelly", 0.36, (0, -0.22, -0.08), segments=28, rings=16)
    squash(belly, 0.95, 0.45, 1.1)
    belly.data.materials.append(mats["belly"])
    parent(belly, root)

    # head bump (slightly separate for cute round head)
    head = make_uv_sphere("NuriHead", 0.48, (0, -0.05, 0.62), segments=36, rings=20)
    squash(head, 1.05, 0.95, 0.95)
    head.data.materials.append(mats["body"])
    parent(head, root)

    # brows (tiny indent ridges)
    for side in (-1, 1):
        brow = make_uv_sphere(f"Brow_{side}", 0.04, (side * 0.18, -0.42, 0.88), segments=12, rings=8)
        squash(brow, 1.6, 0.5, 0.35)
        brow.rotation_euler = (0, 0, math.radians(side * -12))
        brow.data.materials.append(mats["body"])
        parent(brow, root)

    # blush
    for side in (-1, 1):
        blush = make_uv_sphere(f"Blush_{side}", 0.07, (side * 0.32, -0.4, 0.58), segments=14, rings=8)
        squash(blush, 1.3, 0.4, 0.7)
        blush.data.materials.append(mats["blush"])
        parent(blush, root)

    # gentle smile — small curved tube from bezier
    curve = bpy.data.curves.new("SmileCurve", type="CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.011
    curve.bevel_resolution = 3
    curve.resolution_u = 16
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(2)
    pts = [
        (-0.09, -0.50, 0.545),
        (0.0, -0.52, 0.515),
        (0.09, -0.50, 0.545),
    ]
    for bp, p in zip(spline.bezier_points, pts):
        bp.co = Vector(p)
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
    smile = bpy.data.objects.new("Smile", curve)
    bpy.context.collection.objects.link(smile)
    # convert to mesh for glTF
    bpy.context.view_layer.objects.active = smile
    smile.select_set(True)
    bpy.ops.object.convert(target="MESH")
    smile = bpy.context.object
    smile.name = "Smile"
    smile.data.materials.append(mats["mouth"])
    parent(smile, root)

    # eyes
    eye_L, lid_L = make_eye("Eye_L", -1, mats)
    eye_R, lid_R = make_eye("Eye_R", 1, mats)
    parent(eye_L, root)
    parent(eye_R, root)

    # frills 3 per side
    frills = []
    for side in (-1, 1):
        for i in range(3):
            leaf = make_leaf_frill(f"Frill_{'L' if side < 0 else 'R'}{i}", side, i, mats)
            parent(leaf, root)
            frills.append(leaf)

    # heart gem
    heart = make_heart("HeartGem", mats)
    parent(heart, root)

    # arms
    arm_L, _ = make_arm("Arm_L", -1, mats)
    arm_R, _ = make_arm("Arm_R", 1, mats)
    parent(arm_L, root)
    parent(arm_R, root)

    # feet
    foot_L = make_foot("Foot_L", -1, mats)
    foot_R = make_foot("Foot_R", 1, mats)
    parent(foot_L, root)
    parent(foot_R, root)

    # walk pebble (optional scene prop, also in GLB)
    pebble = make_ico("Pebble", 0.07, (0.7, -0.2, -0.85), subdivisions=1)
    pm = principled("Pebble", base=(0.55, 0.52, 0.48, 1), rough=0.95)
    pebble.data.materials.append(pm)
    parent(pebble, root)

    return {
        "root": root,
        "body": body,
        "head": head,
        "heart": heart,
        "arm_L": arm_L,
        "arm_R": arm_R,
        "lid_L": lid_L,
        "lid_R": lid_R,
        "frills": frills,
        "pebble": pebble,
        "mats": mats,
    }


def animate(parts: dict) -> None:
    root = parts["root"]
    heart = parts["heart"]
    arm_R = parts["arm_R"]
    lid_L = parts["lid_L"]
    lid_R = parts["lid_R"]
    frills = parts["frills"]

    # Clear existing
    for obj in bpy.data.objects:
        if obj.animation_data:
            obj.animation_data_clear()

    # Breath + sway on root (scale Z + rotate Y)
    for fr, z, ry, y in [
        (1, 1.0, -0.08, 0.0),
        (23, 1.035, 0.0, 0.02),
        (45, 1.0, 0.08, 0.0),
        (68, 1.03, 0.0, 0.018),
        (90, 1.0, -0.08, 0.0),
    ]:
        key_scale(root, fr, (1.0, 1.0, z))
        key_rot(root, fr, (0.0, ry, 0.0))
        key_loc(root, fr, (0.0, 0.0, y))

    # Heart pulse
    for fr, s in [(1, 1.0), (15, 1.12), (30, 1.0), (45, 1.1), (60, 1.0), (75, 1.12), (90, 1.0)]:
        key_scale(heart, fr, (s, s, s))

    # Frill gentle shimmer scale
    for i, leaf in enumerate(frills):
        phase = i * 5
        for fr, s in [
            (1 + phase, 1.0),
            (20 + phase, 1.06),
            (40 + phase, 1.0),
            (60 + phase, 1.05),
            (90, 1.0),
        ]:
            f = min(FRAME_END, max(1, fr))
            key_scale(leaf, f, (s, s, s))

    # Blink lids (quick close around frames 50-56 and 80-86)
    def blink(lid, frames_close):
        key_loc(lid, 1, (0, -0.06, 0.16))
        key_scale(lid, 1, (0.01, 0.01, 0.01))
        for start in frames_close:
            key_loc(lid, start, (0, -0.06, 0.16))
            key_scale(lid, start, (0.01, 0.01, 0.01))
            # closed: cover eye
            key_loc(lid, start + 2, (0, -0.1, 0.02))
            key_scale(lid, start + 2, (1.0, 1.0, 1.0))
            key_loc(lid, start + 5, (0, -0.06, 0.16))
            key_scale(lid, start + 5, (0.01, 0.01, 0.01))

    blink(lid_L, [48, 78])
    blink(lid_R, [48, 78])

    # Wave right arm (raise + wiggle)
    # rest
    key_rot(arm_R, 1, (0.15, 0.0, 0.2))
    key_rot(arm_R, 30, (0.15, 0.0, 0.2))
    # wave cycle
    key_rot(arm_R, 35, (-0.9, 0.1, 0.5))
    key_rot(arm_R, 40, (-0.7, -0.25, 0.55))
    key_rot(arm_R, 45, (-0.95, 0.2, 0.5))
    key_rot(arm_R, 50, (-0.7, -0.2, 0.55))
    key_rot(arm_R, 55, (-0.9, 0.15, 0.5))
    key_rot(arm_R, 62, (0.15, 0.0, 0.2))
    key_rot(arm_R, 90, (0.15, 0.0, 0.2))

    # Left arm idle micro motion
    key_rot(parts["arm_L"], 1, (0.2, 0.0, -0.15))
    key_rot(parts["arm_L"], 45, (0.28, 0.05, -0.2))
    key_rot(parts["arm_L"], 90, (0.2, 0.0, -0.15))

    # Make animations loop nicely
    for obj in bpy.data.objects:
        if obj.animation_data and obj.animation_data.action:
            for fcurve in obj.animation_data.action.fcurves:
                for kp in fcurve.keyframe_points:
                    kp.interpolation = "BEZIER"
                    kp.handle_left_type = "AUTO_CLAMPED"
                    kp.handle_right_type = "AUTO_CLAMPED"


def setup_preview_lighting() -> None:
    # Soft studio lighting for preview PNG — bright cute look
    bpy.ops.object.light_add(type="AREA", location=(1.5, -2.0, 2.2))
    key = bpy.context.object
    key.data.energy = 120
    key.data.size = 2.5
    key.data.color = (1.0, 0.98, 0.94)
    key.rotation_euler = (math.radians(50), math.radians(15), math.radians(25))

    bpy.ops.object.light_add(type="AREA", location=(-1.8, -1.0, 1.5))
    fill = bpy.context.object
    fill.data.energy = 50
    fill.data.size = 3.0
    fill.data.color = (0.75, 0.9, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(0.2, 1.5, 0.8))
    rim = bpy.context.object
    rim.data.energy = 40
    rim.data.size = 2.0
    rim.data.color = (1.0, 0.7, 0.35)

    # World soft warm
    world = bpy.data.worlds.new("NuriWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.18, 0.20, 0.24, 1.0)
    bg.inputs[1].default_value = 0.6

    # Camera — full-body framing so heart + feet read in preview
    bpy.ops.object.camera_add(location=(0.0, -4.2, 0.25))
    cam = bpy.context.object
    cam.name = "PreviewCam"
    cam.rotation_euler = (math.radians(90), 0, 0)
    cam.data.lens = 70
    bpy.context.scene.camera = cam


def export_glb() -> None:
    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    # Deselect lights/camera for cleaner export? Keep all char objects.
    # Export whole scene animations
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_animations=True,
        export_force_sampling=True,
        export_apply=False,
        export_yup=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_lights=False,
        export_cameras=False,
    )
    print("WROTE", OUT_GLB, os.path.getsize(OUT_GLB))


def render_preview() -> None:
    scene = bpy.context.scene
    scene.render.filepath = OUT_PNG
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # EEVEE: amber emission reads as glow instead of Cycles blowout
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        try:
            scene.render.engine = "BLENDER_EEVEE"
        except Exception:
            pass
    # Soft bloom if available
    eevee = getattr(scene, "eevee", None)
    if eevee is not None:
        if hasattr(eevee, "use_bloom"):
            eevee.use_bloom = True
            eevee.bloom_intensity = 0.08
            eevee.bloom_threshold = 0.6
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = -0.3
    scene.frame_set(20)
    bpy.ops.render.render(write_still=True)
    print("WROTE", OUT_PNG, os.path.getsize(OUT_PNG) if os.path.exists(OUT_PNG) else 0)


def main() -> None:
    clear_scene()
    parts = build_character()
    animate(parts)
    setup_preview_lighting()
    export_glb()
    render_preview()
    print("DONE Nuri cute character build")


if __name__ == "__main__":
    main()
