import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * The preload script runs before the renderer process starts and has access to both
 * Node.js APIs and a limited subset of Electron's renderer APIs.
 * It's used to securely expose main process functionality to the renderer.
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Window control
  maximize: () => ipcRenderer.invoke('maximize-window'),
  unmaximize: () => ipcRenderer.invoke('unmaximize-window'),
  minimize: () => ipcRenderer.invoke('minimize-window'),
  isMaximized: () => ipcRenderer.invoke('get-window-isMaximized'),
  closeApp: () => ipcRenderer.send('close-app'),
  onWindowMaximizedChange: (callback: (event: IpcRendererEvent, maximized: boolean) => void) => ipcRenderer.on('window-maximized-change', callback),
  
  // System information
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  getSysInfo: () => ipcRenderer.invoke('get-sys-info'),
  getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // File and URL operations
  openUrl: (url: string) => ipcRenderer.send('open-url', url),
  openFolderByFile: (path: string) => ipcRenderer.send('open-folder-by-file', path),
  saveFile: (fileBuffer: ArrayBuffer | string, fileName: string, fileType: string) => 
    ipcRenderer.invoke('save-file', { fileBuffer, fileName, fileType }),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
}); 