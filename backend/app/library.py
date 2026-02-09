import os
from pathlib import Path
from typing import List

def scan_directory(path: Path) -> List[dict]:
    """
    Recursively scans a directory and returns a PrimeReact TreeNode structure.
    """
    nodes = []

    # Files to hide in the UI
    BLOCKED_FILES = {'intro.pptx', 'outro.pptx', 'Thumbs.db'}

    # Safety check
    if not path.exists():
        return []

    try:
        # Sort: Directories first, then files
        items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))

        for item in items:
            if item.name.startswith('.') or item.name in BLOCKED_FILES:
                continue

            node = {
                "key": str(item.resolve()),
                "label": item.name,
                "data": str(item.resolve()),
            }

            if item.is_dir():
                # FOLDER: Use standard folder icon
                node["icon"] = "pi pi-fw pi-folder"
                node["children"] = scan_directory(item)
                nodes.append(node)
            else:
                # FILE LOGIC
                ext = item.suffix.lower()

                # --- ICON MAPPING FIXED ---
                # PrimeIcons DOES NOT have pi-file-word or pi-file-powerpoint.
                # We must use 'pi-file' (generic) or 'pi-file-pdf' / 'pi-file-excel' (which exist).

                if ext in ['.docx', '.doc']:
                    node["icon"] = "pi pi-fw pi-file text-blue-500" # Generic File (Blue)
                    node["type"] = "file"
                elif ext in ['.pptx', '.ppt']:
                    node["icon"] = "pi pi-fw pi-file text-orange-500" # Generic File (Orange)
                    node["type"] = "file"
                elif ext in ['.xlsx', '.xls', '.csv']:
                    node["icon"] = "pi pi-fw pi-file-excel text-green-500" # Exists!
                    node["type"] = "file"
                elif ext in ['.pdf']:
                    node["icon"] = "pi pi-fw pi-file-pdf text-red-500" # Exists!
                    node["type"] = "file"
                elif ext in ['.txt', '.json', '.xml']:
                    node["icon"] = "pi pi-fw pi-align-left" # Text icon
                    node["type"] = "file"
                else:
                    node["icon"] = "pi pi-fw pi-file" # Generic Gray
                    node["type"] = "file"

                nodes.append(node)

    except PermissionError:
        pass

    return nodes