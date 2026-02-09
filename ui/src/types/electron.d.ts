export {}

declare global {
    interface Window {
        electronAPI: {
            quitApp: () => void;
            toggleDevTools: () => void;
            help: () => void;
            selectFolder: () => Promise<string | null>;
            getSettings: () => void;
            saveSettings: () => void;
        };
    }
}