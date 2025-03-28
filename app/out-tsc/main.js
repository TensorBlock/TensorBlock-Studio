"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const electron_1 = require("electron");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
// Main window reference
let win = null;
// Check if app is running in development mode
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
/**
 * Creates the main application window
 */
function createWindow() {
    // Create the browser window
    win = new electron_1.BrowserWindow({
        x: 0,
        y: 0,
        width: 1440,
        height: 800,
        titleBarStyle: 'hidden',
        title: "TensorBlock Desktop",
        ...(process.platform === 'linux' ? { icon: path.resolve("resources/app.asar.unpacked/dist/logos/favicon.256x256.png") } : {}),
        ...(process.platform !== 'linux' ?
            { titleBarOverlay: {
                    height: 29,
                    color: 'rgb(243, 243, 243)'
                } } : {}),
        frame: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        minWidth: 600,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            allowRunningInsecureContent: serve,
            devTools: true
        },
    });
    // IPC handlers for system information and window controls
    // Get current operating system platform
    electron_1.ipcMain.handle('get-platform', () => {
        return process.platform;
    });
    // Get system resource information
    electron_1.ipcMain.handle('get-device-info', () => {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const cpuUsage = process.getCPUUsage().percentCPUUsage;
        return { totalMemory, freeMemory, usedMemory, cpuUsage };
    });
    // Check if window is maximized
    electron_1.ipcMain.handle('get-window-isMaximized', () => {
        return win !== null ? win.isMaximized() : false;
    });
    // Open file explorer to the directory containing a file
    electron_1.ipcMain.on('open-folder-by-file', (event, filePath) => {
        const dirPath = path.dirname(filePath);
        electron_1.shell.openPath(dirPath).then((result) => {
            if (result) {
                console.error('Error opening folder:', result);
            }
        });
    });
    // Window control handlers
    // Maximize the window
    electron_1.ipcMain.handle('maximize-window', () => {
        win?.maximize();
        return true;
    });
    // Restore window from maximized state
    electron_1.ipcMain.handle('unmaximize-window', () => {
        win?.unmaximize();
        return true;
    });
    // Minimize the window
    electron_1.ipcMain.handle('minimize-window', () => {
        win?.minimize();
        return win?.isMaximized();
    });
    // Get the local IP address
    electron_1.ipcMain.handle('get-local-ip', () => {
        const nets = os.networkInterfaces();
        let localIp = '127.0.0.1'; // Default value
        for (const name of Object.keys(nets)) {
            for (const net of nets[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                    localIp = net.address;
                }
            }
        }
        return localIp;
    });
    // Get system information
    electron_1.ipcMain.handle('get-sys-info', () => {
        return getSystemInfo();
    });
    // Close application
    electron_1.ipcMain.on('close-app', () => {
        electron_1.app.quit();
    });
    // Open URL in default browser
    electron_1.ipcMain.on('open-url', (event, url) => {
        electron_1.shell.openExternal(url);
    });
    // Disable page refresh in production
    if (process.env.NODE_ENV === 'production') {
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F5' || (input.control && input.key === 'r')) {
                event.preventDefault();
            }
        });
    }
    // Set up development environment
    if (serve) {
        // Enable dev tools with F12 and refresh with F5
        win.webContents.on('before-input-event', (_event, input) => {
            if (input.key === 'F12') {
                win?.webContents.openDevTools();
            }
            if (input.key === 'F5') {
                win?.webContents.reload();
            }
        });
        win.webContents.openDevTools();
        win.loadURL('http://localhost:5173');
    }
    else {
        // Production environment
        win.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.key === 'o') {
                win.webContents.openDevTools();
            }
        });
        win.webContents.openDevTools();
        const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
        win.loadFile(indexPath).catch(e => {
            console.error('Failed to load index.html:', e);
            console.log('Current directory:', __dirname);
            console.log('Attempted path:', indexPath);
        });
    }
    // Quit app when window is closed
    win.on('closed', () => {
        electron_1.app.quit();
    });
    return win;
}
/**
 * Get system information including OS, CPU, and RAM
 */
function getSystemInfo() {
    return {
        osName: getOSName(),
        cpuName: getCPUName(),
        ram: os.totalmem()
    };
}
/**
 * Get formatted operating system name and version
 */
function getOSName() {
    const platform = os.platform();
    const release = os.release();
    if (platform === 'win32') {
        try {
            // Use PowerShell to get Windows version info with proper UTF-8 encoding
            const windowsVersion = (0, child_process_1.execSync)(`powershell -command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; (Get-CimInstance Win32_OperatingSystem).Caption"`, { encoding: 'utf8' }).trim();
            return windowsVersion || `Windows ${release}`;
        }
        catch (_error) {
            return `Windows ${release}`;
        }
    }
    switch (platform) {
        case 'darwin': return `macOS ${release}`;
        case 'linux': return `Linux ${release}`;
        default: return `${platform} ${release}`;
    }
}
/**
 * Get CPU model name
 */
function getCPUName() {
    const cpus = os.cpus();
    return cpus.length > 0 ? cpus[0].model : 'Unknown CPU';
}
try {
    electron_1.app.commandLine.appendSwitch('class', 'tensorblock-desktop');
    // Initialize app when Electron is ready
    // Added delay to fix black background issue with transparent windows
    // See: https://github.com/electron/electron/issues/15947
    electron_1.app.on('ready', () => setTimeout(createWindow, 400));
    // Quit when all windows are closed
    electron_1.app.on('window-all-closed', () => {
        electron_1.app.quit();
    });
    // Re-create window if activated and no windows exist
    electron_1.app.on('activate', () => {
        if (win === null) {
            createWindow();
        }
    });
}
catch (_e) {
    // Catch errors but continue
}
//# sourceMappingURL=main.js.map