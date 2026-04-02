import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { usePlayerStore } from '@/store/playerStore';
import { WEAPONS, canBuyWeapon, Weapon } from '@/data/armas';
import CardTransactionModal from '@/components/CardTransactionModal';
import { Model3D } from '@/components/Model3D';
import { isDelacaoActive } from '@/services/punishmentService';

export default function ArsenalPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.player);
  const { removeDirtyMoney, addInventoryItem, addSkill } = usePlayerStore((state) => ({
    removeDirtyMoney: state.removeDirtyMoney,
    addInventoryItem: state.addInventoryItem,
    addSkill: state.addSkill,
  }));

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const playerName = player?.name || 'Guerreiro';
  const playerLevel = player?.niveis?.barracoLevel || 1;
  const dirtyMoney = player?.balances?.dirtyMoney || 0;

  // Filter weapons by player level
  const availableWeapons = WEAPONS.filter((w) => w.level === playerLevel);

  if (!availableWeapons.length) return;

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
    if (!availableWeapons.length) return;

    setSelectedWeapon(availableWeapons[0]);
    setShowWeaponModal(true);
    setTransactionError(null);
  };

  const handleBuyWeapon = async () => {
    if (!selectedWeapon) return;

    // Check if player already owns this weapon
    const alreadyOwned = player?.inventory?.items?.some(
      (item: any) => item.level === selectedWeapon.level
    );

    if (alreadyOwned) {
      setTransactionError('Você já possui essa arma');
      return;
    }

    // Check if player is blocked by delação
    if (isDelacaoActive(player)) {
      setTransactionError('Você está bloqueado pela delação');
      return;
    }

    if (dirtyMoney < selectedWeapon.price) {
      setTransactionError('Saldo insuficiente');
      return;
    }

    setIsProcessing(true);

    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update player state
    removeDirtyMoney(selectedWeapon.price);
    addInventoryItem({
      id: `weapon-${selectedWeapon.level}-${Date.now()}`,
      name: selectedWeapon.name,
      level: selectedWeapon.level,
      category: selectedWeapon.category,
      price: selectedWeapon.price,
      attackBonus: selectedWeapon.attackBonus,
      defenseBonus: selectedWeapon.defenseBonus,
    });
    addSkill('attack', selectedWeapon.attackBonus);
    addSkill('defense', selectedWeapon.defenseBonus);

    setIsProcessing(false);
    setShowTransactionModal(false);
    setShowWeaponModal(false);
    setTransactionError(null);
  };

  const handleNextWeapon = () => {
    if (!selectedWeapon) return;
    const currentIndex = availableWeapons.findIndex((w) => w.level === selectedWeapon.level);
    if (currentIndex < availableWeapons.length - 1) {
      setSelectedWeapon(availableWeapons[currentIndex + 1]);
    }
  };

  const handlePrevWeapon = () => {
    if (!selectedWeapon) return;
    const currentIndex = availableWeapons.findIndex((w) => w.level === selectedWeapon.level);
    if (currentIndex > 0) {
      setSelectedWeapon(availableWeapons[currentIndex - 1]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      <div className="relative flex-1 w-full overflow-hidden">
        {/* VIDEO */}
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_770eb01b5d5c4fab9227df7948ffb4da/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="w-[80%] h-full object-cover mx-auto"
        />

        {/* DIALOG - RIGHT SIDE */}
        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 max-w-xs"
            >
              <div className="bg-black border-2 border-black p-6 rounded-lg">
                <p className="text-white font-paragraph text-base md:text-lg leading-relaxed">
                  Olá {playerName}
                  <br />
                  Vamos ver o que eu tenho pra você hoje...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BUTTON */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute right-4 bottom-8 z-30"
            >
              <button
                onClick={handleShowWeapon}
                disabled={availableWeapons.length === 0}
                className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Exibir Arma
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WEAPON MODAL */}
      <AnimatePresence>
        {showWeaponModal && selectedWeapon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border-2 border-white w-full max-w-2xl rounded-lg p-8 max-h-[90vh] overflow-y-auto"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-heading text-3xl">{selectedWeapon.name}</h2>
                <button
                  onClick={() => setShowWeaponModal(false)}
                  className="text-white text-2xl hover:text-primary transition"
                >
                  ✕
                </button>
              </div>

              {/* 3D MODEL */}
              <div className="w-full h-80 bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
                <Model3D modelUrl={selectedWeapon.glb} />
              </div>

              {/* WEAPON INFO */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Categoria</p>
                  <p className="text-white font-bold text-lg capitalize">{selectedWeapon.category}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Filtro</p>
                  <p className="text-white font-bold text-lg">{selectedWeapon.filter}</p>
                </div>
              </div>

              {/* BONUSES */}
              <div className="bg-gray-900 p-4 rounded-lg mb-6">
                <h3 className="text-white font-bold mb-3">Bônus de Habilidade</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Ataque</p>
                    <p className="text-primary font-bold text-xl">+{selectedWeapon.attackBonus}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Defesa</p>
                    <p className="text-primary font-bold text-xl">+{selectedWeapon.defenseBonus}</p>
                  </div>
                </div>
              </div>

              {/* PRICE */}
              <div className="bg-primary/20 border border-primary p-4 rounded-lg mb-6">
                <p className="text-gray-400 text-sm">Preço</p>
                <p className="text-primary font-bold text-3xl">R$ {selectedWeapon.price.toLocaleString('pt-BR')}</p>
                <p className="text-gray-400 text-xs mt-2">
                  Saldo: R$ {dirtyMoney.toLocaleString('pt-BR')} {dirtyMoney < selectedWeapon.price && '(Insuficiente)'}
                </p>
              </div>

              {/* NAVIGATION */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handlePrevWeapon}
                  disabled={availableWeapons[0].level === selectedWeapon.level}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Anterior
                </button>
                <button
                  onClick={handleNextWeapon}
                  disabled={availableWeapons[availableWeapons.length - 1].level === selectedWeapon.level}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Próxima →
                </button>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowWeaponModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-bold"
                >
                  Fechar
                </button>
                <button
                  onClick={() => setShowTransactionModal(true)}
                  disabled={dirtyMoney < selectedWeapon.price}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold"
                >
                  Comprar
                </button>
              </div>

              {transactionError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                  {transactionError}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD TRANSACTION MODAL */}
      <CardTransactionModal
        isOpen={showTransactionModal}
        isProcessing={isProcessing}
        onClose={() => {
          setShowTransactionModal(false);
          setTransactionError(null);
        }}
        onConfirm={handleBuyWeapon}
      />

      {/* BACK TO GAME BUTTON */}
      <div className="fixed bottom-8 left-8 z-40">
        <button
          onClick={() => navigate('/game')}
          className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition"
        >
          ← Voltar ao Game
        </button>
      </div>
    </div>
  );
}
