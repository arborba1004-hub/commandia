import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LuxuryshowroomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTime = () => {
      const t = video.currentTime;

      if (t >= 1 && !showDialog) setShowDialog(true);
      if (t >= 7 && !showButton) setShowButton(true);
    };

    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, [showDialog, showButton]);

  // 🔥 TEXTO LETRA POR LETRA
  const text = "Boa noite, Comandante.";

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

        {/* 💎 DIÁLOGO NOVO (SEM FUNDO) */}
        {showDialog && (
          <div className="
            absolute
            top-[14%]
            left-1/2
            -translate-x-1/2
            w-[90%]
            max-w-[600px]
            z-20
            text-center
          ">

            <motion.div
              initial="hidden"
              animate="visible"
              className="flex flex-wrap justify-center gap-[2px]"
            >
              {text.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{
                    opacity: 0,
                    y: 20,
                    scale: 1.2,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.4,
                    ease: 'easeOut',
                  }}
                  style={{
                    color: '#2a0f0f', // mais escuro (vinho profundo)
textShadow: `
  0 2px 6px rgba(0,0,0,0.6),
  0 0 8px rgba(255,80,80,0.3)
`,
                  }}
                  className="
                    text-[28px]
                    md:text-[38px]
                    font-bold
                    tracking-wide
                  "
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.div>

            {/* TEXTO SECUNDÁRIO */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="
                mt-4
                text-[14px] md:text-[18px]
                text-[#9a3b3b]
                tracking-wide
              "
              style={{
                textShadow: '0 0 10px rgba(150,50,50,0.4)',
              }}
            >
              Sua coleção está pronta para você.
            </motion.p>

          </div>
        )}

        {/* 🔴 BOTÃO (MÃO DELA) */}
        {showButton && (
          <div
            className="
              absolute
              left-[21%]
              top-[50%]
              -translate-x-1/2
              -translate-y-1/2
              z-30
            "
          >
            <button
              onClick={() => navigate('/luxo-items')}
              className="
                px-6 py-3
                md:px-8 md:py-4
                rounded-xl
                text-white
                font-semibold
                text-sm md:text-base
                bg-gradient-to-r from-red-500 to-pink-500
                shadow-[0_0_25px_rgba(255,0,80,0.5)]
                transition
                hover:scale-105
                active:scale-95
              "
            >
              VER COLEÇÃO
            </button>
          </div>
        )}

      </div>
    </div>
  );
}