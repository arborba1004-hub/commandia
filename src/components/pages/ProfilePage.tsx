import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { LogOut, Mail, User } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { playerData, isAuthenticated, logout, isLoading } = useGoogleAuth();

  // If not authenticated, show sign in prompt
  if (!isAuthenticated || !playerData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-24 flex items-center justify-center">
          <div className="max-w-[120rem] mx-auto px-6 lg:px-12 text-center">
            <h1 className="font-heading text-6xl lg:text-8xl uppercase tracking-wider text-foreground mb-6">
              Acesso <span className="text-primary">Negado</span>
            </h1>
            <p className="font-paragraph text-xl text-foreground/80 mb-8">
              Você precisa estar autenticado para acessar seu perfil.
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all"
            >
              Voltar ao Início
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <h1 className="font-heading text-6xl lg:text-8xl uppercase tracking-wider text-foreground">
              Meu <span className="text-primary">Perfil</span>
            </h1>
            <p className="font-paragraph text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Gerencie suas informações e preferências no Domínio do Comando
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 space-y-8">
              {/* Profile Header */}
              <div className="flex items-center gap-6 pb-8 border-b border-secondary/20">
                {playerData?.picture ? (
                  <Image src={playerData.picture} alt={playerData.name || 'Profile'} width={96} className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="font-heading text-3xl uppercase tracking-wider text-foreground">
                    {playerData?.name || 'Jogador'}
                  </h2>
                  <p className="font-paragraph text-foreground/60 mt-2">
                    Jogador do Domínio do Comando
                  </p>
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-6">
                <div>
                  <label className="font-heading text-sm uppercase tracking-wider text-foreground/60 block mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-3 bg-background/50 rounded-lg p-4">
                    <Mail className="w-5 h-5 text-primary" />
                    <p className="font-paragraph text-foreground">
                      {playerData?.email || 'Não disponível'}
                    </p>
                  </div>
                </div>

                {playerData?.id && (
                  <div>
                    <label className="font-heading text-sm uppercase tracking-wider text-foreground/60 block mb-2">
                      ID do Jogador
                    </label>
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="font-paragraph text-foreground text-sm break-all">
                        {playerData.id}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <div className="pt-8 border-t border-secondary/20">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 bg-destructive text-destructiveforeground font-heading uppercase tracking-wider px-6 py-4 rounded-lg hover:bg-destructive/90 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
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
