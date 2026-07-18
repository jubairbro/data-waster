import React, { useEffect, useState } from 'react';

interface Props {
  mode: 'terminal' | 'gui';
  theme: 'dark' | 'light';
}

const CustomCursor: React.FC<Props> = ({ mode, theme }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    // Check if the device is primarily touch-based
    const checkTouch = () => {
        return window.matchMedia("(pointer: coarse)").matches;
    };

    if (checkTouch()) {
        setIsTouchDevice(true);
        return;
    }

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Don't render anything on mobile/tablet
  if (isTouchDevice || !isVisible) return null;

  // Terminal Style: Green Block
  if (mode === 'terminal') {
    return (
      <div 
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out"
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      >
        <div className={`
          ${isHovering ? 'w-8 h-8 border-2 border-terminal-green bg-terminal-green/10' : 'w-4 h-5 bg-terminal-green'} 
          shadow-[0_0_15px_rgba(0,255,65,0.6)]
          transition-all duration-200 ease-in-out
        `}>
          {isHovering && (
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-1 h-1 bg-terminal-green rounded-full animate-ping" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // GUI Style: Modern Circle
  const guiColor = isDark ? 'border-blue-400 bg-blue-400/20' : 'border-blue-600 bg-blue-600/10';
  const dotColor = isDark ? 'bg-blue-400' : 'bg-blue-600';

  return (
    <>
      {/* Outer Ring */}
      <div 
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-300 ease-out"
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      >
        <div className={`
          rounded-full border-2 transition-all duration-500 ease-in-out
          ${guiColor}
          ${isHovering ? 'w-12 h-12' : 'w-8 h-8'}
        `} />
      </div>

      {/* Inner Dot */}
      <div 
        className="fixed top-0 left-0 pointer-events-none z-[10000] transition-transform duration-75 ease-out"
        style={{ transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)` }}
      >
        <div className={`
          rounded-full transition-all duration-200
          ${dotColor}
          ${isHovering ? 'w-2 h-2 scale-150' : 'w-1.5 h-1.5'}
        `} />
      </div>
    </>
  );
};

export default CustomCursor;