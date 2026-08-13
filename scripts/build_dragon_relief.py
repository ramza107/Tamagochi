"""Build one soft textured dragon relief GLB from cutout + height (not sphere blobs)."""
from __future__ import annotations

import bpy
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLOR = ROOT / "assets" / "nuri3d" / "cutouts" / "dragon.png"
HEIGHT = ROOT / "assets" / "nuri3d" / "dragon_height.png"
OUT = ROOT / "assets" / "nuri3d" / "nuri.glb"
PREVIEW = ROOT / "assets" / "nuri3d" / "nuri_preview.png"


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def load_images():
    color = bpy.data.images.load(str(COLOR))
    color.colorspace_settings.name = "sRGB"
    height = bpy.data.images.load(str(HEIGHT))
    height.colorspace_settings.name = "Non-Color"
    return color, height


def build_mesh(color, height):
    # High-res plane; keep in XY so UV matches image orientation with rotate fix
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=180, y_subdivisions=180, size=2.15)
    obj = bpy.context.active_object
    obj.name = "NuriDragon"
    # Face camera (+Z): rotate so plane stands upright in Y
    obj.rotation_euler = (1.57079632679, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # Displace along local +Z (toward camera) from soft height
    tex = bpy.data.textures.new("NuriHeight", type="IMAGE")
    tex.image = height

    disp = obj.modifiers.new("Displace", "DISPLACE")
    disp.texture = tex
    disp.texture_coords = "UV"
    disp.mid_level = 0.0
    disp.strength = 0.32  # soft volume — enough body, still not crystalline
    bpy.ops.object.modifier_apply(modifier=disp.name)

    # Carve square fringe: keep only silhouette (height > epsilon)
    import bmesh

    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv_layer = bm.loops.layers.uv.active
    # Sample height via UV → delete low verts
    w, h = height.size
    pixels = list(height.pixels)  # RGBA float

    def height_at(u, v):
        x = int(max(0, min(w - 1, u * (w - 1))))
        y = int(max(0, min(h - 1, v * (h - 1))))
        # Blender images are bottom-up in pixels array
        idx = (y * w + x) * 4
        return pixels[idx]

    kill = []
    for v in bm.verts:
        # average UV of linked loops
        uvs = []
        for loop in v.link_loops:
            uv = loop[uv_layer].uv
            uvs.append((uv.x, uv.y))
        if not uvs:
            kill.append(v)
            continue
        u = sum(p[0] for p in uvs) / len(uvs)
        vv = sum(p[1] for p in uvs) / len(uvs)
        if height_at(u, vv) < 0.04:
            kill.append(v)
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    # Fill tiny holes / clean
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.update()

    # Soften volume — keep original grid UVs (no remesh: remesh destroys UV integrity)
    smooth = obj.modifiers.new("Smooth", "SMOOTH")
    smooth.factor = 0.7
    smooth.iterations = 22
    bpy.ops.object.modifier_apply(modifier=smooth.name)

    # Recenter & ground
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    # Scale to fit ~2.1 tall
    dim = max(obj.dimensions.x, obj.dimensions.y, obj.dimensions.z, 1e-6)
    obj.scale = (2.05 / dim,) * 3
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    # Sit slightly above ground
    obj.location = (0.0, 0.0, 0.0)
    # Shift so feet near bottom of frame
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in bbox)
    max_z = max(v.z for v in bbox)
    mid_z = (min_z + max_z) * 0.5
    obj.location.z -= mid_z - 0.05

    mat = bpy.data.materials.new("NuriSkin")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = color
    tex.interpolation = "Cubic"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    # Alpha from cutout
    links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.inputs["Specular IOR Level"].default_value = 0.18
    bsdf.inputs["Metallic"].default_value = 0.0
    # Soft pastel sheen
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.35
        bsdf.inputs["Sheen Roughness"].default_value = 0.45
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat.blend_method = "HASHED"
    mat.shadow_method = "HASHED"
    obj.data.materials.append(mat)

    # Drop near-transparent fringe verts so silhouette is clean
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    # Keep mesh intact — alpha handles fringe; delete only fully empty if needed
    return obj


def export_glb(obj):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
    )
    print("Wrote", OUT, "size", OUT.stat().st_size)


def render_preview(obj):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.render.filepath = str(PREVIEW)

    cam_data = bpy.data.cameras.new("PrevCam")
    cam = bpy.data.objects.new("PrevCam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (0.0, -3.1, 0.15)
    cam.rotation_euler = (1.520, 0.0, 0.0)

    light_data = bpy.data.lights.new("Key", type="AREA")
    light_data.energy = 80
    light_data.size = 3
    light = bpy.data.objects.new("Key", light_data)
    bpy.context.collection.objects.link(light)
    light.location = (1.5, -2.0, 2.2)

    fill_data = bpy.data.lights.new("Fill", type="AREA")
    fill_data.energy = 35
    fill_data.size = 4
    fill = bpy.data.objects.new("Fill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-1.8, -1.5, 1.2)

    try:
        bpy.ops.render.render(write_still=True)
        print("Preview", PREVIEW)
    except Exception as e:
        print("Preview skip:", e)


def main():
    reset()
    color, height = load_images()
    obj = build_mesh(color, height)
    export_glb(obj)
    render_preview(obj)


if __name__ == "__main__":
    main()
