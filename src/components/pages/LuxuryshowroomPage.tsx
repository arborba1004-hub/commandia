import { useEffect, useMemo, useState } from 'react';
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      className={`relative min-w-[58px] rounded-2xl border px-3 py-3 text-xs font-black transition-all duration-200 ${
        selected
          ? 'border-amber-300 bg-amber-300 text-black shadow-[0_0_22px_rgba(252,211,77,.42)]'
          : unlocked
            ? 'border-white/15 bg-white/7 text-white hover:border-amber-300/70 hover:bg-white/12'
            : 'border-white/5 bg-white/[0.025] text-white/25 cursor-not-allowed'
      }`}
    >
      {level}
      {unlocked && ownedCount > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full border border-emerald-300/40 bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-black">
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
  const disabled = owned || locked || buying || !canAfford;
  const reason = locked
    ? 'Bloqueado pelo nível do barraco'
    : owned
      ? 'Já comprado neste nível'
      : !canAfford
        ? 'Commands Limpo insuficiente'
        : `Comprar ${item.name}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, delay: index * 0.06 }}
      className="relative overflow-hidden rounded-[30px] border border-white/12 p-5 backdrop-blur-xl"
      style={{
        background: getLuxuryItemBackground(level, index),
        boxShadow: getLuxuryItemGlow(level, index),
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.38)_55%,rgba(0,0,0,.76))]" />
      <div className="relative z-10 flex min-h-[440px] flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/48">Item de luxo</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">{item.name}</h3>
          </div>

          <div className="rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/78">
            Nv. {level}
          </div>
        </div>

        <div className="mt-6 flex flex-1 items-center justify-center rounded-[26px] border border-white/10 bg-black/20 p-4">
          <motion.img
            src={item.image}
            alt={item.name}
            className="max-h-[210px] w-full object-contain drop-shadow-[0_0_22px_rgba(255,255,255,.35)]"
            draggable={false}
            whileHover={{ scale: locked ? 1 : 1.04 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <p className="mt-5 min-h-[42px] text-sm leading-relaxed text-white/68">{item.description}</p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/32 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Bônus permanente</p>
            <p className="mt-2 text-lg font-black text-amber-200">
              +{LUXURY_BONUS_PERCENT}% {LUXURY_STAT_LABELS[item.targetStat]} em {LUXURY_MEMBER_LABELS[item.targetType]}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/32 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Valor</p>
            <p className="mt-2 text-xl font-black text-white">{formatCleanMoney(price)} Commands Limpo</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBuy}
          disabled={disabled}
          className="mt-5 rounded-2xl border border-amber-200/35 bg-amber-300 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/38 disabled:hover:scale-100"
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
  const collectionName = getCollectionNameByLevel(level);
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
      setStatus({ type: 'info', message: 'Aproximando cartão...' });

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
    <div className="min-h-screen bg-[#030108] text-white overflow-x-hidden">
      <Header />

      <main className="relative min-h-screen px-4 pb-20 pt-[140px] md:px-8 md:pt-[160px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(190,24,93,.22),transparent_28%),linear-gradient(180deg,#05010b_0%,#09030d_45%,#020102_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:38px_38px] opacity-20" />

        <div className="relative z-10 mx-auto max-w-[1500px]">
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[34px] border border-white/10 bg-black/42 p-5 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl md:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-200/70">Loja de luxo</p>
                <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.14em] text-white md:text-6xl">
                  Coleção {collectionName}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/62 md:text-base">
                  São 100 níveis de coleção. Cada nível é liberado pelo nível do barraco e cada item comprado adiciona
                  +1% permanente em uma estatística de um membro da gangue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Barraco</p>
                  <p className="mt-2 text-2xl font-black text-white">Nv. {barracoLevel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Liberado</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300">Nv. {maxUnlockedLevel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Saldo</p>
                  <p className="mt-2 text-lg font-black text-amber-200">{formatCleanMoney(cleanMoney)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Coleção</p>
                  <p className="mt-2 text-2xl font-black text-white">{ownedCount}/6</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_auto] lg:items-center">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Selecionar nível</span>
                <select
                  value={level}
                  onChange={(event) => setSelectedLevel(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-white/12 bg-black/65 px-4 py-3 text-sm font-black text-white outline-none focus:border-amber-300"
                >
                  {levelOptions.map((option) => (
                    <option key={option} value={option} disabled={option > maxUnlockedLevel}>
                      Nível {option}{option > maxUnlockedLevel ? ' — bloqueado' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 overflow-x-auto pb-2">
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

              <div className={`rounded-2xl border px-5 py-4 text-sm font-black uppercase tracking-[0.18em] ${
                isCollectionComplete
                  ? 'border-emerald-300/35 bg-emerald-500/12 text-emerald-200'
                  : 'border-amber-300/25 bg-amber-300/10 text-amber-100'
              }`}>
                {isCollectionComplete ? 'Coleção completa' : `${ownedCount}/6 itens comprados`}
              </div>
            </div>
          </motion.section>

          {status && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-bold ${
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

          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
              className="rounded-2xl border border-amber-200/25 bg-amber-300/10 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-amber-100 transition hover:bg-amber-300/15"
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
