interface Window {
  electron: {
    maximize: () => Promise<boolean>;
    unmaximize: () => Promise<boolean>;
    minimize: () => Promise<boolean>;
    isMaximized: () => Promise<boolean>;
    closeApp: () => Promise<void>;
    getDeviceInfo: () => Promise<{
      totalMemory: number;
      freeMemory: number;
      usedMemory: number;
      cpuUsage: number;
    }>;
    openUrl: (url: string) => Promise<void>;
  };
} 