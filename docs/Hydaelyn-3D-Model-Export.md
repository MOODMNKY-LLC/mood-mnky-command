# Showing monk-mnky (or any 3D model) with textures in Hydaelyn

The Hydaelyn app can display a GLB model with full PBR textures (base color, normal, metallic/roughness) in the FFLogs dashboard. Textures are **embedded in the GLB file**, so you only need to export once from Blender and drop the file in place.

## Showing textures in Blender (when loading/importing a model)

Blender’s viewport often defaults to **Solid** shading, which does not show image textures—only flat colors. To see textures in the viewport:

1. **Switch viewport shading to Material Preview or Rendered**
   - In the **top-right of the 3D viewport**, find the shading mode buttons (Wireframe / Solid / Material Preview / Rendered).
   - Click **Material Preview** (sphere with checkerboard) or **Rendered** (sphere with camera) so the viewport uses materials and textures.
   - **Solid** (grey sphere) does not display image textures.

2. **Optional: ensure materials use the images**
   - If you **imported** a GLB and it still looks grey: select the object → **Material Properties** (red sphere icon) → open the material. The GLB importer should have created a Principled BSDF with Base Color / Normal / etc. connected. If “Base Color” is not connected to an Image Texture, the file may have been exported without embedded images.

3. **Optional: check the Shading workspace**
   - **Window → Shading** (or the “Shading” tab at the top) shows the node graph. Confirm that **Image Texture** nodes are connected to the Principled BSDF; if they’re missing, re-export the GLB from the source with “Materials” and “Images” included.

**Summary:** Use **Material Preview** or **Rendered** in the viewport header to see textures; Solid view will always show flat shading only.

---

## 1. Export from Blender with textures

1. Open your Blender scene and select the **monk-mnky** object (or the mesh you want).
2. **File → Export → glTF 2.0 (.glb / .gltf)**.
3. In the export options:
   - **Include**: enable **Selected Objects** (or export the whole scene if only monk-mnky is there).
   - **Transform**: leave default (Y up is fine).
   - **Geometry**: no need to change.
   - **Materials**: ensure **Export** is enabled so materials and **images** are written into the file.
   - For **glTF 2.0 Binary (.glb)** the exporter will **embed** all used images (base color, normal, metallic/roughness, etc.) into the single `.glb` file.
4. Save as `monk-mnky.glb`.

## 2. Place the file in Hydaelyn

Put the exported file here:

```
apps/hydaelyn/public/models/<name>.glb
```

The viewer loads it from the path `/models/<name>.glb`.

GLB files in the repo’s `temp/` folder (e.g. `monk.glb`, `mood-mnky.glb`, `warrior.glb`, `paladin.glb`, `code-mnky.glb`, `sage-mnky.glb`, `scholar.glb`, `samurai.glb`) can be copied into `apps/hydaelyn/public/models/` so they’re available to the app. The FFLogs dashboard default is `monk-mnky.glb`; use any of the copied names by passing `modelUrl="/models/<name>.glb"` to `ModelViewer`.

## 3. Where it appears

- **FFLogs dashboard** (e.g. `/dashboard/fflogs`): the “Character model” card on the right (visible on xl screens) shows the 3D viewer. Drag to rotate; textures are applied from the GLB.

## 4. How textures are shown

- The app uses **React Three Fiber** and **Three.js** to load the GLB.
- GLB stores materials and embedded images; **no extra texture paths** are needed.
- The viewer uses **PBR-friendly lighting** (ambient + directional + Environment) so base color, normals, and metal/roughness maps display correctly.

If the model appears dark or flat, in Blender ensure the materials use **Principled BSDF** and that image textures are connected; the glTF exporter will pack them into the GLB.

## 5. Using a different model or path

You can pass a different URL to the viewer, e.g. another GLB in `public/models/`:

```tsx
<ModelViewer modelUrl="/models/other-character.glb" />
```
