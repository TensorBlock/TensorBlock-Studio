/* eslint-disable @typescript-eslint/no-unused-vars */
import {app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
// import axios from 'axios';

// Main window reference
let win: BrowserWindow | null = null;
// Tray reference
let tray: Tray | null = null;

// Settings
let closeToTray = true;
let forceQuit = false; // Flag to indicate we're trying to actually quit

// Check if app is running in development mode
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

/**
 * Create the system tray
 */
function createTray() {
  if (tray) {
    return;
  }

  // Get appropriate icon based on platform
  const iconPath = path.join(__dirname, '..', 'dist', 'logos', 'favicon.256x256.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);
  tray.setToolTip('TensorBlock Desktop');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open TensorBlock', click: () => { 
      win?.show(); 
      win?.setSkipTaskbar(false); // Show in taskbar
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => { 
      forceQuit = true; // Set flag to bypass close-to-tray
      app.quit(); 
    }}
  ]);
  
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
        win.setSkipTaskbar(true); // Hide from taskbar
      } else {
        win.show();
        win.setSkipTaskbar(false); // Show in taskbar
      }
    }
  });
}

/**
 * Set or remove auto launch on system startup
 */
function setAutoLaunch(enable: boolean): boolean {
  try {
    if (process.platform === 'win32') {
      const appPath = app.getPath('exe');
      const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
      const appName = app.getName();
      
      if (enable) {
        // Add to registry to enable auto launch
        execSync(`reg add ${regKey} /v ${appName} /t REG_SZ /d "${appPath}" /f`);
      } else {
        // Remove from registry to disable auto launch
        execSync(`reg delete ${regKey} /v ${appName} /f`);
      }
      return true;
    } else if (process.platform === 'darwin') {
      const appPath = app.getPath('exe');
      const loginItemSettings = app.getLoginItemSettings();
      
      // Set login item settings for macOS
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: appPath
      });
      
      return app.getLoginItemSettings().openAtLogin === enable;
    } else if (process.platform === 'linux') {
      // For Linux, create or remove a .desktop file in autostart directory
      const desktopFilePath = path.join(os.homedir(), '.config', 'autostart', `${app.getName()}.desktop`);
      
      if (enable) {
        // Create directory if it doesn't exist
        const autoStartDir = path.dirname(desktopFilePath);
        if (!fs.existsSync(autoStartDir)) {
          fs.mkdirSync(autoStartDir, { recursive: true });
        }
        
        // Create .desktop file
        const desktopFileContent = `
          [Desktop Entry]
          Type=Application
          Exec=${app.getPath('exe')}
          Hidden=false
          NoDisplay=false
          X-GNOME-Autostart-enabled=true
          Name=${app.getName()}
          Comment=${app.getName()} startup script
          `;
        fs.writeFileSync(desktopFilePath, desktopFileContent);
      } else if (fs.existsSync(desktopFilePath)) {
        // Remove .desktop file
        fs.unlinkSync(desktopFilePath);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting auto launch:', error);
    return false;
  }
}

/**
 * Check if app is set to auto launch on system startup
 */
function getAutoLaunchEnabled(): boolean {
  try {
    if (process.platform === 'win32') {
      const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
      const appName = app.getName();
      
      const output = execSync(`reg query ${regKey} /v ${appName} 2>nul`).toString();
      return output.includes(appName);
    } else if (process.platform === 'darwin') {
      return app.getLoginItemSettings().openAtLogin;
    } else if (process.platform === 'linux') {
      const desktopFilePath = path.join(os.homedir(), '.config', 'autostart', `${app.getName()}.desktop`);
      return fs.existsSync(desktopFilePath);
    }
    
    return false;
  } catch (error) {
    // If command fails (e.g., key doesn't exist), auto launch is not enabled
    return false;
  }
}

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
    frame: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    minWidth: 800,
    minHeight: 700,
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
  
  // Save file handler
  ipcMain.handle('save-file', async (event, args) => {
    try {
      if (!win) return { success: false, error: 'Window not available' };
      
      const { fileBuffer, fileName, fileType } = args;
      
      // Show save dialog
      const result = await dialog.showSaveDialog(win, {
        title: 'Save File',
        defaultPath: fileName,
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }
      
      // Convert base64 to buffer if needed
      let buffer;
      if (typeof fileBuffer === 'string') {
        buffer = Buffer.from(fileBuffer, 'base64');
      } else {
        buffer = Buffer.from(fileBuffer);
      }
      
      // Write file to disk
      fs.writeFileSync(result.filePath, buffer);
      
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: String(error) };
    }
  });
  
  // Open file handler
  ipcMain.handle('open-file', async (event, filePath) => {
    try {
      if (!filePath) return { success: false, error: 'No file path provided' };
      
      const result = await shell.openPath(filePath);
      
      if (result) {
        return { success: false, error: result };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error opening file:', error);
      return { success: false, error: String(error) };
    }
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

  // Emit when window's maximized state changes
  win?.on('maximize', () => {
    win?.webContents.send('window-maximized-change', true);
  });

  win?.on('unmaximize', () => {
    win?.webContents.send('window-maximized-change', false);
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
    if (closeToTray && !forceQuit) {
      win?.hide();
      win?.setSkipTaskbar(true); // Hide from taskbar
    } else {
      forceQuit = true; // Ensure we're really quitting
      app.quit();
    }
  });

  // Open URL in default browser
  ipcMain.on('open-url', (event, url) => {
    shell.openExternal(url);
  });

  // Auto-startup handlers
  ipcMain.handle('get-auto-launch', () => {
    return getAutoLaunchEnabled();
  });

  ipcMain.handle('set-auto-launch', (event, enable) => {
    return setAutoLaunch(enable);
  });

  // Tray handlers
  ipcMain.handle('set-close-to-tray', (event, enable) => {
    closeToTray = enable;
    return true;
  });

  ipcMain.handle('get-close-to-tray', () => {
    return closeToTray;
  });

  ipcMain.handle('set-startup-to-tray', (event, enable) => {
    // Store this preference for the next app start
    try {
      const configPath = path.join(app.getPath('userData'), 'config.json');
      let config = {};
      
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      
      config = { ...config, startupToTray: enable };
      fs.writeFileSync(configPath, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Error saving startup to tray setting:', error);
      return false;
    }
  });

  // Listen for window close event
  win.on('close', (e) => {
    if (closeToTray && !forceQuit) {
      e.preventDefault();
      win?.hide();
      win?.setSkipTaskbar(true); // Hide from taskbar
    }
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

  // Set force quit flag when app is about to quit
  app.on('before-quit', () => {
    forceQuit = true;
  });

  // Initialize app when Electron is ready
  // Added delay to fix black background issue with transparent windows
  // See: https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    setTimeout(() => {
      // Create window
      win = createWindow();
      
      // Create tray
      createTray();
      
      // Check if we should start minimized to tray
      try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.startupToTray) {
            win.hide();
          }
        }
      } catch (error) {
        console.error('Error reading config file:', error);
      }
    }, 400);
  });

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    app.quit();
  });

  // Re-create window if activated and no windows exist
  app.on('activate', () => {
    if (win === null) {
      win = createWindow();
    } else {
      win.show();
      win.setSkipTaskbar(false); // Show in taskbar
    }
  });
} catch (_e) {
  // Catch errors but continue
}
