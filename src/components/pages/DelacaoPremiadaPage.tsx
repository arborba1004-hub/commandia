import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export default function DelacaoPremiadaPage() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayerStore();

  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleConfirm = () => {
    setProcessing(true);

    setTimeout(() => {
      const until = addHours(72);

      const skills = { ...(player.skills || {}) };

      // 🔥 +100% em todas as habilidades
      Object.keys(skills).forEach((key) => {
        skills[key] = (skills[key] || 0) + 100;
      });

      setPlayer({
        ...player,
        skills,
        punishments: {
          ...player.punishments,
          delacaoPremiadaUntil: until,
          assetLockdownActive: true,
          inventoryBlocked: true,
          dirtyMoneyBlocked: true,
          cleanMoneyBlocked: true,
          levelProgressionBlocked: true,
          inventoryBonusReductionPercent: 100,
          pvpProtectionUntil: until,
        },
      });

      setConfirmed(true);

      setTimeout(() => {
        navigate('/game');
      }, 4000);
    }, 1800);
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">

      <Header />

      {/* 🔥 BACKGROUND */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f~mv2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 🔥 FLASHES DA PLATEIA */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 0.4,
            delay: i * 1.5,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      ))}

      {/* 🔥 OVERLAY SUAVE (sem escurecer demais) */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* 🔥 CONTEÚDO */}
      <div className="relative z-20 h-full flex items-center justify-center px-6">

        {!confirmed ? (
          <div className="text-center max-w-2xl">

            {/* TEXTO */}
            <motion.h1
              className="text-3xl md:text-5xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              Você chegou ao topo.
            </motion.h1>

            <motion.p
              className="mt-6 text-lg md:text-2xl text-gray-200 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              Agora você pode fazer parte de algo maior...
              <br />
              ou escolher o lado que chama de certo.
              <br /><br />
              Mas certas escolhas mudam tudo.
            </motion.p>

            {/* BOTÃO */}
            <motion.button
              onClick={handleConfirm}
              disabled={processing}
              className="
                mt-10
                px-10 py-5
                text-lg md:text-xl
                font-bold
                text-white
                rounded-xl
                bg-gradient-to-r from-red-600 to-red-800
                shadow-[0_0_30px_rgba(255,0,0,0.5)]
                hover:scale-105
                active:scale-95
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {processing ? 'Tomando decisão...' : 'Delação Premiada'}
            </motion.button>

          </div>
        ) : (
          <motion.div
            className="text-center max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Você fez a coisa certa.
            </h2>

            <p className="mt-6 text-lg md:text-xl text-gray-300 leading-relaxed">
              Mas no topo...
              <br />
              até a verdade cobra seu preço.
              <br /><br />
              Seus bens foram bloqueados.
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
