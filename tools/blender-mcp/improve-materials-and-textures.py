# Run this script in Blender via Blender MCP (execute_blender_code) or Blender's Scripting workspace.
# It switches the viewport to Material Preview so textures are visible, and reports material/texture status.

import bpy

# Switch all 3D viewports to Material Preview so textures are visible (not Solid)
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                break

# Report materials and image textures on selected objects, or all mesh objects if none selected
objects = bpy.context.selected_objects if bpy.context.selected_objects else bpy.context.scene.objects
report_lines = ["Viewport set to Material Preview.", ""]

for obj in objects:
    if obj.type != "MESH":
        continue
    report_lines.append(f"Object: {obj.name}")
    for slot in obj.material_slots:
        mat = slot.material
        if not mat:
            report_lines.append(f"  Slot: no material")
            continue
        if not mat.use_nodes:
            report_lines.append(f"  Material '{mat.name}': no nodes (enable Use Nodes)")
            continue
        has_base = has_norm = False
        for node in mat.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image:
                report_lines.append(f"  Texture: {node.image.name} ({node.image.size[0]}x{node.image.size[1]})")
                for out in node.outputs:
                    for link in out.links:
                        if link.to_node.type == "BSDF_PRINCIPLED":
                            sock = link.to_socket.name
                            if "Base Color" in sock or sock == "Base Color":
                                has_base = True
                            if "Normal" in sock:
                                has_norm = True
            if node.type == "BSDF_PRINCIPLED":
                report_lines.append("  Principled BSDF present")
        report_lines.append(f"  -> base_color_connected={has_base}, normal_connected={has_norm}")
    report_lines.append("")

result = "\n".join(report_lines)
print(result)
