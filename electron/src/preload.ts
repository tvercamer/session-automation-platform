import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    quitApp: () => ipcRenderer.send('app-quit'),
    toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
    help: () => ipcRenderer.send('help'),
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    getSettings: () => ipcRenderer.invoke('settings:get'),
    saveSettings: (data: any) => ipcRenderer.send('settings:save', data)
});