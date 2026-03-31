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

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;

      // ⏱️ 1 SEGUNDO → MOSTRA DIÁLOGO
      if (currentTime >= 1 && !showDialog) {
        setShowDialog(true);
      }

      // ⏱️ 7 SEGUNDOS → MOSTRA BOTÃO
      if (currentTime >= 7 && !showButton) {
        setShowButton(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [showDialog, showButton]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Header />

      {/* 🎬 VÍDEO FULLSCREEN */}
      <video
        ref={videoRef}
        src="https://video.wixstatic.com/video/50f4bf_01db91a09f984c8fb0dd332626b5fb37/720p/mp4/file.mp4"
        autoPlay
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* 🔥 OVERLAY ESCURO LEVE */}
      <div className="absolute inset-0 bg-black/30 z-10" />

      {/* 💬 DIÁLOGO */}
      {showDialog && (
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
          <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white shadow-2xl">
            
            <p className="text-xs text-white/60 mb-2 tracking-widest">
              ATENDIMENTO PRIVADO
            </p>

            <h2 className="text-xl font-bold mb-3">
              Boa noite, Comandante.
            </h2>

            <p className="text-sm text-white/70 leading-relaxed">
              Sua coleção atual está disponível. Aqui você transforma Commands
              em presença... e presença em poder.
            </p>

          </div>
        </div>
      )}

      {/* 🔴 BOTÃO FINAL */}
      {showButton && (
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-30 w-[80%] max-w-sm">
          <button
            onClick={() => navigate('/luxo-items')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg shadow-[0_0_25px_rgba(255,0,0,0.4)] hover:scale-105 transition-all"
          >
            VER COLEÇÃO
          </button>
        </div>
      )}
    </div>
  );
}