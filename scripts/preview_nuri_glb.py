import bpy
from pathlib import Path

GLB = "/workspace/assets/nuri3d/nuri.glb"
OUT = "/workspace/assets/nuri3d/nuri_preview.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
print("meshes", len(objs))
for o in objs:
    print(o.name, "verts", len(o.data.vertices), "dims", tuple(round(x, 3) for x in o.dimensions))
    if o.data.materials and o.data.materials[0] and o.data.materials[0].node_tree:
        imgs = [
            n.image.name
            for n in o.data.materials[0].node_tree.nodes
            if n.type == "TEX_IMAGE" and n.image
        ]
        print("imgs", imgs)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.film_transparent = True
scene.render.filepath = OUT

cam_data = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam
cam.location = (0, -3.0, 0.1)
cam.rotation_euler = (1.5708, 0, 0)

light_data = bpy.data.lights.new("L", type="AREA")
light_data.energy = 90
light_data.size = 3
light = bpy.data.objects.new("L", light_data)
bpy.context.collection.objects.link(light)
light.location = (1.2, -2, 2)

fill_data = bpy.data.lights.new("F", type="AREA")
fill_data.energy = 40
fill_data.size = 4
fill = bpy.data.objects.new("F", fill_data)
bpy.context.collection.objects.link(fill)
fill.location = (-1.5, -1.2, 1.0)

bpy.ops.render.render(write_still=True)
print("preview", OUT)
