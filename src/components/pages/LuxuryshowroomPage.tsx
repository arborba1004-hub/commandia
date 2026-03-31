import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import LuxuryNPC from '@/components/LuxuryNPC';
import LuxuryDialogFrame from '@/components/LuxuryDialogFrame';

const SHOWROOM_BG =
  'https://static.wixstatic.com/media/50f4bf_58cda01923cf4acda15fa4b54cebc965~mv2.png';

const SHOWCASE_BG =
  'https://static.wixstatic.com/media/50f4bf_bc5d38e571e7424f8ad8a566beb55dc1~mv2.png';

const ITEM_IMAGES = {
  ring: 'https://static.wixstatic.com/media/50f4bf_651d1089b4f94751b866a45cbd902243~mv2.png',
  bracelet: 'https://static.wixstatic.com/media/50f4bf_44c2d719e7974529b9e0eea26dc937fa~mv2.png',
  chain: 'https://static.wixstatic.com/media/50f4bf_95112066aaa34deba75e3955a7a9198b~mv2.png',
  watch: 'https://static.wixstatic.com/media/50f4bf_9589a22c92ea41d0a4d64f480b077d89~mv2.png',
  bag: 'https://static.wixstatic.com/media/50f4bf_0ed2c4ee08714e1b923b1e2def99fce9~mv2.png',
  sunglasses: 'https://static.wixstatic.com/media/50f4bf_34b7f97d84b44ab7868db573ab58e00a~mv2.png',
};

const ITEMS = [
  { key: 'ring', name: 'Anel' },
  { key: 'bracelet', name: 'Pulseira' },
  { key: 'chain', name: 'Corrente' },
  { key: 'watch', name: 'Relógio' },
  { key: 'bag', name: 'Bolsa' },
  { key: 'sunglasses', name: 'Óculos' },
];

function getBonus(level: number) {
  if (level < 50) return 1;
  return Number((1 + (level - 50) * 0.1).toFixed(1));
}

function getVisual(level: number) {
  const hue = level * 3.6;
  return {
    filter: `brightness(1.1) contrast(1.3) saturate(2) hue-rotate(${hue}deg)`,
    glow: `drop-shadow(0 0 20px hsl(${hue},100%,60%))`,
    color: `hsl(${hue},100%,60%)`,
  };
}

export default function LuxuryShowroomPage() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayerStore();

  const [introDone, setIntroDone] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [pending, setPending] = useState<any>(null);
  const [npcAction, setNpcAction] = useState<'kiss' | 'bye' | null>(null);

  const level = player?.niveis?.barracoLevel || 1;
  const cleanMoney = player?.balances?.cleanMoney || 0;
  const inventory = player?.inventory?.items || [];
  const playerName = player?.name || 'Chefe';

  const visual = useMemo(() => getVisual(level), [level]);

  const handleBuy = (item) => {
    setPending(item);
    setTransactionOpen(true);
  };

  const confirmBuy = () => {
    const item = pending;
    if (!item) return;

    const id = `${item.key}-${level}`;
    if (inventory.some((i) => i.id === id)) return;

    const price = level * 1000;

    if (cleanMoney < price) return;

    const updated = {
      ...player,
      balances: {
        ...player.balances,
        cleanMoney: cleanMoney - price,
      },
      inventory: {
        ...player.inventory,
        items: [...inventory, { id, ...item, level }],
      },
    };

    setPlayer(updated);

    setNpcAction(Math.random() > 0.5 ? 'kiss' : 'bye');

    setTimeout(() => {
      navigate('/game');
    }, 2000);

    setTransactionOpen(false);
  };

  return (
    <div className="min-h-screen text-white">
      <Header />

      <main
        className="min-h-screen pt-24"
        style={{
          backgroundImage: `url(${SHOWROOM_BG})`,
          backgroundSize: 'cover',
        }}
      >
        {/* NPC INTRO */}
        <AnimatePresence>
          {!introDone && (
            <motion.div
              initial={{ y: 300, scale: 0.4 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ duration: 1.8 }}
              className="flex flex-col items-center"
            >
              <LuxuryNPC />

              <div className="bg-black/70 p-6 rounded-xl mt-4 text-center max-w-xl">
                <p>
                  Bem-vindo, <b>{playerName}</b>.
                </p>
                <p>
                  Essa é a coleção nível <b>{level}</b>.
                </p>

                <button
                  onClick={() => setIntroDone(true)}
                  className="mt-4 px-6 py-2 bg-white text-black rounded"
                >
                  Ver coleção
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VITRINES */}
        {introDone && (
          <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto mt-10">
            {ITEMS.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: i < 3 ? -100 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl"
                style={{
                  backgroundImage: `url(${SHOWCASE_BG})`,
                }}
              >
                <img
                  src={ITEM_IMAGES[item.key]}
                  style={{
                    filter: `${visual.filter} ${visual.glow}`,
                  }}
                />

                <p>{item.name}</p>
                <p>+{getBonus(level)}%</p>

                <button onClick={() => handleBuy(item)}>
                  Comprar
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* TRANSAÇÃO */}
        <AnimatePresence>
          {transactionOpen && (
            <LuxuryDialogFrame
              onConfirm={confirmBuy}
              onCancel={() => setTransactionOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* NPC REAÇÃO */}
        {npcAction && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed center"
          >
            {npcAction === 'kiss' ? '😘' : '💋'}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}