// Mute the security warning in dev because we need 'unsafe-eval' for Vite
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Imports
import { spawn, ChildProcess } from 'child_process'
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as url from 'url'

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
        : url.format({
            pathname: path.join(__dirname, '../../ui/dist/index.html'),
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

    pythonProcess = spawn(pythonPath, [scriptPath, `${pythonPort}`])

    // Check for errors
    if (pythonProcess.stdout) {
        pythonProcess.stdout.on('data', (data) => {
            console.log('py:stdout:', data.toString());
        });
    }

    if (pythonProcess.stderr) {
        pythonProcess.stderr.on('data', (data) => {
            console.error('py:stderr:', data.toString());
        });
    }

    pythonProcess.on('close', (code) => {
        console.log('py:process exited with code:', code);
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