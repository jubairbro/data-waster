export interface SystemInfo {
  ip: string;
  city: string;
  country: string;
  isp: string;
  os: string;
  browser: string;
  connectionType: string;
  downlink: number | string;
  batteryLevel: string;
  isCharging: string;
  timezone?: string;
  screenRes?: string;
  language?: string;
  cores?: number | string;
}

export interface WasterState {
  isRunning: boolean;
  bytesWasted: number;
  targetBytes: number;
  speedBps: number; // Bytes per second
  elapsedTime: number; // Seconds
}

export interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'success' | 'system';
  message: string;
  timestamp: number;
}

// Extending Navigator for experimental APIs
export interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
    saveData: boolean;
  };
  getBattery?: () => Promise<{
    level: number;
    charging: boolean;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  }>;
}