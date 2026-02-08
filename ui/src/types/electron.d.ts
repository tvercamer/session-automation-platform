export {}

declare global {
    interface Window {
        electronAPI: {
            quitApp: () => void;
            toggleDevTools: () => void;
            help: () => void;
        };
    }
}