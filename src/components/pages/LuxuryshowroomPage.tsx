import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function LuxuryshowroomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);

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
  }, [showDialog, showButton]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      <div className="relative flex-1 w-full overflow-hidden">
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
                    "
                    style={{
                      color: '#2b0d0d',
                      textShadow: `
                        0 2px 2px rgba(255,255,255,0.14),
                        0 4px 10px rgba(0,0,0,0.62),
                        0 0 10px rgba(110,28,28,0.28)
                      `,
                    }}
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
                    "
                    style={{
                      color: '#2b0d0d',
                      textShadow: `
                        0 2px 2px rgba(255,255,255,0.12),
                        0 4px 10px rgba(0,0,0,0.60),
                        0 0 10px rgba(110,28,28,0.24)
                      `,
                    }}
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
        onClick={() => navigate('/luxo-items')}
        className="
          px-8 py-4
          sm:px-9 sm:py-4
          md:px-10 md:py-5
          rounded-2xl
          text-white
          font-bold
          text-base sm:text-lg md:text-xl
          tracking-[0.08em]
          bg-gradient-to-r from-red-500 via-rose-500 to-pink-500
          shadow-[0_0_26px_rgba(255,0,80,0.45)]
          transition
          hover:scale-105
          active:scale-95
          whitespace-nowrap
        "
        style={{
          boxShadow: `
            0 0 18px rgba(255,70,110,0.40),
            0 0 34px rgba(255,0,90,0.25),
            0 10px 30px rgba(0,0,0,0.32)
          `,
        }}
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