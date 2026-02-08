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