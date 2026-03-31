import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import LuxuryNPC from '@/components/LuxuryNPC';
import { getLuxurySystem } from '@/data/luxoItems';

const SHOWROOM_BG =
  'https://static.wixstatic.com/media/50f4bf_58cda01923cf4acda15fa4b54cebc965~mv2.png';

const SHOWCASE_BG =
  'https://static.wixstatic.com/media/50f4bf_bc5d38e571e7424f8ad8a566beb55dc1~mv2.png';

const ITEM_IMAGE_BY_INDEX = [
  'https://static.wixstatic.com/media/50f4bf_651d1089b4f94751b866a45cbd902243~mv2.png',
  'https://static.wixstatic.com/media/50f4bf_44c2d719e7974529b9e0eea26dc937fa~mv2.png',
  'https://static.wixstatic.com/media/50f4bf_95112066aaa34deba75e3955a7a9198b~mv2.png',
  'https://static.wixstatic.com/media/50f4bf_9589a22c92ea41d0a4d64f480b077d89~mv2.png',
  'https://static.wixstatic.com/media/50f4bf_0ed2c4ee08714e1b923b1e2def99fce9~mv2.png',
  'https://static.wixstatic.com/media/50f4bf_34b7f97d84b44ab7868db573ab58e00a~mv2.png',
];

const ITEM_KEY_BY_INDEX = ['ring', 'bracelet', 'chain', 'watch', 'bag', 'sunglasses'] as const;

const ITEM_SKILL_BY_KEY = {
  ring: 'respect',
  bracelet: 'defense',
  chain: 'attack',
  watch: 'intelligence',
  bag: 'respect',
  sunglasses: 'agility',
} as const;

type SkillKey = 'attack' | 'defense' | 'intelligence' | 'agility' | 'respect' | 'vigor';

function getBonusByLevel(level: number) {
  if (level < 50) return 1;
  return Number((1 + (level - 50) * 0.1).toFixed(1));
}

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
    '#ff3b3b','#cc2f2f',
    '#ff6b3b','#cc552f',
    '#ff9b3b','#cc7a2f',
    '#ffc93b','#cca32f',
    '#f5ff3b','#c3cc2f',
    '#baff3b','#94cc2f',
    '#7dff3b','#64cc2f',
    '#3bff57','#2fcc45',
    '#3bff8c','#2fcc70',
    '#3bffc2','#2fcc9a',
    '#3bfff5','#2fccc3',
    '#3bc7ff','#2fa0cc',
    '#3b8fff','#2f73cc',
    '#3b57ff','#2f45cc',
    '#6b3bff','#552fcc',
    '#9b3bff','#7a2fcc',
    '#c93bff','#a32fcc',
    '#ff3bf5','#cc2fc3',
    '#ff3bc2','#cc2f9a',
    '#ff3b8c','#cc2f70',
    '#ff3b57','#cc2f45',
    '#ff5e3b','#cc4b2f',
    '#ff7a3b','#cc612f',
    '#ff963b','#cc772f',
    '#ffb23b','#cc8f2f',
    '#ffce3b','#cca62f',
    '#ffe93b','#ccb92f',
    '#e1ff3b','#b5cc2f',
    '#c5ff3b','#9dcc2f',
    '#a9ff3b','#85cc2f',
    '#8dff3b','#6dcc2f',
    '#71ff3b','#56cc2f',
    '#55ff3b','#42cc2f',
    '#3bff49','#2fcc3a',
    '#3bff66','#2fcc52',
    '#3bff82','#2fcc69',
    '#3bff9e','#2fcc80',
    '#3bffba','#2fcc97',
    '#3bffd6','#2fccae',
    '#3bfff2','#2fccc6',
    '#3be0ff','#2fb3cc',
    '#3bc4ff','#2f9ecc',
    '#3ba8ff','#2f88cc',
    '#3b8cff','#2f73cc',
    '#3b70ff','#2f5dcc',
    '#3b54ff','#2f47cc',
    '#4f3bff','#3f2fcc',
    '#6b3bff','#552fcc',
    '#873bff','#6a2fcc',
    '#a33bff','#802fcc',
    '#bf3bff','#962fcc',
    '#db3bff','#ac2fcc',
    '#f73bff','#c22fcc',
    '#ff3be7','#cc2fb9',
    '#ff3bcb','#cc2fa3',
    '#ff3baf','#cc2f8c',
    '#ff3b93','#cc2f76',
    '#ff3b77','#cc2f60',
    '#ff3b5b','#cc2f4a',
    '#ff3b3f','#cc2f34',
    '#ff4a3b','#cc3b2f',
    '#ff5e3b','#cc4b2f',
    '#ff723b','#cc5b2f',
    '#ff863b','#cc6c2f',
    '#ff9a3b','#cc7c2f',
    '#ffae3b','#cc8d2f',
    '#ffc23b','#cc9d2f',
    '#ffd63b','#ccae2f',
    '#ffea3b','#ccbe2f',
    '#e9ff3b','#bacc2f',
    '#d5ff3b','#aacc2f',
    '#c1ff3b','#9acc2f',
    '#adff3b','#8acc2f',
    '#99ff3b','#7acc2f',
    '#85ff3b','#6acc2f',
    '#71ff3b','#5acc2f',
    '#5dff3b','#4acc2f',
    '#49ff3b','#3acc2f',
    '#3bff45','#2fcc38',
    '#3bff5a','#2fcc49',
    '#3bff6f','#2fcc59',
    '#3bff84','#2fcc6a',
    '#3bff99','#2fcc7a',
    '#3bffae','#2fcc8b',
    '#3bffc3','#2fcc9c',
    '#3bffd8','#2fccac',
    '#3bffed','#2fccbd',
    '#3bf5ff','#2fc3cc',
    '#3be1ff','#2fb4cc',
    '#3bcdff','#2fa4cc'
  ];

  if (level <= 0) {
    return {
      glow: 'none',
      halo: 'none',
      overlay: 'none',
      accent: '#ffffff',
      accentSoft: 'rgba(255,255,255,0.18)',
      cardMetal: 'linear-gradient(135deg, #ffffff, #f2f2f2, #fff7d3)',
    };
  }

  const color = colors[(level - 1) % 100];

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

function money(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
export default function LuxuryShowroomPage() {
  const navigate = useNavigate();
  const { player, setPlayer, isLoaded, loadPlayer } = usePlayerStore();

  const [npcLoaded, setNpcLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [flash, setFlash] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [farewell, setFarewell] = useState(false);
  const [farewellEmoji, setFarewellEmoji] = useState<'😘' | '👍' | null>(null);

  useEffect(() => {
    if (!isLoaded) loadPlayer();
  }, [isLoaded, loadPlayer]);

  const playerName = player?.name || 'COMANDANTE';
  const barracoLevel = player?.niveis?.barracoLevel || 1;
  const cleanMoney = player?.balances?.cleanMoney || 0;
  const inventoryItems = player?.inventory?.items || [];
  const skills = player?.skills || {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  };

  const system = useMemo(() => getLuxurySystem(barracoLevel), [barracoLevel]);
  const visual = useMemo(() => getVisualByLevel(barracoLevel), [barracoLevel]);
  const levelFilter = useMemo(() => getFilterByLevel(barracoLevel), [barracoLevel]);
  const collectionName = system?.collectionName || `Nível ${barracoLevel}`;

  useEffect(() => {
    if (!npcLoaded || showCollection) return;
    const timer = window.setTimeout(() => {
      setDialogOpen(true);
    }, 850);

    return () => window.clearTimeout(timer);
  }, [npcLoaded, showCollection]);

  const items = useMemo(() => {
    return (system?.items || []).map((item: any, index: number) => {
      const itemKey = ITEM_KEY_BY_INDEX[index];
      const bonusSkill = ITEM_SKILL_BY_KEY[itemKey] as SkillKey;
      const bonusValue = getBonusByLevel(barracoLevel);

      return {
        id: `${itemKey}-${barracoLevel}`,
        key: itemKey,
        name: item.name,
        displayName: item.name.split(' ')[0],
        price: Number(item.price || 0),
        image: ITEM_IMAGE_BY_INDEX[index],
        level: barracoLevel,
        bonusSkill,
        bonusValue,
      };
    });
  }, [system, barracoLevel]);

  const leftItems = items.slice(0, 3);
  const rightItems = items.slice(3, 6);
  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  const dialogMessage = `Bem-vindo, ${playerName}. A coleção ${collectionName} já está separada pra você. Aqui não se compra só peça. Aqui se compra presença.`;

  const closeIntroAndShowCollection = () => {
    setDialogOpen(false);

    window.setTimeout(() => {
      setShowCollection(true);
    }, 220);
  };

  const openTransaction = (index: number) => {
    setSelectedIndex(index);
    setShowCard(true);
  };

  const confirmBuy = (insured: boolean) => {
    if (!selectedItem || !player) return;

    const alreadyOwned = inventoryItems.some((item: any) => item?.id === selectedItem.id);

    if (alreadyOwned) {
      setShowCard(false);
      setFeedback('Essa peça dessa coleção já foi comprada.');
      return;
    }

    const finalPrice = insured
      ? Number((selectedItem.price * 1.1).toFixed(2))
      : selectedItem.price;

    if (cleanMoney < finalPrice) {
      setShowCard(false);
      setFeedback('Commands Limpo insuficiente para essa compra.');
      return;
    }

    const newItem = {
      id: selectedItem.id,
      category: 'luxury',
      itemType: selectedItem.key,
      name: selectedItem.name,
      collectionName,
      level: barracoLevel,
      insured,
      price: selectedItem.price,
      finalPrice,
      bonusSkill: selectedItem.bonusSkill,
      bonusValue: selectedItem.bonusValue,
      usable: false,
      couponUnlocked: false,
      createdAt: new Date().toISOString(),
    };

    const updatedPlayer = {
      ...player,
      balances: {
        ...player.balances,
        cleanMoney: Number((cleanMoney - finalPrice).toFixed(2)),
      },
      inventory: {
        ...player.inventory,
        items: [...inventoryItems, newItem],
      },
      skills: {
        ...skills,
        [selectedItem.bonusSkill]: Number(
          ((skills[selectedItem.bonusSkill] || 0) + selectedItem.bonusValue).toFixed(1)
        ),
      },
    };

    setPlayer(updatedPlayer);
    setShowCard(false);
    setFlash(true);

    const emoji = Math.random() > 0.5 ? '😘' : '👍';
    setFarewellEmoji(emoji);
    setFarewell(true);

    setFeedback(
      insured
        ? `${selectedItem.displayName} comprado com seguro. +${selectedItem.bonusValue}% em ${selectedItem.bonusSkill}.`
        : `${selectedItem.displayName} comprado. +${selectedItem.bonusValue}% em ${selectedItem.bonusSkill}.`
    );

    window.setTimeout(() => setFlash(false), 500);
    window.setTimeout(() => navigate('/game'), 2400);
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

        <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.15)_18%,rgba(0,0,0,0.32)_48%,rgba(0,0,0,0.74)_100%)]" />

        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: visual.overlay,
            filter: 'blur(80px)',
            opacity: 0.65,
          }}
        />

        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-[120] pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${visual.accentSoft}, transparent 58%)`,
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 max-w-[1650px] mx-auto px-4 md:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="pt-4 text-center"
          >
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-[0.18em]"
              style={{
                textShadow: `0 0 16px rgba(255,255,255,0.18), 0 0 38px ${visual.accentSoft}`,
              }}
            >
              Luxury Showroom
            </h1>

            <p className="mt-3 text-xs md:text-sm uppercase tracking-[0.22em] text-white/70">
              {collectionName}
            </p>

            <p className="mt-2 text-[11px] md:text-xs uppercase tracking-[0.2em] text-white/45">
              Barraco nível {barracoLevel} • Commands Limpo {money(cleanMoney)}
            </p>
          </motion.div>
{!showCollection && (
            <section className="relative mt-6 min-h-[720px] md:min-h-[760px]">
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                <div
                  className="h-12 w-[220px] rounded-full blur-2xl opacity-80"
                  style={{
                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.65), transparent 72%)',
                    transform: 'translateY(28px)',
                  }}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 120, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-1/2 bottom-[34px] -translate-x-1/2 z-30 flex flex-col items-center"
              >
                <div
                  className="absolute -inset-10 rounded-full blur-3xl opacity-45"
                  style={{ background: visual.halo }}
                />

                <div className="relative h-[360px] w-[260px] md:h-[470px] md:w-[320px] lg:h-[560px] lg:w-[360px] flex items-end justify-center">
                  <LuxuryNPC onNPCLoaded={() => setNpcLoaded(true)} />
                </div>
              </motion.div>

              <AnimatePresence>
                {dialogOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="absolute left-1/2 top-[40px] z-40 w-[92%] max-w-[760px] -translate-x-1/2"
                  >
                    <div className="rounded-[28px] border border-white/12 bg-black/72 px-5 py-5 md:px-7 md:py-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                        Atendimento Privado
                      </p>

                      <h2 className="mt-2 text-lg md:text-2xl font-black uppercase tracking-[0.16em] text-white">
                        Boa noite, {playerName}
                      </h2>

                      <p className="mt-3 text-sm md:text-base leading-relaxed text-white/82">
                        {dialogMessage}
                      </p>

                      <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={closeIntroAndShowCollection}
                          className="flex-1 rounded-2xl py-3 text-sm md:text-base font-black uppercase tracking-[0.18em] text-black"
                          style={{
                            background: visual.cardMetal,
                            boxShadow: `0 12px 30px ${visual.accentSoft}`,
                          }}
                        >
                          Ver coleção
                        </button>

                        <button
                          onClick={() => setDialogOpen(false)}
                          className="flex-1 rounded-2xl border border-white/18 bg-white/5 py-3 text-sm md:text-base font-black uppercase tracking-[0.18em] text-white"
                        >
                          Depois
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          <AnimatePresence>
            {showCollection && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55 }}
                className="mt-10"
              >
                <div className="hidden xl:grid xl:grid-cols-[1fr_420px_1fr] gap-8 items-start min-h-[780px]">
                  {/* LEFT */}
                  <div className="grid gap-6 pt-12">
                    {leftItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -180, scale: 0.82, rotate: -6, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, scale: 1, rotate: 0, filter: 'blur(0px)' }}
                        transition={{ delay: index * 0.11, duration: 0.62, ease: 'easeOut' }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative rounded-[30px] overflow-hidden border border-white/12 bg-black/45 shadow-[0_18px_50px_rgba(0,0,0,.35)]"
                        style={{ boxShadow: `0 0 30px ${visual.accentSoft}` }}
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
                        <div className="relative z-10 p-5">
                          <CardContent
                            item={item}
                            visual={visual}
                            onBuy={() => openTransaction(index)}
                            alreadyOwned={inventoryItems.some((inv: any) => inv?.id === item.id)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* CENTER */}
                  <div className="relative flex flex-col items-center pt-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.75 }}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className="absolute bottom-[-10px] h-10 w-[210px] rounded-full blur-2xl"
                        style={{
                          background: 'radial-gradient(ellipse, rgba(0,0,0,.62), transparent 72%)',
                        }}
                      />
                      <div
                        className="absolute -inset-10 rounded-full blur-3xl opacity-40"
                        style={{ background: visual.halo }}
                      />
                      <div className="relative h-[560px] w-[360px] flex items-end justify-center">
                        <LuxuryNPC />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.55 }}
                      className="mt-3 rounded-[28px] border border-white/12 bg-black/60 px-6 py-5 text-center backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.45)]"
                    >
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                        Atendimento Privado
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-white/88">
                        Cada peça da <span style={{ color: visual.accent }}>{collectionName}</span> puxa
                        presença, ego e porcentagem real. Fecha a coleção e vira referência.
                      </p>
                    </motion.div>
                  </div>

                  {/* RIGHT */}
                  <div className="grid gap-6 pt-12">
                    {rightItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 180, scale: 0.82, rotate: 6, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, scale: 1, rotate: 0, filter: 'blur(0px)' }}
                        transition={{ delay: index * 0.11, duration: 0.62, ease: 'easeOut' }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative rounded-[30px] overflow-hidden border border-white/12 bg-black/45 shadow-[0_18px_50px_rgba(0,0,0,.35)]"
                        style={{ boxShadow: `0 0 30px ${visual.accentSoft}` }}
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
                        <div className="relative z-10 p-5">
                          <CardContent
                            item={item}
                            visual={visual}
                            onBuy={() => openTransaction(index + 3)}
                            alreadyOwned={inventoryItems.some((inv: any) => inv?.id === item.id)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* MOBILE / TABLET */}
                <div className="xl:hidden">
                  <div className="relative flex flex-col items-center pt-2">
                    <div
                      className="absolute bottom-[2px] h-10 w-[170px] rounded-full blur-2xl"
                      style={{
                        background: 'radial-gradient(ellipse, rgba(0,0,0,.60), transparent 72%)',
                      }}
                    />
                    <div className="relative h-[320px] w-[240px] md:h-[420px] md:w-[300px] flex items-end justify-center">
                      <LuxuryNPC />
                    </div>

                    <div className="mt-3 rounded-[24px] border border-white/12 bg-black/60 px-5 py-4 text-center backdrop-blur-xl">
                      <p className="text-sm text-white/90">
                        Coleção <span style={{ color: visual.accent }}>{collectionName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.08, duration: 0.45 }}
                        className="relative rounded-[26px] overflow-hidden border border-white/12 bg-black/45"
                        style={{ boxShadow: `0 0 24px ${visual.accentSoft}` }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${SHOWCASE_BG})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,.58))]" />
                        <div className="relative z-10 p-5">
                          <CardContent
                            item={item}
                            visual={visual}
                            onBuy={() => openTransaction(index)}
                            alreadyOwned={inventoryItems.some((inv: any) => inv?.id === item.id)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCard && selectedItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/82 px-4 backdrop-blur-sm"
              >
                <div className="relative flex w-full max-w-[1100px] flex-col items-center justify-center gap-10 lg:flex-row">
                  <motion.div
                    initial={{ x: -120, opacity: 0, rotate: -8 }}
                    animate={{ x: 0, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="max-w-md text-center lg:text-left"
                  >
                    <p className="text-[11px] uppercase tracking-[0.38em] text-white/45">
                      Transação privada
                    </p>

                    <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                      Confirmando sua compra
                    </h2>

                    <p className="mt-4 text-base leading-relaxed text-white/72">
                      Commands Limpo virando presença. Presença virando poder.
                    </p>

                    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-white/60">Item selecionado</p>
                      <p className="mt-2 text-2xl font-black text-white">{selectedItem.displayName}</p>
                      <p className="mt-2 text-lg font-black" style={{ color: visual.accent }}>
                        {money(selectedItem.price)} Commands
                      </p>
                      <p className="mt-2 text-sm text-white/72">
                        Bônus: +{selectedItem.bonusValue}% em {selectedItem.bonusSkill}
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => confirmBuy(false)}
                        className="rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-black"
                        style={{
                          background: visual.cardMetal,
                          boxShadow: `0 12px 30px ${visual.accentSoft}`,
                        }}
                      >
                        Comprar
                      </button>

                      <button
                        onClick={() => confirmBuy(true)}
                        className="rounded-2xl border border-white/15 bg-white/6 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white"
                      >
                        Comprar + Seguro
                      </button>

                      <button
                        onClick={() => setShowCard(false)}
                        className="sm:col-span-2 rounded-2xl border border-white/12 bg-black/35 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white/80"
                      >
                        cancelar
                      </button>
                    </div>
                  </motion.div>
<motion.div
                    initial={{ scale: 0.88, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="relative"
                  >
                    <motion.div
                      animate={{ rotateY: [0, 8, -8, 0], rotateX: [0, 2, -2, 0], y: [0, -5, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative h-[235px] w-[390px] overflow-hidden rounded-[30px] border border-white/15 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                      style={{
                        background: 'linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 24%,#2e2208 58%,#0e0e0e 100%)',
                        perspective: '1000px',
                      }}
                    >
                      <div className="absolute inset-0 opacity-70">
                        <div className="absolute -left-20 top-0 h-52 w-52 rounded-full bg-yellow-400/10 blur-3xl" />
                        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
                        <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
                      </div>

                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.44em] text-white/45">
                              Private Access
                            </p>
                            <p className="mt-2 text-xl font-black text-white">Noir Reserve</p>
                          </div>

                          <div className="flex flex-col items-end">
                            <div
                              className="h-11 w-16 rounded-xl"
                              style={{
                                background: visual.cardMetal,
                                boxShadow: `0 0 18px ${visual.accentSoft}`,
                              }}
                            />
                            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/35">
                              Secure
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-5 flex items-center gap-2">
                            {[0, 1, 2, 3].map((n) => (
                              <span
                                key={n}
                                className="h-2.5 w-12 rounded-full bg-white/70"
                                style={{ opacity: 0.9 - n * 0.18 }}
                              />
                            ))}
                          </div>

                          <p className="text-[11px] uppercase tracking-[0.36em] text-white/45">
                            Portador
                          </p>
                          <p className="mt-1 text-xl font-black uppercase tracking-[0.18em] text-white">
                            {playerName}
                          </p>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                              Valor
                            </p>
                            <p className="mt-1 text-lg font-black" style={{ color: visual.accent }}>
                              {money(selectedItem.price)} Cmds
                            </p>
                          </div>

                          <motion.div
                            animate={{ opacity: [0.55, 1, 0.55] }}
                            transition={{ duration: 1.1, repeat: Infinity }}
                            className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white"
                          >
                            validando
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.82, 0.2] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="pointer-events-none absolute inset-0 rounded-[32px]"
                      style={{
                        boxShadow: `0 0 70px ${visual.accentSoft}, 0 0 130px rgba(255,77,154,.12)`,
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {farewell && farewellEmoji && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="fixed inset-0 z-[10030] pointer-events-none flex items-center justify-center"
              >
                <div className="rounded-full border border-white/12 bg-black/60 px-8 py-6 text-center shadow-[0_0_50px_rgba(255,255,255,0.15)] backdrop-blur-xl">
                  <div className="text-5xl">{farewellEmoji}</div>
                  <p className="mt-3 text-sm uppercase tracking-[0.22em] text-white/88">
                    Volta pro jogo, chefe
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10025] w-[92%] max-w-[760px] rounded-[24px] border border-white/12 bg-black/75 px-5 py-4 text-center text-sm md:text-base text-white/92 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              >
                {feedback}
                <button
                  onClick={() => setFeedback(null)}
                  className="ml-4 text-white/55 hover:text-white"
                >
                  fechar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CardContent({
  item,
  visual,
  onBuy,
  alreadyOwned,
}: {
  item: any;
  visual: any;
  onBuy: () => void;
  alreadyOwned: boolean;
}) {
  return (
    <>
      <div className="flex justify-between items-start gap-3">
        <div
          className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-black"
          style={{ background: visual.cardMetal }}
        >
          Nível {item.level}
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Bônus</p>
          <p className="mt-1 text-sm font-black" style={{ color: visual.accent }}>
            +{item.bonusValue}%
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-center h-[220px]">
        <div
          className="absolute w-[200px] h-[200px] rounded-full blur-3xl opacity-45"
          style={{ background: visual.halo }}
        />
        <Image
          src={item.image}
          alt={item.displayName}
          width={230}
          className="relative object-contain max-h-[210px]"
          style={{
            filter: `${getFilterByLevel(item.level)} ${visual.glow}`,
            transition: 'filter 0s',
          }}
        />
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-black uppercase tracking-[0.16em] text-white">
          {item.displayName}
        </h3>

        <p className="mt-2 text-sm text-white/78">
          +{item.bonusValue}% em {item.bonusSkill}
        </p>

        <p className="mt-2 text-sm font-bold text-white">
          {money(item.price)} Commands Limpo
        </p>

        {alreadyOwned ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/12 px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-emerald-300">
            Comprado
          </div>
        ) : (
          <button
            onClick={onBuy}
            className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.02]"
            style={{
              background: visual.cardMetal,
              boxShadow: `0 12px 28px ${visual.accentSoft}`,
            }}
          >
            Comprar
          </button>
        )}
      </div>
    </>
  );
}