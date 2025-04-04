/* eslint-disable @typescript-eslint/no-unused-vars */
import {app, BrowserWindow, ipcMain, shell} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
// import axios from 'axios';

// Main window reference
let win: BrowserWindow | null = null;

// Check if app is running in development mode
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

/**
 * Creates the main application window
 */
function createWindow(): BrowserWindow {
  // Create the browser window
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1440,
    height: 800,
    titleBarStyle: 'hidden',
    title: "TensorBlock Desktop",
    ...(process.platform === 'linux' ? { icon: path.resolve("resources/app.asar.unpacked/dist/logos/favicon.256x256.png") } : {}),
    ...(process.platform !== 'linux' ?
      {titleBarOverlay: {
        height: 29,
        color: 'rgb(243, 243, 243)'
      }} : {}),
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
  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  // Get system resource information
  ipcMain.handle('get-device-info', () => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpuUsage = process.getCPUUsage().percentCPUUsage;

    return { totalMemory, freeMemory, usedMemory, cpuUsage };
  });

  // Check if window is maximized
  ipcMain.handle('get-window-isMaximized', () => {
    return win !== null ? win.isMaximized() : false;
  });

  // Open file explorer to the directory containing a file
  ipcMain.on('open-folder-by-file', (event, filePath) => {
    const dirPath = path.dirname(filePath);
    shell.openPath(dirPath).then((result) => {
      if (result) {
        console.error('Error opening folder:', result);
      }
    });
  });

  // Window control handlers
  
  // Maximize the window
  ipcMain.handle('maximize-window', () => {
    win?.maximize();
    return true;
  });

  // Restore window from maximized state
  ipcMain.handle('unmaximize-window', () => {
    win?.unmaximize();
    return true;
  });

  // Minimize the window
  ipcMain.handle('minimize-window', () => {
    win?.minimize();
    return win?.isMaximized();
  });

  // Get the local IP address
  ipcMain.handle('get-local-ip', () => {
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
  ipcMain.handle('get-sys-info', () => {
    return getSystemInfo();
  });

  // Close application
  ipcMain.on('close-app', () => {
    app.quit();
  });

  // Open URL in default browser
  ipcMain.on('open-url', (event, url) => {
    shell.openExternal(url);
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
  } else {
    // Production environment
    win.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.key === 'o') {
        win!.webContents.openDevTools();
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
    app.quit();
  });

  // testCallAnthropic();

  return win;
}

// async function testCallAnthropic() {
//   try {
//     const response = await axios.post("https://api.anthropic.com/v1/messages", {
//       headers: {
//         "x-api-key": "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",
//         "Content-Type": "application/json",
//         "anthropic-version": "2023-06-01",
//         "anthropic-dangerous-direct-browser-access": "true",
//       },
//       body: JSON.stringify({
//         messages: [{
//           role: "user",
//           content: "Hello, how are you?"
//         }],
//         model: "claude-3-5-sonnet-20241022",
//         max_tokens: 1024,
//       }),
//     });
  
//     console.log(response);
  
//     const data = response.data;
//     return data;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

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
      const windowsVersion = execSync(
        `powershell -command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; (Get-CimInstance Win32_OperatingSystem).Caption"`,
        { encoding: 'utf8' }
      ).trim();

      return windowsVersion || `Windows ${release}`;
    } catch (_error) {
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
  app.commandLine.appendSwitch('class', 'tensorblock-desktop');

  // Initialize app when Electron is ready
  // Added delay to fix black background issue with transparent windows
  // See: https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    app.quit();
  });

  // Re-create window if activated and no windows exist
  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  });
} catch (_e) {
  // Catch errors but continue
}
