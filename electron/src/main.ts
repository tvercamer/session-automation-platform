import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as url from 'url'

// Global references
let mainBrowserWindow: BrowserWindow | null = null
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// ---------- WINDOW MANAGEMENT ---------- \\
function createMainWindow() {
    // Determine the URL to load
    const startURL = isDev
        ? process.env.VITE_DEV_SERVER_URL!
        : url.format({
            pathname: path.join(__dirname, '../../ui/dist/index.html'), // ui/dist
            protocol: 'file:',
            slashes: true,
        });

    // Create the browser window.
    mainBrowserWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // TODO: switch to preload + contextIsolation: true later
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    mainBrowserWindow.loadURL(startURL).then()

    // Handle browser window closed
    mainBrowserWindow.on('closed', () => {
        mainBrowserWindow = null;
    })
}

// ---------- BACKEND SERVER MANAGEMENT ---------- \\

// ---------- APP LIFECYLCE MANAGEMENT ---------- \\
app.whenReady().then(() => {
    createMainWindow()

    // Listeners
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
})