import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    quitApp: () => ipcRenderer.send('app-quit'),
    toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
    help: () => ipcRenderer.send('help')
});