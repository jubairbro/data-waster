import { useState, useRef, useCallback, useEffect } from 'react';
import { WasterState } from '../types';
import { DOWNLOAD_URL } from '../constants';

export const useDataWaster = () => {
  const [state, setState] = useState<WasterState>({
    isRunning: false,
    bytesWasted: 0,
    targetBytes: 0,
    speedBps: 0,
    elapsedTime: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const totalBytesRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastSpeedUpdateRef = useRef(0);
  const bytesAtLastUpdateRef = useRef(0);
  const targetRef = useRef(0);

  const stopWasting = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Don't reset stats here, just set running to false
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const wasteData = useCallback(async () => {
    if (!state.isRunning) return;

    // Create a new controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Add random query param to prevent caching
      const url = `${DOWNLOAD_URL}&t=${Date.now()}`;
      
      const response = await fetch(url, { signal, cache: 'no-store' });
      
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break; // Chunk finished, loop will restart if target not met
        }

        // Add chunk size
        const chunkSize = value.length;
        totalBytesRef.current += chunkSize;
        
        // 1. CHECK IF TARGET REACHED
        if (totalBytesRef.current >= targetRef.current) {
          const now = Date.now();
          const finalTime = (now - startTimeRef.current) / 1000;
          // Calculate final average speed for better accuracy at end
          const avgSpeed = totalBytesRef.current / (finalTime || 1);

          setState({
             isRunning: false, // Stop immediately in state
             bytesWasted: totalBytesRef.current,
             targetBytes: targetRef.current,
             speedBps: avgSpeed,
             elapsedTime: finalTime
          });
          
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
              abortControllerRef.current = null;
          }
          return;
        }

        // 2. REGULAR THROTTLED UPDATE
        const now = Date.now();
        if (now - lastSpeedUpdateRef.current > 200) { // Updated to 200ms for more "Realtime" feel
          const timeDiff = (now - lastSpeedUpdateRef.current) / 1000; // Seconds
          const bytesDiff = totalBytesRef.current - bytesAtLastUpdateRef.current;
          const currentSpeed = bytesDiff / timeDiff;

          lastSpeedUpdateRef.current = now;
          bytesAtLastUpdateRef.current = totalBytesRef.current;

          setState(prev => ({
            ...prev,
            bytesWasted: totalBytesRef.current,
            speedBps: currentSpeed,
            elapsedTime: (Date.now() - startTimeRef.current) / 1000
          }));
        }
      }
      
      // Recursively call if still running (file ended but target not reached)
      if (state.isRunning && totalBytesRef.current < targetRef.current) {
          wasteData();
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stopped intentionally
      } else {
        // Simple retry delay
        setTimeout(() => {
            if (state.isRunning) wasteData();
        }, 1000);
      }
    }
  }, [state.isRunning]);

  // Effect to trigger the loop when isRunning becomes true
  useEffect(() => {
    if (state.isRunning) {
        wasteData();
    }
  }, [state.isRunning, wasteData]);

  const startWasting = useCallback((amountBytes: number) => {
    if (state.isRunning) return;
    
    totalBytesRef.current = 0;
    targetRef.current = amountBytes;
    startTimeRef.current = Date.now();
    lastSpeedUpdateRef.current = Date.now();
    bytesAtLastUpdateRef.current = 0;

    setState({
      isRunning: true,
      bytesWasted: 0,
      targetBytes: amountBytes,
      speedBps: 0,
      elapsedTime: 0
    });
  }, [state.isRunning]);

  return {
    state,
    startWasting,
    stopWasting
  };
};