import { useEffect, useMemo, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { usePlayerStore } from '@/store/playerStore';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AcessriosdeFuga, EscapeVehicles } from '@/entities';
import {
  FUGA_VEHICLE_UPGRADES,
  clampFugaLevel,
  formatFugaMoney,
  getFugaBonusPercent,
  getFugaGangBonusTarget,
  getFugaProtectionPercentFromInventory,
  getFugaSkillLabel,
  getFugaTheme,
  getFugaVehiclePrice,
  getFugaVehicleUpgradePrice,
} from '@/data/fugaSystem';
import {
  buyFugaCatalogAccessory,
  buyFugaVehicle,
  buyFugaVehicleUpgrade,
} from '@/api/fugaApi';

type ActiveTab = 'vehicles' | 'accessories' | 'upgrades';
type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  type: ToastType;
  message: string;
} | null;

function fallbackDescription(vehicle: EscapeVehicles): string {
  const level = clampFugaLevel(vehicle.level || 1);
  if (vehicle.description) return vehicle.description;
  if (level >= 80) return 'Máquina lendária para rota de fuga, contra-blitz e operações de alto risco.';
  if (level >= 50) return 'Veículo premium com resposta rápida, estabilidade e presença pesada no asfalto.';
  if (level >= 20) return 'Preparado para deslocamento seguro, perseguição curta e saída limpa do território.';
  return 'Veículo de fuga operacional para os primeiros corres do comando.';
}

function isVehicleOwned(player: any, vehicleId: string): boolean {
  const ownedVehicles = Array.isArray(player?.ownedVehicles) ? player.ownedVehicles.map(String) : [];
  const inventoryItems = Array.isArray(player?.inventory?.items) ? player.inventory.items : [];
  return ownedVehicles.includes(String(vehicleId)) || inventoryItems.some((item: any) => (
    String(item?.id || '') === String(vehicleId) ||
    String(item?.vehicleId || '') === String(vehicleId)
  ));
}

function getOwnedVehicleAccessoryNames(player: any, vehicleId: string): string[] {
  const raw = player?.accessories?.vehicles?.[vehicleId];
  if (Array.isArray(raw)) return raw.map(String);
  if (raw && typeof raw === 'object') return Object.keys(raw).filter((key) => raw[key]);
  return [];
}

function getOwnedVehiclesData(player: any, vehicles: EscapeVehicles[]): EscapeVehicles[] {
  const ownedIds = new Set((player?.ownedVehicles || []).map(String));
  const fromCatalog = vehicles.filter((vehicle) => ownedIds.has(String(vehicle._id)));

  const missingFromInventory = (player?.inventory?.items || [])
    .filter((item: any) => (item?.category === 'fuga_vehicle' || item?.source === 'fuga') && !fromCatalog.some((v) => v._id === item.vehicleId || v._id === item.id))
    .map((item: any) => ({
      _id: String(item.vehicleId || item.id),
      name: String(item.name || 'Veículo de Fuga'),
      level: Number(item.level || 1),
      price: Number(item.price || 0),
      image: item.image || '',
      abilityBonusType: item.abilityBonusType || 'agility',
      description: item.description || '',
    }));

  return [...fromCatalog, ...missingFromInventory];
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function FugaIlustradaPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const isLoaded = usePlayerStore((s) => s.isLoaded);
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);

  const [vehicles, setVehicles] = useState<EscapeVehicles[]>([]);
  const [accessories, setAccessories] = useState<AcessriosdeFuga[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState<EscapeVehicles | null>(null);
  const [selectedUpgradeVehicleId, setSelectedUpgradeVehicleId] = useState<string>('');
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const barracoLevel = clampFugaLevel(player?.niveis?.barracoLevel || 1);
  const playerLevel = clampFugaLevel(player?.niveis?.playerLevel || 1);
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const ownedVehicles = Array.isArray(player?.ownedVehicles) ? player.ownedVehicles : [];
  const purchasedAccessories = Array.isArray(player?.purchasedAccessories) ? player.purchasedAccessories : [];
  const currentTheme = getFugaTheme(barracoLevel);
  const fugaProtectionPercent = getFugaProtectionPercentFromInventory(player);

  const visibleVehicles = useMemo(() => (
    [...vehicles].sort((a, b) => Number(a.level || 1) - Number(b.level || 1))
  ), [vehicles]);

  const ownedVehiclesData = useMemo(() => (
    getOwnedVehiclesData(player, visibleVehicles)
      .sort((a, b) => Number(b.level || 1) - Number(a.level || 1))
  ), [player, visibleVehicles]);

  const selectedUpgradeVehicle = useMemo(() => {
    if (!ownedVehiclesData.length) return null;
    return ownedVehiclesData.find((vehicle) => String(vehicle._id) === String(selectedUpgradeVehicleId)) || ownedVehiclesData[0];
  }, [ownedVehiclesData, selectedUpgradeVehicleId]);

  const highestOwnedLevel = useMemo(() => {
    return ownedVehiclesData.reduce((max, vehicle) => Math.max(max, clampFugaLevel(vehicle.level || 1)), 0);
  }, [ownedVehiclesData]);

  const collectionProgress = useMemo(() => {
    const available = visibleVehicles.filter((vehicle) => clampFugaLevel(vehicle.level || 1) <= barracoLevel).length;
    const ownedAvailable = visibleVehicles.filter((vehicle) => clampFugaLevel(vehicle.level || 1) <= barracoLevel && isVehicleOwned(player, String(vehicle._id))).length;
    return { available, ownedAvailable };
  }, [visibleVehicles, barracoLevel, player]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        const [vehiclesResult, accessoriesResult] = await Promise.all([
          BaseCrudService.getAll<EscapeVehicles>('fugavehicles', [], { limit: 100 }),
          BaseCrudService.getAll<AcessriosdeFuga>('accessories', [], { limit: 100 }),
        ]);

        setVehicles([...(vehiclesResult.items || [])].sort((a, b) => Number(a.level || 0) - Number(b.level || 0)));
        setAccessories(accessoriesResult.items || []);
      } catch (error) {
        console.error('Erro ao carregar dados da fuga:', error);
        setToast({ type: 'error', message: 'Erro ao carregar veículos e acessórios de fuga.' });
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedUpgradeVehicleId && ownedVehiclesData[0]?._id) {
      setSelectedUpgradeVehicleId(String(ownedVehiclesData[0]._id));
    }
  }, [ownedVehiclesData, selectedUpgradeVehicleId]);

  const handleBuyVehicle = async (vehicle: EscapeVehicles) => {
    if (!vehicle?._id || pendingKey) return;

    const vehicleLevel = clampFugaLevel(vehicle.level || 1);
    const price = getFugaVehiclePrice(vehicleLevel);

    if (vehicleLevel > barracoLevel) {
      setToast({ type: 'error', message: `Veículo bloqueado. Evolua o barraco para o nível ${vehicleLevel}.` });
      return;
    }

    if (isVehicleOwned(player, String(vehicle._id))) {
      setToast({ type: 'info', message: 'Você já possui esse veículo.' });
      return;
    }

    if (cleanMoney < price) {
      setToast({ type: 'error', message: 'Dinheiro limpo insuficiente para comprar esse veículo.' });
      return;
    }

    const key = `vehicle:${vehicle._id}`;
    setPendingKey(key);
    try {
      const response = await buyFugaVehicle({
        vehicleId: String(vehicle._id),
        name: vehicle.name || `Veículo Nv. ${vehicleLevel}`,
        level: vehicleLevel,
        image: vehicle.image || '',
        description: fallbackDescription(vehicle),
        abilityBonusType: vehicle.abilityBonusType || 'agility',
      });

      if (response.player) hydratePlayerFromServer(response.player as any);
      setToast({ type: 'success', message: `${vehicle.name || 'Veículo'} comprado e preparado para fuga.` });
      setSelectedVehicle(null);
    } catch (error) {
      setToast({ type: 'error', message: extractErrorMessage(error, 'Erro ao comprar veículo de fuga.') });
    } finally {
      setPendingKey(null);
    }
  };

  const handleBuyCatalogAccessory = async (accessory: AcessriosdeFuga) => {
    if (!accessory?._id || pendingKey) return;

    const price = Number(accessory.itemPrice || 0);
    const alreadyOwned = purchasedAccessories.some((acc: any) => String(acc.accessoryId) === String(accessory._id));

    if (alreadyOwned) {
      setToast({ type: 'info', message: 'Você já possui esse acessório.' });
      return;
    }

    if (cleanMoney < price) {
      setToast({ type: 'error', message: 'Dinheiro limpo insuficiente para comprar esse acessório.' });
      return;
    }

    const key = `catalog-accessory:${accessory._id}`;
    setPendingKey(key);
    try {
      const response = await buyFugaCatalogAccessory({
        accessoryId: String(accessory._id),
        itemName: accessory.itemName || 'Acessório de Fuga',
        itemDescription: accessory.itemDescription || '',
        itemPrice: price,
        itemImage: accessory.itemImage || '',
        skillType: accessory.skillType || 'agility',
      });

      if (response.player) hydratePlayerFromServer(response.player as any);
      setToast({ type: 'success', message: `${accessory.itemName || 'Acessório'} instalado com sucesso.` });
    } catch (error) {
      setToast({ type: 'error', message: extractErrorMessage(error, 'Erro ao comprar acessório de fuga.') });
    } finally {
      setPendingKey(null);
    }
  };

  const handleBuyVehicleUpgrade = async (upgradeIndex: number) => {
    if (!selectedUpgradeVehicle || pendingKey) return;

    const upgrade = FUGA_VEHICLE_UPGRADES[upgradeIndex];
    if (!upgrade) return;

    const vehicleId = String(selectedUpgradeVehicle._id);
    const vehicleLevel = clampFugaLevel(selectedUpgradeVehicle.level || 1);
    const price = getFugaVehicleUpgradePrice(vehicleLevel, upgradeIndex);
    const ownedUpgradeNames = getOwnedVehicleAccessoryNames(player, vehicleId);

    if (ownedUpgradeNames.includes(upgrade.name) || ownedUpgradeNames.includes(upgrade.key)) {
      setToast({ type: 'info', message: 'Esse upgrade já está instalado nesse veículo.' });
      return;
    }

    if (cleanMoney < price) {
      setToast({ type: 'error', message: 'Dinheiro limpo insuficiente para instalar esse upgrade.' });
      return;
    }

    const key = `vehicle-upgrade:${vehicleId}:${upgrade.key}`;
    setPendingKey(key);
    try {
      const response = await buyFugaVehicleUpgrade({
        vehicleId,
        vehicleName: selectedUpgradeVehicle.name || 'Veículo de Fuga',
        vehicleLevel,
        upgradeKey: upgrade.key,
        upgradeName: upgrade.name,
        targetType: upgrade.targetType,
        targetStat: upgrade.targetStat,
      });

      if (response.player) hydratePlayerFromServer(response.player as any);
      setToast({ type: 'success', message: `${upgrade.name} instalado em ${selectedUpgradeVehicle.name || 'veículo'}.` });
    } catch (error) {
      setToast({ type: 'error', message: extractErrorMessage(error, 'Erro ao instalar upgrade de fuga.') });
    } finally {
      setPendingKey(null);
    }
  };

  if (!isLoaded || !player?._id || isLoadingData) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center pt-[140px] md:pt-[160px]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main
        className="relative min-h-screen pt-[140px] md:pt-[160px] pb-20 px-4 md:px-8 overflow-hidden"
        style={{ background: currentTheme.background }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.30),rgba(0,0,0,0.82))] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.10] pointer-events-none bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:42px_42px]" />

        <div className="relative z-10 max-w-[1500px] mx-auto">
          <section className="rounded-[34px] border border-white/12 bg-black/54 backdrop-blur-xl overflow-hidden shadow-[0_28px_110px_rgba(0,0,0,.62)]">
            <div className="relative p-6 md:p-10">
              <div
                className="absolute right-[-120px] top-[-140px] h-[360px] w-[360px] rounded-full blur-[86px] opacity-70"
                style={{ background: currentTheme.accentSoft }}
              />

              <div className="relative grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-8 items-end">
                <div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] md:text-xs uppercase tracking-[0.42em] text-white/52 font-black"
                  >
                    Garagem clandestina • Sistema de fuga
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="mt-4 text-4xl md:text-6xl xl:text-7xl font-black uppercase tracking-[0.16em] text-white"
                    style={{ textShadow: currentTheme.textGlow }}
                  >
                    Fuga Ilustrada
                  </motion.h1>

                  <p className="mt-5 max-w-3xl text-sm md:text-base text-white/72 leading-relaxed">
                    Monte uma frota de fuga por nível, instale upgrades e reduza o impacto da blitz no Giro. Cada veículo é liberado conforme o nível do barraco e alimenta bônus reais no sistema da gangue.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {[
                      { label: 'Barraco', value: `Nv. ${barracoLevel}` },
                      { label: 'Proteção contra blitz', value: `${fugaProtectionPercent}%` },
                      { label: 'Maior veículo', value: highestOwnedLevel ? `Nv. ${highestOwnedLevel}` : 'Nenhum' },
                      { label: 'Frota', value: `${ownedVehicles.length}/${visibleVehicles.length}` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur">
                        <p className="text-[9px] uppercase tracking-[0.28em] text-white/42 font-black">{item.label}</p>
                        <p className="mt-1 text-lg font-black text-white" style={{ color: currentTheme.accent }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/12 bg-black/44 p-5 md:p-6" style={{ boxShadow: currentTheme.shadow }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/42 font-black">Saldo operacional</p>
                      <p className="mt-2 text-3xl md:text-4xl font-black text-white">
                        {formatFugaMoney(cleanMoney)}
                      </p>
                      <p className="mt-1 text-xs text-white/48">Commands Limpo disponíveis</p>
                    </div>
                    <button
                      onClick={() => navigate('/barraco')}
                      className="rounded-2xl border border-white/14 bg-white/7 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-white/12 transition"
                    >
                      Evoluir barraco
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/36 p-4">
                    <div className="flex items-center justify-between text-xs text-white/62">
                      <span>{collectionProgress.ownedAvailable}/{collectionProgress.available} veículos liberados comprados</span>
                      <span>{Math.round((collectionProgress.ownedAvailable / Math.max(1, collectionProgress.available)) * 100)}%</span>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (collectionProgress.ownedAvailable / Math.max(1, collectionProgress.available)) * 100)}%`, background: currentTheme.accent }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                className={`fixed left-1/2 top-[104px] z-[10050] w-[92%] max-w-xl -translate-x-1/2 rounded-2xl border px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] shadow-[0_18px_60px_rgba(0,0,0,.5)] backdrop-blur-xl ${
                  toast.type === 'success'
                    ? 'border-emerald-300/35 bg-emerald-500/18 text-emerald-100'
                    : toast.type === 'error'
                    ? 'border-red-300/35 bg-red-500/18 text-red-100'
                    : 'border-white/20 bg-white/12 text-white'
                }`}
              >
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          <section className="mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'vehicles', label: 'Veículos' },
                  { key: 'upgrades', label: 'Upgrades da frota' },
                  { key: 'accessories', label: 'Acessórios gerais' },
                ].map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as ActiveTab)}
                      className="rounded-2xl border px-5 py-3 text-xs md:text-sm font-black uppercase tracking-[0.22em] transition active:scale-95"
                      style={{
                        borderColor: active ? currentTheme.border : 'rgba(255,255,255,0.12)',
                        background: active ? currentTheme.accent : 'rgba(255,255,255,0.06)',
                        color: active ? '#050505' : 'rgba(255,255,255,0.82)',
                        boxShadow: active ? currentTheme.shadow : 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/12 bg-black/38 px-4 py-3 text-xs text-white/58">
                Bônus por compra: <span className="font-black" style={{ color: currentTheme.accent }}>+{getFugaBonusPercent(playerLevel)}%</span> • Nível visual: <span className="font-black text-white">{currentTheme.name}</span>
              </div>
            </div>

            {activeTab === 'vehicles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-7">
                {visibleVehicles.map((vehicle, index) => {
                  const level = clampFugaLevel(vehicle.level || 1);
                  const theme = getFugaTheme(level);
                  const price = getFugaVehiclePrice(level);
                  const owned = isVehicleOwned(player, String(vehicle._id));
                  const unlocked = level <= barracoLevel;
                  const canAfford = cleanMoney >= price;
                  const target = getFugaGangBonusTarget(vehicle.abilityBonusType);
                  const pending = pendingKey === `vehicle:${vehicle._id}`;

                  return (
                    <motion.article
                      key={vehicle._id}
                      initial={{ opacity: 0, y: 24, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.42, delay: index * 0.025 }}
                      className="relative rounded-[30px] border p-4 md:p-5 overflow-hidden cursor-pointer group"
                      style={{ background: theme.cardBackground, borderColor: theme.border, boxShadow: theme.shadow }}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.14),transparent_38%)] pointer-events-none" />

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.30em] text-white/50 font-black">Veículo de fuga</p>
                          <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white" style={{ textShadow: theme.textGlow }}>
                            {vehicle.name || `Veículo Nv. ${level}`}
                          </h3>
                        </div>
                        <span className="rounded-full bg-black/42 border border-white/12 px-3 py-1 text-[10px] font-black text-white/82">Nv. {level}</span>
                      </div>

                      <div className="relative z-10 mt-5 h-48 rounded-[24px] border border-white/10 overflow-hidden flex items-center justify-center" style={{ background: theme.mediaBackground }}>
                        {vehicle.image ? (
                          <Image src={vehicle.image} alt={vehicle.name || 'Veículo'} width={420} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="text-center px-6">
                            <div className="mx-auto h-16 w-16 rounded-full border border-white/16 bg-white/8 flex items-center justify-center text-3xl">🏎️</div>
                            <p className="mt-3 text-xs text-white/50">Sem imagem cadastrada</p>
                          </div>
                        )}
                        {!unlocked && (
                          <div className="absolute inset-0 bg-black/72 backdrop-blur-[2px] flex flex-col items-center justify-center text-center px-5">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50 font-black">Bloqueado</p>
                            <p className="mt-2 text-lg font-black text-white">Barraco Nv. {level}</p>
                          </div>
                        )}
                        {owned && (
                          <div className="absolute right-3 top-3 rounded-full border border-emerald-200/30 bg-emerald-500/20 px-3 py-1 text-[10px] font-black text-emerald-100">Na frota</div>
                        )}
                      </div>

                      <p className="relative z-10 mt-4 min-h-[44px] text-xs text-white/66 leading-relaxed">{fallbackDescription(vehicle)}</p>

                      <div className="relative z-10 mt-5 space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                          <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Bônus operacional</p>
                          <p className="mt-2 text-sm font-black text-white">
                            +{getFugaBonusPercent(playerLevel)}% {target.label}
                          </p>
                          <p className="mt-1 text-[11px] text-white/46">Categoria: {getFugaSkillLabel(vehicle.abilityBonusType)}</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                          <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Valor</p>
                          <p className="mt-2 text-xl font-black text-white">{formatFugaMoney(price)} Commands Limpo</p>
                        </div>
                      </div>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleBuyVehicle(vehicle);
                        }}
                        disabled={owned || !unlocked || !canAfford || Boolean(pendingKey)}
                        className="relative z-10 mt-5 w-full rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.22em] transition active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                        style={{ background: theme.accent, color: '#050505' }}
                      >
                        {pending ? 'Processando...' : owned ? 'Veículo comprado' : !unlocked ? `Libera no Nv. ${level}` : canAfford ? 'Comprar veículo' : 'Sem fundos'}
                      </button>
                    </motion.article>
                  );
                })}
              </div>
            )}

            {activeTab === 'upgrades' && (
              <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-7">
                <aside className="rounded-[30px] border border-white/12 bg-black/48 p-5 backdrop-blur-xl h-fit">
                  <p className="text-[10px] uppercase tracking-[0.30em] text-white/42 font-black">Escolha o veículo</p>
                  <div className="mt-4 space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {ownedVehiclesData.length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-white/64">
                        Compre um veículo primeiro para liberar upgrades de frota.
                      </div>
                    )}
                    {ownedVehiclesData.map((vehicle) => {
                      const level = clampFugaLevel(vehicle.level || 1);
                      const theme = getFugaTheme(level);
                      const active = String(selectedUpgradeVehicle?._id) === String(vehicle._id);
                      return (
                        <button
                          key={vehicle._id}
                          onClick={() => setSelectedUpgradeVehicleId(String(vehicle._id))}
                          className="w-full rounded-2xl border p-4 text-left transition active:scale-[0.99]"
                          style={{
                            borderColor: active ? theme.border : 'rgba(255,255,255,0.10)',
                            background: active ? theme.cardBackground : 'rgba(255,255,255,0.06)',
                            boxShadow: active ? theme.shadow : 'none',
                          }}
                        >
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/42 font-black">Nv. {level}</p>
                          <p className="mt-1 text-lg font-black text-white">{vehicle.name || 'Veículo de Fuga'}</p>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {FUGA_VEHICLE_UPGRADES.map((upgrade, index) => {
                    const vehicleLevel = clampFugaLevel(selectedUpgradeVehicle?.level || 1);
                    const theme = getFugaTheme(vehicleLevel);
                    const price = getFugaVehicleUpgradePrice(vehicleLevel, index);
                    const ownedNames = selectedUpgradeVehicle ? getOwnedVehicleAccessoryNames(player, String(selectedUpgradeVehicle._id)) : [];
                    const owned = ownedNames.includes(upgrade.name) || ownedNames.includes(upgrade.key);
                    const pending = pendingKey === `vehicle-upgrade:${selectedUpgradeVehicle?._id}:${upgrade.key}`;
                    const disabled = !selectedUpgradeVehicle || owned || cleanMoney < price || Boolean(pendingKey);

                    return (
                      <motion.div
                        key={upgrade.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.04 }}
                        className="rounded-[28px] border p-5 overflow-hidden"
                        style={{ background: theme.cardBackground, borderColor: theme.border, boxShadow: theme.shadow }}
                      >
                        <div className="h-24 rounded-[22px] border border-white/10 flex items-center justify-center text-4xl" style={{ background: theme.mediaBackground }}>
                          {index === 0 ? '⚡' : index === 1 ? '🛞' : index === 2 ? '🔥' : index === 3 ? '🛡️' : index === 4 ? '📡' : '💨'}
                        </div>
                        <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-white/42 font-black">Upgrade de frota</p>
                        <h3 className="mt-2 text-xl font-black uppercase tracking-[0.10em] text-white">{upgrade.name}</h3>
                        <p className="mt-3 min-h-[54px] text-xs text-white/62 leading-relaxed">{upgrade.description}</p>
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4">
                          <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Bônus</p>
                          <p className="mt-2 text-sm font-black text-white">+{getFugaBonusPercent(playerLevel)}% {upgrade.targetStat} em {upgrade.targetType}</p>
                        </div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/24 p-4">
                          <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Valor</p>
                          <p className="mt-2 text-lg font-black text-white">{formatFugaMoney(price)} Commands Limpo</p>
                        </div>
                        <button
                          onClick={() => void handleBuyVehicleUpgrade(index)}
                          disabled={disabled}
                          className="mt-5 w-full rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.22em] transition active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                          style={{ background: theme.accent, color: '#050505' }}
                        >
                          {pending ? 'Instalando...' : !selectedUpgradeVehicle ? 'Sem veículo' : owned ? 'Instalado' : cleanMoney >= price ? 'Instalar upgrade' : 'Sem fundos'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'accessories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-7">
                {accessories.map((accessory, index) => {
                  const level = Math.min(100, Math.max(1, index + 1));
                  const theme = getFugaTheme(level);
                  const price = Number(accessory.itemPrice || 0);
                  const owned = purchasedAccessories.some((acc: any) => String(acc.accessoryId) === String(accessory._id));
                  const canAfford = cleanMoney >= price;
                  const target = getFugaGangBonusTarget(accessory.skillType);
                  const pending = pendingKey === `catalog-accessory:${accessory._id}`;

                  return (
                    <motion.article
                      key={accessory._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.36, delay: index * 0.035 }}
                      className="rounded-[28px] border p-5 overflow-hidden"
                      style={{ background: theme.cardBackground, borderColor: theme.border, boxShadow: theme.shadow }}
                    >
                      <div className="h-44 rounded-[22px] border border-white/10 flex items-center justify-center overflow-hidden" style={{ background: theme.mediaBackground }}>
                        {accessory.itemImage ? (
                          <Image src={accessory.itemImage} alt={accessory.itemName || 'Acessório'} width={360} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-4xl">🔧</span>
                        )}
                      </div>
                      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-white/42 font-black">Acessório geral</p>
                      <h3 className="mt-2 text-xl font-black uppercase tracking-[0.10em] text-white">{accessory.itemName || 'Acessório'}</h3>
                      <p className="mt-3 min-h-[48px] text-xs text-white/62 leading-relaxed">{accessory.itemDescription || 'Peça operacional para melhorar a capacidade de fuga.'}</p>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4">
                        <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Bônus</p>
                        <p className="mt-2 text-sm font-black text-white">+{getFugaBonusPercent(playerLevel)}% {target.label}</p>
                      </div>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/24 p-4">
                        <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Valor</p>
                        <p className="mt-2 text-lg font-black text-white">{formatFugaMoney(price)} Commands Limpo</p>
                      </div>
                      <button
                        onClick={() => void handleBuyCatalogAccessory(accessory)}
                        disabled={owned || !canAfford || Boolean(pendingKey)}
                        className="mt-5 w-full rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.22em] transition active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                        style={{ background: theme.accent, color: '#050505' }}
                      >
                        {pending ? 'Processando...' : owned ? 'Comprado' : canAfford ? 'Comprar acessório' : 'Sem fundos'}
                      </button>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVehicle(null)}
              className="fixed inset-0 z-[10030] flex items-center justify-center bg-black/82 px-4 py-8 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.96 }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-[34px] border p-5 md:p-7"
                style={{
                  background: getFugaTheme(selectedVehicle.level || 1).cardBackground,
                  borderColor: getFugaTheme(selectedVehicle.level || 1).border,
                  boxShadow: getFugaTheme(selectedVehicle.level || 1).shadow,
                }}
              >
                {(() => {
                  const level = clampFugaLevel(selectedVehicle.level || 1);
                  const theme = getFugaTheme(level);
                  const price = getFugaVehiclePrice(level);
                  const owned = isVehicleOwned(player, String(selectedVehicle._id));
                  const unlocked = level <= barracoLevel;
                  const target = getFugaGangBonusTarget(selectedVehicle.abilityBonusType);
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-7">
                      <div className="rounded-[28px] border border-white/10 overflow-hidden min-h-[360px] flex items-center justify-center" style={{ background: theme.mediaBackground }}>
                        {selectedVehicle.image ? (
                          <Image src={selectedVehicle.image} alt={selectedVehicle.name || 'Veículo'} width={700} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <div className="text-6xl">🏎️</div>
                            <p className="mt-3 text-white/50">Sem imagem cadastrada</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.34em] text-white/45 font-black">Dossiê do veículo</p>
                        <h2 className="mt-3 text-4xl md:text-5xl font-black uppercase tracking-[0.12em] text-white" style={{ textShadow: theme.textGlow }}>
                          {selectedVehicle.name || `Veículo Nv. ${level}`}
                        </h2>
                        <p className="mt-4 text-sm text-white/68 leading-relaxed">{fallbackDescription(selectedVehicle)}</p>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Nível</p>
                            <p className="mt-2 text-2xl font-black text-white">{level}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Valor</p>
                            <p className="mt-2 text-2xl font-black text-white">{formatFugaMoney(price)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/24 p-4 sm:col-span-2">
                            <p className="text-[9px] uppercase tracking-[0.24em] text-white/42 font-black">Bônus</p>
                            <p className="mt-2 text-lg font-black text-white">+{getFugaBonusPercent(playerLevel)}% {target.label}</p>
                          </div>
                        </div>

                        <div className="mt-7 flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => void handleBuyVehicle(selectedVehicle)}
                            disabled={owned || !unlocked || cleanMoney < price || Boolean(pendingKey)}
                            className="flex-1 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.22em] transition active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                            style={{ background: theme.accent, color: '#050505' }}
                          >
                            {owned ? 'Já está na frota' : !unlocked ? `Bloqueado no Nv. ${level}` : cleanMoney >= price ? 'Comprar agora' : 'Sem fundos'}
                          </button>
                          <button
                            onClick={() => setSelectedVehicle(null)}
                            className="rounded-2xl border border-white/14 bg-white/7 px-5 py-4 text-xs font-black uppercase tracking-[0.22em] text-white"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
