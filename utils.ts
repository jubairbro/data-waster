import { UsageRecord } from './types';

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatBitRate = (bytesPerSec: number): string => {
  // Convert Bytes to Bits
  const bits = bytesPerSec * 8;
  const k = 1000;
  const sizes = ['bps', 'kbps', 'mbps', 'gbps'];
  if (bits === 0) return '0 mbps';
  const i = Math.floor(Math.log(bits) / Math.log(k));
  const val = parseFloat((bits / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i] || 'mbps'}`;
};

export const parseTarget = (input: string): number | null => {
  const cleanInput = input.replace(/\s/g, '').toLowerCase();
  const regex = /^(\d+(\.\d+)?)(mb|gb|kb)$/i;
  const match = cleanInput.match(regex);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[3].toLowerCase();
  let multiplier = 1;
  if (unit === 'kb') multiplier = 1024;
  if (unit === 'mb') multiplier = 1024 * 1024;
  if (unit === 'gb') multiplier = 1024 * 1024 * 1024;
  return value * multiplier;
};

const DB_KEY = 'sensei_waster_db';

export const saveUsageRecord = (record: Omit<UsageRecord, 'id'>) => {
  const history = getUsageHistory();
  const newRecord: UsageRecord = {
    ...record,
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  const updated = [newRecord, ...history].slice(0, 100); 
  localStorage.setItem(DB_KEY, JSON.stringify(updated));
};

export const getUsageHistory = (): UsageRecord[] => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const clearUsageHistory = () => {
  localStorage.removeItem(DB_KEY);
};

export const getUsageStats = () => {
  const history = getUsageHistory();
  const totalBytes = history.reduce((acc, curr) => acc + curr.bytes, 0);
  const totalSessions = history.length;
  const maxSpeed = history.length > 0 ? Math.max(...history.map(h => h.avgSpeedBps)) : 0;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayBytes = history
    .filter(h => h.timestamp >= todayStart)
    .reduce((acc, curr) => acc + curr.bytes, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthBytes = history
    .filter(h => h.timestamp >= monthStart)
    .reduce((acc, curr) => acc + curr.bytes, 0);

  let rank = 'INITIATE';
  let nextRank = 'APPRENTICE';
  let progress = 0;
  const GB = 1024 * 1024 * 1024;

  if (totalBytes < 1 * GB) {
    rank = 'INITIATE';
    progress = (totalBytes / (1 * GB)) * 100;
  } else if (totalBytes < 10 * GB) {
    rank = 'APPRENTICE';
    nextRank = 'ELITE';
    progress = ((totalBytes - 1 * GB) / (9 * GB)) * 100;
  } else if (totalBytes < 50 * GB) {
    rank = 'ELITE';
    nextRank = 'SENSEI';
    progress = ((totalBytes - 10 * GB) / (40 * GB)) * 100;
  } else {
    rank = 'SENSEI';
    nextRank = 'MAX LEVEL';
    progress = 100;
  }

  return {
    totalBytes,
    todayBytes,
    monthBytes,
    totalSessions,
    maxSpeed,
    rank,
    nextRank,
    progress,
    lastSession: history[0] || null
  };
};