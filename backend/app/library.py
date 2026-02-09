import os
import re
from pathlib import Path
from typing import List, Set

# Configuration for your naming conventions
KNOWN_LANGUAGES = {'NL', 'FR', 'DE', 'EN', 'ES'}
KNOWN_INDUSTRIES = {'healthcare', 'finance', 'retail', 'manufacturing'} # Add yours here

def scan_directory(path: Path) -> List[dict]:
    """
    Standard UI Scanner - Hides 'intro/outro' and system files.
    """
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

                # Visuals
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
    """
    Smart Resolver handles:
    1. Folder Expansion -> filtered by Language/Industry
    2. File Drag -> Auto-include 'solution' companion
    """
    path = Path(path_str)
    if not path.exists():
        return []

    results = []

    # Define what we should block based on current session settings
    # e.g. if Language is NL, block FR, DE.
    blocked_tokens = {lang for lang in KNOWN_LANGUAGES if lang != language.upper()}

    # If industry is set, block other industries
    if industry:
        blocked_tokens.update({ind for ind in KNOWN_INDUSTRIES if ind != industry.lower()})

    # --- HELPER: CHECK MATCH ---
    def is_relevant(file_path: Path) -> bool:
        """Returns True if file matches language/industry criteria."""
        name_lower = file_path.stem.lower()
        parts = re.split(r'[_\-\s]', name_lower) # Split by _ or - or space

        # 1. Block mismatched languages/industries
        for token in parts:
            if token.upper() in blocked_tokens:
                return False
            if token in blocked_tokens:
                return False

        # 2. Preference Check (Optional):
        # If we are NL, and we have 'report.txt' vs 'report_NL.txt', 
        # this logic just accepts BOTH. 
        # Filtering strictly for the *best* match requires 2 passes.
        # For now, we simply exclude *wrong* languages.
        return True

    # --- CASE 1: FOLDER DRAG ---
    if path.is_dir():
        for root, _, files in os.walk(path):
            for file in files:
                file_path = Path(root) / file

                # Skip system files
                if file.startswith('.') or file in {'intro.pptx', 'outro.pptx', 'Thumbs.db'}:
                    continue

                if is_relevant(file_path):
                    results.append(_create_node(file_path))

    # --- CASE 2: FILE DRAG ---
    else:
        # Always add the dragged file itself (User intent overrides filters)
        results.append(_create_node(path))

        # Logic: If it's NOT a slide deck, look for companions (exercises/solutions)
        if path.suffix.lower() not in ['.pptx', '.ppt']:
            _find_companions(path, results, is_relevant)

    return results

def _find_companions(path: Path, results: List[dict], filter_func):
    """
    Looks for sibling files (Solution <-> Exercise).
    Logic: 
    - If name contains 'solution', strip it to find base.
    - If name doesn't, add '_solution' to find partner.
    """
    stem = path.stem
    parent = path.parent
    suffix = path.suffix

    candidates = []

    # 1. Identify potential partner names
    if 'solution' in stem.lower():
        # Case: dragged 'exercise_NL_solution', looking for 'exercise_NL'
        base = re.sub(r'_solution', '', stem, flags=re.IGNORECASE)
        candidates.append(base + suffix)
    else:
        # Case: dragged 'exercise_NL', looking for 'exercise_NL_solution'
        candidates.append(f"{stem}_solution{suffix}")
        candidates.append(f"{stem}_Solution{suffix}")

    # 2. Check if they exist on disk and match our filters
    for cand_name in candidates:
        cand_path = parent / cand_name
        if cand_path.exists() and filter_func(cand_path):
            # Avoid duplicates if already added
            if not any(r['path'] == str(cand_path.resolve()) for r in results):
                results.append(_create_node(cand_path))

def _create_node(path: Path):
    ext = path.suffix.lower()
    type_ = 'pptx' if ext in ['.pptx', '.ppt'] else ext.replace('.', '')
    return {
        "name": path.name,
        "path": str(path.resolve()),
        "type": type_
    }