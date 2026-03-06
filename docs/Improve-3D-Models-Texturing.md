# Improving 3D models and texturing with Blender MCP and Hunyuan

You can improve how your models look and how textures are applied using **Blender MCP** (in-Blender material and viewport fixes) and **Hunyuan 3D** (re-texture an existing mesh or generate a new model from an image).

---

## 1. Blender MCP — show and fix textures in Blender

Blender MCP lets you run Python inside Blender via the **execute_blender_code** tool. Use it to:

- **Switch the viewport to Material Preview** so textures are visible (instead of Solid).
- **Inspect materials and textures** on the current selection or scene.
- **Ensure image textures are connected** to the Principled BSDF (base color, normal, etc.).

### Run the “improve materials” script via MCP

With Blender open and the Blender MCP addon connected, ask Cursor to run the script via **execute_blender_code** using the contents of:

**`tools/blender-mcp/improve-materials-and-textures.py`**

That script switches the viewport to Material Preview and prints a short report of materials and image textures. Alternatively, run the following Python in Blender (Scripting workspace or via MCP):

```python
# Ensure viewport shows materials and report texture status (run in Blender)
import bpy

# Switch all 3D viewports to Material Preview so textures are visible
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
                break

# Report materials and image textures on selected objects
report = []
for obj in bpy.context.selected_objects or bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            report.append(f"{obj.name}: material '{mat.name if mat else 'None'}' has no nodes")
            continue
        has_base = has_norm = False
        for n in mat.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image:
                report.append(f"  Texture: {n.image.name} ({n.image.size[0]}x{n.image.size[1]})")
                # Check if connected to Principled BSDF
                for l in n.outputs[0].links:
                    if l.to_node.type == 'BSDF_PRINCIPLED':
                        if 'Base Color' in l.to_socket.name or l.to_socket.name == 'Base Color':
                            has_base = True
                        if 'Normal' in l.to_socket.name:
                            has_norm = True
                has_base = has_base or any('Base Color' in l.to_socket.name for o in n.outputs for l in o.links)
            if n.type == 'BSDF_PRINCIPLED':
                report.append(f"  Principled BSDF present")
        report.append(f"{obj.name} / {mat.name}: base_color_connected={has_base}, normal_connected={has_norm}")

result = "Viewport set to Material Preview.\n" + "\n".join(report) if report else "Viewport set to Material Preview. No mesh/materials to report."
print(result)
# Return for MCP
result
```

After running, the viewport should show textures (Material Preview), and the script output summarizes materials and whether image textures are connected.

---

## 2. Hunyuan 3D — re-texture an existing model or generate from an image

The local Hunyuan 3D API can:

- **Generate a new 3D model (with optional texture)** from a single **image** (image-to-3D).
- **Re-texture an existing mesh**: send your **GLB mesh** plus a **reference image**; the API returns a new GLB with the mesh geometry and textures generated from the image.

### Prerequisites

- Hunyuan 3D API server running locally (e.g. `.\tools\hunyuan3d\run-api.ps1`) with **texture enabled** (default).
- For re-texturing: one **GLB file** (your mesh) and one **reference image** (e.g. character art, concept).

### Re-texture an existing GLB (mesh + image → new GLB)

Use the script:

```powershell
.\tools\hunyuan3d\retexture-glb.ps1 -MeshPath "temp\mood-mnky.glb" -ImagePath "temp\reference.png" -OutputPath "apps\hydaelyn\public\models\mood-mnky-improved.glb"
```

This script:

1. Encodes the GLB and image as base64.
2. POSTs to `http://127.0.0.1:8081/send` with `mesh`, `image`, and `texture: true`.
3. Polls `http://127.0.0.1:8081/status/{uid}` until completed.
4. Saves the returned GLB to `-OutputPath`.

Then use the new file in Hydaelyn (e.g. `modelUrl="/models/mood-mnky-improved.glb"`).

### Generate a new model from an image (no existing mesh)

If you omit `-MeshPath`, Hunyuan generates geometry from the image and applies texture:

```powershell
.\tools\hunyuan3d\retexture-glb.ps1 -ImagePath "temp\reference.png" -OutputPath "apps\hydaelyn\public\models\generated.glb"
```

---

## 3. Suggested workflow

1. **In Blender**: Open your scene, run the Blender MCP “improve materials” script (or the snippet above) so the viewport is in Material Preview and you can see and verify textures. Fix any materials (connect image textures to Principled BSDF, re-export GLB with “Materials” and “Images”).
2. **Optional — Hunyuan re-texture**: Export your mesh as GLB, then run `retexture-glb.ps1` with that GLB and a reference image to get an improved textured GLB; copy the result into `apps/hydaelyn/public/models/` and point the dashboard viewer at it.
3. **Hydaelyn**: Use the final GLB in the FFLogs dashboard `ModelViewer`; textures are read from the GLB.

For Blender-only improvements, step 1 is enough. For AI-assisted re-texturing or new model generation, use step 2 with the Hunyuan API and scripts.
