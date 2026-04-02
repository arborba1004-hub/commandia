import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { usePlayerStore } from '@/store/playerStore';
import { WEAPONS, Weapon } from '@/data/armas';
import CardTransactionModal from '@/components/CardTransactionModal';
import { isDelacaoActive } from '@/services/punishmentService';

export default function ArsenalPage() {
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const setPlayer = usePlayerStore((state) => state.setPlayer);

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

  const availableWeapons = WEAPONS
    .filter((w) => w.level <= playerLevel)
    .sort((a, b) => a.level - b.level);

  // Vídeo simples
  const videoRef = useRef<HTMLVideoElement>(null);

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
    if (availableWeapons.length === 0) {
      alert("Nenhuma arma disponível para seu nível!");
      return;
    }
    setSelectedWeapon(availableWeapons[0]);
    setShowWeaponModal(true);
  };

  const handleBuyWeapon = async () => {
    if (!selectedWeapon) return;
    alert("Compra simulada - arma comprada!"); // teste rápido
    setShowTransactionModal(false);
    setShowWeaponModal(false);
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col overflow-hidden">
      <Header />

      <div className="relative flex-1 w-full bg-black">
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_770eb01b5d5c4fab9227df7948ffb4da/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90" />

        {/* Diálogo + Botão */}
        <div className="absolute bottom-12 left-6 right-6 z-50">
          {showDialog && (
            <div className="mb-6 text-white text-2xl drop-shadow-2xl">
              Olá <span className="text-primary font-bold">{playerName}</span>,<br />
              Vamos ver o que eu tenho pra você hoje...
            </div>
          )}

          {showButton && (
            <button
              onClick={handleShowWeapon}
              className="w-full py-6 bg-primary text-white font-bold text-2xl rounded-3xl active:bg-pink-600 active:scale-95 transition-all"
            >
              EXIBIR ARMA →
            </button>
          )}
        </div>
      </div>

      {/* MODAL MAIS SIMPLES POSSÍVEL */}
      {showWeaponModal && selectedWeapon && (
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-white rounded-3xl w-full max-w-md p-8 text-white">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold">{selectedWeapon.name}</h2>
              <button 
                onClick={() => setShowWeaponModal(false)}
                className="text-4xl leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-lg mb-8">Preço: R$ {selectedWeapon.price.toLocaleString('pt-BR')}</p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowWeaponModal(false)}
                className="flex-1 py-4 bg-gray-700 rounded-2xl text-lg"
              >
                Fechar
              </button>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="flex-1 py-4 bg-primary rounded-2xl text-lg font-bold"
              >
                COMPRAR
              </button>
            </div>
          </div>
        </div>
      )}

      <CardTransactionModal
        isOpen={showTransactionModal}
        isProcessing={isProcessing}
        onClose={() => setShowTransactionModal(false)}
        onConfirm={handleBuyWeapon}
      />

      <div className="fixed bottom-8 left-6 z-50">
        <button
          onClick={() => navigate('/game')}
          className="px-8 py-4 bg-zinc-800 text-white rounded-2xl"
        >
          ← Voltar ao Game
        </button>
      </div>
    </div>
  );
}