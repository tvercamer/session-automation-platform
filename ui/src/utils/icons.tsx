export const getFileIcon = (fileType: string) => {
    switch (fileType) {
        case 'word': return <i className="pi pi-file-word text-blue-500 text-xl"></i>;
        case 'excel': return <i className="pi pi-file-excel text-green-500 text-xl"></i>;
        default: return <i className="pi pi-file text-gray-400 text-xl"></i>;
    }
};