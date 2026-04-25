import { useEffect, useState } from 'react';

export function DebugLoader() {
  const [status, setStatus] = useState('Inicializando...');

  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      setStatus(`Token: ${token ? 'Presente' : 'Ausente'}`);

      // Tenta carregar dados do player
      const playerData = localStorage.getItem('playerData');
      if (playerData) {
        try {
          const parsed = JSON.parse(playerData);
          setStatus(`Player carregado: ${parsed.name || 'Sem nome'}`);
        } catch (e) {
          setStatus('Erro ao parsear playerData');
        }
      } else {
        setStatus('Nenhum playerData armazenado');
      }
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
