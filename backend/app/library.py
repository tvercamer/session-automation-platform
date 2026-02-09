import os
from pathlib import Path
from typing import List

def scan_directory(path: Path) -> List[dict]:
    """
    Recursively scans a directory and returns a PrimeReact TreeNode structure.
    """
    nodes = []

    # Safety check: if path doesn't exist, return empty list
    if not path.exists():
        return []

    try:
        # Sort: Directories first, then files (case-insensitive)
        items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))

        for item in items:
            # Skip hidden files/folders (starting with dot) and system files like Thumbs.db
            if item.name.startswith('.') or item.name == 'Thumbs.db':
                continue

            # Base Node Structure
            node = {
                "key": str(item.resolve()),      # Absolute path as unique ID
                "label": item.name,              # Display name
                "data": str(item.resolve()),     # Path data for drag-and-drop
            }

            if item.is_dir():
                # FOLDER LOGIC
                node["icon"] = "pi pi-fw pi-folder"
                # Recursive call to get children
                children = scan_directory(item)
                node["children"] = children

                # Option: Only add folders if you want to show empty ones
                nodes.append(node)
            else:
                # FILE LOGIC
                ext = item.suffix.lower()

                # icon mapping
                if ext in ['.docx', '.doc']:
                    node["icon"] = "pi pi-fw pi-file-word"
                    node["type"] = "file"
                elif ext in ['.pptx', '.ppt']:
                    node["icon"] = "pi pi-fw pi-file-powerpoint"
                    node["type"] = "file"
                elif ext in ['.xlsx', '.xls']:
                    node["icon"] = "pi pi-fw pi-file-excel"
                    node["type"] = "file"
                else:
                    node["icon"] = "pi pi-fw pi-file"
                    node["type"] = "file"

                # Files are leaves (no children)
                nodes.append(node)

    except PermissionError:
        # Skip folders we don't have permission to access
        pass

    return nodes