import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, WasterState, SystemInfo } from '../types';
import { parseTarget, formatBytes, formatBitRate, getUsageStats } from '../utils';
import TerminalHeader from './TerminalHeader';

interface Props {
  onStart: (bytes: number) => void;
  onStop: () => void;
  wasterState: WasterState;
  systemInfo: SystemInfo;
  onReboot: () => void;
  onToggleGUI: () => void;
}

const HelpTable = () => (
    <div className="my-4 border border-terminal-green/30 rounded overflow-hidden max-w-sm font-mono">
        <div className="bg-terminal-green/10 px-3 py-1 border-b border-terminal-green/30 text-[10px] font-bold tracking-widest uppercase">MODULE_INDEX</div>
        <div className="divide-y divide-terminal-dim/30">
            {[
                { cmd: 'gui', desc: 'Graphical Interface' },
                { cmd: 'speedtest', desc: 'Deep Network Analysis' },
                { cmd: 'start [sz]', desc: 'Ex: start 1gb' },
                { cmd: 'stop', desc: 'Kill Streams' },
                { cmd: 'stats', desc: 'View User Rank' },
                { cmd: 'light/dark', desc: 'Display Intensity' },
                { cmd: 'clear', desc: 'Flush Terminal' },
                { cmd: 'reboot', desc: 'Reload Kernel' }
            ].map(item => (
                <div key={item.cmd} className="flex px-3 py-1.5 hover:bg-terminal-green/5 transition-colors">
                    <span className="w-24 text-terminal-green font-bold shrink-0">{item.cmd}</span>
                    <span className="text-terminal-cyan text-[11px]">{item.desc}</span>
                </div>
            ))}
        </div>
    </div>
);

const CLI: React.FC<Props> = ({ onStart, onStop, wasterState, systemInfo, onReboot, onToggleGUI }) => {
  const [input, setInput] = useState('');
  const [intensity, setIntensity] = useState<'bright' | 'dim'>('bright');
  const [history, setHistory] = useState<(LogEntry | { type: 'help_table', id: string })[]>([
    { id: '0', type: 'info', message: `
  ____  _____ _   _ ____  _____ ___ 
 / ___|| ____| \\ | / ___|| ____|_ _|
 \\___ \\|  _| |  \\| \\___ \\|  _|  | | 
  ___) | |___| |\\  |___) | |___ | | 
 |____/|_____|_| \\_|____/|_____|___|
    [ SYSTEM INITIALIZED V4.5 ]
`, timestamp: Date.now() } as LogEntry,
    { id: '1', type: 'system', message: 'SENSEI_OS KERNEL 4.5.0-STABLE LOADED.', timestamp: Date.now() } as LogEntry,
    { id: '2', type: 'info', message: 'Ready. Type "help" or "speedtest" to begin.', timestamp: Date.now() } as LogEntry
  ]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, wasterState.isRunning]);

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    document.addEventListener('click', focus);
    return () => document.removeEventListener('click', focus);
  }, []);

  const addLog = (type: LogEntry['type'], message: string) => {
    setHistory(prev => [...prev, { id: Date.now().toString(), type, message, timestamp: Date.now() } as LogEntry]);
  };

  const runSpeedTest = async () => {
    addLog('system', '[*] INITIATING DEEP PACKET INSPECTION...');
    await new Promise(r => setTimeout(r, 1200));
    
    addLog('info', `[*] HANDSHAKING WITH EDGE_NODE: ${systemInfo.city.toUpperCase()}`);
    await new Promise(r => setTimeout(r, 1000));
    addLog('info', `[+] CONNECTED TO: SENSEI-PROBE-SERVER (${systemInfo.isp})`);
    
    // Phase 1: Latency & Jitter (2.5s)
    addLog('info', '[*] MEASURING LATENCY (ICMP PROBE)...');
    await new Promise(r => setTimeout(r, 1500));
    const ping = Math.floor(Math.random() * 15) + 12;
    const jitter = (Math.random() * 2 + 0.5).toFixed(2);
    addLog('success', `[✔] PING: ${ping}ms | JITTER: ${jitter}ms`);

    // Phase 2: Download Test (5.5s)
    addLog('info', '[*] STARTING MULTI-THREAD DOWNLOAD (8 STREAMS)...');
    const baseDown = parseFloat(systemInfo.downlink as string) || 45;
    for (let i = 1; i <= 6; i++) {
        await new Promise(r => setTimeout(r, 800));
        const currentSpeed = (baseDown * (0.85 + Math.random() * 0.3)).toFixed(2);
        addLog('info', `    [THREAD-${i}] FETCHING CHUNK: ${currentSpeed} mbps`);
    }
    const finalDown = (baseDown * (0.95 + Math.random() * 0.1)).toFixed(2);
    addLog('success', `[✔] DOWNLOAD PEAK: ${finalDown} mbps`);

    // Phase 3: Upload Test (5s)
    addLog('info', '[*] INITIALIZING UPLOAD BUFFER (POST-PROBE)...');
    await new Promise(r => setTimeout(r, 1000));
    const baseUp = baseDown * 0.65;
    for (let i = 1; i <= 5; i++) {
        await new Promise(r => setTimeout(r, 800));
        const currentUp = (baseUp * (0.8 + Math.random() * 0.4)).toFixed(2);
        addLog('info', `    [UP-STREAM] SYNCING: ${currentUp} mbps`);
    }
    const finalUp = (baseUp * (0.9 + Math.random() * 0.2)).toFixed(2);
    addLog('success', `[✔] UPLOAD PEAK: ${finalUp} mbps`);

    await new Promise(r => setTimeout(r, 1000));
    
    // Final Summary Box
    setHistory(prev => [...prev, {
        id: Date.now().toString(),
        type: 'info',
        message: `
+-----------------------------------+
|       NETWORK DIAGNOSTICS         |
+-----------------------------------+
| NODE: ${systemInfo.ip.padEnd(27)} |
| ISP : ${systemInfo.isp.substring(0, 26).padEnd(27)} |
| LOC : ${ (systemInfo.city + ', ' + systemInfo.country).substring(0,26).padEnd(27) } |
| PING: ${(ping + ' ms').padEnd(27)} |
| DOWN: ${(finalDown + ' mbps').padEnd(27)} |
| UP  : ${(finalUp + ' mbps').padEnd(27)} |
+-----------------------------------+
`
    } as LogEntry]);
    
    addLog('success', 'ANALYSIS COMPLETE. SYSTEM READY.');
  };

  const handleCommand = (cmd: string) => {
    const raw = cmd.trim().toLowerCase();
    if (!raw) return;

    addLog('system', `sensei@root:~$ ${raw}`);

    if (raw === 'gui' || raw === 'desktop') {
        addLog('success', 'TRANSITIONING TO DASHBOARD...');
        setTimeout(onToggleGUI, 600);
        return;
    }
    if (raw === 'light') {
        setIntensity('bright');
        addLog('info', 'BRIGHTNESS: MAX');
        return;
    }
    if (raw === 'dark') {
        setIntensity('dim');
        addLog('info', 'BRIGHTNESS: STEALTH');
        return;
    }
    if (raw === 'speedtest') {
        runSpeedTest();
        return;
    }
    if (raw === 'help') {
        setHistory(prev => [...prev, { id: Date.now().toString(), type: 'help_table' }]);
        return;
    }
    if (raw.startsWith('start ')) {
        const bytes = parseTarget(raw.replace('start ', ''));
        if (bytes) {
            onStart(bytes);
            addLog('success', `PURGE INITIALIZED: ${formatBytes(bytes)}`);
        } else addLog('error', 'SYNTAX ERROR. TRY: start 500mb');
        return;
    }
    if (raw === 'stop') {
        onStop();
        addLog('error', 'PURGE ABORTED BY USER.');
        return;
    }
    if (raw === 'stats') {
        const s = getUsageStats();
        addLog('info', `RANK: ${s.rank}\nTOTAL PURGED: ${formatBytes(s.totalBytes)}\nSESSIONS: ${s.totalSessions}`);
        return;
    }
    if (raw === 'clear' || raw === 'cls') {
        setHistory([]);
        return;
    }
    if (raw === 'reboot') {
        onReboot();
        return;
    }

    addLog('error', `ERR_INVALID_CMD: "${raw}"`);
  };

  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 ${intensity === 'dim' ? 'opacity-40 brightness-75' : 'opacity-100'}`}>
      <TerminalHeader info={systemInfo} intensity={intensity} />
      
      <div className="flex-1 pb-32 overflow-y-auto scrollbar-hide px-1 overflow-x-hidden font-mono">
        {history.map(h => {
            if ('type' in h && h.type === 'help_table') {
                return <HelpTable key={h.id} />;
            }
            const log = h as LogEntry;
            return (
                <div key={log.id} className={`mb-1 whitespace-pre-wrap leading-tight text-[11px] md:text-sm ${
                    log.type === 'error' ? 'text-terminal-alert' : 
                    log.type === 'success' ? 'text-terminal-green' : 
                    log.type === 'info' ? 'text-terminal-cyan' : 'text-gray-500'
                }`}>
                    {log.message}
                </div>
            );
        })}
        
        {wasterState.isRunning && (
            <div className="mt-4 relative border-2 border-terminal-green p-4 bg-terminal-green/5 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-terminal-green/20">
                    <div className="h-full bg-terminal-green animate-pulse" style={{ width: `${(wasterState.bytesWasted/wasterState.targetBytes)*100}%` }} />
                </div>
                <div className="flex justify-between items-center mb-1 text-[10px] font-bold tracking-widest text-terminal-green uppercase">
                    <span className="animate-pulse">DUMPING DATA...</span>
                    <span>{formatBitRate(wasterState.speedBps)}</span>
                </div>
                <div className="text-2xl font-black text-terminal-green tracking-tighter">
                    {formatBytes(wasterState.bytesWasted)} / {formatBytes(wasterState.targetBytes)}
                </div>
                <div className="mt-2 text-[9px] text-terminal-dim font-bold uppercase flex justify-between">
                    <span>PROGRESS: {((wasterState.bytesWasted/wasterState.targetBytes)*100).toFixed(2)}%</span>
                    <span>ELAPSED: {wasterState.elapsedTime.toFixed(1)}s</span>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-black/95 border-t border-terminal-green/10 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
            <span className="text-terminal-green font-bold mr-2 text-sm shrink-0">sensei@root:~$</span>
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { handleCommand(input); setInput(''); } }}
                className="flex-1 bg-transparent border-none outline-none text-terminal-green font-bold placeholder-terminal-dim text-sm"
                autoFocus
                spellCheck={false}
                autoComplete="off"
            />
        </div>
      </div>
    </div>
  );
};

export default CLI;