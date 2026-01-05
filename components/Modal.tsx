import React, { useEffect, useState, useRef } from 'react';
import { LINKS } from '../constants';

const Modal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Matrix Rain Animation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full container size
    const resizeCanvas = () => {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = '01SENSEI';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    const draw = () => {
        // Black with opacity for trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0'; // Green text
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    };

    const interval = setInterval(draw, 33);

    return () => {
        clearInterval(interval);
        window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-black border border-terminal-green shadow-[0_0_30px_rgba(0,255,65,0.2)] max-w-md w-full overflow-hidden">
        
        {/* Matrix Rain Background Layer */}
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        />

        {/* Content Layer (z-10 to sit above rain) */}
        <div className="relative z-10 p-1">
            {/* Header */}
            <div className="bg-terminal-green/90 text-black font-bold px-2 py-1 text-xs flex justify-between items-center font-mono">
            <span className="animate-pulse">Incoming Transmission...</span>
            <button onClick={() => setIsOpen(false)} className="hover:text-white font-bold bg-black/20 px-2 rounded">[ CLOSE ]</button>
            </div>
            
            {/* Content */}
            <div className="p-6 text-center font-mono">
            <div className="mb-4 inline-block border-2 border-terminal-green rounded-full p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-terminal-green animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h2 className="text-xl text-white mb-2 font-black tracking-widest uppercase">
                SENSEI X COMMUNITY
            </h2>
            <p className="text-terminal-green text-sm mb-6 leading-relaxed">
                Unlock advanced tools. Join the network.
            </p>
            
            <div className="flex flex-col gap-3">
                <a 
                href={LINKS.YOUTUBE} 
                target="_blank" 
                rel="noreferrer"
                className="group relative block w-full bg-terminal-alert/10 border border-terminal-alert text-terminal-alert hover:bg-terminal-alert hover:text-black py-3 text-sm font-bold transition-all uppercase tracking-wider"
                >
                <span className="absolute left-0 top-0 h-full w-1 bg-terminal-alert group-hover:w-full transition-all duration-300 opacity-20"></span>
                Subscribe YouTube
                </a>
                <a 
                href={LINKS.TELEGRAM} 
                target="_blank" 
                rel="noreferrer"
                className="group relative block w-full bg-blue-500/10 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white py-3 text-sm font-bold transition-all uppercase tracking-wider"
                >
                 <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 group-hover:w-full transition-all duration-300 opacity-20"></span>
                Join Telegram
                </a>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;