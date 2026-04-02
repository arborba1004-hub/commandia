import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { usePlayerStore } from '@/store/playerStore';
import { WEAPONS, Weapon } from '@/data/armas';
import CardTransactionModal from '@/components/CardTransactionModal';
import { Model3D } from '@/components/Model3D';
import { isDelacaoActive } from '@/services/punishmentService';

export default function ArsenalPage() {
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  if (!isLoaded) {
    return (
      <div className="w-full min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="font-paragraph text-lg">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const playerName = player.name || 'Guerreiro';
  const playerLevel = player.niveis?.barracoLevel || 1;
  const dirtyMoney = player.balances?.dirtyMoney || 0;

  // 🔥 FIX PRINCIPAL (NUNCA FICA VAZIO)
  const safeWeapons = [...WEAPONS]
    .filter((w) => w.level <= playerLevel)
    .sort((a, b) => a.level - b.level);

  const finalWeapons =
    safeWeapons.length > 0
      ? safeWeapons
      : [...WEAPONS].sort((a, b) => a.level - b.level);

  // 🔥 DEBUG (PODE REMOVER DEPOIS)
  console.log('PLAYER LEVEL:', playerLevel);
  console.log('WEAPONS:', WEAPONS);
  console.log('SAFE:', safeWeapons);
  console.log('FINAL:', finalWeapons);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTime = () => {
      const t = video.currentTime;
      if (t >= 0 && !showDialog) setShowDialog(true);
      if (t >= 8 && !showButton) setShowButton(true);
    };

    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, [showDialog, showButton]);

  const handleShowWeapon = () => {
    if (!finalWeapons.length) return;

    setSelectedWeapon(finalWeapons[0]);
    setShowWeaponModal(true);
    setTransactionError(null);
  };

  const handleBuyWeapon = async () => {
    if (!selectedWeapon) return;

    const inventory = player?.inventory?.items || [];
    const alreadyOwned = inventory.some((item: any) => item.level === selectedWeapon.level);

    if (alreadyOwned) {
      setTransactionError('Você já possui essa arma');
      return;
    }

    if (isDelacaoActive(player)) {
      setTransactionError('Você está bloqueado pela delação');
      return;
    }

    if (dirtyMoney < selectedWeapon.price) {
      setTransactionError('Saldo insuficiente');
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const current = player;

    const updated = {
      ...current,
      balances: {
        ...current.balances,
        dirtyMoney: current.balances.dirtyMoney - selectedWeapon.price,
      },
      inventory: {
        ...current.inventory,
        items: [
          ...(current.inventory?.items || []),
          {
            id: crypto.randomUUID(),
            name: selectedWeapon.name,
            level: selectedWeapon.level,
            category: selectedWeapon.category,
            price: selectedWeapon.price,
            attackBonus: selectedWeapon.attackBonus,
            defenseBonus: selectedWeapon.defenseBonus,
          },
        ],
      },
      skills: {
        ...current.skills,
        attack: (current.skills?.attack || 0) + selectedWeapon.attackBonus,
        defense: (current.skills?.defense || 0) + selectedWeapon.defenseBonus,
      },
    };

    usePlayerStore.getState().setPlayer(updated);

    setIsProcessing(false);
    setShowTransactionModal(false);
    setShowWeaponModal(false);
    setTransactionError(null);
  };

  const handleNextWeapon = () => {
    if (!selectedWeapon) return;

    const index = finalWeapons.findIndex((w) => w.level === selectedWeapon.level);

    if (index !== -1 && index < finalWeapons.length - 1) {
      setSelectedWeapon(finalWeapons[index + 1]);
    }
  };

  const handlePrevWeapon = () => {
    if (!selectedWeapon) return;

    const index = finalWeapons.findIndex((w) => w.level === selectedWeapon.level);

    if (index > 0) {
      setSelectedWeapon(finalWeapons[index - 1]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      <div className="relative flex-1 w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_770eb01b5d5c4fab9227df7948ffb4da/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80 pointer-events-none" />

        <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-auto z-50 max-w-lg">
          <AnimatePresence>
            {showDialog && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="text-white font-paragraph text-xl md:text-2xl leading-tight">
                  Olá <span className="text-primary font-bold">{playerName}</span>,
                  <br />
                  Vamos ver o que eu tenho pra você hoje...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showButton && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button
                  onClick={handleShowWeapon}
                  disabled={!finalWeapons.length}
                  className="w-full md:w-auto px-12 py-5 bg-primary text-white font-bold text-xl rounded-2xl transition"
                >
                  EXIBIR ARMA →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CardTransactionModal
        isOpen={showTransactionModal}
        isProcessing={isProcessing}
        onClose={() => {
          setShowTransactionModal(false);
          setTransactionError(null);
        }}
        onConfirm={handleBuyWeapon}
      />

      <div className="fixed bottom-8 left-6 md:left-8 z-40">
        <button
          onClick={() => navigate('/game')}
          className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl"
        >
          ← Voltar ao Game
        </button>
      </div>
    </div>
  );
}