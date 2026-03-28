import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';

const symbols = ['💵', '💎', '🚔', '🔫'];

export default function GiroPage() {
  const {
    player,
    addDirtyMoney,
    removeDirtyMoneyPercent,
    removeCorre,
    addCorre,
  } = usePlayerStore();

  const [slots, setSlots] = useState(['❔', '❔', '❔']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [police, setPolice] = useState(false);

  const spin = (multiplier = 1) => {
    if (isSpinning) return;

    if (player.balances.corre < multiplier) {
      alert('Sem corre suficiente');
      return;
    }

    setIsSpinning(true);

    // consome giros
    removeCorre(multiplier);

    setTimeout(() => {
      const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];

      setSlots(result);

      const [a, b, c] = result;

      // 🚔 PRISÃO
      if (a === '🚔' && b === '🚔' && c === '🚔') {
        setPolice(true);
        removeDirtyMoneyPercent(30);

        setTimeout(() => {
          setPolice(false);
        }, 3000);
      }

      // 💎 JACKPOT
      else if (a === '💎' && b === '💎' && c === '💎') {
        addDirtyMoney(10000 * multiplier);
      }

      // 💵 ganho médio
      else if (a === '💵' && b === '💵') {
        addDirtyMoney(500 * multiplier);
      }

      // padrão
      else {
        addDirtyMoney(100 * multiplier);
      }

      setIsSpinning(false);
    }, 800);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center text-white ${
      police ? 'bg-red-900 animate-pulse' : 'bg-black'
    }`}>

      {/* ALERTA POLÍCIA */}
      {police && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center animate-pulse">
            <h1 className="text-5xl font-bold text-red-500">🚔 RODOU!</h1>
            <p className="mt-4 text-xl">A casa caiu… perder 30% é o preço.</p>
          </div>
        </div>
      )}

      <h1 className="text-4xl mb-10">GIRO NO ASFALTO</h1>

      {/* SLOT */}
      <div className="flex gap-6 text-6xl mb-10">
        {slots.map((s, i) => (
          <motion.div
            key={i}
            animate={{ y: isSpinning ? [0, -20, 0] : 0 }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.2 }}
          >
            {s}
          </motion.div>
        ))}
      </div>

      {/* BOTÕES */}
      <div className="flex gap-4 flex-wrap justify-center">

        <button
          onClick={() => spin(1)}
          className="bg-red-600 px-6 py-3 rounded-lg"
        >
          GIRAR
        </button>

        <button
          onClick={() => spin(5)}
          className="bg-yellow-600 px-6 py-3 rounded-lg"
        >
          x5 GIROS
        </button>

        <button
          onClick={() => spin(10)}
          className="bg-purple-600 px-6 py-3 rounded-lg"
        >
          x10 GIROS
        </button>

      </div>

      {/* STATUS */}
      <div className="mt-10 text-center">
        <p>💰 Dirty: {player.balances.dirtyMoney}</p>
        <p>⚡ Corre: {player.balances.corre}</p>
      </div>

    </div>
  );
}