from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Any, Set, Optional
import requests
import uvicorn
import json
import sys
import os
import re
import shutil

# --- IMPORTS FROM LIBRARY.PY ---
from library import (
    scan_directory,
    resolve_dropped_item,
    list_translatable_folders,
    get_translations,
    save_translations
)

# --- CONFIGURATION ---
if sys.platform == "win32":
    APP_DATA_ROOT = Path(os.environ["APPDATA"])
    SETTINGS_DIR = APP_DATA_ROOT / "Datawijs-SAP"
else:
    SETTINGS_DIR = Path.home() / ".datawijs-sap"

SETTINGS_FILE = SETTINGS_DIR / "settings.json"
SETTINGS_DIR.mkdir(parents=True, exist_ok=True)

# --- APP SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---

class KeyLabel(BaseModel):
    code: str
    label: str
    matches: List[str] = []

class SettingsModel(BaseModel):
    library_path: str
    output_path: str
    hubspot_api_key: str = ""
    languages: List[KeyLabel] = []
    industries: List[KeyLabel] = []

class ResolveRequest(BaseModel):
    path: str

# NIEUW: Model voor een individuele sectie
class SectionRequest(BaseModel):
    title: str
    topics: List[str]

# AANGEPAST: GenerateRequest gebruikt nu SectionRequest
class GenerateRequest(BaseModel):
    session_name: str
    date: str
    customer_name: str
    customer_industry: str
    industry_code: str
    language_code: str
    sections: List[SectionRequest] # Was voorheen playlist: List[str]

class TransListPayload(BaseModel):
    rootPath: str

class TransLoadPayload(BaseModel):
    targetPath: str

class TransSavePayload(BaseModel):
    targetPath: str
    entries: Dict[str, Any]

# --- HELPERS ---

def get_ignored_terms() -> Set[str]:
    """Builds a set of language and industry codes to filter out from the library view."""
    if not SETTINGS_FILE.exists(): return set()
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            langs = {l['code'].lower() for l in data.get('languages', [])}
            inds = {i['code'].lower() for i in data.get('industries', [])}
            combined = langs.union(inds)
            # Add 'en' and 'gen' explicitly as they are often used as base/defaults
            combined.update(['en', 'gen'])

            final_set = combined.union({t.upper() for t in combined})
            return final_set
    except:
        return set()

def find_best_matches(library_path: Path, topic: str, lang: str, ind: str) -> List[Path]:
    """
    Zoekt de beste match voor een topic EN de optionele _solution variant.
    Priority: 1. Topic_Lang_Ind, 2. Topic_Ind_Lang, 3. Topic_Lang, 4. Topic_Ind, 5. Topic (Base)
    """
    base_topic = Path(topic).stem
    found_files = []

    candidates = [
        f"{base_topic}_{lang}_{ind}",
        f"{base_topic}_{ind}_{lang}",
        f"{base_topic}_{lang}",
        f"{base_topic}_{ind}",
        base_topic
    ]

    best_file = None

    for root, _, files in os.walk(library_path):
        for cand in candidates:
            for f in files:
                f_path = Path(root) / f
                if f_path.stem == cand:
                    best_file = f_path
                    break
            if best_file: break
        if best_file: break

    if best_file:
        found_files.append(best_file)
        solution_name = f"{best_file.stem}_solution{best_file.suffix}"
        solution_path = best_file.parent / solution_name
        if solution_path.exists():
            found_files.append(solution_path)

    return found_files

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "SAP Backend"}

@app.get("/settings")
def get_settings():
    if not SETTINGS_FILE.exists():
        return {"library_path": "", "output_path": "", "languages": [], "industries": []}
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            if "languages" not in data: data["languages"] = []
            if "industries" not in data: data["industries"] = []
            return data
    except Exception as e:
        return {"error": str(e)}

@app.post("/settings")
def save_settings(settings: SettingsModel):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings.model_dump(), f, indent=4)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/library")
def get_library():
    if not SETTINGS_FILE.exists(): return []
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            path_str = data.get("library_path", "")
        if not path_str or not Path(path_str).exists(): return []

        ignored = get_ignored_terms()
        return scan_directory(Path(path_str), ignored)
    except:
        return []

@app.post("/library/resolve")
def resolve_drop(req: ResolveRequest):
    ignored = get_ignored_terms()
    return resolve_dropped_item(req.path, ignored)

@app.post("/session/generate")
async def generate_session(req: GenerateRequest):
    """
    Final generation logic:
    1. Create folders (Root + Exercises)
    2. Iterate through SECTIONS
    3. Resolve files
    4. Handle collisions (Section prefix)
    """
    if not SETTINGS_FILE.exists():
        raise HTTPException(status_code=500, detail="Settings not found")

    try:
        with open(SETTINGS_FILE, "r") as f:
            settings = json.load(f)
            lib_path = Path(settings.get("library_path", ""))
            out_root = Path(settings.get("output_path", ""))

        # 1. Maak hoofdmap: [DATE]_[CUSTOMER]_[NAME]
        folder_name = f"{req.date}_{req.customer_name}_{req.session_name}".replace(" ", "_")
        target_dir = out_root / folder_name
        target_dir.mkdir(parents=True, exist_ok=True)

        # 2. Maak exercises submap
        exercises_dir = target_dir / "exercises"
        exercises_dir.mkdir(exist_ok=True)

        print(f"INFO: Start generatie voor klant '{req.customer_name}'...")
        print(f"INFO: Doelmap: {target_dir}")

        files_copied = 0

        # Itereren per sectie om context te behouden voor collisions
        for section in req.sections:
            print(f"INFO: Verwerken sectie '{section.title}'...")

            for topic in section.topics:
                matches = find_best_matches(lib_path, topic, req.language_code, req.industry_code)

                if not matches:
                    print(f"WARN: Geen bestanden gevonden voor '{topic}'")
                    continue

                for file_path in matches:
                    try:
                        # BEPAAL BESTEMMING
                        # .pptx naar root, de rest naar exercises
                        if file_path.suffix.lower() == '.pptx':
                            dest_folder = target_dir
                        else:
                            dest_folder = exercises_dir

                        # BEPAAL BESTANDSNAAM & COLLISIE LOGICA
                        final_name = file_path.name
                        dest_path = dest_folder / final_name

                        if dest_path.exists():
                            # Bestand bestaat al? Prefix met sectie titel.
                            # Vervang onveilige karakters in sectietitel
                            safe_title = section.title.replace("/", "-").replace("\\", "-")

                            final_name = f"{safe_title} - {file_path.name}"
                            dest_path = dest_folder / final_name

                            # Edge case: Wat als die OOK al bestaat? (bv. 2x zelfde file in 1 sectie)
                            counter = 1
                            while dest_path.exists():
                                final_name = f"{safe_title} - {file_path.stem}_{counter}{file_path.suffix}"
                                dest_path = dest_folder / final_name
                                counter += 1

                        # Kopiëren
                        shutil.copy2(file_path, dest_path)
                        print(f"INFO: Gekopieerd: {final_name}")
                        files_copied += 1

                    except Exception as copy_err:
                        print(f"ERROR: Kon {file_path.name} niet kopiëren: {copy_err}")

        print(f"SUCCESS: Generatie voltooid. {files_copied} bestanden klaar.")

        return {
            "status": "success",
            "target_dir": str(target_dir),
            "files_count": files_copied
        }
    except Exception as e:
        print(f"FATAL ERROR: Generatie mislukt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- HUBSPOT & TRANSLATIONS (Keep as is) ---

@app.get("/hubspot/companies")
def get_hubspot_companies():
    if not SETTINGS_FILE.exists(): return []
    try:
        with open(SETTINGS_FILE, "r") as f:
            api_key = json.load(f).get("hubspot_api_key", "")
        if not api_key: return []

        url = "https://api.hubapi.com/crm/v3/objects/companies"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        params = {"limit": 100, "properties": "name,industry", "sort": "name"}

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        return [{"name": r["properties"].get("name"), "code": r["id"], "industry": r["properties"].get("industry", "")}
                for r in data.get("results", []) if r["properties"].get("name")]
    except: return []

@app.post("/library/translations/folders")
def get_trans_folders(req: TransListPayload):
    return list_translatable_folders(req.rootPath)

@app.post("/library/translations/load")
def load_trans(req: TransLoadPayload):
    return get_translations(req.targetPath)

@app.post("/library/translations/save")
def save_trans(req: TransSavePayload):
    if not save_translations(req.targetPath, req.entries):
        raise HTTPException(status_code=500, detail="Failed to save")
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)