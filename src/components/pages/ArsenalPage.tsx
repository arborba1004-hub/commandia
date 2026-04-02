import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (availableWeapons.length === 0) return;
    setSelectedWeapon(availableWeapons[0]);
    setShowWeaponModal(true);   // ← força a abertura
    setTransactionError(null);
  };

  // ... (handleBuyWeapon, handleNextWeapon, handlePrevWeapon ficam iguais ao código anterior)

  const handleBuyWeapon = async () => {
    if (!selectedWeapon) return;
    // ... (mesma lógica de antes - copie do código que eu te passei na mensagem anterior)
    // no final: setPlayer(updated); setShowWeaponModal(false); etc.
  };

  // handleNextWeapon e handlePrevWeapon iguais ao anterior

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
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />

        {/* Diálogo + Botão */}
        <div className="absolute bottom-10 left-6 right-6 z-50 max-w-lg">
          {showDialog && (
            <div className="mb-8 text-white text-xl md:text-2xl drop-shadow-2xl">
              Olá <span className="text-primary font-bold">{playerName}</span>,<br />
              Vamos ver o que eu tenho pra você hoje...
            </div>
          )}

          {showButton && (
            <button
              onClick={handleShowWeapon}
              className="w-full bg-primary hover:bg-pink-600 py-5 text-white font-bold text-xl rounded-2xl shadow-2xl active:scale-95 transition"
            >
              EXIBIR ARMA →
            </button>
          )}
        </div>
      </div>

      {/* MODAL SIMPLIFICADO PARA TESTE */}
      {showWeaponModal && selectedWeapon && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-zinc-950 border border-white/30 w-full max-w-lg rounded-3xl p-8">
            <div className="flex justify-between mb-6">
              <h2 className="text-3xl text-white">{selectedWeapon.name}</h2>
              <button 
                onClick={() => setShowWeaponModal(false)}
                className="text-4xl text-white"
              >
                ✕
              </button>
            </div>

            <div className="h-64 bg-black rounded-2xl mb-6 flex items-center justify-center">
              <Model3D modelUrl={selectedWeapon.glb} />
            </div>

            <p className="text-white text-lg mb-4">Preço: R$ {selectedWeapon.price.toLocaleString('pt-BR')}</p>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowWeaponModal(false)}
                className="flex-1 py-4 bg-gray-700 rounded-2xl text-white"
              >
                Fechar
              </button>
              <button 
                onClick={() => setShowTransactionModal(true)}
                className="flex-1 py-4 bg-primary rounded-2xl text-white font-bold"
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