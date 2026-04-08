import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { getLuxurySystem } from '@/data/luxoItems';
import { getReducedInventoryBonus } from '@/utils/inventoryBonus';

const SHOWROOM_BG =
  'https://static.wixstatic.com/media/50f4bf_58cda01923cf4acda15fa4b54cebc965~mv2.png';

const SHOWCASE_BG =
  'https://static.wixstatic.com/media/50f4bf_bc5d38e571e7424f8ad8a566beb55dc1~mv2.png';

type TransactionStage = 'idle' | 'approach' | 'accepted' | 'insufficient';

function money(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const safeHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const num = parseInt(safeHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LuxoItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const player = usePlayerStore((s) => s.player);
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionStage, setTransactionStage] = useState<TransactionStage>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  const barracoLevel = player.niveis.barracoLevel;
  const cleanMoney = player.balances.cleanMoney;
  const inventoryItems = player.inventory.items;
  const playerName = player.name || 'COMANDANTE';

  const itemKey = searchParams.get('item') || 'ring';
  const itemNameFromQuery = searchParams.get('name');

  const luxurySystem = useMemo(() => getLuxurySystem(barracoLevel), [barracoLevel]);

  const currentItem = useMemo(() => {
    const found = luxurySystem.items.find((item: any) => item.key === itemKey) || luxurySystem.items[0];

    const adjustedBonus = getReducedInventoryBonus(found.bonusValue, player);

    return {
      ...found,
      name: itemNameFromQuery || found.name,
      bonusValue: adjustedBonus,
      bonusSkill: found.skill,
      id: `luxury-${found.key}-${luxurySystem.level}`,
    };
  }, [itemKey, itemNameFromQuery, luxurySystem, player]);

  const alreadyOwned = inventoryItems.some((item: any) => item?.id === currentItem.id);
  const hasEnoughMoney = cleanMoney >= currentItem.price;

  const accent = luxurySystem.accentColor || '#ffd700';
  const theme = luxurySystem.themeColor || '#ffffff';
  const glow = luxurySystem.glowColor || '#ffffff';
  const textColor = luxurySystem.textColor || '#ffffff';

  const cardBorder = hexToRgba(accent, 0.35);
  const softAccent = hexToRgba(accent, 0.18);
  const hardAccent = hexToRgba(accent, 0.5);
  const glowSoft = `drop-shadow(0 0 8px ${hexToRgba(glow, 0.55)}) drop-shadow(0 0 22px ${hexToRgba(accent, 0.45)})`;
  const imageHalo = `radial-gradient(circle, ${hexToRgba(glow, 0.22)} 0%, ${hexToRgba(
    accent,
    0.12
  )} 30%, transparent 72%)`;

  useEffect(() => {
    if (!feedback) return;

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleOpenTransaction = () => {
    if (alreadyOwned) {
      setFeedback('Esse item dessa coleção já foi comprado.');
      return;
    }

    if (!hasEnoughMoney) {
      setFeedback('Você não tem Commands Limpo suficiente para essa compra.');
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
        collectionName: luxurySystem.collectionName,
        level: luxurySystem.level,
        insured: false,
        price: currentItem.price,
        finalPrice: currentItem.price,
        bonusSkill: currentItem.bonusSkill,
        bonusValue: currentItem.bonusValue,
        usable: false,
        createdAt: new Date().toISOString(),
        frameStyle: currentItem.frameStyle,
        themeColor: currentItem.themeColor,
        accentColor: currentItem.accentColor,
        glowColor: currentItem.glowColor,
      };

      setPlayer({
        balances: {
          ...player.balances,
          cleanMoney: Number((cleanMoney - currentItem.price).toFixed(2)),
        },
        inventory: {
          ...player.inventory,
          items: [...inventoryItems, newItem],
        },
      });

      setTransactionStage('accepted');

      window.setTimeout(() => {
        setTransactionOpen(false);
        setFeedback(`${currentItem.name} comprado com sucesso.`);
      }, 1200);
    }, 1300);
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: `${luxurySystem.background}, url(${SHOWROOM_BG})`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundBlendMode: 'screen, normal',
      }}
    >
      <Header />

      <main className="relative mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-7xl flex-col px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className="mb-2 text-xs font-black uppercase tracking-[0.28em]"
              style={{ color: textColor }}
            >
              {luxurySystem.collectionName}
            </p>

            <h1 className="text-3xl font-black uppercase md:text-5xl">
              Vitrine privada
            </h1>

            <p className="mt-2 text-sm text-white/75 md:text-base">
              Coleção desbloqueada pelo barraco nível {luxurySystem.level}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/luxuryshowroom')}
              className="rounded-2xl border bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
              style={{ borderColor: cardBorder }}
            >
              Voltar vitrine
            </button>

            <button
              onClick={() => navigate('/game')}
              className="rounded-2xl border bg-black/35 px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-black/55"
              style={{ borderColor: cardBorder }}
            >
              Voltar game
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-[28px] border bg-black/40 p-5 md:p-7"
            style={{
              borderColor: cardBorder,
              boxShadow: `0 0 0 1px ${softAccent}, 0 18px 80px ${hexToRgba(accent, 0.16)}`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background: `
                  radial-gradient(circle at 18% 16%, ${hexToRgba(glow, 0.18)} 0%, transparent 22%),
                  radial-gradient(circle at 82% 14%, ${hexToRgba(accent, 0.15)} 0%, transparent 24%),
                  linear-gradient(180deg, ${hexToRgba(theme, 0.05)} 0%, transparent 100%)
                `,
              }}
            />

            <div className="relative mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                  Apresentação do item
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase md:text-4xl">
                  {currentItem.name}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Nível {luxurySystem.level}
                </p>
              </div>

              <div
                className="rounded-2xl border px-4 py-3 text-right"
                style={{
                  borderColor: hardAccent,
                  background: hexToRgba(accent, 0.1),
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                  Coleção
                </p>
                <p className="mt-1 text-sm font-black uppercase" style={{ color: textColor }}>
                  {luxurySystem.collectionName}
                </p>
              </div>
            </div>

            <div
              className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-[28px] border"
              style={{
                borderColor: cardBorder,
                backgroundImage: `url(${SHOWCASE_BG}), linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.9))`,
                backgroundSize: 'cover, cover',
                backgroundPosition: 'center, center',
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                style={{ background: imageHalo }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
                style={{ filter: glowSoft }}
              >
                <Image
                  src={currentItem.image}
                  alt={currentItem.name}
                  className="h-[280px] w-[280px] object-contain md:h-[360px] md:w-[360px]"
                />
              </motion.div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
            className="flex flex-col gap-4"
          >
            <div
              className="rounded-[28px] border bg-black/40 p-5 md:p-6"
              style={{
                borderColor: cardBorder,
                boxShadow: `0 18px 60px ${hexToRgba(accent, 0.12)}`,
              }}
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                Bônus individual
              </p>
              <h3 className="mt-3 text-3xl font-black" style={{ color: textColor }}>
                +{currentItem.bonusValue}% em {currentItem.bonusSkill}
              </h3>
              <p className="mt-3 text-sm text-white/65">
                O bônus aplicado já considera a redução por excesso de inventário.
              </p>
            </div>

            <div
              className="rounded-[28px] border bg-black/40 p-5 md:p-6"
              style={{ borderColor: cardBorder }}
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                Valor
              </p>
              <h3 className="mt-3 text-3xl font-black">{money(currentItem.price)} Commands Limpo</h3>
              <p className="mt-3 text-sm text-white/65">
                Valor com base na coleção atual e no multiplicador específico do item.
              </p>
            </div>

            <div
              className="rounded-[28px] border bg-black/40 p-5 md:p-6"
              style={{ borderColor: cardBorder }}
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                Status
              </p>
              <p className="mt-3 text-base font-semibold text-white">
                {alreadyOwned
                  ? 'Você já possui este item nesta coleção.'
                  : hasEnoughMoney
                  ? 'Pronto para compra.'
                  : 'Saldo insuficiente para compra.'}
              </p>

              <button
                onClick={handleOpenTransaction}
                disabled={alreadyOwned || !hasEnoughMoney}
                className="mt-5 w-full rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-white transition disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(
                    theme,
                    0.85
                  )} 100%)`,
                  boxShadow: `0 10px 30px ${hexToRgba(accent, 0.35)}`,
                }}
              >
                {alreadyOwned ? 'Já comprado' : !hasEnoughMoney ? 'Saldo insuficiente' : 'Comprar'}
              </button>
            </div>
          </motion.aside>
        </div>
      </main>

      <AnimatePresence>
        {transactionOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border bg-[#0c0c0f]"
              style={{
                borderColor: hardAccent,
                boxShadow: `0 20px 80px ${hexToRgba(accent, 0.32)}`,
              }}
            >
              <div
                className="p-6"
                style={{
                  background: `
                    radial-gradient(circle at 20% 20%, ${hexToRgba(glow, 0.18)} 0%, transparent 25%),
                    linear-gradient(180deg, ${hexToRgba(accent, 0.12)} 0%, rgba(0,0,0,0) 100%)
                  `,
                }}
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                  Transação privada
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase">Máquina de cartão</h2>

                <p className="mt-3 text-sm text-white/70">
                  Confirme a compra de {currentItem.name}.
                </p>

                <div className="mt-5 grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-white/50">
                      Portador do cartão
                    </span>
                    <span className="text-sm font-bold text-white">{playerName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-white/50">
                      Item
                    </span>
                    <span className="text-sm font-bold text-white">{currentItem.name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-white/50">
                      Valor
                    </span>
                    <span className="text-sm font-bold text-white">
                      {money(currentItem.price)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-5">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/55">
                      Cartão gamer
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: textColor }}>
                      holder
                    </span>
                  </div>

                  <div className="mb-6 h-10 w-14 rounded-lg bg-yellow-300/80" />

                  <div className="mb-5 grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <div
                        key={n}
                        className="h-8 rounded-md border border-white/10 bg-white/5"
                      />
                    ))}
                  </div>

                  <div className="text-sm font-bold uppercase tracking-[0.22em] text-white/85">
                    {playerName}
                  </div>
                </div>

                <div className="mt-5 min-h-[28px] text-sm font-black uppercase tracking-[0.2em]">
                  {transactionStage === 'approach' && (
                    <span style={{ color: textColor }}>processando...</span>
                  )}
                  {transactionStage === 'accepted' && (
                    <span className="text-emerald-400">transação aceita</span>
                  )}
                  {transactionStage === 'insufficient' && (
                    <span className="text-red-400">saldo insuficiente</span>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setTransactionOpen(false)}
                    className="flex-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.22em] text-white"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSimulateCard}
                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.22em] text-white"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(
                        theme,
                        0.85
                      )} 100%)`,
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/10 bg-black/85 px-5 py-4 text-sm text-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <span>{feedback}</span>
              <button
                onClick={() => setFeedback(null)}
                className="text-white/60 transition hover:text-white"
              >
                fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}