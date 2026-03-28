import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { GameMechanics } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Zap, Target, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [mechanics, setMechanics] = useState<GameMechanics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMechanics();
  }, []);

  const loadMechanics = async () => {
    try {
      const result = await BaseCrudService.getAll<GameMechanics>('gamemechanics');
      setMechanics(result.items);
    } catch (error) {
      console.error('Error loading mechanics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="font-heading text-7xl lg:text-9xl uppercase tracking-wider text-foreground">
              Domínio do <span className="text-primary">Comando</span>
            </h1>
            <p className="font-paragraph text-xl lg:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Mergulhe em um universo de estratégia, poder e domínio absoluto. Domine o jogo, controle o destino.
            </p>
            <div className="flex gap-4 justify-center pt-8">
              <Link
                to="/galeria"
                className="px-8 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all"
              >
                Explorar Galeria
              </Link>
              <button className="px-8 py-4 border-2 border-primary text-primary font-heading uppercase tracking-wider rounded-lg hover:bg-primary/10 transition-all">
                Começar Jogo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Game Mechanics Section */}
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
              Mecânicas do <span className="text-primary">Jogo</span>
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Descubra os sistemas que definem sua jornada no Domínio do Comando
            </p>
          </motion.div>

          <div className="min-h-[600px]">
            {isLoading ? null : mechanics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mechanics.map((mechanic, index) => (
                  <motion.div
                    key={mechanic._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-custom4/30 border border-secondary/20 rounded-lg overflow-hidden hover:border-primary/50 transition-all h-full flex flex-col">
                      {mechanic.mechanicImage && (
                        <div className="relative h-64 overflow-hidden">
                          <Image
                            src={mechanic.mechanicImage}
                            alt={mechanic.title || 'Game mechanic'}
                            width={500}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                          />
                        </div>
                      )}

                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        {mechanic.title && (
                          <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {mechanic.title}
                          </h3>
                        )}

                        {mechanic.description && (
                          <p className="font-paragraph text-base text-foreground/80 leading-relaxed flex-1">
                            {mechanic.description}
                          </p>
                        )}

                        <div className="pt-4 border-t border-secondary/20 space-y-2">
                          {mechanic.mechanicType && (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                Tipo: {mechanic.mechanicType}
                              </p>
                            </div>
                          )}

                          {mechanic.levelRequirement && (
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-secondary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                Nível: {mechanic.levelRequirement}
                              </p>
                            </div>
                          )}

                          {mechanic.reward && (
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-primary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                Recompensa: {mechanic.reward}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="font-paragraph text-xl text-foreground/60">
                  Mecânicas do jogo em breve
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-custom4/20">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-wider text-foreground">
              Pronto para <span className="text-primary">Dominar</span>?
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Junte-se a milhares de jogadores que já conquistaram seu lugar no Domínio do Comando
            </p>
            <button className="px-10 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all text-lg">
              Começar Agora
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}