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
    saveFile: (fileBuffer: ArrayBuffer | string, fileName: string, fileType: string) => Promise<{
      success: boolean;
      filePath?: string;
      canceled?: boolean;
      error?: string;
    }>;
    openFile: (filePath: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
} 