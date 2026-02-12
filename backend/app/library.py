import os
import re
import json
from pathlib import Path
from typing import List

# --- CONFIGURATION ---
KNOWN_LANGUAGES = {'NL', 'FR', 'DE', 'EN', 'ES'}
KNOWN_INDUSTRIES = {'healthcare', 'finance', 'retail', 'manufacturing', 'technology'}

# Folders to completely ignore in UI, Drag operations, and Translation scanning
IGNORED_FOLDERS = {'screenshots', 'images', 'assets', '__pycache__', '.git', 'translations', 'config'}
IGNORED_EXTENSIONS = {'.json', '.png', '.jpg', '.jpeg', '.gif', '.tmp', '.log', '.xml', '.ini'}

def _is_base_file(path: Path) -> bool:
    """
    Returns True ONLY if the file is a 'Base' (Generic) version.
    It rejects files with Language or Industry tags (e.g. 'report_NL.txt').
    """
    # 1. Block System Files
    if path.name.startswith('.') or path.name in {'intro.pptx', 'outro.pptx', 'Thumbs.db'}:
        return False

    # 2. Block Ignored Extensions (Double check)
    if path.suffix.lower() in IGNORED_EXTENSIONS:
        return False

    # 3. Check for Tags
    stem = path.stem.lower()
    # Split by delimiters: underscore, hyphen, space
    tokens = re.split(r'[_\-\s]', stem)

    for token in tokens:
        if token.upper() in KNOWN_LANGUAGES: return False
        if token in KNOWN_INDUSTRIES: return False

    return True

def scan_directory(path: Path) -> List[dict]:
    """
    Scans directory but HIDES specific versions (NL, Healthcare) AND technical folders.
    Only generic files are returned to the UI.
    """
    nodes = []

    if not path.exists():
        return []

    try:
        # Sort: Directories first, then files
        items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))

        for item in items:
            # 1. SKIP IGNORED FOLDERS
            if item.is_dir() and item.name.lower() in IGNORED_FOLDERS:
                continue

            # 2. FILTER FILES: Skip if it's a specific version (e.g. _NL)
            if not item.is_dir():
                if item.name.startswith('.'): continue
                # Explicitly hide translations.json from the file tree
                if item.name == 'translations.json': continue
                if not _is_base_file(item): continue

            node = {
                "key": str(item.resolve()),
                "label": item.name,
                "data": str(item.resolve()),
            }

            if item.is_dir():
                node["icon"] = "pi pi-fw pi-folder"
                node["children"] = scan_directory(item)
                # Optional: if not node["children"]: continue
                nodes.append(node)
            else:
                node = _create_node(item)
                # Helper _create_node returns simple dict, we need tree format here
                tree_node = {
                    "key": str(item.resolve()),
                    "label": item.name,
                    "data": str(item.resolve()),
                    "type": node["type"],
                    "icon": f"pi pi-fw pi-file {node['type']}-icon" if node['type'] != 'file' else "pi pi-fw pi-file"
                }
                # Fix specific icons based on type
                if node['type'] == 'pptx': tree_node['icon'] = "pi pi-fw pi-file text-orange-500"
                elif node['type'] == 'docx': tree_node['icon'] = "pi pi-fw pi-file text-blue-500"
                elif node['type'] == 'xlsx': tree_node['icon'] = "pi pi-fw pi-file-excel text-green-500"
                elif node['type'] == 'pdf': tree_node['icon'] = "pi pi-fw pi-file-pdf text-red-500"

                nodes.append(tree_node)
    except PermissionError:
        pass
    return nodes

def resolve_dropped_item(path_str: str) -> List[dict]:
    """
    Simple Resolver:
    1. Folder -> All 'Base' files inside.
    2. File -> The file itself + its 'Base' companion (Exercise <-> Solution).
    """
    path = Path(path_str)
    if not path.exists():
        return []

    results = []

    # --- CASE 1: FOLDER DRAG ---
    if path.is_dir():
        for root, dirs, files in os.walk(path):
            # Block hidden/system folders from recursion
            dirs[:] = [d for d in dirs if d.lower() not in IGNORED_FOLDERS]

            for file in files:
                file_path = Path(root) / file

                # Use the same filter as the Library Tree
                if _is_base_file(file_path):
                    # Only content files
                    if file_path.suffix.lower() in ['.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls', '.pdf', '.txt']:
                        results.append(_create_node(file_path))

    # --- CASE 2: FILE DRAG ---
    else:
        # Add the file itself
        results.append(_create_node(path))

        # Look for companions (Exercise <-> Solution)
        _find_companions_simple(path, results)

    return results

def _find_companions_simple(path: Path, results: List[dict]):
    """
    Finds sibling files that are exercise/solution pairs.
    e.g. dragging 'exercise.xlsx' also pulls 'exercise_solution.xlsx'
    """
    parent = path.parent
    stem = path.stem.lower()

    # Identify base name (strip 'solution')
    base_name = re.sub(r'[-_ ]?solution', '', stem)

    for sibling in parent.iterdir():
        if sibling == path or not sibling.is_file(): continue
        if not _is_base_file(sibling): continue # Ignore NL/Healthcare versions

        sib_stem = sibling.stem.lower()

        # Check if sibling contains the base name AND 'solution'
        if base_name in sib_stem:
            # Avoid adding duplicates
            if not any(r['path'] == str(sibling.resolve()) for r in results):
                results.append(_create_node(sibling))

def _create_node(path: Path):
    ext = path.suffix.lower()
    type_ = 'file'
    if ext in ['.pptx', '.ppt']: type_ = 'pptx'
    elif ext in ['.docx', '.doc']: type_ = 'docx'
    elif ext in ['.xlsx', '.xls', '.csv']: type_ = 'xlsx'
    elif ext == '.pdf': type_ = 'pdf'

    return {
        "name": path.name,
        "path": str(path.resolve()),
        "type": type_
    }

# ==========================================
#      NEW: TRANSLATION MANAGEMENT
# ==========================================

def list_translatable_folders(library_root: str) -> List[dict]:
    """
    Recursively finds ALL folders (Tools AND Topics) where a translation file could exist.
    """
    root_path = Path(library_root)
    if not root_path.exists(): return []

    # 1. ROOT (Master)
    items = [{
        "name": "Library Root (Master)",
        "path": str(root_path),
        "hasFile": (root_path / "translations.json").exists(),
        "isRoot": True
    }]

    # 2. RECURSIVE SCAN
    for root, dirs, files in os.walk(root_path):
        # Apply the exact same ignore rules as the rest of the app
        dirs[:] = [d for d in dirs if d.lower() not in IGNORED_FOLDERS]

        for d in dirs:
            folder_path = Path(root) / d
            try:
                rel_path = folder_path.relative_to(root_path)
                display_name = str(rel_path).replace(os.sep, ' > ')
            except ValueError:
                display_name = d

            items.append({
                "name": display_name,
                "path": str(folder_path),
                "hasFile": (folder_path / "translations.json").exists(),
                "isRoot": False
            })

    items.sort(key=lambda x: (not x['isRoot'], x['name']))
    return items

def get_translations(folder_path: str) -> dict:
    """Reads translations.json from a specific folder."""
    path = Path(folder_path) / "translations.json"
    if not path.exists(): return {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading translations: {e}")
        return {}

def save_translations(folder_path: str, data: dict) -> bool:
    """Writes translations.json to a specific folder."""
    path = Path(folder_path) / "translations.json"
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving translations: {e}")
        return False