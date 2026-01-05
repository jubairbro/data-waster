import React from 'react';
import { SystemInfo } from '../types';

interface Props {
  info: SystemInfo & { timezone?: string; screenRes?: string; language?: string; cores?: string | number };
  theme: 'dark' | 'light';
}

const TerminalHeader: React.FC<Props> = ({ info, theme }) => {
  const isDark = theme === 'dark';

  // Dynamic Styles based on theme
  const containerClass = isDark 
    ? 'text-terminal-green border-terminal-green bg-black/80 shadow-[0_0_15px_rgba(0,255,65,0.15)]'
    : 'text-terminal-light-text border-terminal-light-accent bg-terminal-light-panel/50 shadow-lg';
  
  const borderClass = isDark ? 'border-terminal-dim' : 'border-terminal-light-dim';
  const labelClass = isDark ? 'opacity-60' : 'opacity-60 font-bold text-gray-400';
  const valueClass = isDark ? '' : 'font-semibold text-gray-100';
  const accentText = isDark ? 'text-terminal-cyan' : 'text-teal-300'; // Lighter teal for grey bg
  const warnText = isDark ? 'text-terminal-warn' : 'text-orange-300'; // Lighter orange for grey bg
  const headerBg = isDark ? 'bg-terminal-green text-terminal-black' : 'bg-terminal-light-accent text-black';

  return (
    <div className={`mb-6 font-mono text-xs sm:text-sm border p-4 relative overflow-hidden transition-colors duration-300 ${containerClass}`}>
        {/* Decorative corner accents */}
        <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${isDark ? 'border-terminal-cyan' : 'border-teal-400'}`}></div>
        <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${isDark ? 'border-terminal-cyan' : 'border-teal-400'}`}></div>
        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${isDark ? 'border-terminal-cyan' : 'border-teal-400'}`}></div>
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${isDark ? 'border-terminal-cyan' : 'border-teal-400'}`}></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Network Identity */}
        <div>
          <h3 className={`${headerBg} inline-block px-1 font-bold mb-3`}>
            [ IDENTITY_MATRIX ]
          </h3>
          <div className="space-y-1 pl-1">
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>IP_ADDR</span>
                <span className={`${warnText} font-bold tracking-wider`}>{info.ip}</span>
            </div>
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>ISP_ORG</span>
                <span className={`text-right max-w-[150px] truncate ${valueClass}`}>{info.isp}</span>
            </div>
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>GEO_LOC</span>
                <span className={valueClass}>{info.city}, {info.country}</span>
            </div>
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>TIMEZONE</span>
                <span className={accentText}>{info.timezone}</span>
            </div>
             <div className="flex justify-between pt-1">
                <span className={labelClass}>CONN_TYPE</span>
                <span className={`${accentText} font-bold`}>{info.connectionType} ({info.downlink})</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Status */}
        <div>
          <h3 className={`${headerBg} inline-block px-1 font-bold mb-3 md:mt-0 mt-2`}>
            [ SYSTEM_KERNEL ]
          </h3>
           <div className="space-y-1 pl-1">
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>HOST_OS</span>
                <span className={isDark ? 'text-white' : 'text-white font-bold'}>{info.os}</span>
            </div>
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>SCREEN</span>
                <span className={valueClass}>{info.screenRes}</span>
            </div>
             <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>CORES</span>
                <span className={valueClass}>{info.cores} LOGICAL</span>
            </div>
            <div className={`flex justify-between border-b pb-1 border-dashed ${borderClass}`}>
                <span className={labelClass}>LANG</span>
                <span className={valueClass}>{info.language}</span>
            </div>
             <div className="flex justify-between pt-1">
                <span className={labelClass}>POWER</span>
                <span className={info.isCharging === 'YES' ? (isDark ? 'text-terminal-green font-bold' : 'text-green-400 font-bold') : warnText}>
                  {info.batteryLevel} {info.isCharging === 'YES' ? '[CHR]' : '[DIS]'}
                </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`mt-4 pt-2 border-t text-center text-[10px] tracking-[0.2em] uppercase ${borderClass} ${isDark ? 'text-terminal-dim' : 'text-gray-500'}`}>
         /// Secure Connection Established ///
      </div>
    </div>
  );
};

export default TerminalHeader;