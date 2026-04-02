import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useGangBonus } from '@/hooks/useGangBonus';
import { WEAPONS, Weapon, WeaponCategory } from '@/data/armas';
import { Model3D } from '@/components/Model3D';
import SafeVaultModal from '@/components/SafeVaultModal';
import { isDelacaoActive } from '@/Services/punishmentService';

const CATEGORY_LABELS: Record<WeaponCategory, string> = {
  knife: 'Faca',
  revolver: 'Revólver',
  pistol: 'Pistola',
  auto_pistol: 'Pistola Automática',
  smg: 'Metralhadora Leve',
  shotgun: 'Espingarda',
  rifle: 'Rifle',
  assault: 'Fuzil de Assalto',
  machinegun: 'Metralhadora',
  launcher: 'Lançador',
};

export default function ArsenalPage() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayerStore();
  const { getArsenalCostReduction } = useGangBonus();

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const playerName = player?.name || 'Guerreiro';
  const playerLevel = player?.niveis?.playerLevel || 1;
  const dirtyMoney = player?.balances?.dirtyMoney || 0;
  const costReductionPercent = getArsenalCostReduction();

  const currentWeapon = WEAPONS.find(w => w.level === playerLevel) || WEAPONS[playerLevel - 1];
  const finalPrice = currentWeapon ? Math.floor(currentWeapon.price * (1 - costReductionPercent / 100)) : 0;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dialogTimer = setTimeout(() => setShowDialog(true), 500);
    const buttonTimer = setTimeout(() => setShowButton(true), 2500);
    return () => {
      clearTimeout(dialogTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const handleShowWeapon = () => {
    if (!currentWeapon) {
      alert("Nenhuma arma disponível para seu nível!");
      return;
    }
    setShowWeaponModal(true);
    setTransactionError(null);
  };

  const handleBuyWeapon = async () => {
    if (!currentWeapon) return;

    // Verificações antes de abrir o modal (já feitas no modal, mas reforça)
    const inventory = player?.inventory?.items || [];
    const alreadyOwned = inventory.some((item: any) => item.level === currentWeapon.level);
    if (alreadyOwned) {
      setTransactionError('Você já possui essa arma');
      setShowVaultModal(false);
      return;
    }
    if (isDelacaoActive(player)) {
      setTransactionError('Você está bloqueado pela delação');
      setShowVaultModal(false);
      return;
    }
    if (dirtyMoney < finalPrice) {
      setTransactionError('Saldo insuficiente');
      setShowVaultModal(false);
      return;
    }

    setIsProcessing(true);

    // Simula processamento (substituir por chamada backend depois)
    await new Promise(resolve => setTimeout(resolve, 1800));

    const newItem = {
      id: crypto.randomUUID(),
      name: currentWeapon.name,
      level: currentWeapon.level,
      category: currentWeapon.category,
      price: finalPrice,
      attackBonus: currentWeapon.attackBonus,
      defenseBonus: currentWeapon.defenseBonus,
    };

    const updated = {
      ...player,
      balances: {
        ...player.balances,
        dirtyMoney: player.balances.dirtyMoney - finalPrice,
      },
      inventory: {
        ...player.inventory,
        items: [...(player.inventory?.items || []), newItem],
      },
      skills: {
        ...player.skills,
        attack: (player.skills?.attack || 0) + currentWeapon.attackBonus,
        defense: (player.skills?.defense || 0) + currentWeapon.defenseBonus,
      },
    };

    setPlayer(updated);
    setIsProcessing(false);
    setShowVaultModal(false);
    setShowWeaponModal(false);
    setTransactionError(null);
    
    // Pequeno delay para o modal fechar suavemente
    setTimeout(() => {
      navigate('/game');
    }, 500);
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

      {/* MODAL DA ARMA (DIRETO, SEM LISTA) */}
      {showWeaponModal && currentWeapon && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-white rounded-3xl w-full max-w-2xl p-8 text-white max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold">{currentWeapon.name}</h2>
                <p className="text-gray-400 text-sm mt-2">{CATEGORY_LABELS[currentWeapon.category]} • Nível {currentWeapon.level}</p>
              </div>
              <button onClick={() => setShowWeaponModal(false)} className="text-4xl leading-none text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="mb-6 bg-black/50 rounded-2xl overflow-hidden" style={{ height: '300px' }}>
              <Model3D modelUrl={currentWeapon.object3d} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/40 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-sm">Ataque</p>
                <p className="text-2xl font-bold text-green-400">+{currentWeapon.attackBonus}</p>
              </div>
              <div className="bg-black/40 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-sm">Defesa</p>
                <p className="text-2xl font-bold text-blue-400">+{currentWeapon.defenseBonus}</p>
              </div>
            </div>

            {costReductionPercent > 0 && (
              <div className="mb-4 bg-purple-900/30 rounded-xl p-3 text-center">
                <p className="text-purple-300 text-sm">Desconto da Gang (Armeiro)</p>
                <p className="text-xl font-bold text-purple-400">-{costReductionPercent}% no preço</p>
              </div>
            )}

            <div className="mb-6 text-center">
              <p className="text-gray-400 text-sm">Preço com desconto</p>
              <p className="text-3xl font-bold text-primary">R$ {finalPrice.toLocaleString('pt-BR')}</p>
            </div>

            {transactionError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-400 text-center">{transactionError}</div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setShowWeaponModal(false)} className="flex-1 py-4 bg-gray-700 rounded-2xl text-lg font-medium active:bg-gray-600">Voltar</button>
              <button 
                onClick={() => {
                  setTransactionError(null);
                  setShowVaultModal(true);
                }} 
                disabled={dirtyMoney < finalPrice || isProcessing} 
                className="flex-1 py-4 bg-primary rounded-2xl text-lg font-bold active:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                COMPRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Cofre para confirmação de saldo */}
      <SafeVaultModal
        open={showVaultModal}
        onOpenChange={setShowVaultModal}
        subornoValue={finalPrice}
        playerDirtyMoney={dirtyMoney}
        onConfirm={handleBuyWeapon}
        isProcessing={isProcessing}
      />

      <div className="fixed bottom-8 left-6 z-50">
        <button onClick={() => navigate('/game')} className="px-8 py-4 bg-zinc-800 text-white rounded-2xl">← Voltar ao Game</button>
      </div>

      <Footer />
    </div>
  );
}