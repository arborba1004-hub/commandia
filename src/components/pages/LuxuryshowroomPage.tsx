import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function LuxuryshowroomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const fullText = 'Boa noite, Comandante. Sua coleção está pronta para você.';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTime = () => {
      const t = video.currentTime;

      if (t >= 0 && !showDialog) setShowDialog(true);
      if (t >= 6.9 && !showButton) setShowButton(true);
    };

    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, [showDialog, showButton]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      <div className="relative flex-1 w-full overflow-hidden">

        {/* 🎬 VÍDEO */}
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_01db91a09f984c8fb0dd332626b5fb37/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* 💎 TEXTO CENTRALIZADO REAL */}
        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="
                absolute
                left-[50%]
                top-[15%]
                -translate-x-1/2
                -translate-y-1/2
                z-20
                w-[90%]
                max-w-[800px]
                text-center
              "
            >
              <div className="flex flex-wrap justify-center gap-[2px] leading-[1.1]">
                {fullText.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: 1.2,
                      filter: 'blur(6px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: i * 0.03,
                      duration: 0.35,
                    }}
                    className="
                      text-[28px]
                      md:text-[40px]
                      font-bold
                      tracking-wide
                    "
                    style={{
                      color: '#341414',
                      textShadow: `
                        0 2px 6px rgba(0,0,0,0.6),
                        0 0 10px rgba(255,80,80,0.25)
                      `,
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔴 BOTÃO (FORA DO CENTRO - MÃO DELA) */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="
                absolute
                left-[22%]
                top-[52%]
                -translate-x-1/2
                -translate-y-1/2
                z-30
              "
            >
              <button
                onClick={() => navigate('/luxo-items')}
                className="
                  px-8 py-4
                  md:px-10 md:py-5
                  rounded-2xl
                  text-white
                  font-bold
                  text-base md:text-lg
                  bg-gradient-to-r from-red-500 to-pink-500
                  shadow-[0_0_25px_rgba(255,0,80,0.5)]
                  hover:scale-105
                  transition
                "
              >
                VER COLEÇÃO
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}