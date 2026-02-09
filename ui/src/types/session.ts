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

export interface SessionSettings {
    sessionName: string;
    customer: string;
    date: Date;
    industry: string;
    language: string;
}