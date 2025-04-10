interface Window {
  electron: {
    maximize: () => Promise<boolean>;
    unmaximize: () => Promise<boolean>;
    minimize: () => Promise<boolean>;
    isMaximized: () => Promise<boolean>;
    closeApp: () => Promise<void>;
    getPlatform: () => Promise<string>;
    getDeviceInfo: () => Promise<{
      totalMemory: number;
      freeMemory: number;
      usedMemory: number;
      cpuUsage: number;
    }>;
    openUrl: (url: string) => Promise<void>;
    onWindowMaximizedChange: (callback: (event: IpcRendererEvent, maximized: boolean) => void) => void;
  };
} 