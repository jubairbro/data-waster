import React, { useState, useEffect, useMemo } from 'react';
import { WasterState, SystemInfo } from '../types';
import { getUsageStats, formatBytes, formatBitRate } from '../utils';

interface Props {
  wasterState: WasterState;
  onStart: (bytes: number) => void;
  onStop: () => void;
  systemInfo: SystemInfo;
  onSwitchMode: () => void;
  theme: 'dark' | 'light';
  onSetTheme: (theme: 'dark' | 'light') => void;
}

const UNITS = ['KB', 'MB', 'GB', 'TB'];

const GUI: React.FC<Props> = ({ wasterState, onStart, onStop, onSwitchMode, theme, onSetTheme, systemInfo }) => {
  const [unit, setUnit] = useState<'KB' | 'MB' | 'GB' | 'TB'>('GB');
  const [val, setVal] = useState<number>(1);
  const [stats, setStats] = useState(getUsageStats());
  const isDark = theme === 'dark';

  const liveStats = useMemo(() => {
    const session = wasterState.isRunning ? wasterState.bytesWasted : 0;
    return {
      today: stats.todayBytes + session,
      month: stats.monthBytes + session,
      total: stats.totalBytes + session,
    };
  }, [stats, wasterState.bytesWasted, wasterState.isRunning]);

  useEffect(() => {
    if (!wasterState.isRunning) setStats(getUsageStats());
  }, [wasterState.isRunning]);

  const handleStart = () => {
    const mult = { KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4 }[unit];
    onStart(val * mult);
  };

  const cardBg = isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xl';
  const mainText = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="flex-1 flex flex-col space-y-6 pb-20 font-sans">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center bg-transparent py-4">
        <div>
            <h1 className={`text-3xl font-black tracking-tighter ${mainText}`}>Sensei Waster</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest text-blue-500`}>Network Node: {systemInfo.ip}</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => onSetTheme(isDark ? 'light' : 'dark')}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                    isDark ? 'bg-slate-700 border-slate-600 text-yellow-400' : 'bg-white border-slate-100 text-blue-600 shadow-sm'
                }`}
            >
                {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={onSwitchMode} className={`px-5 py-2.5 rounded-2xl text-xs font-black bg-slate-900 text-white shadow-lg shadow-black/20`}>
                Terminal
            </button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
            { l: "Purged Today", v: liveStats.today, color: "text-blue-500" },
            { l: "Monthly Usage", v: liveStats.month, color: "text-indigo-500" },
            { l: "Lifetime Data", v: liveStats.total, color: "text-purple-500" }
        ].map((s, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border ${cardBg}`}>
                <div className={`text-[10px] uppercase font-black tracking-widest mb-1 ${subText}`}>{s.l}</div>
                <div className={`text-2xl font-black ${s.color}`}>{formatBytes(s.v)}</div>
            </div>
        ))}
      </div>

      {/* Main Control Panel */}
      <div className={`p-8 md:p-12 rounded-[3.5rem] border ${cardBg}`}>
        <div className="flex justify-center gap-2 mb-12">
            {UNITS.map(u => (
                <button 
                    key={u} 
                    onClick={() => setUnit(u as any)}
                    disabled={wasterState.isRunning}
                    className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                        unit === u ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 
                        (isDark ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400 bg-slate-50')
                    }`}
                >
                    {u}
                </button>
            ))}
        </div>

        <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 w-full px-2">
                    <input 
                        type="range" min="1" max="1024" step="1"
                        value={val} 
                        disabled={wasterState.isRunning}
                        onChange={e => setVal(Number(e.target.value))}
                        className={`w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}
                    />
                    <div className="flex justify-between mt-4 text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                        <span>Min Control</span>
                        <span>Drag to Adjust Payload</span>
                        <span>Max Control</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input 
                            type="number" value={val} 
                            disabled={wasterState.isRunning}
                            onChange={e => setVal(Math.max(1, Number(e.target.value)))}
                            className={`w-36 p-6 rounded-[2.5rem] text-center text-4xl font-black outline-none border-2 transition-all ${
                                isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 
                                'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600'
                            }`}
                        />
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-[10px] font-black text-white uppercase shadow-md">Value</span>
                    </div>
                    <span className="font-black text-3xl text-slate-300">{unit}</span>
                </div>
            </div>

            <div className="pt-6">
                {!wasterState.isRunning ? (
                    <button 
                    onClick={handleStart} 
                    className="w-full py-8 rounded-full bg-blue-600 text-white text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        Initiate Stream
                    </button>
                ) : (
                    <button 
                    onClick={onStop} 
                    className="w-full py-8 rounded-full bg-rose-600 text-white text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/40 hover:bg-rose-700 active:scale-95 transition-all animate-pulse"
                    >
                        Abort Stream
                    </button>
                )}
            </div>
        </div>

        {/* Live Bandwidth Dashboard */}
        {wasterState.isRunning && (
            <div className="mt-16 space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                <div className="flex justify-between items-end">
                    <div>
                        <div className={`text-[10px] font-black uppercase mb-1 ${subText}`}>Traffic Flow Rate</div>
                        <div className={`text-5xl md:text-6xl font-black tracking-tighter ${mainText}`}>{formatBitRate(wasterState.speedBps)}</div>
                    </div>
                    <div className="text-right">
                        <div className={`text-[10px] font-black uppercase mb-1 ${subText}`}>Active Payload</div>
                        <div className={`text-2xl font-black ${mainText}`}>{formatBytes(wasterState.bytesWasted)}</div>
                    </div>
                </div>
                
                <div className="relative">
                    <div className={`h-8 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-300 shadow-[0_0_25px_rgba(37,99,235,0.4)]" 
                          style={{ width: `${(wasterState.bytesWasted/wasterState.targetBytes)*100}%` }} 
                        />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black text-white mix-blend-difference">
                        {((wasterState.bytesWasted/wasterState.targetBytes)*100).toFixed(1)}% PURGED
                    </div>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>ISP: {systemInfo.isp}</span>
                    <span>Elapsed: {wasterState.elapsedTime.toFixed(1)}s</span>
                    <span>Latency: 24ms</span>
                </div>
            </div>
        )}
      </div>

      {/* Global Rank Meter */}
      <div className={`p-8 rounded-[2.5rem] border ${cardBg}`}>
         <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                 <span className={`text-xs font-black uppercase tracking-wider ${mainText}`}>Rank: {stats.rank}</span>
             </div>
             <span className={`text-[10px] font-black uppercase tracking-widest ${subText}`}>Target: {stats.nextRank}</span>
         </div>
         <div className={`h-2.5 rounded-full ${isDark ? 'bg-slate-900' : 'bg-slate-50'} overflow-hidden`}>
            <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${stats.progress}%` }} />
         </div>
      </div>
    </div>
  );
};

export default GUI;