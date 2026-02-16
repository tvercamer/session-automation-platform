import json
from pathlib import Path
from typing import Dict, Any, List

class TranslationService:
    """
    Handles loading, parsing, and saving translation files (translations.json).
    """

    @staticmethod
    def load_json_safely(path: Path) -> Dict[str, Any]:
        """Reads a JSON file safely, returning an empty dict on failure."""
        if not path.exists():
            return {}
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print(f"ERROR: Corrupt JSON at {path}: {e}")
            return {}

    @staticmethod
    def save_json(path: Path, data: Dict[str, Any]) -> bool:
        """Writes data to a JSON file."""
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            return True
        except OSError as e:
            print(f"ERROR: Could not save JSON to {path}: {e}")
            return False

    @staticmethod
    def flatten_translation(data: Dict, lang: str, industry: str) -> Dict[str, str]:
        """
        Flattens nested JSON (Key -> Default/Industries -> Language) into a simple Key-Value pair
        based on the specific language and industry context.
        """
        result = {}
        target_lang = lang.upper().strip()
        target_ind = industry.lower().strip()

        for key, content in data.items():
            if not isinstance(content, dict):
                continue

            value_found = None

            # 1. Check Industry Specifics
            if 'industries' in content and isinstance(content['industries'], dict):
                ind_block = None
                # Case-insensitive industry lookup
                for k, v in content['industries'].items():
                    if k.lower() == target_ind:
                        ind_block = v
                        break

                if ind_block:
                    # Try target language
                    for l_key, l_val in ind_block.items():
                        if l_key.upper() == target_lang:
                            value_found = l_val
                            break
                    # Fallback to English
                    if not value_found:
                        for l_key, l_val in ind_block.items():
                            if l_key.upper() == 'EN':
                                value_found = l_val
                                break

            # 2. Check Defaults (if no industry match found)
            if not value_found and 'default' in content:
                def_block = content['default']
                for l_key, l_val in def_block.items():
                    if l_key.upper() == target_lang:
                        value_found = l_val
                        break
                if not value_found:
                    for l_key, l_val in def_block.items():
                        if l_key.upper() == 'EN':
                            value_found = l_val
                            break

            if value_found:
                result[key] = value_found

        return result

    @classmethod
    def build_file_context(cls, library_root: Path, file_path: Path, lang: str, ind: str, base_vars: Dict) -> Dict[str, str]:
        """
        Builds the full translation context for a specific file.
        Hierarchy: Global JSON < Local JSON < System Variables
        """
        context = {}

        # 1. Global Translations
        global_trans_path = library_root / "translations.json"
        if global_trans_path.exists():
            raw_global = cls.load_json_safely(global_trans_path)
            context.update(cls.flatten_translation(raw_global, lang, ind))

        # 2. Local Translations
        local_trans_path = file_path.parent / "translations.json"
        if local_trans_path.exists():
            raw_local = cls.load_json_safely(local_trans_path)
            if raw_local:
                context.update(cls.flatten_translation(raw_local, lang, ind))

        # 3. System Variables (Highest Priority)
        context.update(base_vars)
        return context

    @staticmethod
    def list_translatable_folders(library_root: Path, ignored_folders: set) -> List[Dict[str, Any]]:
        """
        Scans the library for folders where translations.json can be placed.
        Limit depth to Level 2 (Root > Tool > Topic).
        """
        if not library_root.exists(): return []

        # LEVEL 0: ROOT (Initialize list with the root element directly)
        items = [{
            "name": "Library Root (Master)",
            "path": str(library_root),
            "hasFile": (library_root / "translations.json").exists(),
            "isRoot": True,
            "level": 0
        }]

        try:
            # LEVEL 1: TOOLS
            tools = [x for x in library_root.iterdir() if x.is_dir() and x.name.lower() not in ignored_folders]

            for tool in tools:
                items.append({
                    "name": tool.name,
                    "path": str(tool),
                    "hasFile": (tool / "translations.json").exists(),
                    "isRoot": False,
                    "level": 1
                })

                # LEVEL 2: TOPICS
                topics = [t for t in tool.iterdir() if t.is_dir() and t.name.lower() not in ignored_folders]
                for topic in topics:
                    items.append({
                        "name": f"{tool.name} > {topic.name}",
                        "path": str(topic),
                        "hasFile": (topic / "translations.json").exists(),
                        "isRoot": False,
                        "level": 2
                    })
        except PermissionError:
            pass

        return items