import { ipcMain, dialog, shell, app } from 'electron';
import { PythonClient } from './pythonClient';

export function registerIpcHandlers(mainBrowserWindow: Electron.BrowserWindow | null) {
    // --- APP & SYSTEM ---
    ipcMain.on('app-quit', () => app.quit());
    ipcMain.on('toggle-dev-tools', () => mainBrowserWindow?.webContents.toggleDevTools());
    ipcMain.on('help', () => shell.openExternal('https://google.com?q=project-help-page'));

    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        return canceled ? null : filePaths[0];
    });

    ipcMain.handle('system:openPath', async (_, pathStr) => {
        const error = await shell.openPath(pathStr);
        return error || null;
    });

    // --- SETTINGS ---
    ipcMain.handle('settings:get', () => PythonClient.request('GET', '/settings'));
    ipcMain.handle('settings:save', (_, data) => PythonClient.request('POST', '/settings', data));

    // --- LIBRARY ---
    ipcMain.handle('library:get', () => PythonClient.request('GET', '/library'));
    ipcMain.handle('library:resolve', (_, pathStr) => PythonClient.request('POST', '/library/resolve', { path: pathStr }));

    // --- GENERATION ---
    ipcMain.handle('session:generate', (_, payload) => PythonClient.request('POST', '/session/generate', payload));

    // --- TRANSLATIONS ---
    ipcMain.handle('trans:folders', (_, args) => PythonClient.request('POST', '/library/translations/folders', args));
    ipcMain.handle('trans:load', (_, args) => PythonClient.request('POST', '/library/translations/load', args));
    ipcMain.handle('trans:save', (_, args) => PythonClient.request('POST', '/library/translations/save', args));

    // --- INTEGRATIONS ---
    ipcMain.handle('hubspot:companies', () => PythonClient.request('GET', '/hubspot/companies'));
}