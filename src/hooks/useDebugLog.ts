import { useState, useCallback } from 'react';

export interface DebugLog {
  timestamp: number;
  stage: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export function useDebugLog() {
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const addLog = useCallback((stage: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        stage,
        status,
        message,
        details,
      }
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
