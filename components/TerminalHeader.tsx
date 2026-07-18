import React from 'react';
import { SystemInfo } from '../types';

interface Props {
  info: SystemInfo;
  intensity: 'bright' | 'dim';
}

const TerminalHeader: React.FC<Props> = ({ info, intensity }) => {
  const isDim = intensity === 'dim';

  return (
    <div className={`mb-6 transition-all duration-300 font-mono ${isDim ? 'opacity-30 blur-[0.5px]' : 'opacity-100'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Box: Network Node */}
        <div className="relative border-2 border-terminal-green bg-black/40 group">
           {/* Header Label - Positioned as if part of the border */}
           <div className="absolute -top-3 left-3 bg-black px-2 text-terminal-green text-[10px] font-bold uppercase tracking-widest border border-terminal-green">
             NETWORK_TELEMETRY
           </div>
           
           <div className="p-4 pt-5 space-y-2 text-[11px] md:text-xs">
              <div className="flex justify-between items-center border-b border-terminal-dim/30 pb-1">
                <span className="text-terminal-dim">NODE_IP :</span>
                <span className="text-terminal-cyan font-bold">{info.ip}</span>
              </div>
              <div className="flex justify-between items-center border-b border-terminal-dim/30 pb-1">
                <span className="text-terminal-dim">ISP_TAG :</span>
                <span className="truncate max-w-[140px] text-terminal-green text-right">{info.isp}</span>
              </div>
              <div className="flex justify-between items-center border-b border-terminal-dim/30 pb-1">
                <span className="text-terminal-dim">LOCATION:</span>
                <span className="text-terminal-green">{info.city}, {info.country}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-terminal-dim">PEAK_DL :</span>
                <span className="text-terminal-cyan font-bold">{info.downlink}</span>
              </div>
           </div>
        </div>

        {/* Right Box: System Kernel */}
        <div className="relative border-2 border-terminal-green bg-black/40 group">
           {/* Header Label */}
           <div className="absolute -top-3 left-3 bg-black px-2 text-terminal-green text-[10px] font-bold uppercase tracking-widest border border-terminal-green">
             SYSTEM_KERNEL
           </div>
           
           <div className="p-4 pt-5 space-y-2 text-[11px] md:text-xs">
              <div className="flex justify-between items-center border-b border-terminal-dim/30 pb-1">
                <span className="text-terminal-dim">OS_TYPE :</span>
                <span className="text-white font-bold">{info.os}</span>
              </div>
              <div className="flex justify-between items-center border-b border-terminal-dim/40 pb-1">
                <span className="text-terminal-dim">CPU_CORE:</span>
                <span className="text-terminal-green">{info.cores} LOGICAL</span>
              </div>
              <div className="flex justify-between items-center border-b border-terminal-dim/40 pb-1">
                <span className="text-terminal-dim">STATUS  :</span>
                <span className="text-terminal-green uppercase">AUTHORIZED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-terminal-dim">POWER   :</span>
                <span className={info.isCharging === 'YES' ? 'text-terminal-green animate-pulse' : 'text-terminal-warn'}>
                    {info.batteryLevel} {info.isCharging === 'YES' ? '[CHARGING]' : '[DISCHARGING]'}
                </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalHeader;