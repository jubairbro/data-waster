import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, WasterState, SystemInfo } from '../types';
import { parseTarget, formatBytes, formatBitRate } from '../utils';

interface Props {
  onStart: (bytes: number) => void;
  onStop: () => void;
  wasterState: WasterState;
  theme: 'dark' | 'light';
  onSetTheme: (theme: 'dark' | 'light') => void;
  systemInfo: SystemInfo;
  onClearUI: () => void;
  onReboot: () => void;
}

const KNOWN_COMMANDS = ['start', 'stop', 'help', 'clear', 'ping', 'sys', 'time', 'whoami', 'light', 'dark', 'reboot', 'history', 'ls', 'echo', 'matrix', 'speedtest', 'fast'];

const CLI: React.FC<Props> = ({ onStart, onStop, wasterState, theme, onSetTheme, systemInfo, onClearUI, onReboot }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([
    { id: 'init', type: 'system', message: 'INITIALIZING SENSEI PROTOCOL...', timestamp: Date.now() },
    { id: 'help', type: 'info', message: 'Type "help" to see available tools.', timestamp: Date.now() }
  ]);
  
  // Command History (Up/Down Arrows)
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Track previous running state to detect completion edge
  const wasRunningRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  // Styles for the prompt parts
  const pColors = {
    bracket: isDark ? 'text-gray-500' : 'text-gray-400',
    user: isDark ? 'text-blue-500' : 'text-blue-300',
    at: isDark ? 'text-gray-300' : 'text-gray-400',
    host: isDark ? 'text-blue-500' : 'text-blue-300',
    path: isDark ? 'text-white' : 'text-gray-200',
    symbol: isDark ? 'text-terminal-green' : 'text-terminal-light-accent',
    input: isDark ? 'text-terminal-green' : 'text-terminal-light-accent',
    placeholder: isDark ? 'placeholder-gray-700' : 'placeholder-gray-600'
  };

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, wasterState.isRunning]);

  // Keep focus
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
        if (window.getSelection()?.toString()) return;
        inputRef.current?.focus();
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Completion Log Logic
  useEffect(() => {
    // If it WAS running, and now IS NOT running, and we have wasted data...
    if (wasRunningRef.current && !wasterState.isRunning && wasterState.bytesWasted > 0) {
        
        // Check if we hit the target (or got very close/over it)
        if (wasterState.bytesWasted >= wasterState.targetBytes) {
            const avgSpeed = wasterState.bytesWasted / (wasterState.elapsedTime || 1);
       
            const msg = `
 _________________________________________
|                                         |
|      [ TASK COMPLETED SUCCESSFULLY ]    |
|_________________________________________|
      
       \\|/          
      (o o)         
  +----( )----+     
  |   DONE!   |     
  +-----------+     

  [✔] STATUS  : VERIFIED
  [✔] TOTAL   : ${formatBytes(wasterState.bytesWasted)}
  [✔] TIME    : ${wasterState.elapsedTime.toFixed(1)}s
  [✔] AVG SPD : ${formatBitRate(avgSpeed)}
_________________________________________
`;
            addLog('success', msg);
        }
    }
    // Update ref for next render
    wasRunningRef.current = wasterState.isRunning;

  }, [wasterState.isRunning, wasterState.bytesWasted, wasterState.targetBytes, wasterState.elapsedTime]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setHistory(prev => [...prev, { id: Date.now().toString(), type, message, timestamp: Date.now() }]);
  };

  const runSpeedTest = async () => {
    addLog('info', 'INITIALIZING NETWORK SPEED TEST...');
    addLog('system', '>> PHASE 1: LATENCY CHECK (PING)');
    
    // Phase 1: Ping
    const startPing = Date.now();
    let pingMs = 0;
    try {
        await fetch('https://speed.cloudflare.com/__down?bytes=1', { cache: 'no-store' });
        pingMs = Date.now() - startPing;
        addLog('info', `>> PING RESULT: ${pingMs}ms`);
    } catch (e) {
        addLog('error', '>> PING FAILED');
        return;
    }

    addLog('system', '>> PHASE 2: BANDWIDTH STRESS TEST (10s)');
    
    // Phase 2: Download
    const controller = new AbortController();
    const signal = controller.signal;
    let loaded = 0;
    const startTime = Date.now();
    const DURATION = 10000; // 10 seconds

    try {
        const url = `https://speed.cloudflare.com/__down?bytes=50000000&t=${Date.now()}`;
        const response = await fetch(url, { signal, cache: 'no-store' });
        if (!response.body) throw new Error("No Body");
        
        const reader = response.body.getReader();

        // Timer to stop
        setTimeout(() => controller.abort(), DURATION);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.length;
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
             // If it wasn't our timeout, it's an error
             console.error(e);
        }
    }

    const endTime = Date.now();
    const durationSec = (endTime - startTime) / 1000;
    const speedBps = loaded / durationSec;

    const report = `
  ____  ____  ____  ____  ____ 
 ||S ||||P ||||E ||||E ||||D ||
 ||__||||__||||__||||__||||__||
 |/__\\||/__\\||/__\\||/__\\||/__\\|

 =================================
  ➤ PING      : ${pingMs} ms
  ➤ SPEED     : ${formatBitRate(speedBps)}
  ➤ DATA USED : ${formatBytes(loaded)}
 =================================
`;
    addLog('success', report);
  };

  const handleCommand = async (cmd: string) => {
    const rawInput = cmd.trim();
    if (!rawInput) return;

    // Add to command history
    setCmdHistory(prev => [rawInput, ...prev]);
    setHistoryIndex(-1);

    const parts = rawInput.split(' ');
    const baseCmd = parts[0].toLowerCase();
    
    // Echo Command
    const echoLog: LogEntry = { 
        id: Date.now().toString(), 
        type: 'system', 
        message: `┌──(sensei㉿waster)-[~]\n└─$ ${rawInput}`, 
        timestamp: Date.now() 
    };
    setHistory(prev => [...prev, echoLog]);

    // --- COMMAND LOGIC ---

    // 1. CLEAR / RESET
    if (baseCmd === 'clear' || baseCmd === 'cls') {
      setHistory([]);
      onClearUI(); // Clears header in Parent
      return;
    }

    if (baseCmd === 'reboot' || baseCmd === 'reload') {
        addLog('error', 'SYSTEM REBOOT INITIATED...');
        setTimeout(() => onReboot(), 800);
        return;
    }

    // 2. THEME COMMANDS
    if (baseCmd === 'light') {
        onSetTheme('light');
        addLog('success', '>> ACTIVATING DIM MODE... [COMFORT: ON]');
        return;
    }
    if (baseCmd === 'dark') {
        onSetTheme('dark');
        addLog('success', '>> ACTIVATING MATRIX MODE... [STEALTH: ON]');
        return;
    }

    // 3. START COMMAND
    if (baseCmd === 'start') {
      if (wasterState.isRunning) {
        addLog('error', 'ERROR: Process running. Type "stop".');
        return;
      }
      
      const args = rawInput.replace(/^start\s*/i, ''); 
      const bytes = parseTarget(args);
      
      if (bytes) {
        addLog('success', `>> INITIATING DUMP: ${formatBytes(bytes)} <<`);
        onStart(bytes);
      } else {
        addLog('error', 'SYNTAX ERROR. Try: "start 1gb" or "start 500mb"');
      }
      return;
    }

    // 4. STOP
    if (baseCmd === 'stop') {
        onStop();
        addLog('error', '>> PROCESS ABORTED <<');
        return;
    }

    // 5. PING (Basic)
    if (baseCmd === 'ping') {
        addLog('info', 'Pinging Cloudflare Edge...');
        const start = Date.now();
        try {
            await fetch('https://speed.cloudflare.com/__down?bytes=1', { cache: 'no-store' });
            const latency = Date.now() - start;
            let quality = 'EXCELLENT';
            if (latency > 100) quality = 'GOOD';
            if (latency > 200) quality = 'FAIR';
            if (latency > 500) quality = 'POOR';
            
            addLog('success', `REPLY: time=${latency}ms [${quality}]`);
        } catch (e) {
            addLog('error', 'PING FAILED: Network unreachable');
        }
        return;
    }

    // 6. SPEEDTEST (Advanced)
    if (baseCmd === 'speedtest' || baseCmd === 'fast' || baseCmd === 'test') {
        if (wasterState.isRunning) {
            addLog('error', 'ERROR: Cannot run speedtest while wasting data.');
            return;
        }
        await runSpeedTest();
        return;
    }

    // 7. SYSTEM INFO
    if (['sys', 'info', 'specs', 'neofetch'].includes(baseCmd)) {
        const infoMsg = `
[ SYSTEM DIAGNOSTICS ]
----------------------
OS      : ${systemInfo.os}
IP      : ${systemInfo.ip}
ISP     : ${systemInfo.isp}
BATTERY : ${systemInfo.batteryLevel} (${systemInfo.isCharging === 'YES' ? 'CHARGING' : 'DISCHARGING'})
CORES   : ${systemInfo.cores || 'N/A'}
RES     : ${window.screen.width}x${window.screen.height}
LOC     : ${systemInfo.city}, ${systemInfo.country}
`;
        addLog('info', infoMsg.trim());
        return;
    }

    // 8. TIME
    if (baseCmd === 'time' || baseCmd === 'date') {
        const now = new Date();
        addLog('info', `LOCAL: ${now.toLocaleString()}\nUTC  : ${now.toUTCString()}`);
        return;
    }

    // 9. WHOAMI
    if (baseCmd === 'whoami') {
        addLog('success', `USER: SENSEI_INITIATE\nACCESS: LEVEL 1 (GUEST)\nMISSION: DATA_PURGE`);
        return;
    }

    // 10. LS (Fake File System)
    if (baseCmd === 'ls' || baseCmd === 'll' || baseCmd === 'dir') {
        const files = `
permissions  user   size   date       name
drwx------   sensei 4096   Jan 01     .config/
-rwxr-xr-x   root   14KB   Jan 02     waster_core.sh
-rw-r--r--   sensei 500MB  Jan 03     temp_buffer.bin
-rwxr-xr-x   sensei 1.2KB  Jan 04     network_killswitch.py
        `;
        addLog('info', files.trim());
        return;
    }

    // 11. HISTORY
    if (baseCmd === 'history') {
        if (cmdHistory.length === 0) {
            addLog('info', 'No history found.');
            return;
        }
        const histString = [...cmdHistory].reverse().map((c, i) => `${i + 1}  ${c}`).join('\n');
        addLog('info', histString);
        return;
    }

    // 12. ECHO
    if (baseCmd === 'echo') {
        const msg = parts.slice(1).join(' ');
        addLog('info', msg || '');
        return;
    }
    
    // 13. MATRIX
    if (baseCmd === 'matrix') {
         addLog('success', 'The Matrix is everywhere. It is all around us.');
         return;
    }

    // 14. HELP
    if (baseCmd === 'help' || baseCmd === '?') {
        const helpLines = `
AVAILABLE MODULES:
------------------
  start [size]  : Start wasting (e.g., start 1gb)
  stop          : Halt current operation
  speedtest     : Run 10s download speed test
  ping          : Check network latency
  sys / info    : View full device/network specs
  ls            : List directory contents
  echo [text]   : Print text to console
  history       : Show command history
  reboot        : Restart application
  clear         : Clear screen and buffer
  light / dark  : Toggle interface theme
`;
        addLog('info', helpLines.trim());
        return;
    }

    addLog('error', `COMMAND NOT RECOGNIZED: "${baseCmd}". Type "help".`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // History Navigation
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdHistory.length > 0) {
            const newIndex = Math.min(historyIndex + 1, cmdHistory.length - 1);
            setHistoryIndex(newIndex);
            setInput(cmdHistory[newIndex]);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(cmdHistory[newIndex]);
        } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInput('');
        }
    }
    // Tab Auto-Completion
    else if (e.key === 'Tab') {
        e.preventDefault();
        const currentInput = input.trim().toLowerCase();
        if (!currentInput) return;

        const match = KNOWN_COMMANDS.find(cmd => cmd.startsWith(currentInput));
        if (match) {
            setInput(match + (['start', 'echo'].includes(match) ? ' ' : ''));
        }
    }
    // Submit
    else if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  // Progress Bar
  const progressPercent = wasterState.targetBytes > 0 
    ? Math.min((wasterState.bytesWasted / wasterState.targetBytes) * 100, 100) 
    : 0;

  const progressBar = () => {
    const totalBars = 20;
    const filledBars = Math.floor((progressPercent / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return `[${'#'.repeat(filledBars)}${'.'.repeat(emptyBars)}]`;
  };

  return (
    <div className="flex-1 flex flex-col font-mono text-sm relative overflow-hidden">
      {/* Output Area */}
      <div className="flex-1 pb-44 overflow-y-auto px-1 scrollbar-hide">
        {history.map(entry => {
            let colorClass = isDark ? 'text-gray-300' : 'text-gray-300';
            
            if (entry.type === 'error') colorClass = isDark ? 'text-terminal-alert' : 'text-red-400';
            if (entry.type === 'success') colorClass = isDark ? 'text-terminal-green' : 'text-green-400';
            if (entry.type === 'info') colorClass = isDark ? 'text-terminal-warn' : 'text-orange-300'; 
            if (entry.type === 'system') colorClass = isDark ? 'text-gray-400' : 'text-gray-400';

            return (
                <div key={entry.id} className={`mb-2 break-words whitespace-pre-wrap ${colorClass} leading-tight`}>
                    {entry.message}
                </div>
            );
        })}

        {/* Active Job Stats */}
        {wasterState.isRunning && (
            <div className={`mt-4 border border-dashed p-3 animate-pulse ${isDark ? 'border-terminal-warn bg-terminal-warn/5' : 'border-orange-500 bg-orange-900/20'}`}>
                <div className={`${isDark ? 'text-terminal-warn' : 'text-orange-400'} font-bold mb-1 tracking-widest uppercase`}>[ Task In Progress ]</div>
                <div className="grid grid-cols-2 gap-4 text-xs mb-2 font-bold">
                    <div>SPD: <span className={isDark ? 'text-white' : 'text-gray-100'}>{formatBitRate(wasterState.speedBps)}</span></div>
                    <div>TME: {Math.floor(wasterState.elapsedTime)}s</div>
                </div>
                <div className="font-bold text-base text-center mb-1">
                    {formatBytes(wasterState.bytesWasted)} / {formatBytes(wasterState.targetBytes)}
                </div>
                <div className="whitespace-pre font-bold text-center text-xs sm:text-sm">{progressBar()} {Math.floor(progressPercent)}%</div>
            </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Area (Sticky) - Real Terminal Look */}
      <div className={`fixed bottom-0 left-0 w-full p-3 z-50 font-mono transition-colors duration-300 text-sm md:text-base shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isDark ? 'bg-terminal-black/95' : 'bg-terminal-light-bg/95'}`}>
        <div className="flex flex-col font-bold">
            
            {/* Line 1: ┌──(sensei㉿waster)-[~] */}
            <div className="flex flex-wrap items-center leading-none mb-1">
                <span className={`${pColors.bracket} mr-0.5`}>┌──(</span>
                <span className={`${pColors.user}`}>sensei</span>
                <span className={`${pColors.at}`}>㉿</span>
                <span className={`${pColors.host}`}>waster</span>
                <span className={`${pColors.bracket} mx-0.5`}>)-[</span>
                <span className={`${pColors.path}`}>~</span>
                <span className={`${pColors.bracket}`}>]</span>
            </div>

            {/* Line 2: └─$ input */}
            <div className="flex items-center leading-none">
                <span className={`${pColors.bracket} mr-2`}>└─<span className={pColors.symbol}>$</span></span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`flex-1 bg-transparent border-none outline-none font-bold ${pColors.input} ${pColors.placeholder}`}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    placeholder=""
                />
            </div>

        </div>
      </div>
    </div>
  );
};

export default CLI;