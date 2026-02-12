// Mute the security warning in dev because we need 'unsafe-eval' for Vite
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Imports
import { spawn, ChildProcess } from 'child_process'
import { app, BrowserWindow, ipcMain, shell, dialog, net } from 'electron'
import * as path from 'path'
import { pathToFileURL } from 'url';

// Global references
const isDev = !app.isPackaged;
const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
let mainBrowserWindow: BrowserWindow | null = null
let pythonProcess: ChildProcess | null = null
const pythonPort = 8000;

// ---------- WINDOW MANAGEMENT ---------- \\
function createMainWindow() {
    // Determine the URL to load
    const startURL = isDev
        ? devUrl
        : pathToFileURL(path.join(__dirname, '../../ui/dist/index.html')).href;

    // Create the browser window.
    mainBrowserWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true, // Will be replaced by a custom menu in the React frontend
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    })
    mainBrowserWindow.setMenu(null); // Also hides the menu when holding the ALT key
    mainBrowserWindow.loadURL(startURL).then();

    // Handle browser window closed
    mainBrowserWindow.on('closed', () => {
        mainBrowserWindow = null;
    })
}

// ---------- BACKEND SERVER MANAGEMENT ---------- \\

// Helper to send logs to the frontend ConsolePanel
function sendLogToWindow(level: string, message: string) {
    if (mainBrowserWindow) {
        // Sends event 'app-console' which preload.ts listens for
        mainBrowserWindow.webContents.send('app-console', {
            timestamp: new Date().toLocaleTimeString('en-GB'), // HH:MM:SS
            level: level,
            message: message.trim()
        });
    }
}

function createPythonProcess(){
    const scriptPath = path.join(__dirname, '../../backend', 'app', 'main.py')
    let pythonPath: string;

    if(isDev){
        pythonPath = process.platform === 'win32'
            ? path.join(__dirname, '../../backend/.venv/Scripts/python.exe')
            : path.join(__dirname, '../../backend/.venv/bin/python')
    } else{
        // TODO: for PRD point to bundled python interpreter
        console.log('Production python path not set yet.')
        return;
    }

    console.log('Starting python process...')
    console.log(`Python Path: ${pythonPath}`)
    console.log(`Script Path: ${scriptPath}`)

    // Log to UI
    sendLogToWindow('INFO', 'Starting Python backend...');
    sendLogToWindow('DEBUG', `Script: ${scriptPath}`);

    pythonProcess = spawn(pythonPath, [scriptPath, `${pythonPort}`])

    // 1. Capture STDOUT (Standard Output)
    if (pythonProcess.stdout) {
        pythonProcess.stdout.on('data', (data) => {
            const str = data.toString();
            console.log('py:stdout:', str);
            // Forward to UI
            sendLogToWindow('INFO', str);
        });
    }

    // 2. Capture STDERR (Errors & Logs)
    if (pythonProcess.stderr) {
        pythonProcess.stderr.on('data', (data) => {
            const str = data.toString();
            console.error('py:stderr:', str);

            // Simple heuristic to determine log level from string
            let level = 'DEBUG';
            const lower = str.toLowerCase();
            if (lower.includes('error') || lower.includes('exception') || lower.includes('failed')) level = 'ERROR';
            else if (lower.includes('warning')) level = 'WARN';
            else if (lower.includes('info')) level = 'INFO';

            sendLogToWindow(level, str);
        });
    }

    pythonProcess.on('close', (code) => {
        const msg = `Python process exited with code: ${code}`;
        console.log('py:process exited:', code);
        sendLogToWindow('WARN', msg);
        pythonProcess = null;
    })
}

function exitPytonProcess() {
    if (pythonProcess) {
        // On Windows, simple kill() might not kill subprocesses
        // but for a simple spawned python script it is usually sufficient.
        pythonProcess.kill();
        pythonProcess = null;
        console.log('Python process killed');
    }
}

const requestPython = (method: string, endpoint: string, body: any = null) => {
    return new Promise((resolve, reject) => {
        const request = net.request({
            method,
            protocol: 'http:',
            hostname: '127.0.0.1',
            port: 8000,
            path: endpoint
        });

        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk.toString());
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        request.on('error', (error) => reject(error));

        if (body) {
            request.setHeader('Content-Type', 'application/json');
            request.write(JSON.stringify(body));
        }

        request.end();
    });
};

// ---------- APP LIFECYLCE MANAGEMENT ---------- \\
app.whenReady().then(() => {
    createPythonProcess();
    createMainWindow()

    // Listeners
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })

    app.on('will-quit', () => {
        exitPytonProcess();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
})

// ---------- IPC HANDLERS ---------- \\

ipcMain.on('app-quit', () => {
    app.quit();
})

ipcMain.on('toggle-dev-tools', () => {
    if(mainBrowserWindow) mainBrowserWindow.webContents.toggleDevTools();
});

ipcMain.on('help', () => {
    shell.openExternal('https://google.com?q=project-help-page');
});

ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

// --- SETTINGS ---
ipcMain.handle('settings:get', async () => {
    return await requestPython('GET', '/settings');
});

ipcMain.handle('settings:save', async (event, data) => {
    return await requestPython('POST', '/settings', data);
});

// --- LIBRARY ---
ipcMain.handle('library:get', async () => {
    return await requestPython('GET', '/library');
});

ipcMain.handle('library:resolve', async (event, args) => {
    return await requestPython('POST', '/library/resolve', args);
});

// --- TRANSLATIONS ---
ipcMain.handle('trans:folders', async (event, args) => {
    return await requestPython('POST', '/library/translations/folders', args);
});

ipcMain.handle('trans:load', async (event, args) => {
    return await requestPython('POST', '/library/translations/load', args);
});

ipcMain.handle('trans:save', async (event, args) => {
    return await requestPython('POST', '/library/translations/save', args);
});

// --- INTEGRATIONS ---
ipcMain.handle('hubspot:companies', async () => {
    return await requestPython('GET', '/hubspot/companies');
});