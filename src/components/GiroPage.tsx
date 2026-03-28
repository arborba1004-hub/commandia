import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';

const symbols = ['💵', '💎', '🚔', '🔫'];

export default function GiroPage() {
  const { player, addDirtyMoney, removeDirtyMoneyPercent, removeCorre, useGiroSpin, getAvailableSpins } = usePlayerStore();

  const [slots, setSlots] = useState(['❔', '❔', '❔']);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    if (isSpinning) return;
    
    const availableSpins = getAvailableSpins();
    if (availableSpins <= 0) {
      alert('Sem giros disponíveis');
      return;
    }

    if (player.balances.corre <= 0) {
      alert('Sem corre disponível');
      return;
    }

    setIsSpinning(true);

    // Use a giro spin
    useGiroSpin();
    
    // remove 1 corre
    removeCorre(1);

    setTimeout(() => {
      const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];

      setSlots(result);

      const [a, b, c] = result;

      // 🚔 polícia
      if (a === '🚔' && b === '🚔' && c === '🚔') {
        removeDirtyMoneyPercent(30);
        alert('🚔 POLÍCIA! Você perdeu 30% do dinheiro sujo');
      }

      // 💎 jackpot
      else if (a === '💎' && b === '💎' && c === '💎') {
        addDirtyMoney(10000);
        alert('💎 JACKPOT!');
      }

      // 💵 ganho normal
      else if (a === '💵' && b === '💵') {
        addDirtyMoney(500);
      }

      // padrão
      else {
        addDirtyMoney(100);
      }

      setIsSpinning(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="flex flex-col items-center justify-center pt-40 space-y-10">

        <h1 className="text-4xl font-bold">GIRO NO ASFALTO</h1>

        {/* SLOT */}
        <div className="flex gap-6 text-6xl">
          {slots.map((s, i) => (
            <motion.div
              key={i}
              animate={{ y: isSpinning ? [0, -30, 0] : 0 }}
              transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.2 }}
            >
              {s}
            </motion.div>
          ))}
        </div>

        {/* BOTÃO */}
        <button
          onClick={spin}
          disabled={isSpinning || getAvailableSpins() <= 0}
          className="bg-red-600 px-8 py-4 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          GIRAR
        </button>

        {/* STATUS */}
        <div className="text-center space-y-2">
          <p>💰 Dirty: {player.balances.dirtyMoney}</p>
          <p>⚡ Corre: {player.balances.corre}</p>
          <p>🎰 Giros Disponíveis: {getAvailableSpins()}</p>
        </div>

      </div>

      <Footer />
    </div>
  );
}