"""One continuous soft dragon relief — no vertex carving (that shattered the mesh)."""
from __future__ import annotations

import bpy
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLOR = ROOT / "assets" / "nuri3d" / "cutouts" / "dragon.png"
HEIGHT = ROOT / "assets" / "nuri3d" / "dragon_height.png"
OUT = ROOT / "assets" / "nuri3d" / "nuri.glb"


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    color = bpy.data.images.load(str(COLOR))
    color.colorspace_settings.name = "sRGB"
    height = bpy.data.images.load(str(HEIGHT))
    height.colorspace_settings.name = "Non-Color"

    # Dense grid — keep ALL verts so silhouette stays one continuous surface;
    # alpha on the texture handles the fringe (no delete → no shards).
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=220, y_subdivisions=220, size=2.2)
    obj = bpy.context.active_object
    obj.name = "NuriDragon"
    obj.rotation_euler = (1.57079632679, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    tex = bpy.data.textures.new("NuriHeight", type="IMAGE")
    tex.image = height

    disp = obj.modifiers.new("Displace", "DISPLACE")
    disp.texture = tex
    disp.texture_coords = "UV"
    disp.mid_level = 0.0
    disp.strength = 0.28
    bpy.ops.object.modifier_apply(modifier=disp.name)

    # Gentle smooth only — preserve UV + continuity
    smooth = obj.modifiers.new("Smooth", "SMOOTH")
    smooth.factor = 0.45
    smooth.iterations = 10
    bpy.ops.object.modifier_apply(modifier=smooth.name)

    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    dim = max(obj.dimensions.x, obj.dimensions.y, obj.dimensions.z, 1e-6)
    obj.scale = (2.05 / dim,) * 3
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mid_z = (min(v.z for v in bbox) + max(v.z for v in bbox)) * 0.5
    obj.location.z -= mid_z - 0.02

    mat = bpy.data.materials.new("NuriSkin")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    img = nodes.new("ShaderNodeTexImage")
    img.image = color
    img.interpolation = "Cubic"
    links.new(img.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(img.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.52
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.15
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.3
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat.blend_method = "CLIP"
    mat.alpha_threshold = 0.08
    if hasattr(mat, "shadow_method"):
        mat.shadow_method = "CLIP"
    obj.data.materials.append(mat)

    # Shade smooth
    bpy.ops.object.shade_smooth()

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
    print("Wrote", OUT, OUT.stat().st_size, "verts", len(obj.data.vertices))


if __name__ == "__main__":
    main()
