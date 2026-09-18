#!/usr/bin/env python3
"""
gpm_generator.py — Công cụ sinh cấu trúc JSON .gscript / .gpmsln chuẩn xác cho GPM Automate theo SKILL.md.
"""

import json
import os
import sys
import uuid
from datetime import datetime, timezone

def gid():
    return str(uuid.uuid4())

def ri(pairs):
    return json.dumps([{"Key": k, "Value": str(v)} for k, v in pairs], ensure_ascii=False)

def create_action_node(action_type, display_text=None, xpath=None, outvar=None, delay="0,0", raw_params=None, comment=None):
    return {
        "$type": "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
        "type": int(action_type),
        "element_xpath": xpath,
        "output_variable_name": outvar,
        "delay": delay,
        "continue_on_error": False,
        "id": gid(),
        "display_text": display_text,
        "raw_input": ri(raw_params) if raw_params else "[]",
        "comment": comment
    }

def create_normal_block(name, nodes=None):
    return {
        "$type": "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
        "nodes": nodes or [],
        "expanded": True,
        "continue_on_error": False,
        "id": gid(),
        "display_text": name,
        "raw_input": None,
        "comment": None
    }

def create_project(project_name, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    proj_id = gid()
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    info = {
        "id": proj_id,
        "type": "Browser",
        "name": project_name,
        "description": None,
        "version": "3.0.8",
        "password": None,
        "author_info": "GPM Softwares - gpmsoftwares.com",
        "logo": None,
        "use_license_system": False,
        "created_at": now_iso
    }

    script = {
        "$type": "GPMAutomateEditor.Models.Editor, GPMAutomateEditor.Models",
        "before_init": create_normal_block("Before browser opened"),
        "main_logic": create_normal_block("Main logic"),
        "after_quit": create_normal_block("After browser closed"),
        "name": "Main"
    }

    info_path = os.path.join(output_dir, "info.gpmsln")
    script_path = os.path.join(output_dir, "src.gscript")

    with open(info_path, "w", encoding="utf-8") as f:
        json.dump(info, f, ensure_ascii=False, indent=2)

    with open(script_path, "w", encoding="utf-8") as f:
        json.dump(script, f, ensure_ascii=False, indent=2)

    print(f"Created GPM Automate project '{project_name}' at: {output_dir}")

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Untitled"
    target = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.getcwd(), name)
    create_project(name, target)
