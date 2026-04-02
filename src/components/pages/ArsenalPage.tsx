import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { usePlayerStore } from '@/store/playerStore';
import { WEAPONS, Weapon, WeaponCategory } from '@/data/armas';
import { Model3D } from '@/components/Model3D';
import SafeVaultModal from '@/components/SafeVaultModal';
import { isDelacaoActive } from '@/services/punishmentService';

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
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const setPlayer = usePlayerStore((state) => state.setPlayer);

  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<WeaponCategory | 'all'>('all');
  const [showWeaponList, setShowWeaponList] = useState(false);

  const playerName = player.name || 'Guerreiro';
  const playerLevel = player.niveis?.playerLevel || 1;
  const dirtyMoney = player.balances?.dirtyMoney || 0;

  const availableWeapons = WEAPONS
    .filter((w) => w.level <= playerLevel)
    .sort((a, b) => a.level - b.level);

  const filteredWeapons = selectedFilter === 'all'
    ? availableWeapons
    : availableWeapons.filter((w) => w.category === selectedFilter);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Controla UI com setTimeout, independente do vídeo
  useEffect(() => {
    // Mostra diálogo após 500ms
    const dialogTimer = setTimeout(() => {
      setShowDialog(true);
    }, 500);

    // Mostra botão após 2.5s
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    return () => {
      clearTimeout(dialogTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const handleShowWeapon = () => {
    if (availableWeapons.length === 0) {
      alert("Nenhuma arma disponível para seu nível!");
      return;
    }
    setShowWeaponList(true);
    setTransactionError(null);
  };

  const handleSelectWeapon = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setShowWeaponModal(true);
    setShowWeaponList(false);
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

    // Simula processamento (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 1800));

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

    // Fecha tudo
    setIsProcessing(false);
    setShowVaultModal(false);
    setShowWeaponModal(false);
    setTransactionError(null);

    // Feedback de sucesso
    alert(`✅ Arma ${selectedWeapon.name} comprada com sucesso!`);
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

        {/* Diálogo + Botão principal */}
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

      {/* MODAL DE LISTA DE ARMAS COM FILTRO */}
      {showWeaponList && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-white rounded-3xl w-full max-w-2xl p-8 text-white max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold">Seleção de Armas</h2>
              <button 
                onClick={() => setShowWeaponList(false)}
                className="text-4xl leading-none text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Filtros por Categoria */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">Filtrar por tipo:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectedFilter === 'all'
                      ? 'bg-primary text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  Todas
                </button>
                {(Object.keys(CATEGORY_LABELS) as WeaponCategory[]).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedFilter(category)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedFilter === category
                        ? 'bg-primary text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Armas */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-2">
              {filteredWeapons.length > 0 ? (
                filteredWeapons.map((weapon) => (
                  <button
                    key={weapon.level}
                    onClick={() => handleSelectWeapon(weapon)}
                    className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-left transition-all border border-gray-700 hover:border-primary"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{weapon.name}</p>
                        <p className="text-gray-400 text-sm">
                          {CATEGORY_LABELS[weapon.category]} • {weapon.filter}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-green-400">ATK: +{weapon.attackBonus}</span>
                          <span className="text-blue-400">DEF: +{weapon.defenseBonus}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-xl">
                          R$ {weapon.price.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Nenhuma arma disponível nesta categoria
                </div>
              )}
            </div>

            <button
              onClick={() => setShowWeaponList(false)}
              className="w-full py-4 bg-gray-700 rounded-2xl text-lg font-medium active:bg-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DA ARMA COM MODELO 3D */}
      {showWeaponModal && selectedWeapon && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border-2 border-white rounded-3xl w-full max-w-2xl p-8 text-white max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold">{selectedWeapon.name}</h2>
                <p className="text-gray-400 text-sm mt-2">
                  {CATEGORY_LABELS[selectedWeapon.category]} • Nível {selectedWeapon.level}
                </p>
              </div>
              <button 
                onClick={() => setShowWeaponModal(false)}
                className="text-4xl leading-none text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modelo 3D da Arma */}
            <div className="mb-6 bg-black/50 rounded-2xl overflow-hidden" style={{ height: '300px' }}>
              <Model3D modelUrl={selectedWeapon.object3d} />
            </div>

            <div className="space-y-6 mb-8 flex-1 overflow-y-auto">
              <div>
                <p className="text-gray-400 text-sm">Filtro</p>
                <p className="text-xl font-semibold text-primary">{selectedWeapon.filter}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Ataque</p>
                  <p className="text-2xl font-bold text-green-400">+{selectedWeapon.attackBonus}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Defesa</p>
                  <p className="text-2xl font-bold text-blue-400">+{selectedWeapon.defenseBonus}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Preço</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {selectedWeapon.price.toLocaleString('pt-BR')}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Seu saldo</p>
                <p className="text-xl">
                  R$ {dirtyMoney.toLocaleString('pt-BR')}
                  {dirtyMoney < selectedWeapon.price && (
                    <span className="text-red-400"> (Insuficiente)</span>
                  )}
                </p>
              </div>
            </div>

            {transactionError && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl text-red-400 text-center">
                {transactionError}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWeaponModal(false);
                  setTransactionError(null);
                }}
                className="flex-1 py-4 bg-gray-700 rounded-2xl text-lg font-medium active:bg-gray-600"
              >
                Voltar
              </button>
              <button
                onClick={() => setShowVaultModal(true)}
                disabled={dirtyMoney < selectedWeapon.price || isProcessing}
                className="flex-1 py-4 bg-primary rounded-2xl text-lg font-bold active:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                COMPRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Transação */}
      <SafeVaultModal
        open={showVaultModal}
        onOpenChange={setShowVaultModal}
        subornoValue={selectedWeapon?.price || 0}
        playerDirtyMoney={dirtyMoney}
        onConfirm={handleBuyWeapon}
        isProcessing={isProcessing}
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