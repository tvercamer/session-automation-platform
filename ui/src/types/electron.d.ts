export {}

declare global {
    interface Window {
        electronAPI: {
            // App & System
            quitApp: () => void;
            toggleDevTools: () => void;
            help: () => void;
            openPath: (path: string) => Promise<string>;

            // Settings & Dialogs
            selectFolder: () => Promise<string | null>;
            getSettings: () => Promise<any>;
            saveSettings: (data: any) => Promise<any>;

            // Library & Drag-Drop
            getLibrary: () => Promise<any[]>;
            resolveDrop: (path: string) => Promise<any[]>;

            // --- SESSION GENERATION ---
            generateSession: (payload: {
                session_name: string;
                date: string;
                customer_name: string;
                customer_industry: string;
                industry_code: string;
                language_code: string;
                sections: { title: string; topics: string[] }[];
            }) => Promise<any>;

            // --- TRANSLATION MODULE ---
            getTransFolders: (rootPath: string) => Promise<any[]>;
            loadTrans: (targetPath: string) => Promise<any>;
            saveTrans: (targetPath: string, entries: any) => Promise<any>;

            // --- Integrations ---
            getHubspotCompanies: () => Promise<any[]>;

            // --- Console Bridge ---
            onConsoleLog: (callback: (log: any) => void) => () => void;
        };
    }
}