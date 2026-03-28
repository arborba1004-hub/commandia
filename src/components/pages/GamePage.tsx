import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Coins } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useToast } from '@/hooks/use-toast';

export default function GamePage() {
  const navigate = useNavigate();
  const { isAuthenticated, playerData, logout } = useGoogleAuth();
  const { toast } = useToast();
  const [currentMoney, setCurrentMoney] = useState(playerData?.money || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !playerData) {
      navigate('/');
    }
  }, [isAuthenticated, playerData, navigate]);

  // Sync money state with playerData
  useEffect(() => {
    if (playerData?.money !== undefined) {
      setCurrentMoney(playerData.money);
    }
  }, [playerData?.money]);

  if (!isAuthenticated || !playerData) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEarnCoins = async () => {
    setIsUpdating(true);
    
    try {
      // Read current playerData from localStorage
      const storedPlayerData = localStorage.getItem('playerData');
      if (!storedPlayerData) {
        toast({
          title: 'Erro',
          description: 'Dados do jogador não encontrados',
          variant: 'destructive',
        });
        setIsUpdating(false);
        return;
      }

      const player = JSON.parse(storedPlayerData);
      
      // Add 100 coins
      const updatedMoney = (player.money || 0) + 100;
      player.money = updatedMoney;

      // Update localStorage immediately (optimistic update)
      localStorage.setItem('playerData', JSON.stringify(player));
      setCurrentMoney(updatedMoney);

      // TODO: Call backend endpoint to persist the update
      // Example: await updatePlayerOnBackend(player);
      // For now, we just update localStorage and prepare for future backend integration

      toast({
        title: 'Sucesso!',
        description: 'Saldo atualizado: +100 moedas',
      });
    } catch (error) {
      console.error('Erro ao ganhar moedas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar saldo',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <h1 className="font-heading text-5xl lg:text-7xl uppercase tracking-wider text-foreground">
              Jogo em <span className="text-primary">Desenvolvimento</span>
            </h1>

            <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 max-w-2xl mx-auto space-y-6">
              <div className="space-y-4">
                <h2 className="font-heading text-2xl uppercase tracking-wider text-foreground">
                  Dados do Jogador
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-paragraph text-sm text-foreground/60">Nome</p>
                    <p className="font-heading text-lg text-foreground">{playerData.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-paragraph text-sm text-foreground/60">Email</p>
                    <p className="font-heading text-lg text-foreground">{playerData.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-paragraph text-sm text-foreground/60">Level</p>
                    <p className="font-heading text-lg text-primary">{playerData.level || 1}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-paragraph text-sm text-foreground/60">HP</p>
                    <p className="font-heading text-lg text-foreground">{playerData.hp || 100}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-paragraph text-sm text-foreground/60">Moedas</p>
                    <p className="font-heading text-lg text-secondary">{currentMoney}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-secondary/20 space-y-3">
                <button
                  onClick={handleEarnCoins}
                  disabled={isUpdating}
                  className="w-full px-8 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Coins className="w-4 h-4" />
                  {isUpdating ? 'Atualizando...' : 'Ganhar 100 Moedas'}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-8 py-4 border-2 border-destructive text-destructive font-heading uppercase tracking-wider rounded-lg hover:bg-destructive/10 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
