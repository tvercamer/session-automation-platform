from pydantic import BaseModel
from typing import List, Dict, Any

# --- SETTINGS MODELS ---
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

# --- LIBRARY MODELS ---
class ResolveRequest(BaseModel):
    path: str

# --- GENERATION MODELS ---
class SectionRequest(BaseModel):
    title: str
    topics: List[str]

class GenerateRequest(BaseModel):
    session_name: str
    date: str
    customer_name: str
    customer_industry: str
    industry_code: str
    language_code: str
    sections: List[SectionRequest]

# --- TRANSLATION MODELS ---
class TransListPayload(BaseModel):
    rootPath: str

class TransLoadPayload(BaseModel):
    targetPath: str

class TransSavePayload(BaseModel):
    targetPath: str
    entries: Dict[str, Any]