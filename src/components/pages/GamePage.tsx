import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Coins, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';

export default function GamePage() {
  const navigate = useNavigate();
  const { player, isLoaded, loadPlayer } = usePlayerStore();

  // 🔐 Verifica autenticação - redireciona para Home se não autenticado
  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    } else if (!player?._id) {
      navigate('/');
    }
  }, [isLoaded, player?._id, navigate, loadPlayer]);

  if (!player?._id) return null;

  const navigationButtons = [
    {
      title: 'Giro',
      description: 'Gerenciar operações de giro',
      icon: Coins,
      path: '/giro',
      color: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/30',
      textColor: 'text-primary',
    },
    {
      title: 'Suborno Ilustrado',
      description: 'Operações de suborno',
      icon: Users,
      path: '/suborno-ilustrado',
      color: 'from-secondary/20 to-secondary/5',
      borderColor: 'border-secondary/30',
      textColor: 'text-secondary',
    },
    {
      title: 'Loja de Luxo',
      description: 'Adquirir itens premium',
      icon: ShoppingBag,
      path: '/luxuryshowroom',
      color: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/30',
      textColor: 'text-primary',
    },
    {
      title: 'Lavagem de Dinheiro',
      description: 'Lavar dinheiro sujo',
      icon: DollarSign,
      path: '/lavagem-de-dinheiro',
      color: 'from-secondary/20 to-secondary/5',
      borderColor: 'border-secondary/30',
      textColor: 'text-secondary',
    },
  ];

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
              Hub de <span className="text-primary">Operações</span>
            </h1>

            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Escolha sua próxima operação no Domínio do Comando
            </p>

            {/* Player Stats */}
            <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Level</p>
                  <p className="font-heading text-lg text-primary">{player.niveis?.playerLevel || 1}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Power</p>
                  <p className="font-heading text-lg text-foreground">{player.power || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Dinheiro Sujo</p>
                  <p className="font-heading text-lg text-secondary">{(player.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-paragraph text-sm text-foreground/60">Dinheiro Limpo</p>
                  <p className="font-heading text-lg text-primary">{(player.balances?.cleanMoney || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Buttons Section */}
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
              Suas <span className="text-primary">Operações</span>
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Acesse as diferentes áreas do jogo
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {navigationButtons.map((button, index) => {
              const Icon = button.icon;
              return (
                <motion.button
                  key={button.path}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => navigate(button.path)}
                  className={`bg-gradient-to-br ${button.color} border ${button.borderColor} rounded-lg p-8 text-left hover:shadow-lg hover:scale-105 transition-all duration-300 group`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground mb-2">
                        {button.title}
                      </h3>
                      <p className="font-paragraph text-foreground/70">
                        {button.description}
                      </p>
                    </div>
                    <Icon className={`w-12 h-12 ${button.textColor} group-hover:scale-110 transition-transform`} />
                  </div>

                  <div className="flex items-center gap-2 text-primary font-heading uppercase text-sm tracking-wider">
                    <span>Acessar</span>
                    <Zap className="w-4 h-4" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}