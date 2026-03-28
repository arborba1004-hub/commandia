import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Coins } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

export default function GamePage() {
  const { toast } = useToast();
  const [player, setPlayer] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔐 Verifica autenticação
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedPlayer = localStorage.getItem('playerData');

    if (!token || !storedPlayer) {
      window.location.href = '/';
      return;
    }

    setPlayer(JSON.parse(storedPlayer));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerData');
    window.location.href = '/';
  };

  const handleEarnCoins = () => {
    if (!player) return;

    setIsUpdating(true);

    const updated = { ...player };
    updated.money = (updated.money || 0) + 100;

    localStorage.setItem('playerData', JSON.stringify(updated));
    setPlayer(updated);

    toast({
      title: 'Sucesso!',
      description: 'Saldo atualizado: +100 moedas',
    });

    setIsUpdating(false);
  };

  if (!player) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-24">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-8">

          <h1 className="text-4xl font-bold">
            Área do Jogador
          </h1>

          <div className="space-y-4">
            <p><strong>Nome:</strong> {player.name}</p>
            <p><strong>Email:</strong> {player.email}</p>
            <p><strong>Level:</strong> {player.level}</p>
            <p><strong>HP:</strong> {player.hp}</p>
            <p><strong>Moedas:</strong> {player.money}</p>
          </div>

          <button
            onClick={handleEarnCoins}
            disabled={isUpdating}
            className="px-6 py-3 bg-primary text-white rounded"
          >
            {isUpdating ? 'Atualizando...' : 'Ganhar 100 moedas'}
          </button>

          <button
            onClick={handleLogout}
            className="px-6 py-3 border border-red-500 text-red-500 rounded"
          >
            Sair
          </button>

        </div>
      </section>

      <Footer />
    </div>
  );
}