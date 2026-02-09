import os
import re
from pathlib import Path
from typing import List

# Configuration
KNOWN_LANGUAGES = {'NL', 'FR', 'DE', 'EN', 'ES'}
KNOWN_INDUSTRIES = {'healthcare', 'finance', 'retail', 'manufacturing'}

def scan_directory(path: Path) -> List[dict]:
    nodes = []
    BLOCKED_FILES = {'intro.pptx', 'outro.pptx', 'Thumbs.db'}

    if not path.exists():
        return []

    try:
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
                node["icon"] = "pi pi-fw pi-folder"
                node["children"] = scan_directory(item)
                nodes.append(node)
            else:
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

def resolve_dropped_item(path_str: str, language: str = "EN", industry: str = None) -> List[dict]:
    path = Path(path_str)
    if not path.exists():
        return []

    results = []

    # --- 1. STRICT FILTERS ---
    IGNORED_FOLDERS = {'screenshots', 'images', 'assets', '__pycache__', '.git', 'translations', 'config'}
    IGNORED_EXTENSIONS = {'.json', '.png', '.jpg', '.jpeg', '.gif', '.tmp', '.log', '.xml', '.ini'}

    blocked_tokens = {lang for lang in KNOWN_LANGUAGES if lang != language.upper()}
    if industry:
        blocked_tokens.update({ind for ind in KNOWN_INDUSTRIES if ind != industry.lower()})

    def is_relevant(file_path: Path) -> bool:
        if file_path.suffix.lower() in IGNORED_EXTENSIONS: return False
        for parent in file_path.parents:
            if parent.name.lower() in IGNORED_FOLDERS: return False

        name_lower = file_path.stem.lower()
        parts = re.split(r'[_\-\s]', name_lower)
        for token in parts:
            if token.upper() in blocked_tokens: return False
            if token in blocked_tokens: return False
        return True

    # --- CASE 1: FOLDER DRAG ---
    if path.is_dir():
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d.lower() not in IGNORED_FOLDERS]

            for file in files:
                file_path = Path(root) / file
                if file.startswith('.') or file in {'intro.pptx', 'outro.pptx', 'Thumbs.db'}: continue

                if is_relevant(file_path):
                    if file_path.suffix.lower() in ['.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls', '.pdf', '.txt']:
                        results.append(_create_node(file_path))

    # --- CASE 2: FILE DRAG ---
    else:
        results.append(_create_node(path))
        # If NOT a slide deck, find companions using wildcard search
        if path.suffix.lower() not in ['.pptx', '.ppt']:
            _find_companions_robust(path, results, is_relevant)

    return results

def _find_companions_robust(path: Path, results: List[dict], filter_func):
    """
    Robustly finds companions (Exercise <-> Solution).
    Scans the parent directory for any file that shares the name stem
    and contains 'solution' (or lacks it if we are the solution).
    """
    parent = path.parent
    stem = path.stem.lower()

    # Is the dragged file a solution?
    is_solution_file = 'solution' in stem

    # Base name to search for (remove 'solution' if present)
    base_name = re.sub(r'[-_ ]?solution', '', stem)

    for sibling in parent.iterdir():
        if sibling == path or not sibling.is_file():
            continue

        sib_name = sibling.stem.lower()

        # Check strict relation
        # 1. We dragged 'Exercise'. Sibling is 'Exercise_Solution'.
        if not is_solution_file and base_name in sib_name and 'solution' in sib_name:
            if filter_func(sibling):
                _add_if_new(sibling, results)

        # 2. We dragged 'Exercise_Solution'. Sibling is 'Exercise'.
        elif is_solution_file and sib_name == base_name:
            if filter_func(sibling):
                _add_if_new(sibling, results)

def _add_if_new(path: Path, results: List[dict]):
    if not any(r['path'] == str(path.resolve()) for r in results):
        results.append(_create_node(path))

def _create_node(path: Path):
    ext = path.suffix.lower()
    type_ = 'pptx' if ext in ['.pptx', '.ppt'] else ext.replace('.', '')
    return {
        "name": path.name,
        "path": str(path.resolve()),
        "type": type_
    }