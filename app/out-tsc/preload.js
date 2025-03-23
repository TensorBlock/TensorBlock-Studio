"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * The preload script runs before the renderer process starts and has access to both
 * Node.js APIs and a limited subset of Electron's renderer APIs.
 * It's used to securely expose main process functionality to the renderer.
 */
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electron', {
    // Window control
    maximize: () => electron_1.ipcRenderer.invoke('maximize-window'),
    unmaximize: () => electron_1.ipcRenderer.invoke('unmaximize-window'),
    minimize: () => electron_1.ipcRenderer.invoke('minimize-window'),
    isMaximized: () => electron_1.ipcRenderer.invoke('get-window-isMaximized'),
    closeApp: () => electron_1.ipcRenderer.send('close-app'),
    // System information
    getDeviceInfo: () => electron_1.ipcRenderer.invoke('get-device-info'),
    getSysInfo: () => electron_1.ipcRenderer.invoke('get-sys-info'),
    getLocalIp: () => electron_1.ipcRenderer.invoke('get-local-ip'),
    getPlatform: () => electron_1.ipcRenderer.invoke('get-platform'),
    // File and URL operations
    openUrl: (url) => electron_1.ipcRenderer.send('open-url', url),
    openFolderByFile: (path) => electron_1.ipcRenderer.send('open-folder-by-file', path),
});
//# sourceMappingURL=preload.js.map