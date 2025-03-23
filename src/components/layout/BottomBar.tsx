import React, { useEffect, useState } from 'react';

interface SystemResources {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  cpuUsage: number;
}

interface BottomBarProps {
  loadedModels: string[];
}

export const BottomBar: React.FC<BottomBarProps> = ({ loadedModels }) => {
  const [resources, setResources] = useState<SystemResources>({
    totalMemory: 0,
    freeMemory: 0,
    usedMemory: 0,
    cpuUsage: 0
  });

  // Poll for system resources
  useEffect(() => {
    const updateResources = async () => {
      try {
        // Always try to get real data from Electron first
        if (typeof window !== 'undefined' && window.electron && window.electron.getDeviceInfo) {
          // Get device info from Electron
          const data = await window.electron.getDeviceInfo();
          setResources(data);
        } else {
          // Only if electron APIs are completely unavailable, use mock data
          console.warn('Electron API not available - using mock data. Consider running in Electron environment.');
          setResources({
            totalMemory: 16 * 1024 * 1024 * 1024, // 16GB
            freeMemory: 8 * 1024 * 1024 * 1024,   // 8GB
            usedMemory: 8 * 1024 * 1024 * 1024,   // 8GB
            cpuUsage: 25                          // 25%
          });
        }
      } catch (error) {
        console.error("Failed to get system resources:", error);
        // Log more detailed error information to help debugging
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        
        // Fallback to mock data on error
        setResources({
          totalMemory: 16 * 1024 * 1024 * 1024,
          freeMemory: 8 * 1024 * 1024 * 1024,
          usedMemory: 8 * 1024 * 1024 * 1024,
          cpuUsage: 25
        });
      }
    };

    // Update immediately and then every 2 seconds (more frequent updates)
    updateResources();
    const interval = setInterval(updateResources, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Convert bytes to GB for display
  const bytesToGB = (bytes: number): number => {
    return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10; // Round to 1 decimal place
  };

  // Format CPU usage percentage
  const formatCpuUsage = (usage: number): number => {
    return Math.round(usage * 100) / 100; // Round to 2 decimal places
  };

  return (
    <div className="h-8 border-t border-gray-200 px-4 flex items-center justify-between bg-[#f8f8f8] text-xs text-gray-600">
      <div>
        Loaded Models: {loadedModels.length ? loadedModels.join(', ') : 'Not loaded'}
      </div>
      
      <div className="flex space-x-4">
        {/* GPU metrics are not available in the current API */}
        <div>RAM: {bytesToGB(resources.totalMemory)} GB</div>
        <div>RAM Usage: {Math.round((resources.usedMemory / resources.totalMemory) * 100) || 0}%</div>
        <div>CPU: {formatCpuUsage(resources.cpuUsage)}%</div>
      </div>
    </div>
  );
};

export default BottomBar; 