import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // --- APP & SYSTEM ---
    quitApp: () => ipcRenderer.send('app-quit'),
    toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
    help: () => ipcRenderer.send('help'),

    // --- SETTINGS ---
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    getSettings: () => ipcRenderer.invoke('settings:get'),
    saveSettings: (data: any) => ipcRenderer.invoke('settings:save', data),

    // --- LIBRARY ---
    getLibrary: () => ipcRenderer.invoke('library:get'),

    // LET OP: We sturen hier nu direct de string 'path'.
    // main.ts pakt hem in als { path: args } voor Python.
    resolveDrop: (path: string) => ipcRenderer.invoke('library:resolve', path),

    // --- SESSION (NIEUW) ---
    // Stuurt de payload (naam, datum, playlist, etc.) naar main.ts
    generateSession: (payload: any) => ipcRenderer.invoke('session:generate', payload),

    // --- TRANSLATIONS ---
    getTransFolders: (rootPath: string) => ipcRenderer.invoke('trans:folders', { rootPath }),
    loadTrans: (targetPath: string) => ipcRenderer.invoke('trans:load', { targetPath }),
    saveTrans: (targetPath: string, entries: any) => ipcRenderer.invoke('trans:save', { targetPath, entries }),

    // --- INTEGRATIONS ---
    getHubspotCompanies: () => ipcRenderer.invoke('hubspot:companies'),

    // --- CONSOLE ---
    onConsoleLog: (callback: (log: any) => void) => {
        const subscription = (_event: any, data: any) => callback(data);
        ipcRenderer.on('app-console', subscription);

        // Return a cleanup function to remove listener
        return () => ipcRenderer.removeListener('app-console', subscription);
    }
});