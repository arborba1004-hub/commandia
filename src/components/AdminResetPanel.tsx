import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { resetAllPlayersDatabase } from '@/api/playerApi';
import { usePlayerStore } from '@/store/playerStore';
import { Trash2 } from 'lucide-react';

export default function AdminResetPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  const handleReset = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await resetAllPlayersDatabase();

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Banco de dados resetado com sucesso! Todos os jogadores foram zerados.',
        });

        // Limpa o player local também
        clearPlayer();

        // Recarrega a página após 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Erro ao resetar banco de dados',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Erro ao conectar com o servidor',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
            title="Admin: Resetar banco de dados de jogadores"
          >
            <Trash2 className="w-4 h-4" />
            Reset DB
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Resetar Banco de Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>IRREVERSÍVEL</strong>. Todos os dados de todos os jogadores serão permanentemente deletados:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Dinheiro sujo e limpo</li>
                <li>Níveis e skills</li>
                <li>Inventário</li>
                <li>Veículos e acessórios</li>
                <li>Histórico de ataques</li>
                <li>Tudo mais</li>
              </ul>
              <p className="mt-3 font-semibold">Tem certeza que deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4">
            {message && (
              <div
                className={`p-3 rounded mb-4 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Resetando...' : 'Confirmar Reset'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
