import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />

      <main className="relative flex min-h-[calc(100vh-140px)] items-center justify-center">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
        >
          <source
            src="https://video.wixstatic.com/video/11062b_054dce43c8ea44cb8c5d742e96f0b7b0/720p/mp4/file.mp4"
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 bg-black/35" />

        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 22 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 mx-4 flex w-full max-w-4xl flex-col items-center text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-black/45 px-6 py-8 backdrop-blur-sm md:px-10 md:py-10">
                <div className="mb-4 flex flex-wrap justify-center gap-x-3 gap-y-2 text-2xl font-semibold md:text-4xl">
                  {wordsLine1.map((word, i) => (
                    <motion.span
                      key={`line1-${i}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-lg text-white/90 md:text-2xl">
                  {wordsLine2.map((word, i) => (
                    <motion.span
                      key={`line2-${i}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + i * 0.1 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </div>

                {showButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate('/luxo-item?item=ring')}
                    className="mt-8 rounded-xl border border-red-400/50 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 px-8 py-4 text-base font-bold tracking-[0.08em] text-white opacity-95 transition hover:scale-105 active:scale-95 sm:px-9 sm:py-4 sm:text-lg md:px-10 md:py-5 md:text-xl"
                  >
                    VER COLEÇÃO
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}