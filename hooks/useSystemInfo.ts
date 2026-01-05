import { useState, useEffect } from 'react';
import { SystemInfo, NavigatorWithMemory } from '../types';

interface ExtendedSystemInfo extends SystemInfo {
  timezone: string;
  screenRes: string;
  language: string;
  cores: number | string;
}

const useSystemInfo = () => {
  const [info, setInfo] = useState<ExtendedSystemInfo>({
    ip: 'SCANNING...',
    city: '...',
    country: '...',
    isp: '...',
    os: 'DETECTING...',
    browser: 'DETECTING...',
    connectionType: 'UNKNOWN',
    downlink: 'UNKNOWN',
    batteryLevel: 'UNKNOWN',
    isCharging: 'UNKNOWN',
    timezone: '...',
    screenRes: '...',
    language: '...',
    cores: '...'
  });

  useEffect(() => {
    const fetchInfo = async () => {
      // 1. IP & Location (Using ipinfo.io as requested)
      try {
        const res = await fetch('https://ipinfo.io/json');
        if (res.ok) {
          const data = await res.json();
          setInfo(prev => ({
            ...prev,
            ip: data.ip || 'HIDDEN',
            city: data.city || 'UNKNOWN',
            country: data.country || 'UNKNOWN',
            isp: data.org ? data.org.replace(/^AS\d+\s*/, '') : 'UNKNOWN', // Remove AS Number
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          }));
        } else {
            throw new Error('API Rate Limit');
        }
      } catch (e) {
        setInfo(prev => ({ ...prev, ip: 'OFFLINE/VPN', isp: 'UNKNOWN' }));
      }

      // 2. Browser & OS
      const userAgent = navigator.userAgent;
      let os = 'Unknown OS';
      if (userAgent.indexOf("Win") !== -1) os = "WINDOWS NT";
      if (userAgent.indexOf("Mac") !== -1) os = "MACOS X";
      if (userAgent.indexOf("Linux") !== -1) os = "LINUX KERNEL";
      if (userAgent.indexOf("Android") !== -1) os = "ANDROID OS";
      if (userAgent.indexOf("like Mac") !== -1) os = "IOS";

      // 3. Hardware & Screen
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const language = navigator.language.toUpperCase();
      const cores = navigator.hardwareConcurrency || '?';

      setInfo(prev => ({ 
        ...prev, 
        os, 
        browser: navigator.appName.toUpperCase(),
        screenRes,
        language,
        cores
      }));

      const nav = navigator as NavigatorWithMemory;

      // 4. Network Information
      if (nav.connection) {
        setInfo(prev => ({
          ...prev,
          connectionType: nav.connection?.effectiveType?.toUpperCase() || 'UNKNOWN',
          downlink: nav.connection?.downlink ? `${nav.connection.downlink} Mbps` : 'UNKNOWN',
        }));
        
        // Listen for changes
        // @ts-ignore - experimental API
        nav.connection.onchange = () => {
             setInfo(prev => ({
                ...prev,
                connectionType: nav.connection?.effectiveType?.toUpperCase() || prev.connectionType,
                downlink: nav.connection?.downlink ? `${nav.connection.downlink} Mbps` : prev.downlink,
              }));
        }
      }

      // 5. Battery
      if (nav.getBattery) {
        try {
          const battery = await nav.getBattery();
          const updateBattery = () => {
            setInfo(prev => ({
              ...prev,
              batteryLevel: `${Math.round(battery.level * 100)}%`,
              isCharging: battery.charging ? 'YES' : 'NO',
            }));
          };
          
          updateBattery();
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);
        } catch (e) {
          console.warn("Battery API error", e);
        }
      }
    };

    fetchInfo();
  }, []);

  return info;
};

export default useSystemInfo;