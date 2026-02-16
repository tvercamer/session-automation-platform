import os
import sys
import json
import uvicorn
import requests
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# --- CONFIGURATION ---
if sys.platform == "win32":
    APP_DATA_ROOT = Path(os.environ["APPDATA"])
    SETTINGS_DIR = APP_DATA_ROOT / "Datawijs-SAP"
else:
    SETTINGS_DIR = Path.home() / ".datawijs-sap"

SETTINGS_FILE = SETTINGS_DIR / "settings.json"
SETTINGS_DIR.mkdir(parents=True, exist_ok=True)

# --- IMPORTS ---
try:
    from app.models import (
        SettingsModel, ResolveRequest, GenerateRequest,
        TransListPayload, TransLoadPayload, TransSavePayload
    )
    from app.services.library_service import LibraryService
    from app.services.translation_service import TranslationService
    from app.services.generator_service import GeneratorService
except ImportError:
    from models import (
        SettingsModel, ResolveRequest, GenerateRequest,
        TransListPayload, TransLoadPayload, TransSavePayload
    )
    from services.library_service import LibraryService
    from services.translation_service import TranslationService
    from services.generator_service import GeneratorService

# --- APP SETUP ---
app = FastAPI(title="SAP Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "SAP Backend"}

# --- SETTINGS ---

@app.get("/settings")
def get_settings():
    if not SETTINGS_FILE.exists():
        return {"library_path": "", "output_path": "", "languages": [], "industries": []}

    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            # Ensure lists exist
            if "languages" not in data: data["languages"] = []
            if "industries" not in data: data["industries"] = []
            return data
    except (OSError, json.JSONDecodeError) as e:
        return {"error": f"Failed to load settings: {str(e)}"}

@app.post("/settings")
def save_settings(settings: SettingsModel):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings.model_dump(), f, indent=4)
        return {"status": "success"}
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")

# --- LIBRARY ---

@app.get("/library")
def get_library():
    try:
        if not SETTINGS_FILE.exists(): return []
        with open(SETTINGS_FILE, "r") as f:
            settings = json.load(f)
            path_str = settings.get("library_path", "")

        if not path_str or not Path(path_str).exists(): return []

        return LibraryService.scan_directory(Path(path_str))
    except (OSError, json.JSONDecodeError) as e:
        print(f"Library Scan Error: {e}")
        return []

@app.post("/library/resolve")
def resolve_drop(req: ResolveRequest):
    return LibraryService.resolve_dropped_path(req.path)

# --- GENERATION ---

@app.post("/session/generate")
async def generate_session(req: GenerateRequest):
    if not SETTINGS_FILE.exists():
        raise HTTPException(status_code=500, detail="Settings not found")

    try:
        with open(SETTINGS_FILE, "r") as f:
            settings = json.load(f)
            lib_path = Path(settings.get("library_path", ""))
            out_root = Path(settings.get("output_path", ""))

        if not lib_path.exists():
            raise HTTPException(status_code=404, detail="Library path not found")

        # Delegate logic to Service
        result = GeneratorService.generate_session(req, lib_path, out_root)
        return result

    except HTTPException:
        # Re-raise intentional HTTP exceptions (like 404s from above)
        raise
    except Exception as e:
        # Catch unexpected errors (like permissions or merging crashes)
        print(f"FATAL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- TRANSLATIONS ---

@app.post("/library/translations/folders")
def get_trans_folders(req: TransListPayload):
    return TranslationService.list_translatable_folders(
        Path(req.rootPath),
        LibraryService.IGNORED_FOLDERS
    )

@app.post("/library/translations/load")
def load_trans(req: TransLoadPayload):
    return TranslationService.load_json_safely(Path(req.targetPath) / "translations.json")

@app.post("/library/translations/save")
def save_trans(req: TransSavePayload):
    success = TranslationService.save_json(
        Path(req.targetPath) / "translations.json",
        req.entries
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save translation file")
    return {"success": True}

# --- HUBSPOT ---

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

        return [
            {
                "name": r["properties"].get("name"),
                "code": r["id"],
                "industry": r["properties"].get("industry", "")
            }
            for r in data.get("results", []) if r["properties"].get("name")
        ]
    except (requests.RequestException, OSError, json.JSONDecodeError, KeyError) as e:
        # Catch specific errors: Network issues, File I/O, JSON parsing, or missing keys
        print(f"HubSpot Error: {e}")
        return []

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)