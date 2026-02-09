import os
import re
from pathlib import Path
from typing import List

# --- CONFIGURATION ---
KNOWN_LANGUAGES = {'NL', 'FR', 'DE', 'EN', 'ES'}
# Add your industries here (lowercase)
KNOWN_INDUSTRIES = {'healthcare', 'finance', 'retail', 'manufacturing', 'technology'}

def _is_base_file(path: Path) -> bool:
    """
    Returns True ONLY if the file is a 'Base' (Generic) version.
    It rejects files with Language or Industry tags (e.g. 'report_NL.txt').
    """
    # 1. Block System Files
    if path.name.startswith('.') or path.name in {'intro.pptx', 'outro.pptx', 'Thumbs.db'}:
        return False

    # 2. Check for Tags
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

    # --- FOLDERS TO HIDE ---
    IGNORED_FOLDERS = {'screenshots', 'images', 'assets', '__pycache__', '.git', 'translations', 'config'}

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
            if not item.is_dir() and not _is_base_file(item):
                continue

            # 3. Skip System Files (dotfiles)
            if item.name.startswith('.'):
                continue

            node = {
                "key": str(item.resolve()),
                "label": item.name,
                "data": str(item.resolve()),
            }

            if item.is_dir():
                node["icon"] = "pi pi-fw pi-folder"
                node["children"] = scan_directory(item)

                # Optional: If you want to hide empty folders, uncomment this:
                # if not node["children"]: continue

                nodes.append(node)
            else:
                # Icon Logic
                ext = item.suffix.lower()
                if ext in ['.pptx', '.ppt']:
                    node["icon"] = "pi pi-fw pi-file text-orange-500"
                    node["type"] = "pptx"
                elif ext in ['.docx', '.doc']:
                    node["icon"] = "pi pi-fw pi-file text-blue-500"
                    node["type"] = "docx"
                elif ext in ['.xlsx', '.xls', '.csv']:
                    node["icon"] = "pi pi-fw pi-file-excel text-green-500"
                    node["type"] = "xlsx"
                elif ext == '.pdf':
                    node["icon"] = "pi pi-fw pi-file-pdf text-red-500"
                    node["type"] = "pdf"
                else:
                    node["icon"] = "pi pi-fw pi-file"
                    node["type"] = "file"
                nodes.append(node)
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

    # Re-define ignored list for the drag handler too, just in case
    IGNORED_FOLDERS = {'screenshots', 'images', 'assets', '__pycache__', '.git', 'translations', 'config'}

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
    type_ = 'pptx' if ext in ['.pptx', '.ppt'] else ext.replace('.', '')
    return {
        "name": path.name,
        "path": str(path.resolve()),
        "type": type_
    }