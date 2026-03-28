import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const VIDEO = "https://video.wixstatic.com/video/50f4bf_536b2010396c43bd9a462af825339fa5/720p/mp4/file.mp4";
const LOGO = "https://static.wixstatic.com/media/50f4bf_7140cdf76a2742628049849ce89b7560~mv2.png";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, playerData, logout } = useGoogleAuth();

  useEffect(() => {
    if (window.google && !isAuthenticated) {
      window.google.accounts.id.initialize({
        client_id: "948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com",
        callback: async (response: any) => {
          const res = await fetch("https://comando-backend.onrender.com/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential })
          });

          const data = await res.json();

          if (data.token && data.player) {
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("playerData", JSON.stringify(data.player));
            window.location.reload();
          }
        },
        ux_mode: "popup"
      });

      const el = document.getElementById("google-btn");
      if (el) {
        el.innerHTML = "";
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          width: 260
        });
      }
    }
  }, [isAuthenticated]);

  return (
    <div className="w-full h-screen overflow-hidden bg-black text-white">

      {/* 🎥 VIDEO */}
      <video
        src={VIDEO}
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover"
      />

      {/* 🎭 OVERLAY INTELIGENTE */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/80" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent,black_80%)]" />

      {/* 🎬 CONTEÚDO */}
      <div className="relative z-10 flex h-full items-center justify-between px-8 md:px-20">

        {/* 🧠 LADO ESQUERDO */}
        <div className="max-w-xl">

          <motion.img
            src={LOGO}
            className="w-40 mb-6 opacity-90"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 1 }}
          />

          <motion.h1
            className="text-4xl md:text-6xl font-bold uppercase tracking-wider"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            A cidade não respeita fracos.
          </motion.h1>

          <motion.p
            className="mt-4 text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            O poder não se herda. Se toma.
          </motion.p>

          <motion.button
            onClick={() => navigate('/game')}
            className="mt-8 px-8 py-4 bg-red-700 hover:bg-red-800 rounded-lg font-bold tracking-widest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            ENTRAR NO COMANDO
          </motion.button>

        </div>

        {/* 🔐 LADO DIREITO (LOGIN / HUD) */}
        <div className="hidden md:block">

          {isAuthenticated && playerData ? (
            <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 w-72">

              <h2 className="text-xl font-bold">{playerData.name}</h2>
              <p className="text-sm text-gray-400">{playerData.email}</p>

              <div className="mt-4 space-y-2 text-sm">
                <p>Level: {playerData.level || 1}</p>
                <p>HP: {playerData.hp || 100}</p>
                <p>Money: {playerData.money || 0}</p>
              </div>

              <button
                onClick={() => navigate('/game')}
                className="mt-4 w-full bg-red-700 py-2 rounded-lg"
              >
                CONTINUAR
              </button>

              <button
                onClick={logout}
                className="mt-2 w-full border border-red-500 py-2 rounded-lg"
              >
                SAIR
              </button>

            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 w-72 text-center">

              <p className="mb-4 text-sm tracking-widest text-gray-400">
                ACESSO AO SISTEMA
              </p>

              <div id="google-btn" />

            </div>
          )}

        </div>

      </div>

      {/* 📱 MOBILE */}
      <div className="md:hidden absolute bottom-10 w-full px-6 text-center z-10">

        {isAuthenticated && playerData ? (
          <>
            <button
              onClick={() => navigate('/game')}
              className="w-full bg-red-700 py-4 rounded-xl font-bold"
            >
              CONTINUAR
            </button>
          </>
        ) : (
          <div id="google-btn" className="flex justify-center" />
        )}

      </div>

    </div>
  );
}