import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Zap, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useToast } from '@/hooks/use-toast';

export default function GamePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { player, isLoaded, loadPlayer, addDirtyMoney } = usePlayerStore();
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔐 Verifica autenticação - redireciona para Home se não autenticado
  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    } else if (!player?._id) {
      navigate('/');
    }
  }, [isLoaded, player?._id, navigate, loadPlayer]);

  const handleEarnCoins = () => {
    if (!player) return;

    setIsUpdating(true);

    addDirtyMoney(100);

    toast({
      title: 'Sucesso!',
      description: 'Saldo atualizado: +100 Commands Sujo',
    });

    setIsUpdating(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerData');
    loadPlayer();
    navigate('/');
  };

  if (!player?._id) return null;

  return (
    <div className="min-h-screen bg-background pb-[40vh]">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <h1 className="font-heading text-5xl lg:text-7xl uppercase tracking-wider text-foreground">
              Bem-vindo, <span className="text-primary">{player.name}</span>
            </h1>

            <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Email</p>
                  <p className="font-heading text-lg text-foreground">{player.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Level</p>
                  <p className="font-heading text-lg text-primary">{player.niveis?.playerLevel || 1}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Power</p>
                  <p className="font-heading text-lg text-foreground">{player.power || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Commands Sujo</p>
                  <p className="font-heading text-lg text-secondary">{(player.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-8 flex-wrap">
              <button
                onClick={handleEarnCoins}
                disabled={isUpdating}
                className="px-8 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isUpdating ? 'Atualizando...' : 'Ganhar 100 Moedas'}
              </button>
              <button
                onClick={handleLogout}
                className="px-8 py-4 border-2 border-destructive text-destructive font-heading uppercase tracking-wider rounded-lg hover:bg-destructive/10 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-wider text-foreground mb-4">
              Seu <span className="text-primary">Progresso</span>
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Acompanhe suas estatísticas e conquistas no Domínio do Comando
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 text-center space-y-4"
            >
              <div className="flex justify-center">
                <Target className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground">
                Level
              </h3>
              <p className="font-heading text-5xl text-primary">
                {playerData.level || 1}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 text-center space-y-4"
            >
              <div className="flex justify-center">
                <Trophy className="w-12 h-12 text-secondary" />
              </div>
              <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground">
                HP
              </h3>
              <p className="font-heading text-5xl text-secondary">
                {playerData.hp || 100}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 text-center space-y-4"
            >
              <div className="flex justify-center">
                <Zap className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground">
                Moedas
              </h3>
              <p className="font-heading text-5xl text-primary">
                {playerData.money || 0}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}