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
  const setPlayer = usePlayerStore((state) => state.setPlayer);

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

  const availableWeapons = WEAPONS.filter((w) => w.level === playerLevel);

  const fallbackWeapon = WEAPONS[0];

  const safeWeapons = availableWeapons.length ? availableWeapons : [fallbackWeapon];

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
    if (!safeWeapons.length) return;
    setSelectedWeapon(safeWeapons[0]);
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

    // Agrupa todas as atualizações em uma única chamada
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
    const currentIndex = safeWeapons.findIndex((w) => w.level === selectedWeapon.level);
    if (currentIndex !== -1 && currentIndex < safeWeapons.length - 1) {
      setSelectedWeapon(safeWeapons[currentIndex + 1]);
    }
  };

  const handlePrevWeapon = () => {
    if (!selectedWeapon) return;
    const currentIndex = safeWeapons.findIndex((w) => w.level === selectedWeapon.level);
    if (currentIndex > 0 && currentIndex !== -1) {
      setSelectedWeapon(safeWeapons[currentIndex - 1]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      {/* VÍDEO FULL SCREEN ABAIXO DO HEADER */}
      <div className="relative flex-1 w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_770eb01b5d5c4fab9227df7948ffb4da/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradiente forte para legibilidade em mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

        {/* DIÁLOGO + BOTÃO - Posicionados na parte inferior esquerda */}
        <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-auto z-30 max-w-lg">
          <AnimatePresence>
            {showDialog && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="text-white font-paragraph text-xl md:text-2xl leading-tight drop-shadow-[0_4px_15px_rgba(0,0,0,0.95)]">
                  Olá <span className="text-primary font-bold">{playerName}</span>,
                  <br />
                  Vamos ver o que eu tenho pra você hoje...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <button
                  onClick={handleShowWeapon}
                  disabled={!safeWeapons.length}
                  className="w-full md:w-auto px-12 py-5 bg-primary hover:bg-pink-600 text-white font-bold text-xl rounded-2xl transition-all duration-300 shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  EXIBIR ARMA
                  <span className="text-2xl">→</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* WEAPON MODAL (mantido com visual premium) */}
      <AnimatePresence>
        {showWeaponModal && selectedWeapon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-white/30 w-full max-w-2xl rounded-3xl p-8 max-h-[92vh] overflow-y-auto shadow-2xl"
            >
              {/* conteúdo do modal igual ao anterior */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-white font-heading text-4xl tracking-tight">{selectedWeapon.name}</h2>
                <button
                  onClick={() => setShowWeaponModal(false)}
                  className="text-white text-3xl hover:text-primary transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="w-full h-80 bg-zinc-950 rounded-2xl mb-8 flex items-center justify-center overflow-hidden border border-white/10">
                <Model3D modelUrl={selectedWeapon.glb} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">Categoria</p>
                  <p className="text-white font-bold text-xl capitalize mt-1">{selectedWeapon.category}</p>
                </div>
                <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">Filtro</p>
                  <p className="text-white font-bold text-xl mt-1">{selectedWeapon.filter}</p>
                </div>
              </div>

              <div className="bg-zinc-950 p-6 rounded-2xl mb-8 border border-white/10">
                <h3 className="text-white font-bold text-xl mb-4">Bônus de Habilidade</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm">Ataque</p>
                    <p className="text-primary font-bold text-3xl">+{selectedWeapon.attackBonus}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Defesa</p>
                    <p className="text-primary font-bold text-3xl">+{selectedWeapon.defenseBonus}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 p-6 rounded-2xl mb-8">
                <p className="text-gray-400 text-sm">Preço</p>
                <p className="text-primary font-bold text-4xl mt-1">
                  R$ {selectedWeapon.price.toLocaleString('pt-BR')}
                </p>
                <p className="text-gray-400 text-sm mt-3">
                  Saldo atual: R$ {dirtyMoney.toLocaleString('pt-BR')}
                  {dirtyMoney < selectedWeapon.price && ' • Insuficiente'}
                </p>
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={handlePrevWeapon}
                  disabled={safeWeapons[0]?.level === selectedWeapon.level}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <button
                  onClick={handleNextWeapon}
                  disabled={safeWeapons[safeWeapons.length - 1]?.level === selectedWeapon.level}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition disabled:opacity-50"
                >
                  Próxima →
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowWeaponModal(false)}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition"
                >
                  Fechar
                </button>
                <button
                  onClick={() => setShowTransactionModal(true)}
                  disabled={dirtyMoney < selectedWeapon.price}
                  className="flex-1 py-4 bg-primary hover:bg-pink-600 text-white font-bold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  COMPRAR ARMA
                </button>
              </div>

              {transactionError && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-center">
                  {transactionError}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardTransactionModal
        isOpen={showTransactionModal}
        isProcessing={isProcessing}
        onClose={() => {
          setShowTransactionModal(false);
          setTransactionError(null);
        }}
        onConfirm={handleBuyWeapon}
      />

      {/* BOTÃO VOLTAR */}
      <div className="fixed bottom-8 left-6 md:left-8 z-40">
        <button
          onClick={() => navigate('/game')}
          className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg"
        >
          ← Voltar ao Game
        </button>
      </div>
    </div>
  );
}