export {}

declare global {
    interface Window {
        electronAPI: {
            quitApp: () => void;
            toggleDevTools: () => void;
            help: () => void;
            selectFolder: () => Promise<string | null>;
            getSettings: () => Promise<any>;
            saveSettings: (data: any) => Promise<any>;
            getLibrary: () => Promise<any[]>;
            resolveDrop: (path: string, language: string) => Promise<any[]>;
        };
    }
}