import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { getLuxurySystem } from '@/data/luxoItems';

export default function LuxuryShowroom() {
  const player = usePlayerStore((s) => s.player);
  const removeCleanMoney = usePlayerStore((s) => s.removeCleanMoney);

  const barracoLevel = player?.niveis?.barracoLevel || 1;
  const cleanMoney = player?.balances?.cleanMoney || 0;

  const { items, background, collectionName } = useMemo(() => {
    return getLuxurySystem(barracoLevel);
  }, [barracoLevel]);

  // 🎨 TEMA DINÂMICO POR NÍVEL (OSTENTAÇÃO)
  const theme = useMemo(() => {
    if (barracoLevel <= 10) {
      return { color: '#b91c1c', glow: 'rgba(185,28,28,0.4)' };
    }
    if (barracoLevel <= 25) {
      return { color: '#2563eb', glow: 'rgba(37,99,235,0.4)' };
    }
    if (barracoLevel <= 50) {
      return { color: '#7c3aed', glow: 'rgba(124,58,237,0.4)' };
    }
    if (barracoLevel <= 75) {
      return { color: '#d4af37', glow: 'rgba(212,175,55,0.5)' };
    }
    if (barracoLevel <= 90) {
      return { color: '#facc15', glow: 'rgba(250,204,21,0.5)' };
    }
    return { color: '#ffffff', glow: 'rgba(255,255,255,0.7)' };
  }, [barracoLevel]);

  const handleBuy = (price: number) => {
    if (cleanMoney < price) return;
    removeCleanMoney(price);
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background }}
    >
      <Header />

      {/* 🔥 OVERLAY CINEMATOGRÁFICO */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 pt-32 px-6 lg:px-12 max-w-[120rem] mx-auto">

        {/* 💣 HEADER PREMIUM */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1
            className="text-4xl lg:text-6xl font-black tracking-widest"
            style={{ color: theme.color }}
          >
            SHOWROOM DE LUXO
          </h1>

          <p className="mt-4 text-lg opacity-80">
            Coleção: <span style={{ color: theme.color }}>{collectionName}</span>
          </p>

          <p className="opacity-50 text-sm mt-1">
            Nível do Barraco: {barracoLevel}
          </p>
        </motion.div>

        {/* 💰 COFRE */}
        <div className="flex justify-center mb-12">
          <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/10 text-yellow-400 font-bold text-lg shadow-xl">
            💰 {cleanMoney.toLocaleString()} Commands Limpo
          </div>
        </div>

        {/* 💎 GRID DE ITENS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.08 }}
              className="relative group"
            >
              {/* 🔥 GLOW */}
              <div
                className="absolute inset-0 blur-2xl opacity-30 group-hover:opacity-60 transition"
                style={{ background: theme.glow }}
              />

              {/* 💣 CARD */}
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-center shadow-2xl">

                {/* 💎 ITEM */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-contain mb-4 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                />

                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  {item.name}
                </h3>

                <p
                  className="font-bold mt-2 text-lg"
                  style={{ color: theme.color }}
                >
                  ${item.price.toLocaleString()}
                </p>

                {/* 💣 BOTÃO */}
                <button
                  onClick={() => handleBuy(item.price)}
                  className="mt-4 w-full py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: theme.color,
                    color: '#000',
                  }}
                >
                  Comprar
                </button>

              </div>
            </motion.div>
          ))}

        </div>

      </div>

      <Footer />
    </div>
  );
}