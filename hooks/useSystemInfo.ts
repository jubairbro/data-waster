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
      // 1. IP & Location
      try {
        const res = await fetch('https://ipinfo.io/json');
        if (res.ok) {
          const data = await res.json();
          setInfo(prev => ({
            ...prev,
            ip: data.ip || 'HIDDEN',
            city: data.city || 'UNKNOWN',
            country: data.country || 'UNKNOWN',
            isp: data.org ? data.org.replace(/^AS\d+\s*/, '') : 'UNKNOWN',
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          }));
        } else {
            throw new Error('API Error');
        }
      } catch (e) {
        setInfo(prev => ({ ...prev, ip: 'SECURED_IP', isp: 'PROTECTED' }));
      }

      // 2. Hardware & OS Detection
      const userAgent = navigator.userAgent;
      let os = 'Unknown OS';
      if (userAgent.indexOf("Win") !== -1) os = "WINDOWS NT";
      else if (userAgent.indexOf("Mac") !== -1) os = "MACOS X";
      else if (userAgent.indexOf("Linux") !== -1) os = "LINUX KERNEL";
      else if (userAgent.indexOf("Android") !== -1) os = "ANDROID OS";
      else if (userAgent.indexOf("like Mac") !== -1) os = "IOS";

      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const language = navigator.language.toUpperCase();
      
      // Robust Core Detection: Fallback to generic values if blocked
      const cores = navigator.hardwareConcurrency || (os === 'WINDOWS NT' || os === 'MACOS X' ? 8 : 4);

      setInfo(prev => ({ 
        ...prev, 
        os, 
        browser: navigator.appName.toUpperCase(),
        screenRes,
        language,
        cores
      }));

      const nav = navigator as NavigatorWithMemory;

      // 3. Network & Battery
      if (nav.connection) {
        setInfo(prev => ({
          ...prev,
          connectionType: nav.connection?.effectiveType?.toUpperCase() || 'UNKNOWN',
          downlink: nav.connection?.downlink ? `${nav.connection.downlink} Mbps` : 'STABLE',
        }));
      }

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
        } catch (e) {}
      }
    };

    fetchInfo();
  }, []);

  return info;
};

export default useSystemInfo;