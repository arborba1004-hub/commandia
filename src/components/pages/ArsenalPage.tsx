import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useGangBonus } from '@/hooks/useGangBonus';
import { WEAPONS, Weapon, WeaponCategory } from '@/data/armas';
import { Model3D } from '@/components/Model3D';
import DirtyMoneyVaultModal from '@/components/DirtyMoneyVaultModal';
import { isDelacaoActive } from '@/Services/punishmentService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

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
    setSelectedWeapon(currentWeapon);
    setShowWeaponModal(true);
  };

  const handleBuyWeapon = async () => {
    setIsProcessing(true);
    try {
      const inventory = player?.inventory?.items || [];
      const alreadyOwned = inventory.some((item: any) => item.level === selectedWeapon?.level);
      if (alreadyOwned) {
        setResultMessage('Você já possui essa arma!');
        setShowResult(true);
        setShowVaultModal(false);
        return;
      }
      if (isDelacaoActive(player)) {
        setResultMessage('Você está bloqueado pela delação!');
        setShowResult(true);
        setShowVaultModal(false);
        return;
      }
      if (dirtyMoney < finalPrice) {
        setResultMessage('Saldo insuficiente!');
        setShowResult(true);
        setShowVaultModal(false);
        return;
      }

      // Processa a compra
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newItem = {
        id: crypto.randomUUID(),
        name: selectedWeapon!.name,
        level: selectedWeapon!.level,
        category: selectedWeapon!.category,
        price: finalPrice,
        attackBonus: selectedWeapon!.attackBonus,
        defenseBonus: selectedWeapon!.defenseBonus,
      };

      const updated = {
        ...player,
        balances: {
          ...player!.balances,
          dirtyMoney: player!.balances.dirtyMoney - finalPrice,
        },
        inventory: {
          ...player!.inventory,
          items: [...(player!.inventory?.items || []), newItem],
        },
        skills: {
          ...player!.skills,
          attack: (player!.skills?.attack || 0) + selectedWeapon!.attackBonus,
          defense: (player!.skills?.defense || 0) + selectedWeapon!.defenseBonus,
        },
      };

      setPlayer(updated);
      setResultMessage(`✅ ${selectedWeapon!.name} comprada com sucesso!`);
      setShowResult(true);
      setShowWeaponModal(false);
      setShowVaultModal(false);
    } catch (error) {
      setResultMessage('Erro na compra. Tente novamente.');
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    if (resultMessage.includes('sucesso')) {
      navigate('/game');
    }
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col overflow-hidden">
      <Header />

      <div className="relative flex-1 w-full">
        {/* Vídeo sem overlay escuro */}
        <video
          ref={videoRef}
          src="https://video.wixstatic.com/video/50f4bf_770eb01b5d5c4fab9227df7948ffb4da/720p/mp4/file.mp4"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Conteúdo sobre o vídeo – sem fundo escuro */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-28 pb-14 px-4">
          {showDialog && (
            <div className="mb-6 text-white text-2xl drop-shadow-2xl text-center">
              Olá <span className="text-primary font-bold">{playerName}</span>,<br />
              Vamos ver o que eu tenho pra você hoje...
            </div>
          )}
          {showButton && (
            <button
              onClick={handleShowWeapon}
              className="px-8 py-4 bg-primary text-white font-bold text-xl rounded-2xl active:scale-95 transition-all"
            >
              EXIBIR ARMA →
            </button>
          )}
        </div>
      </div>

      {/* MODAL DA ARMA */}
      {showWeaponModal && selectedWeapon && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-white rounded-3xl w-full max-w-2xl p-8 text-white max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold">{selectedWeapon.name}</h2>
                <p className="text-gray-400 text-sm mt-2">{CATEGORY_LABELS[selectedWeapon.category]} • Nível {selectedWeapon.level}</p>
              </div>
              <button onClick={() => setShowWeaponModal(false)} className="text-4xl leading-none text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="mb-6 bg-black/50 rounded-2xl overflow-hidden" style={{ height: '300px' }}>
              <Model3D modelUrl={selectedWeapon.object3d} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/40 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-sm">Ataque</p>
                <p className="text-2xl font-bold text-green-400">+{selectedWeapon.attackBonus}</p>
              </div>
              <div className="bg-black/40 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-sm">Defesa</p>
                <p className="text-2xl font-bold text-blue-400">+{selectedWeapon.defenseBonus}</p>
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

            <div className="flex gap-4">
              <button onClick={() => setShowWeaponModal(false)} className="flex-1 py-4 bg-gray-700 rounded-2xl text-lg font-medium active:bg-gray-600">Voltar</button>
              <button 
                onClick={() => setShowVaultModal(true)} 
                disabled={dirtyMoney < finalPrice || isProcessing} 
                className="flex-1 py-4 bg-primary rounded-2xl text-lg font-bold active:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                COMPRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO COFRE (idêntico ao Suborno) */}
      <DirtyMoneyVaultModal
  open={showVaultModal}
  onOpenChange={setShowVaultModal}
  amount={subornoValue}
  playerDirtyMoney={player.balances.dirtyMoney}
  onConfirm={handlePaySuborno}
  isProcessing={isProcessing}
  title="Pagamento do Suborno"
  confirmLabel="Confirmar Pagamento"
  insufficientTitle="COFRE VAZIO"
  insufficientMessage="Você não tem dinheiro sujo suficiente para pagar este suborno."
/>

      {/* MODAL DE RESULTADO (idêntico ao Suborno) */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="bg-gray-900 border-emerald-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl text-center">Resultado da Compra</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="font-paragraph text-xl whitespace-pre-line text-gray-200 leading-relaxed">{resultMessage}</p>
          </div>
          <Button
            onClick={handleCloseResult}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xl py-7 rounded-3xl"
          >
            FECHAR
          </Button>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-8 left-6 z-50">
        <button onClick={() => navigate('/game')} className="px-8 py-4 bg-zinc-800 text-white rounded-2xl">← Voltar ao Game</button>
      </div>

      <Footer />
    </div>
  );
}