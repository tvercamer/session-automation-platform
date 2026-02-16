import { app, BrowserWindow } from 'electron';
import { pathToFileURL } from 'url';
import { IS_DEV, DEV_SERVER_URL, PATHS } from './constants';
import { registerIpcHandlers } from './ipcHandlers';
import { createPythonProcess, stopPythonProcess } from './pythonManager';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainBrowserWindow: BrowserWindow | null = null;

function createMainWindow() {
    mainBrowserWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: PATHS.PRELOAD,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainBrowserWindow.setMenu(null);

    const startURL = IS_DEV ? DEV_SERVER_URL : pathToFileURL(PATHS.UI_DIST).href;
    mainBrowserWindow.loadURL(startURL).then();

    // Initialize all IPC listeners
    registerIpcHandlers(mainBrowserWindow);

    mainBrowserWindow.on('closed', () => {
        mainBrowserWindow = null;
    });
}

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
    createPythonProcess();
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('will-quit', stopPythonProcess);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});