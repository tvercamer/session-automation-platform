export interface FileItem {
    id: string;
    name: string;
    type: 'file';
    fileType: string;
}

export interface Section {
    id: string;
    title: string;
    isLocked: boolean;
    items: FileItem[];
}

export interface KeyLabel {
    code: string;
    label: string;
    matches?: string[];
}

export interface Customer {
    name: string;
    code: string;
    industry?: string;
}

export interface SessionSettings {
    sessionName: string;
    customer: Customer | null;
    date: Date | null;
    industry: KeyLabel | null;
    language: KeyLabel | null;
}