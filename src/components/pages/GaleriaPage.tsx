import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { getLuxurySystem } from '@/data/luxoItems';


  
    
const textVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(8px)',
    scale: 1.08,
    y: 10,
  },
  visible: (i: number) => ({
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: i * 0.2,
      ease: 'easeOut',
    },
  }),
};

const glowVariants = {
  hidden: {
    textShadow: '0 0 0px rgba(255,255,255,0)',
  },
  visible: (i: number) => ({
    textShadow:
      i === 0
        ? '0 0 18px rgba(255,255,255,0.55), 0 0 36px rgba(255,255,255,0.2)'
        : '0 0 10px rgba(255,255,255,0.32), 0 0 20px rgba(255,255,255,0.12)',
    transition: {
      duration: 1,
      delay: i * 0.2,
      ease: 'easeOut',
    },
  }),
};

const beamColumnVariants = {
  hidden: {
    opacity: 0,
    scaleY: 0.15,
    scaleX: 0.7,
  },
  visible: {
    opacity: 1,
    scaleY: 1,
    scaleX: 1,
    transition: {
      duration: 0.95,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const impactGlowVariants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: 'easeOut',
    },
  },
};

const imageRevealVariants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 30,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const haloRevealVariants = {
  hidden: {
    opacity: 0,
    scale: 0.65,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: 'easeOut',
    },
  },
};

function getFilterByLevel(level: number) {
  // Array de filtros fortes e contrastantes para cada cor
  const filters = [
    'none', // 0 - sem filtro
    'hue-rotate(0deg) saturate(2) brightness(1.1) contrast(1.3)', // 1 - vermelho
    'hue-rotate(240deg) saturate(2.2) brightness(1.05) contrast(1.4)', // 2 - azul
    'hue-rotate(60deg) saturate(2.5) brightness(1.2) contrast(1.3)', // 3 - amarelo
    'hue-rotate(270deg) saturate(2.3) brightness(1.08) contrast(1.35)', // 4 - roxo
    'hue-rotate(120deg) saturate(2.4) brightness(1.1) contrast(1.3)', // 5 - verde
    'hue-rotate(330deg) saturate(2.2) brightness(1.12) contrast(1.32)', // 6 - rosa
    'hue-rotate(180deg) saturate(2.3) brightness(1.15) contrast(1.28)', // 7 - ciano
    'hue-rotate(30deg) saturate(2.4) brightness(1.08) contrast(1.35)', // 8 - laranja
    'hue-rotate(140deg) saturate(2.5) brightness(1.06) contrast(1.38)', // 9 - esmeralda
    'hue-rotate(300deg) saturate(2.3) brightness(1.1) contrast(1.36)', // 10 - magenta
  ];

  // Cicla entre os filtros (0-10)
  const filterIndex = level % filters.length;
  return filters[filterIndex];
}

function getVisualByLevel(level: number) {
  const colors = [
    0,0,7,7,14,14,21,21,28,28,
    36,36,43,43,50,50,57,57,64,64,
    72,72,79,79,86,86,93,93,100,100,
    108,108,115,115,122,122,129,129,136,136,
    144,144,151,151,158,158,165,165,172,172,
    180,180,187,187,194,194,201,201,208,208,
    216,216,223,223,230,230,237,237,244,244,
    252,252,259,259,266,266,273,273,280,280,
    288,288,295,295,302,302,309,309,316,316,
    324,324,331,331,338,338,345,345,352,352
  ];

  if (level <= 0) {
    return {
      filter: 'none',
      glow: 'none',
      halo: 'none',
      overlay: 'none',
    };
  }

  const hue = colors[(level - 1) % 100];

  const isEven = level % 2 === 0;

  const brightness = isEven ? 1.25 : 1.1;
  const contrast = isEven ? 1.3 : 1.2;
  const lightness = isEven ? 65 : 45;

  return {
    filter: `
      sepia(1)
      saturate(14)
      hue-rotate(${hue}deg)
      brightness(${brightness})
      contrast(${contrast})
    `,
    glow: `
      drop-shadow(0 0 12px hsla(${hue}, 100%, ${lightness}%, 0.9))
      drop-shadow(0 0 32px hsla(${hue}, 100%, ${lightness}%, 0.6))
    `,
    halo: `
      radial-gradient(circle, hsla(${hue}, 100%, ${lightness}%, 0.4) 0%, transparent 70%)
    `,
    overlay: `
      radial-gradient(circle, hsla(${hue}, 100%, ${lightness}%, 0.3) 0%, transparent 60%)
    `,
  };
}

export default function Item1Page() {
  const [textAnimationDone, setTextAnimationDone] = useState(false);
  const [beamAnimationStarted, setBeamAnimationStarted] = useState(false);
  const [imageRevealStarted, setImageRevealStarted] = useState(false);
  const [level, setLevel] = useState(0);

  const beamTimeoutRef = useRef<number | null>(null);

  const handleTextSequenceComplete = () => {
    if (textAnimationDone) return;

    setTextAnimationDone(true);

    beamTimeoutRef.current = window.setTimeout(() => {
      setBeamAnimationStarted(true);
    }, 180);
  };

  const handleBeamAnimationComplete = () => {
    if (!imageRevealStarted) {
      setImageRevealStarted(true);
    }
  };

  useEffect(() => {
    return () => {
      if (beamTimeoutRef.current) {
        window.clearTimeout(beamTimeoutRef.current);
      }
    };
  }, []);

  const handleBuy = () => {
    setLevel((prev) => (prev < 100 ? prev + 1 : 0)); // Volta ao início ao atingir 100
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col relative bg-[#01020bff] overflow-hidden">
        <StarAnimation count={40} className="z-[5]" />
        <SkyEffects />

        <div className="flex-1 flex flex-col relative h-[calc(100vh-160px)] scale-50 origin-top">
          <div className="flex justify-center items-start pt-4 relative z-30">
            <motion.div
              className="bg-transparent p-4 max-w-3xl text-center relative z-10"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
            >
              <motion.h1
                className="text-3xl md:text-4xl font-black uppercase tracking-wide text-white mb-3"
                initial="hidden"
                animate="visible"
                custom={0}
                variants={textVariants}
              >
                <motion.span
                  className="inline-block"
                  initial="hidden"
                  animate="visible"
                  custom={0}
                  variants={glowVariants}
                >
                  Item 1
                </motion.span>
              </motion.h1>

              <div className="text-sm md:text-base font-bold uppercase tracking-wide text-white space-y-1">
                <motion.span
                  className="block"
                  initial="hidden"
                  animate="visible"
                  custom={1}
                  variants={textVariants}
                >
                  <motion.span
                    className="inline-block"
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    variants={glowVariants}
                  >
                    Coleção
                  </motion.span>
                </motion.span>

                <motion.span
                  className="block"
                  initial="hidden"
                  animate="visible"
                  custom={2}
                  variants={textVariants}
                >
                  <motion.span
                    className="inline-block"
                    initial="hidden"
                    animate="visible"
                    custom={2}
                    variants={glowVariants}
                  >
                    Nível
                  </motion.span>
                </motion.span>

                <motion.span
                  className="block"
                  initial="hidden"
                  animate="visible"
                  custom={3}
                  variants={textVariants}
                  onAnimationComplete={handleTextSequenceComplete}
                >
                  <motion.span
                    className="inline-block"
                    initial="hidden"
                    animate="visible"
                    custom={3}
                    variants={glowVariants}
                  >
                    Bônus
                  </motion.span>
                </motion.span>
              </div>
            </motion.div>
          </div>

          <div
            className="absolute inset-0 z-10"
            style={{
              backgroundImage:
                'url(https://static.wixstatic.com/media/50f4bf_1db81fe6673a4c94ad02dc4735d25bd7~mv2.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: getFilterByLevel(level),
              transition: 'filter 0.4s ease',
            }}
          />

          {/* foco principal da nebulosa */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div
              className="absolute"
              style={{
                width: '30rem',
                height: '30rem',
                left: '50%',
                top: '68%',
                transform: 'translate(-50%, -50%)',
                borderRadius: '9999px',
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.14) 25%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0) 72%)',
                filter: 'blur(26px)',
              }}
            />
          </div>

          {/* coluna de energia */}
          {textAnimationDone && (
            <>
              <motion.div
                className="absolute z-30 pointer-events-none origin-top"
                style={{
                  left: '50%',
                  top: '23%',
                  width: '7rem',
                  height: '46%',
                  transform: 'translateX(-50%)',
                  borderRadius: '9999px',
                  background: `
                    radial-gradient(
                      ellipse at center,
                      rgba(255,255,255,0.78) 0%,
                      rgba(255,255,255,0.52) 18%,
                      rgba(255,255,255,0.20) 40%,
                      rgba(255,255,255,0.05) 62%,
                      rgba(255,255,255,0) 82%
                    )
                  `,
                  filter: 'blur(12px)',
                  boxShadow:
                    '0 0 30px rgba(255,255,255,0.55), 0 0 60px rgba(255,255,255,0.24)',
                }}
                initial="hidden"
                animate={beamAnimationStarted ? 'visible' : 'hidden'}
                variants={beamColumnVariants}
              />

              <motion.div
                className="absolute z-31 pointer-events-none origin-top"
                style={{
                  left: '50%',
                  top: '23%',
                  width: '2.2rem',
                  height: '44%',
                  transform: 'translateX(-50%)',
                  borderRadius: '9999px',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.86) 22%, rgba(255,255,255,0.62) 48%, rgba(255,255,255,0.18) 78%, rgba(255,255,255,0) 100%)',
                  filter: 'blur(2px)',
                  boxShadow:
                    '0 0 18px rgba(255,255,255,0.9), 0 0 38px rgba(255,255,255,0.42)',
                }}
                initial="hidden"
                animate={beamAnimationStarted ? 'visible' : 'hidden'}
                variants={beamColumnVariants}
                onAnimationComplete={handleBeamAnimationComplete}
              />

              <motion.div
                className="absolute z-32 pointer-events-none"
                style={{
                  left: '50%',
                  top: '67.5%',
                  width: '14rem',
                  height: '14rem',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '9999px',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.36) 24%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0) 72%)',
                  filter: 'blur(22px)',
                }}
                initial="hidden"
                animate={beamAnimationStarted ? 'visible' : 'hidden'}
                variants={impactGlowVariants}
              />
            </>
          )}

          {/* item revelado */}
          {imageRevealStarted && (
            <motion.div
              className="absolute z-40"
              style={{
                left: '30%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              initial="hidden"
              animate="visible"
              variants={imageRevealVariants}
            >
              <motion.div
                className="absolute inset-0 -z-10 flex items-center justify-center"
                initial="hidden"
                animate="visible"
                variants={haloRevealVariants}
              >
                <div
                  className="w-[18rem] h-[18rem] rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.14) 35%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0) 78%)',
                    filter: 'blur(22px)',
                  }}
                />
              </motion.div>

              <Image
                src="https://static.wixstatic.com/media/50f4bf_1cbe7a9134644eafb1c08918f699ae28~mv2.png"
                alt="Luxury Item Reveal"
                width={320}
                className="object-contain"
                style={{
                  filter: getFilterByLevel(level),
                  transition: 'filter 0s', // Sem transição suave - mudança imediata
                }}
              />

              <div className="absolute z-50 left-1/2 top-[78%] -translate-x-1/2 flex flex-col items-center gap-3">
                <div className="text-white text-xl font-bold tracking-wide uppercase">
                  Nível: {level} / 100
                </div>

                <button
                  onClick={handleBuy}
                  className="px-8 py-3 rounded-xl bg-black/70 text-white font-bold uppercase tracking-wide border border-white/20 shadow-[0_0_18px_rgba(255,255,255,0.18)] transition duration-200 hover:scale-105 hover:shadow-[0_0_28px_rgba(255,255,255,0.28)] disabled:opacity-50"
                  disabled={level >= 100}
                >
                  {level >= 100 ? 'Máximo' : 'Comprar'}
                </button>
              </div>
            </motion.div>
          )}

          <div className="w-full min-h-screen relative z-0 flex items-center justify-center" />
        </div>
      </main>

      <Footer />
    </div>
  );
}