import { useState, useCallback } from 'react';

export interface HealthCheckResult {
  isHealthy: boolean;
  message: string;
  timedOut: boolean;
  duration: number;
}

const BACKEND_URL = 'https://comando-backend.onrender.com';
const HEALTH_CHECK_TIMEOUT = 20000; // 20 seconds

export function useBackendHealthCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<HealthCheckResult | null>(null);

  const checkBackendHealth = useCallback(async (): Promise<HealthCheckResult> => {
    setIsChecking(true);
    setStatus(null);

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      const response = await fetch(BACKEND_URL, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const result: HealthCheckResult = {
          isHealthy: true,
          message: 'Servidor conectado com sucesso',
          timedOut: false,
          duration,
        };
        setStatus(result);
        setIsChecking(false);
        return result;
      } else {
        const result: HealthCheckResult = {
          isHealthy: false,
          message: `Erro do servidor: ${response.statusText}`,
          timedOut: false,
          duration,
        };
        setStatus(result);
        setIsChecking(false);
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        const result: HealthCheckResult = {
          isHealthy: false,
          message: 'O servidor demorou para responder. Tente novamente.',
          timedOut: true,
          duration: HEALTH_CHECK_TIMEOUT,
        };
        setStatus(result);
        setIsChecking(false);
        return result;
      }

      const result: HealthCheckResult = {
        isHealthy: false,
        message: 'Falha ao conectar com o servidor',
        timedOut: false,
        duration,
      };
      setStatus(result);
      setIsChecking(false);
      return result;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(null);
    setIsChecking(false);
  }, []);

  return {
    isChecking,
    status,
    checkBackendHealth,
    reset,
  };
}
