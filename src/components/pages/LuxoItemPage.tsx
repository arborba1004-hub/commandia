import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { getLuxurySystem } from '@/data/luxoItems';
import { getReducedInventoryBonus } from '@/utils/inventoryBonus';

const SHOWROOM_BG =
  'https://static.wixstatic.com/media/50f4bf_58cda01923cf4acda15fa4b54cebc965~mv2.png';

const SHOWCASE_BG =
  'https://static.wixstatic.com/media/50f4bf_bc5d38e571e7424f8ad8a566beb55dc1~mv2.png';

const ITEM_IMAGE_BY_KEY: Record<string, string> = {
  ring: 'https://static.wixstatic.com/media/50f4bf_651d1089b4f94751b866a45cbd902243~mv2.png',
  bracelet: 'https://static.wixstatic.com/media/50f4bf_44c2d719e7974529b9e0eea26dc937fa~mv2.png',
  chain: 'https://static.wixstatic.com/media/50f4bf_95112066aaa34deba75e3955a7a9198b~mv2.png',
  watch: 'https://static.wixstatic.com/media/50f4bf_9589a22c92ea41d0a4d64f480b077d89~mv2.png',
  bag: 'https://static.wixstatic.com/media/50f4bf_0ed2c4ee08714e1b923b1e2def99fce9~mv2.png',
  sunglasses: 'https://static.wixstatic.com/media/50f4bf_34b7f97d84b44ab7868db573ab58e00a~mv2.png',
};

const ITEM_SKILL_BY_KEY: Record<string, keyof PlayerSkills> = {
  ring: 'respect',
  bracelet: 'defense',
  chain: 'attack',
  watch: 'intelligence',
  bag: 'respect',
  sunglasses: 'agility',
};

type PlayerSkills = {
  attack: number;
  defense: number;
  intelligence: number;
  agility: number;
  respect: number;
  vigor: number;
};

type TransactionStage = 'idle' | 'approach' | 'accepted' | 'insufficient';

function getFilterByLevel(level: number) {
  const filters = [
    'none',
    'saturate(2) brightness(1.1) contrast(1.3)',
    'saturate(2.2) brightness(1.05) contrast(1.4)',
    'saturate(2.5) brightness(1.2) contrast(1.3)',
    'saturate(2.3) brightness(1.08) contrast(1.35)',
    'saturate(2.4) brightness(1.1) contrast(1.3)',
    'saturate(2.2) brightness(1.12) contrast(1.32)',
    'saturate(2.3) brightness(1.15) contrast(1.28)',
    'saturate(2.4) brightness(1.08) contrast(1.35)',
    'saturate(2.5) brightness(1.06) contrast(1.38)',
    'saturate(2.3) brightness(1.1) contrast(1.36)',
  ];

  const filterIndex = level % filters.length;
  return filters[filterIndex];
}

function getVisualByLevel(level: number) {
  const colors = [
    '#ff3b3b','#cc2f2f','#ff6b3b','#cc552f','#ff9b3b','#cc7a2f','#ffc93b','#cca32f',
    '#f5ff3b','#c3cc2f','#baff3b','#94cc2f','#7dff3b','#64cc2f','#3bff57','#2fcc45',
    '#3bff8c','#2fcc70','#3bffc2','#2fcc9a','#3bfff5','#2fccc3','#3bc7ff','#2fa0cc',
    '#3b8fff','#2f73cc','#3b57ff','#2f45cc','#6b3bff','#552fcc','#9b3bff','#7a2fcc',
    '#c93bff','#a32fcc','#ff3bf5','#cc2fc3','#ff3bc2','#cc2f9a','#ff3b8c','#cc2f70',
    '#ff3b57','#cc2f45','#ff5e3b','#cc4b2f','#ff7a3b','#cc612f','#ff963b','#cc772f',
    '#ffb23b','#cc8f2f','#ffce3b','#cca62f','#ffe93b','#ccb92f','#e1ff3b','#b5cc2f',
    '#c5ff3b','#9dcc2f','#a9ff3b','#85cc2f','#8dff3b','#6dcc2f','#71ff3b','#56cc2f',
    '#55ff3b','#42cc2f','#3bff49','#2fcc3a','#3bff66','#2fcc52','#3bff82','#2fcc69',
    '#3bff9e','#2fcc80','#3bffba','#2fcc97','#3bffd6','#2fccae','#3bfff2','#2fccc6',
    '#3be0ff','#2fb3cc','#3bc4ff','#2f9ecc','#3ba8ff','#2f88cc','#3b8cff','#2f73cc',
    '#3b70ff','#2f5dcc','#3b54ff','#2f47cc','#4f3bff','#3f2fcc','#6b3bff','#552fcc',
    '#873bff','#6a2fcc','#a33bff','#802fcc','#bf3bff','#962fcc','#db3bff','#ac2fcc',
    '#f73bff','#c22fcc','#ff3be7','#cc2fb9','#ff3bcb','#cc2fa3','#ff3baf','#cc2f8c',
    '#ff3b93','#cc2f76','#ff3b77','#cc2f60','#3bf5ff','#2fc3cc','#3be1ff','#2fb4cc',
    '#3bcdff','#2fa4cc'
  ];

  const color = level <= 0 ? '#ffffff' : colors[(level - 1) % 100];

  return {
    glow: `
      drop-shadow(0 0 6px rgba(255,255,255,0.6))
      drop-shadow(0 0 18px ${color})
      drop-shadow(0 0 40px ${color})
    `,
    halo: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
    overlay: `radial-gradient(circle, ${color}55 0%, transparent 60%)`,
    accent: color,
    accentSoft: `${color}55`,
    cardMetal: `linear-gradient(135deg, #ffffff, ${color}, #fff7d3)`,
  };
}

function getBonusByLevel(level: number) {
  if (level < 50) return 1;
  return Number((1 + (level - 50) * 0.1).toFixed(1));
}

function getItemPrice(level: number) {
  const safeLevel = Math.max(1, level || 1);
  return Number((120 * Math.pow(1.1, safeLevel - 1)).toFixed(2));
}

function money(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function LuxoItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const player = usePlayerStore((s) => s.player);
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionStage, setTransactionStage] = useState<TransactionStage>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  // ÚNICA FONTE: playerStore
  const barracoLevel = player.niveis.barracoLevel;
  const cleanMoney = player.balances.cleanMoney;
  const inventoryItems = player.inventory.items;
  const playerName = player.name || 'COMANDANTE';

  const luxurySystem = useMemo(() => getLuxurySystem(barracoLevel), [barracoLevel]);
  const collectionName = luxurySystem?.collectionName || `Coleção ${barracoLevel}`;
  const visual = useMemo(() => getVisualByLevel(barracoLevel), [barracoLevel]);
  const imageFilter = useMemo(() => getFilterByLevel(barracoLevel), [barracoLevel]);

  const itemKey = searchParams.get('item') || 'ring';
  const itemNameFromQuery = searchParams.get('name');

  const currentItem = useMemo(() => {
    const found = luxurySystem.items.find((item: any) => item.key === itemKey);
    const fallbackNameMap: Record<string, string> = {
      ring: 'Anel',
      bracelet: 'Pulseira',
      chain: 'Corrente',
      watch: 'Relógio',
      bag: 'Bolsa',
      sunglasses: 'Óculos',
    };

    const baseBonus = getBonusByLevel(barracoLevel);
    const reducedBonus = getReducedInventoryBonus(baseBonus, player);

    return {
      key: itemKey,
      name: itemNameFromQuery || found?.name || fallbackNameMap[itemKey] || 'Item',
      image: ITEM_IMAGE_BY_KEY[itemKey],
      price: getItemPrice(barracoLevel),
      bonusSkill: ITEM_SKILL_BY_KEY[itemKey] || 'respect',
      bonusValue: reducedBonus,
      id: `luxury-${itemKey}-${barracoLevel}`,
    };
  }, [itemKey, itemNameFromQuery, luxurySystem, barracoLevel, player]);

  const alreadyOwned = inventoryItems.some((item: any) => item?.id === currentItem.id);

  const handleOpenTransaction = () => {
    if (alreadyOwned) {
      setFeedback('Esse item dessa coleção já foi comprado.');
      return;
    }
    setTransactionStage('idle');
    setTransactionOpen(true);
  };

  const handleSimulateCard = () => {
    setTransactionStage('approach');

    window.setTimeout(() => {
      if (cleanMoney < currentItem.price) {
        setTransactionStage('insufficient');
        return;
      }
const newItem = {
        id: currentItem.id,
        category: 'luxury',
        itemType: currentItem.key,
        name: currentItem.name,
        collectionName,
        level: barracoLevel,
        insured: false,
        price: currentItem.price,
        finalPrice: currentItem.price,
        bonusSkill: currentItem.bonusSkill,
        bonusValue: currentItem.bonusValue,
        usable: false,
        createdAt: new Date().toISOString(),
      };

      const currentSkills: PlayerSkills = player?.skills || {
        attack: 0,
        defense: 0,
        intelligence: 0,
        agility: 0,
        respect: 0,
        vigor: 0,
      };

      const updatedPlayer = {
        ...player,
        balances: {
          ...player.balances,
          cleanMoney: Number((cleanMoney - currentItem.price).toFixed(2)),
        },
        inventory: {
          ...player.inventory,
          items: [...inventoryItems, newItem],
        },
        skills: {
          ...currentSkills,
          [currentItem.bonusSkill]: Number(
            ((currentSkills[currentItem.bonusSkill] || 0) + currentItem.bonusValue).toFixed(1)
          ),
        },
      };

      setPlayer(updatedPlayer);
      setTransactionStage('accepted');

      window.setTimeout(() => {
        setTransactionOpen(false);
        setFeedback(`${currentItem.name} comprado com sucesso.`);
      }, 1200);
    }, 1300);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main className="relative min-h-screen pt-24">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${SHOWROOM_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.32)_0%,rgba(0,0,0,0.18)_22%,rgba(0,0,0,0.42)_58%,rgba(0,0,0,0.80)_100%)]" />

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: visual.overlay,
            filter: 'blur(70px)',
            opacity: 0.65,
          }}
        />

        <div className="relative z-10 max-w-[1300px] mx-auto px-4 md:px-8 pb-20">
          {/* TÍTULO */}
          <section className="pt-4 text-center">
            <motion.h1
              className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-[0.18em] text-white"
              initial={{ opacity: 0, y: -18, filter: 'blur(8px)', scale: 1.04 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{
                textShadow: `0 0 18px rgba(255,255,255,0.35), 0 0 36px ${visual.accentSoft}`,
              }}
            >
              {collectionName}
            </motion.h1>

            <motion.p
              className="mt-3 text-xs md:text-sm uppercase tracking-[0.24em] text-white/78"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.18, ease: 'easeOut' }}
            >
              Coleção desbloqueada pelo barraco nível {barracoLevel}
            </motion.p>
          </section>

          {/* VITRINE */}
          <section className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, x: -80, scale: 0.92, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative rounded-[34px] overflow-hidden border border-white/12 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,.38)]"
              style={{ boxShadow: `0 0 28px ${visual.accentSoft}` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${SHOWCASE_BG})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.60))]" />

              <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.32em] text-white/50">Vitrine privada</p>
                    <h2 className="mt-2 text-3xl md:text-4xl font-black uppercase tracking-[0.14em] text-white">
                      {currentItem.name}
                    </h2>
                  </div>

                  <div
                    className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-black"
                    style={{ background: visual.cardMetal }}
                  >
                    Nível {barracoLevel}
                  </div>
                </div>

                <div className="relative mt-8 min-h-[420px] flex items-center justify-center">
                  <div
                    className="absolute w-[280px] h-[280px] rounded-full opacity-50"
                    style={{
                      background: visual.halo,
                      filter: 'blur(28px)',
                    }}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: 30, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                  >
                    <Image
                      src={currentItem.image}
                      alt={currentItem.name}
                      width={420}
                      className="object-contain max-h-[380px]"
                      style={{
                        filter: `${imageFilter} ${visual.glow}`,
                        transition: 'filter 0s',
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

{/* DADOS */}
            <motion.div
              initial={{ opacity: 0, x: 80, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.12 }}
              className="rounded-[30px] border border-white/12 bg-black/62 p-6 md:p-8 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.45)]"
            >
              <p className="text-[10px] uppercase tracking-[0.30em] text-white/42">Apresentação do item</p>

              <h3 className="mt-3 text-2xl md:text-3xl font-black uppercase tracking-[0.14em] text-white">
                {collectionName}
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Bônus individual</p>
                  <p className="mt-2 text-xl font-black" style={{ color: visual.accent }}>
                    +{currentItem.bonusValue}% em {currentItem.bonusSkill}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Valor</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {money(currentItem.price)} Commands Limpo
                  </p>
                  <p className="mt-2 text-xs text-white/52">
                    Valor inicial 120,00 • fórmula 120 × 1.1^(nível - 1)
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Status</p>
                  <p className="mt-2 text-sm text-white/78">
                    {alreadyOwned ? 'Você já possui este item nesta coleção.' : 'Pronto para compra.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3">
                <button
                  onClick={handleOpenTransaction}
                  disabled={alreadyOwned}
                  className="rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-black disabled:opacity-45"
                  style={{
                    background: visual.cardMetal,
                    boxShadow: `0 12px 28px ${visual.accentSoft}`,
                  }}
                >
                  Comprar
                </button>

                <button
                  onClick={() => navigate('/luxuryshowroom')}
                  className="rounded-2xl border border-white/14 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-white"
                >
                  Voltar vitrine
                </button>

                <button
                  onClick={() => navigate('/game')}
                  className="rounded-2xl border border-white/14 bg-black/35 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-white"
                >
                  Voltar game
                </button>
              </div>
            </motion.div>
          </section>
        </div>

        {/* TRANSAÇÃO */}
        <AnimatePresence>
          {transactionOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/84 px-4 backdrop-blur-sm"
            >
              <div className="w-full max-w-[950px] grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -60, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.55 }}
                  className="rounded-[30px] border border-white/12 bg-black/62 p-6 md:p-8 backdrop-blur-xl"
                >
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/42">Transação privada</p>
                  <h2 className="mt-3 text-3xl md:text-4xl font-black text-white">
                    Máquina de cartão
                  </h2>
                  <p className="mt-4 text-base text-white/74 leading-relaxed">
                    Confirme a compra de <span style={{ color: visual.accent }}>{currentItem.name}</span>.
                  </p>

                  <div className="mt-6 rounded-[28px] border border-white/12 bg-white/5 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Portador do cartão</p>
                        <p className="mt-2 text-2xl font-black uppercase tracking-[0.16em] text-white">
                          {playerName}
                        </p>
                      </div>

                      <div
                        className="h-14 w-20 rounded-2xl"
                        style={{
                          background: visual.cardMetal,
                          boxShadow: `0 0 20px ${visual.accentSoft}`,
                        }}
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/42">Item</p>
                        <p className="mt-2 text-xl font-black text-white">{currentItem.name}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/42">Valor</p>
                        <p className="mt-2 text-xl font-black" style={{ color: visual.accent }}>
                          {money(currentItem.price)} Commands
                        </p>
                      </div>
                    </div>

 <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
                      {transactionStage === 'idle' && (
                        <p className="text-lg font-black uppercase tracking-[0.18em] text-white">
                          Aproxime o cartão
                        </p>
                      )}

                      {transactionStage === 'approach' && (
                        <motion.p
                          animate={{ opacity: [0.45, 1, 0.45] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="text-lg font-black uppercase tracking-[0.18em]"
                          style={{ color: visual.accent }}
                        >
                          Lendo cartão...
                        </motion.p>
                      )}

                      {transactionStage === 'accepted' && (
                        <p className="text-lg font-black uppercase tracking-[0.18em] text-emerald-400">
                          Transação aceita
                        </p>
                      )}

                      {transactionStage === 'insufficient' && (
                        <p className="text-lg font-black uppercase tracking-[0.18em] text-red-400">
                          Saldo insuficiente
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSimulateCard}
                        disabled={transactionStage === 'approach' || transactionStage === 'accepted'}
                        className="flex-1 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-black disabled:opacity-45"
                        style={{
                          background: visual.cardMetal,
                          boxShadow: `0 12px 28px ${visual.accentSoft}`,
                        }}
                      >
                        Aproximar cartão
                      </button>

                      <button
                        onClick={() => setTransactionOpen(false)}
                        className="flex-1 rounded-2xl border border-white/14 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* MAQUININHA */}
                <motion.div
                  initial={{ opacity: 0, x: 60, scale: 0.92, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.55 }}
                  className="relative mx-auto w-full max-w-[420px]"
                >
                  <div className="rounded-[34px] border border-white/14 bg-[linear-gradient(180deg,#101010_0%,#181818_35%,#0a0a0a_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                    <div className="rounded-[22px] border border-white/10 bg-black/45 p-4">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/42">terminal</p>
                      <div className="mt-3 h-24 rounded-2xl border border-white/8 bg-black/60 flex items-center justify-center">
                        {transactionStage === 'idle' && (
                          <span className="text-sm font-black uppercase tracking-[0.18em] text-white/88">
                            aproxime o cartão
                          </span>
                        )}
                        {transactionStage === 'approach' && (
                          <motion.span
                            animate={{ opacity: [0.45, 1, 0.45] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-sm font-black uppercase tracking-[0.18em]"
                            style={{ color: visual.accent }}
                          >
                            processando...
                          </motion.span>
                        )}
                        {transactionStage === 'accepted' && (
                          <span className="text-sm font-black uppercase tracking-[0.18em] text-emerald-400">
                            transação aceita
                          </span>
                        )}
                        {transactionStage === 'insufficient' && (
                          <span className="text-sm font-black uppercase tracking-[0.18em] text-red-400">
                            saldo insuficiente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <div key={n} className="h-12 rounded-xl border border-white/10 bg-white/5" />
                      ))}
                    </div>

                    <div className="mt-5 rounded-[24px] border border-white/12 bg-white/5 p-5">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-white/42">Cartão gamer</p>

                      <motion.div
                        animate={
                          transactionStage === 'approach'
                            ? { y: [0, -10, 6, -4, 0], rotate: [0, -3, 3, -2, 0] }
                            : {}
                        }
                        transition={{ duration: 1.1 }}
                        className="mt-4 rounded-[24px] border border-white/12 p-5"
                        style={{
                          background: visual.cardMetal,
                          boxShadow: `0 12px 28px ${visual.accentSoft}`,
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.3em] text-black/70">holder</p>
                        <p className="mt-2 text-2xl font-black uppercase tracking-[0.16em] text-black">
                          {playerName}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEEDBACK */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10030] w-[92%] max-w-[760px] rounded-[24px] border border-white/12 bg-black/75 px-5 py-4 text-center text-sm md:text-base text-white/92 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            >
              {feedback}
              <button
                onClick={() => setFeedback(null)}
                className="ml-4 text-white/60 hover:text-white"
              >
                fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}