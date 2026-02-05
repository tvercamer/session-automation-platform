import { app, BrowserWindow } from 'electron'
import * as path from 'path'

// Global references
let mainBrowserWindow: BrowserWindow | null = null
const isDev = process.env.NODE_ENV === 'development'

// ---------- WINDOW MANAGEMENT ---------- \\
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
}

// ---------- BACKEND SERVER MANAGEMENT ---------- \\

// ---------- APP LIFECYLCE MANAGEMENT ---------- \\
app.whenReady().then(() => {
    // Setting things up
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