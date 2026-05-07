import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import FeatureLevelLock from '@/components/FeatureLevelLock';
import { canAccessFeature, getFeatureLevelRequirement } from '@/utils/levelRequirements';

export default function LuxuryshowroomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.player);

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const playerLevel = player.niveis.playerLevel || 1;
  const requiredLevel = getFeatureLevelRequirement('luxo');
  const isFeatureUnlocked = canAccessFeature(playerLevel, 'luxo');

  // Se a funcionalidade não está desbloqueada, mostrar lock screen
  if (!isFeatureUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 pt-[140px] md:pt-[160px]">
          <FeatureLevelLock
            playerLevel={playerLevel}
            requiredLevel={requiredLevel}
            featureName="Loja de Luxo"
            onNavigateToBarraco={() => navigate('/barraco')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const line1 = 'Boa noite, Comandante.';
  const line2 = 'Sua coleção está pronta para você.';
  const wordsLine1 = line1.split(' ');
  const wordsLine2 = line2.split(' ');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTime = () => {
      const t = video.currentTime;

      if (t >= 0 && !showDialog) setShowDialog(true);
      if (t >= 8 && !showButton) setShowButton(true);
    };

    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, []); // Only set up listener once on mount

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      <div className="relative flex-1 w-full overflow-hidden pt-[140px] md:pt-[160px]">
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_01db91a09f984c8fb0dd332626b5fb37/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="
                absolute
                left-[50%]
                top-[14%]
                -translate-x-1/2
                -translate-y-1/2
                z-20
                w-[94%]
                max-w-[980px]
                text-center
                px-2
              "
            >
              {/* LINHA 1 - SEM QUEBRAR NO MEIO */}
              <div className="flex justify-center items-center flex-nowrap gap-[10px] whitespace-nowrap overflow-visible">
                {wordsLine1.map((word, i) => (
                  <motion.span
                    key={`line1-${i}`}
                    initial={{
                      opacity: 0,
                      y: 18,
                      scale: 1.18,
                      filter: 'blur(5px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: i * 0.9,
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                       text-[30px]
                       sm:text-[34px]
                       md:text-[46px]
                       lg:text-[56px]
                       font-bold
                       leading-none
                       text-red-950
                     "
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              {/* LINHA 2 - PODE DIVIDIR, MAS SÓ ENTRE PALAVRAS */}
              <div className="mt-3 flex justify-center items-center flex-wrap gap-x-[10px] gap-y-[4px]">
                {wordsLine2.map((word, i) => (
                  <motion.span
                    key={`line2-${i}`}
                    initial={{
                      opacity: 0,
                      y: 18,
                      scale: 1.14,
                      filter: 'blur(5px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: 2.7 + i * 0.9,
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                       text-[26px]
                       sm:text-[30px]
                       md:text-[40px]
                       lg:text-[48px]
                       font-bold
                       leading-none
                       whitespace-nowrap
                       text-red-950
                     "
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="
                absolute
                left-[21%]
                top-[46%]
                sm:left-[20%]
                sm:top-[45%]
                md:left-[19%]
                md:top-[44%]
                lg:left-[18%]
                lg:top-[43%]
                -translate-x-1/2
                -translate-y-1/2
                z-30
              "
            >
              <button
                onClick={() => navigate('/galeria')}
                className="
                  px-8 py-4
                  sm:px-9 sm:py-4
                  md:px-10 md:py-5
                  rounded-xl
                  text-white
                  font-bold
                  text-base sm:text-lg md:text-xl
                  tracking-[0.08em]
                  bg-gradient-to-r from-red-500 via-rose-500 to-pink-500
                  transition
                  hover:scale-105
                  active:scale-95
                  whitespace-nowrap
                  border border-red-400/50
                  opacity-95
                "
              >
                VER COLEÇÃO
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
