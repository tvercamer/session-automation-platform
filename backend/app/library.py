import os
import re
import json
from pathlib import Path
from typing import List, Set

# --- CONFIGURATION ---
# Folders to completely ignore in UI, Drag operations, and Translation scanning
IGNORED_FOLDERS = {'screenshots', 'images', 'assets', '__pycache__', '.git', 'translations', 'config', 'node_modules'}
IGNORED_EXTENSIONS = {'.json', '.png', '.jpg', '.jpeg', '.gif', '.tmp', '.log', '.xml', '.ini'}

def _is_base_file(path: Path, ignored_terms: Set[str]) -> bool:
    """
    Returns True ONLY if the file is a 'Base' (Generic) version.
    It rejects files with tags present in 'ignored_terms' (Languages or Industries).
    """
    # 1. Block System Files
    if path.name.startswith('.') or path.name in {'intro.pptx', 'outro.pptx', 'Thumbs.db'}:
        return False

    # 2. Block Ignored Extensions
    if path.suffix.lower() in IGNORED_EXTENSIONS:
        return False

    # 3. Check for Tags (Dynamic)
    stem = path.stem.lower()
    # Split by delimiters: underscore, hyphen, space
    tokens = re.split(r'[_\-\s]', stem)

    for token in tokens:
        if token.upper() in ignored_terms: return False
        if token.lower() in ignored_terms: return False

    return True

def scan_directory(path: Path, ignored_terms: Set[str] = set()) -> List[dict]:
    """
    Scans directory but HIDES specific versions based on dynamic settings.
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

            # 2. FILTER FILES
            if not item.is_dir():
                if item.name.startswith('.'): continue
                if item.name == 'translations.json': continue
                # Pass the dynamic list
                if not _is_base_file(item, ignored_terms): continue

            # Create Node Structure
            node = _create_node_struct(item)

            if item.is_dir():
                # Recursive call needs to pass the terms down
                children = scan_directory(item, ignored_terms)
                # Optional: Only show folder if it has content (uncomment if desired)
                # if children or _has_content(item):
                node["children"] = children
                nodes.append(node)
            else:
                nodes.append(node)

    except PermissionError:
        pass
    return nodes

def _create_node_struct(path: Path):
    is_dir = path.is_dir()
    node = {
        "key": str(path.resolve()),
        "label": path.name,
        "data": str(path.resolve()),
    }

    if is_dir:
        node["icon"] = "pi pi-fw pi-folder"
    else:
        info = _create_node(path)
        node["type"] = info["type"]

        # Specific Icons
        if info['type'] == 'pptx': node['icon'] = "pi pi-fw pi-file text-orange-500"
        elif info['type'] == 'docx': node['icon'] = "pi pi-fw pi-file text-blue-500"
        elif info['type'] == 'xlsx': node['icon'] = "pi pi-fw pi-file-excel text-green-500"
        elif info['type'] == 'pdf': node['icon'] = "pi pi-fw pi-file-pdf text-red-500"
        else: node['icon'] = f"pi pi-fw pi-file"

    return node

# --- SMART DRAG & DROP ---

def resolve_dropped_item(path_str: str, ignored_terms: Set[str] = set()) -> List[dict]:
    path = Path(path_str)
    if not path.exists(): return []
    results = []

    # --- CASE 1: FOLDER DRAG ---
    if path.is_dir():
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d.lower() not in IGNORED_FOLDERS]
            for file in files:
                file_path = Path(root) / file
                if _is_base_file(file_path, ignored_terms):
                    if file_path.suffix.lower() in ['.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls', '.pdf', '.txt']:
                        results.append(_create_node(file_path))

    # --- CASE 2: FILE DRAG ---
    else:
        results.append(_create_node(path))
        _find_companions_simple(path, results, ignored_terms)

    return results

def _find_companions_simple(path: Path, results: List[dict], ignored_terms: Set[str]):
    parent = path.parent
    stem = path.stem.lower()
    base_name = re.sub(r'[-_ ]?solution', '', stem)

    for sibling in parent.iterdir():
        if sibling == path or not sibling.is_file(): continue
        if not _is_base_file(sibling, ignored_terms): continue

        sib_stem = sibling.stem.lower()
        if base_name in sib_stem:
            if not any(r['path'] == str(sibling.resolve()) for r in results):
                results.append(_create_node(sibling))

def _create_node(path: Path):
    ext = path.suffix.lower()
    type_ = 'file'
    if ext in ['.pptx', '.ppt']: type_ = 'pptx'
    elif ext in ['.docx', '.doc']: type_ = 'docx'
    elif ext in ['.xlsx', '.xls', '.csv']: type_ = 'xlsx'
    elif ext == '.pdf': type_ = 'pdf'
    return { "name": path.name, "path": str(path.resolve()), "type": type_ }

# ==========================================
#      NEW: TRANSLATION MANAGEMENT
# ==========================================

def list_translatable_folders(library_root: str) -> List[dict]:
    """
    Finds folders exactly at Level 0 (Root), Level 1 (Tool), and Level 2 (Topic).
    STRICTLY ignores anything deeper.
    """
    root_path = Path(library_root)
    if not root_path.exists(): return []

    items = []

    # 1. LEVEL 0: ROOT
    items.append({
        "name": "Library Root (Master)",
        "path": str(root_path),
        "hasFile": (root_path / "translations.json").exists(),
        "isRoot": True,
        "level": 0
    })

    try:
        # 2. LEVEL 1: TOOLS
        # Use simple iterdir instead of walk to prevent deep scanning
        tools = [x for x in root_path.iterdir() if x.is_dir() and x.name.lower() not in IGNORED_FOLDERS]

        for tool in tools:
            items.append({
                "name": tool.name,
                "path": str(tool),
                "hasFile": (tool / "translations.json").exists(),
                "isRoot": False,
                "level": 1
            })

            # 3. LEVEL 2: TOPICS
            topics = [t for t in tool.iterdir() if t.is_dir() and t.name.lower() not in IGNORED_FOLDERS]
            for topic in topics:
                items.append({
                    "name": f"{tool.name} > {topic.name}",
                    "path": str(topic),
                    "hasFile": (topic / "translations.json").exists(),
                    "isRoot": False,
                    "level": 2
                })
                # We stop here. No deeper scanning.
    except PermissionError:
        pass

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