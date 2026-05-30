import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureLevelLock from '@/components/FeatureLevelLock';
import { usePlayerStore } from '@/store/playerStore';
import { canAccessFeature, getFeatureLevelRequirement } from '@/utils/levelRequirements';
import { buyLuxuryShowroomItem } from '@/api/shopApi';
import {
  LUXURY_BONUS_PERCENT,
  LUXURY_MAX_LEVEL,
  LUXURY_MEMBER_LABELS,
  LUXURY_SHOWROOM_ITEMS,
  LUXURY_STAT_LABELS,
  clampLuxuryLevel,
  formatCleanMoney,
  getLegacyLuxuryItemId,
  getLuxuryItemBackground,
  getLuxuryItemGlow,
  getLuxuryItemId,
  getLuxuryItemPrice,
  getLuxuryLevelFromBarraco,
  getLuxuryLevelName,
  getLuxuryLevelTheme,
  type LuxuryLevelTheme,
  type LuxuryShowroomItem,
} from '@/data/luxuryShowroomItems';
import { getCollectionNameByLevel } from '@/data/luxoItems';

type PurchaseStatus = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

function isOwnedLuxuryItem(inventoryItem: any, itemKey: string, level: number): boolean {
  const officialId = getLuxuryItemId(itemKey, level);
  const legacyId = getLegacyLuxuryItemId(itemKey, level);

  return (
    inventoryItem?.id === officialId ||
    inventoryItem?.id === legacyId ||
    (inventoryItem?.itemKey === itemKey && Number(inventoryItem?.level) === level) ||
    (inventoryItem?.itemType === itemKey && Number(inventoryItem?.level) === level)
  );
}

function getOwnedCountForLevel(items: any[], level: number): number {
  return LUXURY_SHOWROOM_ITEMS.filter((item) =>
    items.some((inventoryItem) => isOwnedLuxuryItem(inventoryItem, item.key, level)),
  ).length;
}

function StatBox({ label, value, theme }: { label: string; value: string; theme: LuxuryLevelTheme }) {
  return (
    <div
      className="rounded-2xl border p-4 backdrop-blur-xl"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,.085), rgba(0,0,0,.42)), ${theme.heroBackground}`,
        borderColor: theme.borderColor,
        boxShadow: `0 0 22px ${theme.shadowColor}`,
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/48">{label}</p>
      <p className="mt-2 text-lg font-black text-white md:text-2xl" style={{ textShadow: `0 0 18px ${theme.shadowColor}` }}>
        {value}
      </p>
    </div>
  );
}

function LevelButton({
  level,
  selected,
  unlocked,
  ownedCount,
  onClick,
}: {
  level: number;
  selected: boolean;
  unlocked: boolean;
  ownedCount: number;
  onClick: () => void;
}) {
  const levelTheme = getLuxuryLevelTheme(level);
  const style: CSSProperties = unlocked
    ? {
        background: selected ? levelTheme.buttonBackground : levelTheme.previewBackground,
        borderColor: selected ? levelTheme.primary : levelTheme.borderColor,
        boxShadow: selected ? `0 0 24px ${levelTheme.shadowColor}` : undefined,
      }
    : {
        background: 'linear-gradient(135deg, rgba(255,255,255,.045), rgba(255,255,255,.015))',
        borderColor: 'rgba(255,255,255,.06)',
      };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      style={style}
      className={`relative min-w-[62px] rounded-2xl border px-3 py-3 text-xs font-black transition-all duration-200 ${
        selected
          ? 'scale-[1.04] text-black'
          : unlocked
            ? 'text-white hover:scale-[1.04] active:scale-95'
            : 'cursor-not-allowed text-white/25'
      }`}
      title={unlocked ? `${getLuxuryLevelName(level)} — nível ${level}` : `Nível ${level} bloqueado pelo barraco`}
    >
      <span className="relative z-10">{level}</span>
      {unlocked && ownedCount > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full border border-black/35 bg-emerald-300 px-1.5 py-0.5 text-[9px] font-black text-black">
          {ownedCount}/6
        </span>
      )}
    </button>
  );
}

function LuxuryCard({
  item,
  index,
  level,
  owned,
  locked,
  buying,
  canAfford,
  onBuy,
}: {
  item: LuxuryShowroomItem;
  index: number;
  level: number;
  owned: boolean;
  locked: boolean;
  buying: boolean;
  canAfford: boolean;
  onBuy: () => void;
}) {
  const price = getLuxuryItemPrice(level);
  const theme = getLuxuryLevelTheme(level);
  const disabled = owned || locked || buying || !canAfford;
  const reason = locked
    ? 'Bloqueado pelo barraco'
    : owned
      ? 'Já comprado neste nível'
      : !canAfford
        ? 'Commands Limpo insuficiente'
        : `Comprar ${item.name}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 34, scale: 0.95, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.44, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
      whileHover={locked ? undefined : { y: -7, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[32px] border p-[1px] backdrop-blur-xl"
      style={{
        borderColor: theme.borderColor,
        boxShadow: getLuxuryItemGlow(level, index),
      }}
    >
      <div className="absolute inset-0" style={{ background: getLuxuryItemBackground(level, index) }} />
      <div className="absolute inset-0 opacity-75 mix-blend-screen" style={{ background: theme.particles }} />
      <motion.div
        className="absolute -inset-[32%] opacity-0 mix-blend-screen group-hover:opacity-100"
        style={{ background: 'linear-gradient(112deg, transparent 0%, rgba(255,255,255,.22) 30%, transparent 58%)' }}
        animate={{ x: ['-20%', '20%', '-20%'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.22)_42%,rgba(0,0,0,.80))]" />

      {owned && (
        <div className="absolute left-4 top-4 z-20 rounded-full border border-emerald-200/45 bg-emerald-400/18 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 backdrop-blur-md">
          Comprado
        </div>
      )}

      <div className="relative z-10 flex min-h-[500px] flex-col rounded-[31px] p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/50">Item de luxo</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.13em] text-white" style={{ textShadow: `0 0 22px ${theme.shadowColor}` }}>
              {item.name}
            </h3>
          </div>

          <div
            className="rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,.36)', borderColor: theme.borderColor }}
          >
            Nv. {level}
          </div>
        </div>

        <div
          className="relative mt-6 flex flex-1 items-center justify-center overflow-hidden rounded-[28px] border bg-black/24 p-5"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="absolute h-[280px] w-[280px] rounded-full opacity-80 blur-2xl" style={{ background: theme.itemHalo }} />
          <div className="absolute inset-0 opacity-55 mix-blend-screen" style={{ background: theme.particles }} />
          <motion.img
            src={item.image}
            alt={item.name}
            className="relative z-10 max-h-[245px] w-full object-contain drop-shadow-[0_0_28px_rgba(255,255,255,.46)]"
            draggable={false}
            whileHover={{ scale: locked ? 1 : 1.065, rotate: locked ? 0 : 0.5 }}
            transition={{ duration: 0.22 }}
          />
        </div>

        <p className="mt-5 min-h-[44px] text-sm leading-relaxed text-white/72">{item.description}</p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <div className="rounded-2xl border bg-black/34 p-4 backdrop-blur-md" style={{ borderColor: theme.borderColor }}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/44">Bônus permanente</p>
            <p className="mt-2 text-lg font-black text-white" style={{ textShadow: `0 0 20px ${theme.shadowColor}` }}>
              +{LUXURY_BONUS_PERCENT}% {LUXURY_STAT_LABELS[item.targetStat]} em {LUXURY_MEMBER_LABELS[item.targetType]}
            </p>
          </div>

          <div className="rounded-2xl border bg-black/34 p-4 backdrop-blur-md" style={{ borderColor: theme.borderColor }}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/44">Valor</p>
            <p className="mt-2 text-xl font-black text-white">{formatCleanMoney(price)} Commands Limpo</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBuy}
          disabled={disabled}
          className="mt-5 rounded-2xl border px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/38 disabled:hover:scale-100"
          style={
            disabled
              ? undefined
              : {
                  background: theme.buttonBackground,
                  borderColor: theme.borderColor,
                  boxShadow: `0 12px 28px ${theme.shadowColor}`,
                }
          }
        >
          {buying ? 'Processando...' : reason}
        </button>
      </div>
    </motion.article>
  );
}

export default function LuxuryshowroomPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.player);
  const hydratePlayerFromServer = usePlayerStore((state) => state.hydratePlayerFromServer);

  const playerLevel = player?.niveis?.playerLevel || 1;
  const barracoLevel = clampLuxuryLevel(player?.niveis?.barracoLevel || 1);
  const maxUnlockedLevel = getLuxuryLevelFromBarraco(barracoLevel);
  const requiredLevel = getFeatureLevelRequirement('luxo');
  const isFeatureUnlocked = canAccessFeature(playerLevel, 'luxo');

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [buyingKey, setBuyingKey] = useState<string | null>(null);
  const [status, setStatus] = useState<PurchaseStatus>(null);

  useEffect(() => {
    setSelectedLevel((current) => {
      if (current === null) return maxUnlockedLevel;
      return Math.min(current, maxUnlockedLevel);
    });
  }, [maxUnlockedLevel]);

  const level = selectedLevel ?? maxUnlockedLevel;
  const theme = useMemo(() => getLuxuryLevelTheme(level), [level]);
  const collectionName = getCollectionNameByLevel(level);
  const levelThemeName = getLuxuryLevelName(level);
  const inventoryItems = Array.isArray(player?.inventory?.items) ? player.inventory.items : [];
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const levelLocked = level > maxUnlockedLevel;
  const levelPrice = getLuxuryItemPrice(level);
  const ownedCount = getOwnedCountForLevel(inventoryItems, level);
  const isCollectionComplete = ownedCount >= LUXURY_SHOWROOM_ITEMS.length;

  const levelOptions = useMemo(
    () => Array.from({ length: LUXURY_MAX_LEVEL }, (_, index) => index + 1),
    [],
  );

  const handleBuy = async (item: LuxuryShowroomItem) => {
    if (buyingKey) return;

    if (levelLocked) {
      setStatus({ type: 'error', message: `Coleção nível ${level} bloqueada. Evolua o barraco para liberar.` });
      return;
    }

    if (cleanMoney < levelPrice) {
      setStatus({ type: 'error', message: 'Commands Limpo insuficiente para comprar este item.' });
      return;
    }

    try {
      setBuyingKey(item.key);
      setStatus({ type: 'info', message: 'Aproximando cartão premium...' });

      const response = await buyLuxuryShowroomItem({ itemKey: item.key, level });
      if (response?.player) hydratePlayerFromServer(response.player as any);

      setStatus({
        type: 'success',
        message: `${item.name} nível ${level} comprado. Bônus aplicado em ${LUXURY_MEMBER_LABELS[item.targetType]}.`,
      });
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error?.message || 'Erro ao comprar item de luxo.',
      });
    } finally {
      setBuyingKey(null);
    }
  };

  if (!isFeatureUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 pt-[140px] md:pt-[160px]">
          <FeatureLevelLock
            playerLevel={playerLevel}
            requiredLevel={requiredLevel}
            featureName="Loja de Luxo"
            onNavigateToBarraco={() => navigate('/barraco')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-white" style={{ background: theme.pageBackground }}>
      <Header />

      <main className="relative min-h-screen px-4 pb-20 pt-[140px] md:px-8 md:pt-[160px]">
        <div className="absolute inset-0 opacity-70 mix-blend-screen" style={{ background: theme.particles }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />
        <motion.div
          className="absolute -left-24 top-28 h-80 w-80 rounded-full blur-3xl"
          style={{ background: theme.itemHalo }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.30, 0.52, 0.30] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-24 top-72 h-96 w-96 rounded-full blur-3xl"
          style={{ background: theme.itemHalo }}
          animate={{ scale: [1.08, 1, 1.08], opacity: [0.24, 0.46, 0.24] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 mx-auto max-w-[1540px]">
          <motion.section
            initial={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[38px] border p-5 shadow-[0_24px_90px_rgba(0,0,0,.52)] backdrop-blur-xl md:p-8"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,.085), rgba(0,0,0,.50)), ${theme.heroBackground}`,
              borderColor: theme.borderColor,
              boxShadow: `0 0 36px ${theme.shadowColor}, 0 24px 90px rgba(0,0,0,.52)`,
            }}
          >
            <div className="absolute inset-0 opacity-60 mix-blend-screen" style={{ background: theme.particles }} />
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }} />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-black"
                    style={{ background: theme.buttonBackground, borderColor: theme.borderColor, boxShadow: `0 0 24px ${theme.shadowColor}` }}
                  >
                    {levelThemeName}
                  </span>
                  <span className="rounded-full border border-white/12 bg-black/32 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/72">
                    100 coleções • 6 itens por nível
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.14em] text-white md:text-6xl lg:text-7xl" style={{ textShadow: `0 0 26px ${theme.shadowColor}` }}>
                  Coleção {collectionName}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/68 md:text-base">
                  Cada nível agora tem uma identidade visual dominante própria. Nível 1 cinza, nível 2 verde,
                  nível 3 amarelo, nível 60 azul e roxo, nível 88 espiral rosa e nível 100 estrelas douradas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                <StatBox label="Barraco" value={`Nv. ${barracoLevel}`} theme={theme} />
                <StatBox label="Liberado" value={`Nv. ${maxUnlockedLevel}`} theme={theme} />
                <StatBox label="Saldo limpo" value={formatCleanMoney(cleanMoney)} theme={theme} />
                <StatBox label="Coleção" value={`${ownedCount}/6`} theme={theme} />
              </div>
            </div>

            <div className="relative z-10 mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[270px_1fr_auto] lg:items-center">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/48">Selecionar nível</span>
                <select
                  value={level}
                  onChange={(event) => setSelectedLevel(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border bg-black/65 px-4 py-3 text-sm font-black text-white outline-none backdrop-blur-md"
                  style={{ borderColor: theme.borderColor, boxShadow: `0 0 18px ${theme.shadowColor}` }}
                >
                  {levelOptions.map((option) => (
                    <option key={option} value={option} disabled={option > maxUnlockedLevel}>
                      Nível {option}{option > maxUnlockedLevel ? ' — bloqueado' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                {levelOptions.map((option) => (
                  <LevelButton
                    key={option}
                    level={option}
                    selected={option === level}
                    unlocked={option <= maxUnlockedLevel}
                    ownedCount={getOwnedCountForLevel(inventoryItems, option)}
                    onClick={() => setSelectedLevel(option)}
                  />
                ))}
              </div>

              <div
                className="rounded-2xl border px-5 py-4 text-sm font-black uppercase tracking-[0.18em] backdrop-blur-md"
                style={{
                  background: isCollectionComplete ? 'rgba(16,185,129,.14)' : 'rgba(0,0,0,.32)',
                  borderColor: isCollectionComplete ? 'rgba(110,231,183,.45)' : theme.borderColor,
                  color: isCollectionComplete ? '#a7f3d0' : theme.text,
                }}
              >
                {isCollectionComplete ? 'Coleção completa' : `${ownedCount}/6 itens comprados`}
              </div>
            </div>
          </motion.section>

          {status && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-bold backdrop-blur-md ${
                status.type === 'success'
                  ? 'border-emerald-300/35 bg-emerald-500/12 text-emerald-100'
                  : status.type === 'error'
                    ? 'border-red-300/35 bg-red-500/12 text-red-100'
                    : 'border-amber-300/35 bg-amber-500/12 text-amber-100'
              }`}
            >
              {status.message}
            </motion.div>
          )}

          <section className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {LUXURY_SHOWROOM_ITEMS.map((item, index) => {
              const owned = inventoryItems.some((inventoryItem) => isOwnedLuxuryItem(inventoryItem, item.key, level));
              const canAfford = cleanMoney >= levelPrice;

              return (
                <LuxuryCard
                  key={item.key}
                  item={item}
                  index={index}
                  level={level}
                  owned={owned}
                  locked={levelLocked}
                  buying={buyingKey === item.key}
                  canAfford={canAfford}
                  onBuy={() => handleBuy(item)}
                />
              );
            })}
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/game')}
              className="rounded-2xl border border-white/14 bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
            >
              Voltar para o mapa
            </button>
            <button
              type="button"
              onClick={() => navigate('/gang')}
              className="rounded-2xl border px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-black transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: theme.buttonBackground, borderColor: theme.borderColor, boxShadow: `0 12px 28px ${theme.shadowColor}` }}
            >
              Ver gangue
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
