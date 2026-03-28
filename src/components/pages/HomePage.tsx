// HPI 1.7-V
import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { GameMechanics } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Trophy, Target, Swords, Crown, Crosshair, ShieldAlert, Gem } from 'lucide-react';

export default function HomePage() {
  const [mechanics, setMechanics] = useState<GameMechanics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 15, stiffness: 100 });

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
    <div ref={containerRef} className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black overflow-clip">
      <style>{`
        .text-stroke-white {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.8);
          color: transparent;
        }
        .text-stroke-primary {
          -webkit-text-stroke: 1px #FF007F;
          color: transparent;
        }
        .glow-primary {
          filter: drop-shadow(0 0 20px rgba(255, 0, 127, 0.5));
        }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }
      `}</style>

      <Header />

      {/* Global Noise Overlay */}
      <div className="fixed inset-0 noise-bg z-50 mix-blend-overlay" />

      {/* HERO SECTION - Replicating Inspiration Structure */}
      <section className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-8 px-6 lg:px-12 max-w-[120rem] mx-auto">
        
        {/* Ambient Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Top: Massive Typography */}
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-6"
          >
            <p className="font-paragraph italic text-xl md:text-2xl text-secondary/80 tracking-wide">
              A Ascensão do Nível 1 ao 100
            </p>
            <h1 className="font-heading text-[12vw] leading-[0.85] uppercase tracking-tighter flex flex-col items-center">
              <span className="text-stroke-white block hover:text-white transition-colors duration-500 cursor-default">
                Domínio
              </span>
              <span className="text-primary glow-primary block mt-2">
                Do Comando
              </span>
            </h1>
          </motion.div>
        </div>

        {/* Structural Divider */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          className="w-full h-[1px] bg-white/20 my-8 origin-center z-10" 
        />

        {/* Bottom: 3-Column Layout (Left Info, Center Object, Right Info) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end z-10 pb-4">
          
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-left space-y-1 hidden md:block"
          >
            <p className="font-heading text-xs uppercase tracking-[0.2em] text-primary mb-2">Gênero</p>
            <p className="font-heading text-lg uppercase tracking-wider text-secondary">Multiplayer</p>
            <p className="font-heading text-lg uppercase tracking-wider text-secondary">Online</p>
            <p className="font-paragraph italic text-sm text-secondary/60 mt-2">Cartoon Cinematográfico</p>
          </motion.div>

          {/* Center Column: The "Disco Ball" Equivalent (Rotating Emblem) */}
          <div className="flex justify-center items-center relative h-48 md:h-auto">
            {/* Vertical line connecting to top */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-t from-white/20 to-transparent hidden md:block" />
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="relative w-40 h-40 md:w-56 md:h-56 rounded-full border border-white/10 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              {/* Inner rotating rings */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border border-dashed border-primary/30"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent" />
              
              {/* Core Icon */}
              <Crown className="w-12 h-12 md:w-16 md:h-16 text-primary glow-primary" />
              
              {/* "Pause" or interaction indicator from inspiration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 z-20 mix-blend-difference">
                 <div className="w-1 h-4 bg-primary" />
                 <div className="w-1 h-4 bg-primary" />
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-center md:text-right space-y-1"
          >
            <p className="font-heading text-xs uppercase tracking-[0.2em] text-primary mb-2">Status</p>
            <p className="font-heading text-lg uppercase tracking-wider text-secondary">Acesso</p>
            <p className="font-heading text-lg uppercase tracking-wider text-secondary">Exclusivo</p>
            <p className="font-paragraph italic text-sm text-secondary/60 mt-2">Prepare-se para a glória</p>
          </motion.div>

        </div>
      </section>

      {/* NARRATIVE SECTION: The Pillars of Power */}
      <section className="relative w-full py-32 bg-black border-t border-white/10">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Sticky Left Column */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-32 space-y-8">
                <div className="inline-flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-primary" />
                  <span className="font-heading text-sm uppercase tracking-[0.2em] text-primary">O Caminho</span>
                </div>
                <h2 className="font-heading text-5xl lg:text-7xl uppercase tracking-tight leading-none">
                  Construa seu <br/>
                  <span className="text-stroke-white">Império</span>
                </h2>
                <p className="font-paragraph text-lg text-secondary/70 max-w-md leading-relaxed">
                  A jornada para o nível 100 não é para os fracos. Exige astúcia, força bruta e uma vontade inabalável de dominar o submundo.
                </p>
              </div>
            </div>

            {/* Scrolling Right Column */}
            <div className="lg:col-span-7 space-y-24 mt-16 lg:mt-0">
              {[
                { icon: Target, title: "Tarefas Estratégicas", desc: "Complete missões complexas que testam sua inteligência e habilidade tática nas sombras da cidade." },
                { icon: Swords, title: "Combates Intensos", desc: "Enfrente adversários em batalhas cinematográficas ultra realistas onde cada movimento conta." },
                { icon: Gem, title: "Ostentação Pura", desc: "Acumule riqueza, exiba seu poder e construa um império criminal com estilo inigualável." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="relative pl-8 md:pl-16 border-l border-white/10 group"
                >
                  {/* Hover Line Indicator */}
                  <div className="absolute left-[-1px] top-0 w-[2px] h-0 bg-primary group-hover:h-full transition-all duration-500 ease-out" />
                  
                  <div className="mb-6 inline-flex p-4 rounded-full bg-custom4/30 border border-white/5 group-hover:border-primary/50 transition-colors duration-300">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-3xl uppercase tracking-wider mb-4">{item.title}</h3>
                  <p className="font-paragraph text-xl text-secondary/60 leading-relaxed max-w-xl">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* DATA SECTION: Game Mechanics (CMS Driven) */}
      <section id="missoes" className="relative w-full py-32 bg-custom4/10">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
        
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <h2 className="font-heading text-5xl lg:text-7xl uppercase tracking-tight">
                O <span className="text-primary">Arsenal</span>
              </h2>
              <p className="font-paragraph text-xl text-secondary/60 italic">
                Mecânicas e sistemas à sua disposição.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm font-heading uppercase tracking-widest text-secondary/40">
              <span>Scroll para explorar</span>
              <div className="w-16 h-[1px] bg-secondary/40" />
            </div>
          </div>

          {/* Mechanics Grid */}
          <div className="relative min-h-[400px]">
            {/* Loading State Overlay - Ensures ref container always renders */}
            <div className={`absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-500 ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-500 ${mechanics.length === 0 && !isLoading ? 'hidden' : 'block'}`}>
              {mechanics.map((mechanic, index) => (
                <motion.div
                  key={mechanic._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative bg-black border border-white/10 overflow-hidden hover:border-primary/50 transition-colors duration-500 flex flex-col h-full"
                >
                  {/* Image Container with Parallax/Scale effect */}
                  <div className="relative h-64 overflow-hidden bg-custom4/20">
                    {mechanic.mechanicImage ? (
                      <Image
                        src={mechanic.mechanicImage}
                        alt={mechanic.title || 'Mechanic'}
                        width={600}
                        className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Crosshair className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {/* Level Badge */}
                    {mechanic.levelRequirement && (
                      <div className="absolute top-4 right-4 bg-primary text-black font-heading text-xs uppercase tracking-widest px-3 py-1.5 rounded-sm">
                        Nível {mechanic.levelRequirement}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col relative z-10 -mt-12">
                    <div className="mb-4">
                      {mechanic.mechanicType && (
                        <span className="font-heading text-xs uppercase tracking-[0.2em] text-primary mb-2 block">
                          {mechanic.mechanicType}
                        </span>
                      )}
                      <h3 className="font-heading text-2xl uppercase tracking-wider text-white group-hover:text-primary transition-colors">
                        {mechanic.title}
                      </h3>
                    </div>
                    
                    {mechanic.description && (
                      <p className="font-paragraph text-secondary/70 leading-relaxed mb-6 flex-1">
                        {mechanic.description}
                      </p>
                    )}
                    
                    {mechanic.reward && (
                      <div className="pt-4 border-t border-white/10 mt-auto">
                        <p className="font-heading text-xs uppercase tracking-widest text-secondary/40 mb-1">
                          Recompensa
                        </p>
                        <p className="font-paragraph text-white italic">
                          {mechanic.reward}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            <div className={`text-center py-32 border border-dashed border-white/10 ${mechanics.length === 0 && !isLoading ? 'block' : 'hidden'}`}>
              <ShieldAlert className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="font-heading text-xl uppercase tracking-widest text-secondary/40">
                Arquivos Confidenciais Indisponíveis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FULL BLEED IMAGE BREAK - The Visual Breather */}
      <section className="relative w-full h-[80vh] overflow-hidden">
        <motion.div 
          style={{ y: useTransform(smoothProgress, [0, 1], ["-20%", "20%"]) }}
          className="absolute inset-0 w-full h-[140%]"
        >
          <Image 
            src="https://static.wixstatic.com/media/50f4bf_11ec0e9d2d9d45f18c6cf0c9073db473~mv2.png?originWidth=1280&originHeight=704"
            alt="Cinematic Cityscape"
            className="w-full h-full object-cover opacity-40 grayscale"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center mix-blend-difference">
            <p className="font-paragraph italic text-3xl md:text-5xl text-white">
              "A cidade é sua..."
            </p>
            <p className="font-heading text-xl uppercase tracking-[0.3em] text-white mt-4">
              Se tiver coragem de tomá-la.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative w-full py-32 bg-background overflow-hidden">
        {/* Radial Gradient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="border border-white/10 bg-black/50 backdrop-blur-md p-12 md:p-24 text-center relative overflow-hidden"
          >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary" />

            <h2 className="font-heading text-5xl md:text-8xl uppercase tracking-tighter mb-6">
              Reivindique o <br/>
              <span className="text-primary glow-primary">Comando</span>
            </h2>
            <p className="font-paragraph text-xl md:text-2xl text-secondary/70 max-w-2xl mx-auto mb-12 italic">
              Sua jornada do nível 1 ao 100 começa agora. Entre no mundo do crime organizado e ostentação.
            </p>
            
            <button className="group relative inline-flex items-center justify-center px-12 py-5 font-heading text-lg uppercase tracking-widest text-black bg-primary overflow-hidden transition-transform hover:scale-105">
              <span className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center gap-3">
                Iniciar Sessão <Crosshair className="w-5 h-5" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}