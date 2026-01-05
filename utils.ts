
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatBitRate = (bytesPerSec: number): string => {
  const bits = bytesPerSec * 8;
  const k = 1000; // Network speeds usually use base 1000
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  
  if (bits === 0) return '0 bps';
  
  const i = Math.floor(Math.log(bits) / Math.log(k));
  const val = parseFloat((bits / Math.pow(k, i)).toFixed(2));
  
  return `${val} ${sizes[i] || 'bps'}`;
};

export const parseTarget = (input: string): number | null => {
  // Remove all spaces to handle "10 gb" and "10gb" identically
  const cleanInput = input.replace(/\s/g, '').toLowerCase();
  
  // Matches number followed immediately by unit
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
