"""Relief GLB of beauty Nuri — textured mesh with depth, not spheres, not Image slideshow."""
import bpy
import math
import os

OUT = "/workspace/assets/nuri3d/nuri.glb"
TEX = "/workspace/assets/nuri3d/cutouts/idle.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 90

img = bpy.data.images.load(TEX)
w, h = img.size
pixels = list(img.pixels)

RES = 140
SIZE = 2.0

bpy.ops.mesh.primitive_grid_add(x_subdivisions=RES, y_subdivisions=RES, size=SIZE, location=(0, 0, 0))
body = bpy.context.object
body.name = "NuriBody"
mesh = body.data

# Grid sits on XY, camera looks down -Z in Blender top... we'll face +Y for glTF.
# Displace along +Z first, then rotate so +Z becomes +Y (up) and face camera at -Y.
delete = []
for v in mesh.vertices:
    u = (v.co.x / SIZE) + 0.5
    vv = (v.co.y / SIZE) + 0.5
    u = min(max(u, 0.0), 0.999)
    vv = min(max(vv, 0.0), 0.999)
    px = int(u * (w - 1))
    py = int((1.0 - vv) * (h - 1))
    i = (py * w + px) * 4
    r, g, b, a = pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]
    if a < 0.2:
        delete.append(v.index)
        continue
    lum = 0.2 * r + 0.55 * g + 0.25 * b
    cx, cy = u - 0.5, vv - 0.45
    radial = max(0.0, 1.0 - (cx * cx * 3.5 + cy * cy * 2.6))
    v.co.z = (0.08 + 0.62 * radial * a) * (0.7 + 0.4 * lum)

bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.object.mode_set(mode="OBJECT")
for idx in delete:
    mesh.vertices[idx].select = True
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.delete(type="VERT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode="OBJECT")

# Stand upright: rotate so relief faces -Y (camera), up is +Z
body.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

sol = body.modifiers.new("Solidify", "SOLIDIFY")
sol.thickness = 0.1
sol.offset = 1.0
bpy.ops.object.modifier_apply(modifier="Solidify")
bpy.ops.object.shade_smooth()

# UVs from X/Z front plane
mesh = body.data
if not mesh.uv_layers:
    mesh.uv_layers.new(name="UVMap")
uv = mesh.uv_layers[0]
for poly in mesh.polygons:
    for li in poly.loop_indices:
        vi = mesh.loops[li].vertex_index
        co = mesh.vertices[vi].co
        uu = (co.x / SIZE) + 0.5
        vv = (co.z / SIZE) + 0.5
        uv.data[li].uv = (uu, vv)

mat = bpy.data.materials.new("NuriBeauty")
mat.use_nodes = True
nt = mat.node_tree
nodes, links = nt.nodes, nt.links
nodes.clear()
out = nodes.new("ShaderNodeOutputMaterial")
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
tex = nodes.new("ShaderNodeTexImage")
tex.image = img
tex.interpolation = "Closest"
links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
if "Alpha" in bsdf.inputs:
    links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
bsdf.inputs["Roughness"].default_value = 0.48
links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
mat.blend_method = "CLIP"
mat.alpha_threshold = 0.15
body.data.materials.append(mat)

bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
root = bpy.context.object
root.name = "NuriRoot"
body.parent = root

# glowing amber crystals (3D accents)
amber = bpy.data.materials.new("Amber")
amber.use_nodes = True
an, al = amber.node_tree.nodes, amber.node_tree.links
an.clear()
aout = an.new("ShaderNodeOutputMaterial")
absdf = an.new("ShaderNodeBsdfPrincipled")
absdf.inputs["Base Color"].default_value = (0.95, 0.55, 0.15, 1)
absdf.inputs["Roughness"].default_value = 0.1
if "Transmission Weight" in absdf.inputs:
    absdf.inputs["Transmission Weight"].default_value = 0.5
if "Emission Color" in absdf.inputs:
    absdf.inputs["Emission Color"].default_value = (1.0, 0.48, 0.08, 1)
    absdf.inputs["Emission Strength"].default_value = 3.0
al.new(absdf.outputs["BSDF"], aout.inputs["Surface"])

for i, a in enumerate([-0.95, -0.5, -0.15, 0.15, 0.5, 0.95]):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.06, radius2=0.006, depth=0.24)
    leaf = bpy.context.object
    leaf.name = f"Crystal{i}"
    leaf.data.materials.append(amber)
    leaf.location = (math.sin(a) * 0.38, -0.55, 0.78)
    leaf.rotation_euler = (math.radians(-25), 0, -a)
    leaf.scale = (0.9 + (i % 2) * 0.15, 0.32, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    leaf.parent = root

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.07, location=(0.5, -0.2, -0.9))
pebble = bpy.context.object
pebble.name = "Pebble"
pm = bpy.data.materials.new("Pebble")
pm.use_nodes = True
pm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.45, 0.43, 0.4, 1)
pm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
pebble.data.materials.append(pm)
pebble.parent = root

def key_scale(obj, fr, s):
    obj.scale = s
    obj.keyframe_insert("scale", frame=fr)

def key_rot(obj, fr, e):
    obj.rotation_euler = e
    obj.keyframe_insert("rotation_euler", frame=fr)

def key_loc(obj, fr, loc):
    obj.location = loc
    obj.keyframe_insert("location", frame=fr)

for fr, z, ry in [(1, 1.0, -0.1), (22, 1.045, 0.0), (45, 1.0, 0.1), (68, 1.04, 0.0), (90, 1.0, -0.1)]:
    key_scale(root, fr, (1.0, 1.0, z))
    key_rot(root, fr, (0, ry, 0))

for fr, y in [(1, 0.0), (30, 0.025), (60, 0.0), (90, 0.025)]:
    key_loc(body, fr, (0, y, 0))

# crystal pulse
crystals = [o for o in bpy.data.objects if o.name.startswith("Crystal")]
for fr, s in [(1, 1.0), (30, 1.12), (60, 1.0), (90, 1.12)]:
    for c in crystals:
        key_scale(c, fr, (s, s, s))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_animations=True,
    export_force_sampling=True,
    export_apply=False,
    export_yup=True,
    export_image_format="AUTO",
    export_materials="EXPORT",
)
print("WROTE", OUT, os.path.getsize(OUT))
