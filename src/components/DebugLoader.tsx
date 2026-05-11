import { useEffect, useState } from 'react';

export function DebugLoader() {
  const [status, setStatus] = useState('Inicializando...');

  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      setStatus(`Token: ${token ? 'Presente' : 'Ausente'}`);
    } catch (error) {
      setStatus(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded text-sm z-50 max-w-xs">
      <p className="font-mono">{status}</p>
    </div>
  );
}
