import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

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

      // ⏱️ DIÁLOGO (1s)
      if (t >= 1 && !showDialog) setShowDialog(true);

      // ⏱️ BOTÃO (7s)
      if (t >= 7 && !showButton) setShowButton(true);
    };

    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, [showDialog, showButton]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">

      {/* HEADER */}
      <Header />

      {/* ÁREA DO VÍDEO */}
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

        {/* 💎 DIÁLOGO LUXO */}
        {showDialog && (
          <div className="
            absolute
            top-[12%]
            left-1/2
            -translate-x-1/2
            w-[92%]
            max-w-[520px]
            z-20
          ">
            
            {/* BORDA LUXUOSA */}
            <div
              className="relative p-[2px] rounded-2xl"
              style={{
                backgroundImage: `url(https://static.wixstatic.com/media/50f4bf_651d1089b4f94751b866a45cbd902243~mv2.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="
                bg-black/60
                backdrop-blur-md
                rounded-2xl
                px-6
                py-5
                text-white
              ">

                <p className="text-xs tracking-widest text-white/60 mb-2">
                  ATENDIMENTO PRIVADO
                </p>

                <h2 className="text-xl md:text-2xl font-semibold mb-2">
                  Boa noite, Comandante.
                </h2>

                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  Sua coleção atual está disponível. Aqui você transforma Commands
                  em presença... e presença em poder.
                </p>

              </div>
            </div>
          </div>
        )}

        {/* 🔴 BOTÃO */}
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
        backdrop-blur-sm
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