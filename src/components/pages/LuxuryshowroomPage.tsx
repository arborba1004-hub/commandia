import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function LuxuryshowroomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const fullText = 'Boa noite, Comandante. Sua coleção está pronta para você.';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      setShowDialog(true);
    };

    const handleTime = () => {
      const t = video.currentTime;
      setCurrentTime(t);

      if (t >= 0 && !showDialog) setShowDialog(true);
      if (t >= 6.9 && !showButton) setShowButton(true);
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('timeupdate', handleTime);

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('timeupdate', handleTime);
    };
  }, [showDialog, showButton]);

  const getDialogTop = () => {
    if (currentTime < 1.2) return '11%';
    if (currentTime < 2.8) return '12.5%';
    if (currentTime < 4.8) return '13.5%';
    if (currentTime < 6.3) return '14.5%';
    return '13%';
  };

  const getDialogScale = () => {
    if (currentTime < 1.2) return 1.03;
    if (currentTime < 2.8) return 1;
    if (currentTime < 4.8) return 0.985;
    if (currentTime < 6.3) return 0.97;
    return 0.96;
  };

  const getDialogOpacity = () => {
    if (currentTime < 6.6) return 1;
    if (currentTime < 6.9) return 0.88;
    return 0.72;
  };

  const getButtonPosition = () => {
    if (window.innerWidth < 768) {
      return {
        left: '22%',
        top: '51%',
      };
    }

    return {
      left: '25%',
      top: '53%',
    };
  };

  const buttonPosition = getButtonPosition();

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
              animate={{
                opacity: getDialogOpacity(),
                top: getDialogTop(),
                scale: getDialogScale(),
              }}
              transition={{
                opacity: { duration: 0.4, ease: 'easeOut' },
                top: { duration: 0.45, ease: 'easeOut' },
                scale: { duration: 0.45, ease: 'easeOut' },
              }}
              className="absolute left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[900px] px-3 text-center pointer-events-none"
              style={{
                transformOrigin: 'center top',
              }}
            >
              <div className="flex flex-wrap justify-center gap-x-[2px] md:gap-x-[3px] leading-[1.15]">
                {fullText.split('').map((char, i) => (
                  <motion.span
                    key={`${char}-${i}`}
                    initial={{
                      opacity: 0,
                      y: 28,
                      scale: 1.28,
                      filter: 'blur(7px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: i * 0.032,
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                      text-[26px]
                      sm:text-[30px]
                      md:text-[40px]
                      lg:text-[48px]
                      font-bold
                      tracking-[0.04em]
                    "
                    style={{
                      color: '#341414',
                      textShadow: `
                        0 2px 2px rgba(255,255,255,0.10),
                        0 3px 10px rgba(0,0,0,0.52),
                        0 0 14px rgba(117,34,34,0.30),
                        0 0 28px rgba(86,20,20,0.18)
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

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.72, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-30"
              style={{
                left: buttonPosition.left,
                top: buttonPosition.top,
                transform: 'translate(-50%, -50%)',
              }}
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
                  tracking-[0.14em]
                  bg-gradient-to-r from-red-500 via-rose-500 to-pink-500
                  shadow-[0_0_30px_rgba(255,0,80,0.45)]
                  transition
                  hover:scale-105
                  active:scale-95
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