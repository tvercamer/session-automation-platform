from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Any
import uvicorn
import json
import sys
import os

# --- IMPORTS FROM LIBRARY.PY ---
from library import (
    scan_directory,
    resolve_dropped_item,
    list_translatable_folders,
    get_translations,
    save_translations
)

# --- CONFIGURATION  ---
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

# 1. Settings Models
class Language(BaseModel):
    code: str
    label: str

class SettingsModel(BaseModel):
    library_path: str
    output_path: str
    languages: List[Language] = []

# 2. Library Models
class ResolveRequest(BaseModel):
    path: str

# 3. Translation Models
class TransListPayload(BaseModel):
    rootPath: str

class TransLoadPayload(BaseModel):
    targetPath: str

class TransSavePayload(BaseModel):
    targetPath: str
    entries: Dict[str, Any] # Handles the structured JSON

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "SAP Backend"}

# --- SETTINGS ENDPOINTS ---
@app.get("/settings")
def get_settings():
    if not SETTINGS_FILE.exists():
        return {"library_path": "", "output_path": "", "languages": []}

    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            # Ensure languages key exists for backward compatibility
            if "languages" not in data:
                data["languages"] = []
            return data
    except Exception as e:
        return {"library_path": "", "output_path": "", "languages": [], "error": str(e)}

@app.post("/settings")
def save_settings(settings: SettingsModel):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings.model_dump(), f, indent=4)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- LIBRARY ENDPOINTS ---
@app.get("/library")
def get_library():
    if not SETTINGS_FILE.exists():
        return []

    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            path_str = data.get("library_path", "")
    except:
        return []

    if not path_str:
        return []

    lib_path = Path(path_str)
    if not lib_path.exists():
        return [{"key": "error", "label": "Library path not found", "icon": "pi pi-exclamation-triangle", "children": []}]

    return scan_directory(lib_path)

@app.post("/library/resolve")
def resolve_drop(req: ResolveRequest):
    return resolve_dropped_item(req.path)

# --- TRANSLATION ENDPOINTS ---
@app.post("/library/translations/folders")
def get_trans_folders(req: TransListPayload):
    """Returns list of folders for the Scope Selector"""
    return list_translatable_folders(req.rootPath)

@app.post("/library/translations/load")
def load_trans(req: TransLoadPayload):
    """Reads translations.json from target folder"""
    return get_translations(req.targetPath)

@app.post("/library/translations/save")
def save_trans(req: TransSavePayload):
    """Writes translations.json to target folder"""
    success = save_translations(req.targetPath, req.entries)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save translation file")
    return {"success": True}

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    uvicorn.run(app, host="127.0.0.1", port=port)