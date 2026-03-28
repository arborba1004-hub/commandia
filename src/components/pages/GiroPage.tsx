import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';

const symbols = ['money', 'diamond', 'police', 'gun'];

const symbolImages: Record<string, string> = {
  money: '/public/slots/money.png',
  diamond: '/public/slots/diamond.png',
  police: '/public/slots/police.png',
  gun: '/public/slots/gun.png',
};

export default function GiroPage() {
  const {
    player,
    addDirtyMoney,
    removeDirtyMoneyPercent,
    removeCorre,
    addCorre,
  } = usePlayerStore();

  const [slots, setSlots] = useState(['money', 'money', 'money']);
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
      if (a === 'police' && b === 'police' && c === 'police') {
        setPolice(true);
        removeDirtyMoneyPercent(30);

        setTimeout(() => {
          setPolice(false);
        }, 3000);
      }

      // 💎 JACKPOT
      else if (a === 'diamond' && b === 'diamond' && c === 'diamond') {
        addDirtyMoney(10000 * multiplier);
      }

      // 💵 ganho médio
      else if (a === 'money' && b === 'money') {
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
    <div className={`min-h-screen flex flex-col ${
      police ? 'bg-red-900 animate-pulse' : 'bg-black'
    }`}>
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center text-white px-6">
        {/* ALERTA POLÍCIA */}
        {police && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-center animate-pulse">
              <h1 className="text-5xl font-bold text-red-500">🚔 RODOU!</h1>
              <p className="mt-4 text-xl">A casa caiu… perder 30% é o preço.</p>
            </div>
          </div>
        )}

        <h1 className="font-heading text-5xl lg:text-7xl mb-16 uppercase tracking-wider">
          GIRO NO <span className="text-primary">ASFALTO</span>
        </h1>

        {/* SLOT MACHINE */}
        <div className="flex gap-8 mb-16 relative">
          {/* Frame glow background */}
          <div className="absolute inset-0 -z-10 blur-2xl opacity-30 bg-primary/20 rounded-3xl"></div>
          
          {slots.map((symbol, i) => (
            <motion.div
              key={i}
              animate={{ y: isSpinning ? [0, -30, 0] : 0 }}
              transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.2 }}
              className="relative"
            >
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-custom4/50 border-4 border-primary rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src={symbolImages[symbol]}
                  alt={symbol}
                  width={120}
                  height={120}
                  className="w-24 h-24 lg:w-32 lg:h-32 object-contain"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* BOTÕES */}
        <div className="flex gap-4 flex-wrap justify-center mb-16">
          <button
            onClick={() => spin(1)}
            disabled={isSpinning}
            className="px-8 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSpinning ? 'Girando...' : 'GIRAR'}
          </button>

          <button
            onClick={() => spin(5)}
            disabled={isSpinning}
            className="px-8 py-4 bg-secondary text-secondary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-50"
          >
            {isSpinning ? 'Girando...' : 'x5 GIROS'}
          </button>

          <button
            onClick={() => spin(10)}
            disabled={isSpinning}
            className="px-8 py-4 bg-destructive text-destructiveforeground font-heading uppercase tracking-wider rounded-lg hover:bg-destructive/90 transition-all disabled:opacity-50"
          >
            {isSpinning ? 'Girando...' : 'x10 GIROS'}
          </button>
        </div>

        {/* STATUS */}
        <div className="text-center space-y-4 bg-custom4/30 border border-secondary/20 rounded-lg p-8">
          <p className="font-heading text-2xl">
            💰 Dirty: <span className="text-primary">{player.balances.dirtyMoney}</span>
          </p>
          <p className="font-heading text-2xl">
            ⚡ Corre: <span className="text-secondary">{player.balances.corre}</span>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
