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

  // Armas disponíveis até o nível do jogador
  const availableWeapons = WEAPONS
    .filter((w) => w.level <= playerLevel)
    .sort((a, b) => a.level - b.level);

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
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const updated = {
      ...player,
      balances: {
        ...player.balances,
        dirtyMoney: player.balances.dirtyMoney - selectedWeapon.price,
      },
      inventory: {
        ...player.inventory,
        items: [
          ...(player.inventory?.items || []),
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
        ...player.skills,
        attack: (player.skills?.attack || 0) + selectedWeapon.attackBonus,
        defense: (player.skills?.defense || 0) + selectedWeapon.defenseBonus,
      },
    };

    setPlayer(updated);

    setIsProcessing(false);
    setShowTransactionModal(false);
    setShowWeaponModal(false);
    setTransactionError(null);

    alert(`✅ ${selectedWeapon.name} comprada com sucesso!`);
  };

  const handleNextWeapon = () => {
    if (!selectedWeapon) return;
    const index = availableWeapons.findIndex((w) => w.level === selectedWeapon.level);
    if (index !== -1 && index < availableWeapons.length - 1) {
      setSelectedWeapon(availableWeapons[index + 1]);
    }
  };

  const handlePrevWeapon = () => {
    if (!selectedWeapon) return;
    const index = availableWeapons.findIndex((w) => w.level === selectedWeapon.level);
    if (index > 0) {
      setSelectedWeapon(availableWeapons[index - 1]);
    }
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

      {/* ==================== MODAL DA ARMA ==================== */}
      {showWeaponModal && selectedWeapon && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-white rounded-3xl w-full max-w-lg p-8 text-white">
            
            {/* Nome da arma */}
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-primary">{selectedWeapon.name}</h2>
              <button 
                onClick={() => setShowWeaponModal(false)}
                className="text-4xl leading-none text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Objeto 3D */}
            <div className="w-full h-72 bg-black rounded-2xl mb-8 flex items-center justify-center overflow-hidden border border-white/20">
              <Model3D modelUrl={selectedWeapon.glb} />
            </div>

            {/* Informações detalhadas */}
            <div className="space-y-5 mb-8 text-lg">
              <div>
                <p className="text-gray-400 text-sm">Filtro</p>
                <p className="font-medium">{selectedWeapon.filter}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Brilho</p>
                <p className="font-medium">Alto</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Saturação</p>
                <p className="font-medium">Média</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Bônus de Habilidade</p>
                <p className="font-medium">
                  +{selectedWeapon.attackBonus}% Ataque / +{selectedWeapon.defenseBonus}% Defesa
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Valor</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {selectedWeapon.price.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="pt-4 border-t border-white/20">
                <p className="text-gray-400 text-sm">Seu saldo atual</p>
                <p className="text-xl">
                  R$ {dirtyMoney.toLocaleString('pt-BR')}
                  {dirtyMoney < selectedWeapon.price && (
                    <span className="text-red-400 ml-2">(Insuficiente)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWeaponModal(false);
                  setTransactionError(null);
                }}
                className="flex-1 py-4 bg-gray-700 rounded-2xl text-lg font-medium active:bg-gray-600"
              >
                Fechar
              </button>
              <button
                onClick={() => setShowTransactionModal(true)}
                disabled={dirtyMoney < selectedWeapon.price || isProcessing}
                className="flex-1 py-4 bg-primary rounded-2xl text-lg font-bold active:bg-pink-600 disabled:opacity-50"
              >
                COMPRAR
              </button>
            </div>

            {transactionError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-2xl text-red-400 text-center">
                {transactionError}
              </div>
            )}
          </div>
        </div>
      )}

      <CardTransactionModal
        isOpen={showTransactionModal}
        isProcessing={isProcessing}
        onClose={() => {
          setShowTransactionModal(false);
          setTransactionError(null);
        }}
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