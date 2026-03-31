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

  const fullText = 'Boa noite, Comandante!     Sua coleção  está  pronta  para você.';

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

  const getDialogTopClass = () => {
    if (currentTime < 1.2) return 'top-[9%] md:top-[10%]';
    if (currentTime < 2.8) return 'top-[10%] md:top-[11%]';
    if (currentTime < 4.8) return 'top-[11%] md:top-[12%]';
    if (currentTime < 6.3) return 'top-[12%] md:top-[13%]';
    return 'top-[11%] md:top-[12%]';
  };

  const getDialogScale = () => {
    if (currentTime < 1.2) return 1.02;
    if (currentTime < 2.8) return 1;
    if (currentTime < 4.8) return 0.99;
    if (currentTime < 6.3) return 0.98;
    return 0.98;
  };

  const getDialogOpacity = () => {
    if (currentTime < 6.6) return 1;
    if (currentTime < 6.9) return 0.9;
    return 0.78;
  };

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
                scale: getDialogScale(),
              }}
              transition={{
                opacity: { duration: 0.35, ease: 'easeOut' },
                scale: { duration: 0.35, ease: 'easeOut' },
              }}
              className={`absolute ${getDialogTopClass()} left-[18%], left-[16%] -translate-x-1/2 z-20 w-[92%] sm:w-[88%] md:w-[82%] max-w-[820px] px-2 sm:px-4 text-center`}
              style={{ transformOrigin: 'center top' }}
            >
              <div className="flex flex-wrap justify-center gap-x-[1px] sm:gap-x-[2px] md:gap-x-[3px] leading-[1.12]">
                {fullText.split('').map((char, i) => (
                  <motion.span
                    key={`${char}-${i}`}
                    initial={{
                      opacity: 0,
                      y: 26,
                      scale: 1.22,
                      filter: 'blur(7px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: i * 0.05,
                      duration: 0.40,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                      text-[30px]
                      xs:text-[32px]
                      sm:text-[36px]
                      md:text-[44px]
                      lg:text-[52px]
                      font-bold
                      tracking-[0.03em]
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
              initial={{ opacity: 0, scale: 0.78, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="
                absolute
                z-30
                left-[26%]
                top-[56%]
                sm:left-[24%]
                sm:top-[55%]
                md:left-[23%]
                md:top-[53%]
                lg:left-[21%]
                lg:top-[50%]
                -translate-x-1/2
                -translate-y-1/2
              "
            >
              <button
                onClick={() => navigate('/luxo-items')}
                className="
                  px-6 py-3
                  sm:px-7 sm:py-3.5
                  md:px-9 md:py-4.5
                  rounded-2xl
                  text-white
                  font-bold
                  text-sm sm:text-base md:text-lg
                  tracking-[0.12em]
                  bg-gradient-to-r from-red-500 via-rose-500 to-pink-500
                  shadow-[0_0_30px_rgba(255,0,80,0.45)]
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