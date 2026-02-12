from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Any, Set
import requests
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

# 1. Settings Models
class KeyLabel(BaseModel):
    code: str
    label: str

class SettingsModel(BaseModel):
    library_path: str
    output_path: str
    hubspot_api_key: str = ""
    languages: List[KeyLabel] = []
    industries: List[KeyLabel] = []

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

# --- HELPER: DYNAMIC IGNORE LIST ---
def get_ignored_terms() -> Set[str]:
    """
    Reads settings to build a set of terms (Languages + Industries)
    that should be hidden from the 'Base' file view.
    """
    if not SETTINGS_FILE.exists(): return set()
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)

            # Extract Codes (e.g. 'NL', 'healthcare')
            langs = {l['code'].lower() for l in data.get('languages', [])}
            inds = {i['code'].lower() for i in data.get('industries', [])}

            # Combine all into one set
            combined = langs.union(inds)

            # Add uppercase versions to be safe (e.g. 'NL' and 'nl')
            final_set = combined.union({t.upper() for t in combined})
            return final_set
    except:
        return set()

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "SAP Backend"}

# --- SETTINGS ENDPOINTS ---
@app.get("/settings")
def get_settings():
    if not SETTINGS_FILE.exists():
        return {"library_path": "", "output_path": "", "languages": [], "industries": []}

    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            # Ensure keys exist for backward compatibility
            if "languages" not in data: data["languages"] = []
            if "industries" not in data: data["industries"] = []
            return data
    except Exception as e:
        return {"library_path": "", "output_path": "", "languages": [], "industries": [], "error": str(e)}

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
    if not SETTINGS_FILE.exists(): return []

    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            path_str = data.get("library_path", "")
    except: return []

    if not path_str: return []
    lib_path = Path(path_str)
    if not lib_path.exists():
        return [{"key": "error", "label": "Library path not found", "icon": "pi pi-exclamation-triangle", "children": []}]

    # Pass dynamic ignore list to scanner
    ignored = get_ignored_terms()
    return scan_directory(lib_path, ignored)

@app.post("/library/resolve")
def resolve_drop(req: ResolveRequest):
    # Pass dynamic ignore list to resolver
    ignored = get_ignored_terms()
    return resolve_dropped_item(req.path, ignored)

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

# --- INTEGRATION ENDPOINTS ---
@app.get("/hubspot/companies")
def get_hubspot_companies():
    """Haalt bedrijven op via de HubSpot API"""
    if not SETTINGS_FILE.exists(): return []

    api_key = ""
    try:
        with open(SETTINGS_FILE, "r") as f:
            settings = json.load(f)
            api_key = settings.get("hubspot_api_key", "")
    except: return []

    if not api_key:
        return []

    url = "https://api.hubapi.com/crm/v3/objects/companies"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    params = {
        "limit": 100, # Haal de eerste 100 op
        "properties": "name",
        "sort": "name"
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        companies = []
        for result in data.get("results", []):
            name = result.get("properties", {}).get("name")
            if name:
                # We gebruiken het HubSpot ID als 'code'
                companies.append({"name": name, "code": result.get("id")})

        return companies
    except Exception as e:
        print(f"HubSpot API Error: {e}")
        return []

# --- RUNNER ---
if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    uvicorn.run(app, host="127.0.0.1", port=port)