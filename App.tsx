import React, { useState } from 'react';
import useSystemInfo from './hooks/useSystemInfo';
import { useDataWaster } from './hooks/useDataWaster';
import TerminalHeader from './components/TerminalHeader';
import CLI from './components/CLI';
import Modal from './components/Modal';

const App: React.FC = () => {
  const systemInfo = useSystemInfo();
  const { state: wasterState, startWasting, stopWasting } = useDataWaster();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showHeader, setShowHeader] = useState(true);

  const isDark = theme === 'dark';

  const handleReboot = () => {
    window.location.reload();
  };

  return (
    <div className={`min-h-screen font-mono p-4 flex flex-col max-w-4xl mx-auto transition-colors duration-300 ${
        isDark 
        ? 'bg-terminal-black text-terminal-green selection:bg-terminal-green selection:text-black' 
        : 'bg-terminal-light-bg text-terminal-light-text selection:bg-terminal-light-accent selection:text-black'
    }`}>
      
      {/* Visual Glitch/Scanline effect overlay (Only in Dark Mode) */}
      {isDark && (
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%]"></div>
      )}

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Sticky Header */}
        {showHeader && (
            <header className={`sticky top-0 z-50 pb-4 pt-2 mb-6 border-b backdrop-blur-sm transition-colors duration-300 ${
                isDark 
                ? 'bg-terminal-black/95 border-terminal-green/20' 
                : 'bg-terminal-light-bg/95 border-terminal-light-dim'
            }`}>
                <h1 className="text-3xl md:text-4xl font-black mb-0 animate-pulse tracking-tighter text-center">
                    <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
                        isDark
                        ? 'from-terminal-green via-terminal-cyan to-terminal-green'
                        : 'from-terminal-light-accent via-white to-terminal-light-accent'
                    }`}>
                        SENSEI WASTER
                    </span>
                </h1>
            </header>
        )}

        {showHeader && <TerminalHeader info={systemInfo} theme={theme} />}
        
        <CLI 
            onStart={startWasting}
            onStop={stopWasting}
            wasterState={wasterState}
            theme={theme}
            onSetTheme={setTheme}
            systemInfo={systemInfo}
            onClearUI={() => setShowHeader(false)}
            onReboot={handleReboot}
        />

        <Modal />
      </div>
    </div>
  );
};

export default App;