import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store for managing robot connection state
 * Handles IP address, connection mode (WiFi/BLE), and discovery
 */
export const useConnectionStore = create(
  persist(
    (set, get) => ({
      // Connection Settings
      robotIp: 'localhost',
      robotPort: 8000,
      connectionMode: 'WIFI', // 'WIFI' | 'BLE'
      
      // Connection Status
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      
      // Discovery
      isScanning: false,
      discoveredRobots: [], // Array of { id, name, ip, signal, type }
      
      // Actions
      setRobotIp: (ip) => set({ robotIp: ip }),
      setRobotPort: (port) => set({ robotPort: port }),
      setConnectionMode: (mode) => set({ connectionMode: mode }),
      
      setIsConnected: (connected) => set({ isConnected: connected }),
      setIsConnecting: (connecting) => set({ isConnecting: connecting }),
      setConnectionError: (error) => set({ connectionError: error }),
      
      startScanning: () => set({ isScanning: true, discoveredRobots: [] }),
      stopScanning: () => set({ isScanning: false }),
      addDiscoveredRobot: (robot) => set((state) => {
        // Avoid duplicates
        const exists = state.discoveredRobots.some(r => r.id === robot.id);
        if (exists) return state;
        return { discoveredRobots: [...state.discoveredRobots, robot] };
      }),
      clearDiscoveredRobots: () => set({ discoveredRobots: [] }),
      
      // Helper to get full API URL
      getApiUrl: () => {
        const { robotIp, robotPort } = get();
        // If connecting to localhost on iOS/Android, we might need special handling
        // but for now assume direct IP
        return `http://${robotIp}:${robotPort}`;
      }
    }),
    {
      name: 'reachy-connection-storage', // Persistence key
      partialize: (state) => ({ 
        robotIp: state.robotIp,
        connectionMode: state.connectionMode 
      }), // Only persist settings, not transient status
    }
  )
);

export default useConnectionStore;
