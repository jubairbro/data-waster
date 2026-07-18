import React, { useState, useEffect } from 'react';
import useSystemInfo from './hooks/useSystemInfo';
import { useDataWaster } from './hooks/useDataWaster';
import CLI from './components/CLI';
import GUI from './components/GUI';
import Modal from './components/Modal';
import CustomCursor from './components/CustomCursor';
import { saveUsageRecord } from './utils';

const App: React.FC = () => {
  const systemInfo = useSystemInfo();
  
  const { state: wasterState, startWasting, stopWasting } = useDataWaster((bytes, duration) => {
    // This callback saves the data to LocalStorage when a session ends
    saveUsageRecord({
        bytes,
        duration,
        timestamp: Date.now(),
        avgSpeedBps: bytes / (duration || 1)
    });
  });
  
  const [viewMode, setViewMode] = useState<'terminal' | 'gui'>('terminal');
  const [guiTheme, setGuiTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setGuiTheme(isDark ? 'dark' : 'light');
  }, []);

  const handleReboot = () => window.location.reload();

  return (
    <div className={`min-h-screen transition-all duration-500 overflow-x-hidden ${
        viewMode === 'terminal' 
        ? 'bg-[#050505] font-mono p-2 md:p-4 text-terminal-green' 
        : (guiTheme === 'dark' ? 'bg-[#0f172a] font-sans' : 'bg-[#f8fafc] font-sans')
    }`}>
      
      {/* Custom Terminal Cursor - Now aware of mode and theme */}
      <CustomCursor mode={viewMode} theme={guiTheme} />
      
      <div className="max-w-4xl mx-auto flex flex-col min-h-screen relative z-10">
        {viewMode === 'terminal' ? (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                <CLI 
                    onStart={startWasting}
                    onStop={stopWasting}
                    wasterState={wasterState}
                    systemInfo={systemInfo}
                    onReboot={handleReboot}
                    onToggleGUI={() => setViewMode('gui')}
                />
            </div>
        ) : (
            <div className="flex-1 flex flex-col p-4 md:p-6 animate-in slide-in-from-right-10 duration-700">
                <GUI 
                    wasterState={wasterState}
                    onStart={startWasting}
                    onStop={stopWasting}
                    systemInfo={systemInfo}
                    onSwitchMode={() => setViewMode('terminal')}
                    theme={guiTheme}
                    onSetTheme={setGuiTheme}
                />
            </div>
        )}

        <Modal />
      </div>
    </div>
  );
};

export default App;