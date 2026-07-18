import { useState, useRef, useCallback, useEffect } from 'react';
import { WasterState } from '../types';
import { DOWNLOAD_URL } from '../constants';

export const useDataWaster = (onFinish?: (bytes: number, duration: number) => void) => {
  const [state, setState] = useState<WasterState>({
    isRunning: false,
    bytesWasted: 0,
    targetBytes: 0,
    speedBps: 0,
    elapsedTime: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionActiveRef = useRef(false);
  const totalBytesRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastSpeedUpdateRef = useRef(0);
  const bytesAtLastUpdateRef = useRef(0);
  const targetRef = useRef(0);

  const stopWasting = useCallback(() => {
    if (sessionActiveRef.current) {
      sessionActiveRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      const now = Date.now();
      const duration = (now - startTimeRef.current) / 1000;
      const finalBytes = totalBytesRef.current;

      if (onFinish && finalBytes > 0) {
        onFinish(finalBytes, duration);
      }
      
      setState(prev => ({ 
        ...prev, 
        isRunning: false,
        bytesWasted: 0, // Reset to avoid double counting in live display
        speedBps: 0 
      }));
    }
  }, [onFinish]);

  const wasteData = useCallback(async () => {
    if (!sessionActiveRef.current) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const url = `${DOWNLOAD_URL}&t=${Date.now()}`;
      const response = await fetch(url, { signal, cache: 'no-store' });
      
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done || !sessionActiveRef.current) break;

        const chunkSize = value.length;
        totalBytesRef.current += chunkSize;
        
        // Check if target is reached
        if (totalBytesRef.current >= targetRef.current) {
          if (sessionActiveRef.current) {
            sessionActiveRef.current = false;
            
            const now = Date.now();
            const finalTime = (now - startTimeRef.current) / 1000;
            const avgSpeed = totalBytesRef.current / (finalTime || 1);

            if (onFinish) {
              onFinish(totalBytesRef.current, finalTime);
            }

            setState({
               isRunning: false,
               bytesWasted: 0, // Reset immediately
               targetBytes: targetRef.current,
               speedBps: 0,
               elapsedTime: finalTime
            });
            
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
          }
          return;
        }

        const now = Date.now();
        if (now - lastSpeedUpdateRef.current > 200) {
          const timeDiff = (now - lastSpeedUpdateRef.current) / 1000;
          const bytesDiff = totalBytesRef.current - bytesAtLastUpdateRef.current;
          const currentSpeed = bytesDiff / (timeDiff || 1);

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
      
      // If stream ends naturally before target, reconnect
      if (sessionActiveRef.current && totalBytesRef.current < targetRef.current) {
          wasteData();
      }

    } catch (err: any) {
      if (err.name !== 'AbortError' && sessionActiveRef.current) {
        // Retry logic for connection drops
        setTimeout(() => {
          if (sessionActiveRef.current) wasteData();
        }, 1500);
      }
    }
  }, [onFinish]);

  useEffect(() => {
    if (state.isRunning && sessionActiveRef.current) {
        wasteData();
    }
  }, [state.isRunning, wasteData]);

  const startWasting = useCallback((amountBytes: number) => {
    if (sessionActiveRef.current) return;
    
    sessionActiveRef.current = true;
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
  }, []);

  return {
    state,
    startWasting,
    stopWasting
  };
};