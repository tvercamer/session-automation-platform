import { spawn, ChildProcess } from 'child_process';
import { IS_DEV, PATHS, PYTHON_PORT } from './constants';
import { BrowserWindow } from 'electron';

let pythonProcess: ChildProcess | null = null;

/**
 * Sends logs from the Python process to the UI console
 */
function sendLogToWindow(message: string) {
    const mainBrowserWindow = BrowserWindow.getAllWindows()[0];
    if (!mainBrowserWindow) return;

    let level = 'INFO';
    const lower = message.toLowerCase();

    if (lower.includes('error') || lower.includes('exception') || lower.includes('failed')) {
        level = 'ERROR';
    } else if (lower.includes('warning')) {
        level = 'WARN';
    } else if (lower.includes('debug')) {
        level = 'DEBUG';
    }

    mainBrowserWindow.webContents.send('app-console', {
        timestamp: new Date().toLocaleTimeString('en-GB'),
        level,
        message: message.trim()
    });
}

export function createPythonProcess() {
    if (!IS_DEV) {
        console.warn('Production python path not configured.');
        return;
    }

    console.log(`Starting Python: ${PATHS.PYTHON_VENV}`);
    sendLogToWindow('Starting Python backend...');

    pythonProcess = spawn(PATHS.PYTHON_VENV, [PATHS.PYTHON_SCRIPT, `${PYTHON_PORT}`]);

    pythonProcess.stdout?.on('data', (data) => {
        const msg = data.toString();
        console.log('py:stdout:', msg);
        sendLogToWindow(msg);
    });

    pythonProcess.stderr?.on('data', (data) => {
        const msg = data.toString();
        console.error('py:stderr:', msg);
        sendLogToWindow(msg);
    });

    pythonProcess.on('close', (code) => {
        console.log('py:process exited:', code);
        sendLogToWindow(`Python process exited with code: ${code}`);
        pythonProcess = null;
    });
}

export function stopPythonProcess() {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
        console.log('Python process terminated');
    }
}