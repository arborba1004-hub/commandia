import { useEffect } from 'react';
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

  useEffect(() => {
    if (!player) return;

    const until = addHours(72);

    const skills = { ...(player.skills || {}) };

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
  }, []);

  return (
    <div className="w-full min-h-screen bg-black relative overflow-hidden">

      <Header />

      {/* BACKGROUND */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f~mv2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* VINHETA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.75)_100%)]" />

      <main className="relative z-20 flex items-center justify-center min-h-screen px-6">

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[900px] w-full bg-black/75 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
        >

          {/* TÍTULO */}
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight text-center">
            Você fez a coisa certa.
          </h1>

          {/* SUBTÍTULO */}
          <p className="mt-6 text-xl md:text-2xl text-center text-white/90 leading-relaxed">
            Nem todos chegam até aqui…  
            e menos ainda têm coragem de escolher o que é certo.
          </p>

          {/* RECOMPENSA */}
          <div className="mt-10 bg-emerald-900/40 border border-emerald-400/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.25)]">
            <p className="text-white text-lg md:text-xl">
              Você foi recompensado por isso.
            </p>

            <p className="mt-2 text-2xl md:text-3xl font-bold text-emerald-300">
              +100% em todas as habilidades
            </p>
          </div>

          {/* CONSEQUÊNCIA */}
          <div className="mt-10 bg-red-900/30 border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,0,0,0.25)]">
            <p className="text-white text-lg leading-relaxed text-center">
              Mas até a escolha certa… tem um preço.
            </p>

            <div className="mt-6 space-y-3 text-white/90 text-center">

              <p>🔒 Seus bens ficarão bloqueados por <b>72 horas</b></p>

              <p>📉 Você perde temporariamente os bônus do inventário</p>

              <p>💰 Dinheiro sujo e limpo ficam indisponíveis</p>

              <p>🛡️ Você não poderá ser atacado (proteção federal)</p>

              <p>⚡ Você pode continuar no corre, mas sem progressão</p>

            </div>
          </div>

          {/* FRASE FINAL */}
          <p className="mt-10 text-center text-white/60 italic">
            A verdade protege… mas nunca vem sem custo.
          </p>

          {/* BOTÃO */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => navigate('/game')}
              className="
                px-10 py-4
                rounded-xl
                text-white
                font-bold
                text-lg
                bg-gradient-to-r from-emerald-600 to-emerald-500
                shadow-[0_0_40px_rgba(16,185,129,0.5)]
                hover:scale-105
                transition
              "
            >
              Continuar
            </button>
          </div>

        </motion.div>

      </main>
    </div>
  );
}