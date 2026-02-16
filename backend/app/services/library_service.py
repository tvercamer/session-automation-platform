import os
from pathlib import Path
from typing import List, Dict, Any

class LibraryService:
    """
    Handles file scanning, tree building, and drag-and-drop resolution.
    """

    # --- CONFIGURATION ---
    IGNORED_FOLDERS = {
        'screenshots', 'images', 'assets', '__pycache__',
        '.git', 'translations', 'config', 'node_modules'
    }

    IGNORED_EXTENSIONS = {
        '.json', '.png', '.jpg', '.jpeg', '.gif',
        '.tmp', '.log', '.xml', '.ini', '.db'
    }

    FORBIDDEN_FILENAMES = {'intro.pptx', 'outro.pptx', 'translations.json'}

    @classmethod
    def _is_base_file(cls, path: Path) -> bool:
        """
        Determines if a file is a 'Base' version that should be visible in the UI.
        Hides system files, ignored extensions, forbidden names, and variants (underscores).
        """
        name = path.name.lower()

        if name.startswith('.'): return False
        if path.suffix.lower() in cls.IGNORED_EXTENSIONS: return False
        if name in cls.FORBIDDEN_FILENAMES: return False

        # Hide variants (e.g., _NL, _Healthcare)
        if "_" in path.stem: return False

        return True

    @staticmethod
    def _create_tree_node(path: Path) -> Dict[str, Any]:
        """Creates a node structure for the UI Tree component."""
        is_dir = path.is_dir()
        node = {
            "key": str(path.resolve()),
            "label": path.name,
            "data": str(path.resolve()),
        }

        if is_dir:
            node["icon"] = "pi pi-fw pi-folder"
        else:
            ext = path.suffix.lower()
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
        return node

    @staticmethod
    def _create_simple_node(path: Path) -> Dict[str, Any]:
        """Creates a simple file node object for drag-and-drop results."""
        ext = path.suffix.lower()
        file_type = 'file'
        if ext in ['.pptx', '.ppt']: file_type = 'pptx'
        elif ext in ['.docx', '.doc']: file_type = 'docx'
        elif ext in ['.xlsx', '.xls', '.csv']: file_type = 'xlsx'
        elif ext == '.pdf': file_type = 'pdf'

        return {
            "name": path.name,
            "path": str(path.resolve()),
            "type": file_type
        }

    @classmethod
    def scan_directory(cls, path: Path) -> List[Dict[str, Any]]:
        """
        Recursively scans a directory and builds a tree structure.
        """
        nodes = []
        if not path.exists(): return []

        try:
            # Sort: Directories first, then files
            items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))

            for item in items:
                if item.is_dir() and item.name.lower() in cls.IGNORED_FOLDERS:
                    continue

                if not item.is_dir() and not cls._is_base_file(item):
                    continue

                node = cls._create_tree_node(item)

                if item.is_dir():
                    children = cls.scan_directory(item)
                    if children:
                        node["children"] = children
                        nodes.append(node)
                else:
                    nodes.append(node)

        except PermissionError:
            pass

        return nodes

    @classmethod
    def resolve_dropped_path(cls, path_str: str) -> List[Dict[str, Any]]:
        """
        Resolves a dragged path (folder or file) into a list of valid base files.
        """
        path = Path(path_str)
        if not path.exists(): return []
        results = []

        # CASE 1: FOLDER DRAG
        if path.is_dir():
            for root, dirs, files in os.walk(path):
                dirs[:] = [d for d in dirs if d.lower() not in cls.IGNORED_FOLDERS]
                for file in files:
                    file_path = Path(root) / file
                    if cls._is_base_file(file_path):
                        results.append(cls._create_simple_node(file_path))

        # CASE 2: FILE DRAG
        else:
            if cls._is_base_file(path):
                results.append(cls._create_simple_node(path))

        return results