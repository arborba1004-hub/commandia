import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useGangBonus } from '@/hooks/useGangBonus';
import { WEAPONS, Weapon, WeaponCategory } from '@/data/armas';
import { Model3D } from '@/components/Model3D';
import { isDelacaoActive } from '@/Services/punishmentService';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

    const inventory = player?.inventory?.items || [];
    const alreadyOwned = inventory.some((item: any) => item.level === currentWeapon.level);
    if (alreadyOwned) {
      setTransactionError('Você já possui essa arma');
      setShowConfirmModal(false);
      return;
    }
    if (isDelacaoActive(player)) {
      setTransactionError('Você está bloqueado pela delação');
      setShowConfirmModal(false);
      return;
    }
    if (dirtyMoney < finalPrice) {
      setTransactionError('Saldo insuficiente');
      setShowConfirmModal(false);
      return;
    }

    setIsProcessing(true);
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
    setShowConfirmModal(false);
    setShowWeaponModal(false);
    setTransactionError(null);
    
    setTimeout(() => {
      navigate('/game');
    }, 500);
  };

  const hasSufficientFunds = dirtyMoney >= finalPrice;

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

      {/* MODAL DA ARMA */}
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
                  setShowConfirmModal(true);
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

      {/* MODAL DE CONFIRMAÇÃO (COFRE SIMPLES) */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-gray-900 border-8 border-green-800 max-w-3xl h-[500px] flex flex-col items-center justify-center p-0 overflow-hidden">
          <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-gray-800 to-gray-950 p-8">
            {hasSufficientFunds ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="rounded-lg overflow-hidden border-4 border-green-800 shadow-2xl">
                  <Image
                    src="https://static.wixstatic.com/media/50f4bf_5868d04681cb49d1a58d89dc4493574f~mv2.png"
                    alt="Moeda Oficial do Complexo"
                    width={400}
                    height={400}
                    className="object-cover"
                  />
                </div>
                <p className="text-green-400 font-heading text-2xl text-center">
                  R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            ) : (
              <div className="text-center">
                <p className="font-heading text-4xl text-destructive mb-4">COFRE VAZIO</p>
                <p className="font-paragraph text-gray-300 text-xl">Você não tem saldo suficiente.</p>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6 flex gap-4">
              <Button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              {hasSufficientFunds && (
                <Button
                  onClick={handleBuyWeapon}
                  className="flex-1 bg-primary hover:bg-primary/80 text-black"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              )}
            </div>

            <div className="absolute top-4 left-4 right-4">
              <p className="text-gray-300 text-sm text-center">
                Saldo Atual: R$ {dirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-8 left-6 z-50">
        <button onClick={() => navigate('/game')} className="px-8 py-4 bg-zinc-800 text-white rounded-2xl">← Voltar ao Game</button>
      </div>

      <Footer />
    </div>
  );
}