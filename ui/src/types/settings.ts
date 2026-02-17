export interface KeyLabel {
    code: string;
    label: string;
    matches?: string[];
}

export interface AppSettings {
    library_path: string;
    output_path: string;
    hubspot_api_key: string;
    languages: KeyLabel[];
    industries: KeyLabel[];
}

export interface FolderOption {
    name: string;
    path: string;
    hasFile: boolean;
    isRoot: boolean;
}

export interface TransRow {
    id: string;
    key: string;
    [langCode: string]: string;
}

export const DEFAULT_LANG: KeyLabel = { code: 'EN', label: 'English' };
export const DEFAULT_IND: KeyLabel = { code: 'gen', label: 'Generic' };