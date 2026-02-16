import { app } from 'electron';
import * as path from 'path';

export const IS_DEV = !app.isPackaged;
export const PYTHON_PORT = 8000;
export const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

export const PATHS = {
    PYTHON_VENV: process.platform === 'win32'
        ? path.join(__dirname, '../../backend/.venv/Scripts/python.exe')
        : path.join(__dirname, '../../backend/.venv/bin/python'),
    PYTHON_SCRIPT: path.join(__dirname, '../../backend/app/main.py'),
    PRELOAD: path.join(__dirname, 'preload.js'),
    UI_DIST: path.join(__dirname, '../../ui/dist/index.html')
};