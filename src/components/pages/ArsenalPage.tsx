import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { BaseCrudService } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { useCart } from '@/integrations';
import FeatureLevelLock from '@/components/FeatureLevelLock';
import {
  canAccessFeature,
  getFeatureLevelRequirement,
} from '@/utils/levelRequirements';

interface Weapon {
  _id: string;
  weaponName?: string;
  description?: string;
  level?: number;
  dirtyMoneyPrice?: number;
  abilityBonus?: string;
  weaponImage?: string;
}

interface WeaponCase {
  _id: string;
  itemName?: string;
  itemPrice?: number;
  itemImage?: string;
  itemDescription?: string;
  abilityBonusType?: string;
}

const SKILL_MAP: Record<string, string> = {
  attack: 'attack',
  ataque: 'attack',
  defense: 'defense',
  defesa: 'defense',
  agility: 'agility',
  agilidade: 'agility',
  intelligence: 'intelligence',
  inteligencia: 'intelligence',
  respect: 'respect',
  respeito: 'respect',
  vigor: 'vigor',
};

function normalizeSkillKey(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return SKILL_MAP[normalized] || null;
}

function weaponAlreadyOwned(player: any, weapon: Weapon | null) {
  if (!weapon?._id) return false;

  const items = player?.inventory?.items || [];
  return items.some(
    (item: any) =>
      item?.type === 'weapon' &&
      (item?.weaponId === weapon._id ||
        item?._id === weapon._id ||
        item?.name === weapon.weaponName)
  );
}

export default function ArsenalPage() {
  const navigate = useNavigate();

  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);
  const applyPlayerUpdate = usePlayerStore((state) => state.applyPlayerUpdate);

  const { addToCart } = useCart();

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [cases, setCases] = useState<WeaponCase[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedWeaponCases, setSelectedWeaponCases] = useState<WeaponCase[]>([]);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showCasesModal, setShowCasesModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'weapons' | 'cases'>('weapons');

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        const weaponsResult = await BaseCrudService.getAll<Weapon>(
          'armasarsenal',
          {},
          { limit: 100 }
        );

        const casesResult = await BaseCrudService.getAll<WeaponCase>(
          'casesdearmas',
          {},
          { limit: 600 }
        );

        setWeapons(weaponsResult.items || []);
        setCases(casesResult.items || []);
      } catch (error) {
        console.error('Erro ao carregar dados do arsenal:', error);
        setResultMessage('Erro ao carregar armas e cases do arsenal.');
        setShowResult(true);
      } finally {
        setIsLoadingData(false);
      }
    };

    void fetchData();
  }, []);

  const playerLevel = player?.niveis?.playerLevel || 1;
  const dirtyMoney = Number(player?.balances?.dirtyMoney || 0);
  const requiredLevel = getFeatureLevelRequirement('arsenal');
  const isFeatureUnlocked = canAccessFeature(playerLevel, 'arsenal');

  const selectedWeaponOwned = useMemo(
    () => weaponAlreadyOwned(player, selectedWeapon),
    [player, selectedWeapon]
  );

  const handleSelectWeapon = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setShowWeaponModal(true);
  };

  const handleBuyWeapon = async () => {
    if (!player || !selectedWeapon || isProcessing) return;

    setIsProcessing(true);

    try {
      const price = Number(selectedWeapon.dirtyMoneyPrice || 0);

      if (dirtyMoney < price) {
        setResultMessage('Saldo insuficiente de Dirtymoney.');
        setShowResult(true);
        setShowVaultModal(false);
        return;
      }

      if (weaponAlreadyOwned(player, selectedWeapon)) {
        setResultMessage('Você já comprou essa arma.');
        setShowResult(true);
        setShowVaultModal(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const skillKey = normalizeSkillKey(selectedWeapon.abilityBonus);

      applyPlayerUpdate((currentPlayer) => {
        const currentSkills = { ...(currentPlayer.skills || {}) } as Record<string, number>;

        return {
          ...currentPlayer,
          balances: {
            ...currentPlayer.balances,
            dirtyMoney: Math.max(
              0,
              Number(currentPlayer.balances?.dirtyMoney || 0) - price
            ),
          },
          inventory: {
            ...currentPlayer.inventory,
            items: [
              ...(currentPlayer.inventory?.items || []),
              {
                id: crypto.randomUUID(),
                weaponId: selectedWeapon._id,
                name: selectedWeapon.weaponName,
                level: selectedWeapon.level,
                type: 'weapon',
                abilityBonus: selectedWeapon.abilityBonus,
                weaponImage: selectedWeapon.weaponImage,
              },
            ],
          },
          skills: skillKey
            ? {
                ...currentSkills,
                [skillKey]: Number((currentSkills[skillKey] || 0) + 1),
              }
            : currentPlayer.skills,
        };
      });

      setResultMessage(`✅ ${selectedWeapon.weaponName} comprada com sucesso.`);
      setShowResult(true);
      setShowWeaponModal(false);
      setShowVaultModal(false);
    } catch (error) {
      console.error('Erro na compra da arma:', error);
      setResultMessage('Erro na compra. Tente novamente.');
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyCase = async (caseItem: WeaponCase) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      await addToCart({
        collectionId: 'casesdearmas',
        itemId: caseItem._id,
        quantity: 1,
      });

      setResultMessage(`✅ ${caseItem.itemName} adicionado ao carrinho.`);
      setShowResult(true);
    } catch (error) {
      console.error('Erro ao adicionar case ao carrinho:', error);
      setResultMessage('Erro ao adicionar ao carrinho.');
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowCases = (weapon: Weapon) => {
    setSelectedWeapon(weapon);

    const weaponName = String(weapon.weaponName || '').trim().toLowerCase();

    const weaponCases = cases.filter((caseItem) =>
      String(caseItem.itemName || '')
        .trim()
        .toLowerCase()
        .includes(weaponName)
    );

    setSelectedWeaponCases(weaponCases);
    setShowCasesModal(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  if (!isLoaded || !player?._id || isLoadingData) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          <LoadingSpinner />
        </div>
        <Footer />
      </>
    );
  }

  if (!isFeatureUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 pt-[140px] md:pt-[160px]">
          <FeatureLevelLock
            playerLevel={playerLevel}
            requiredLevel={requiredLevel}
            featureName="Arsenal"
            onNavigateToBarraco={() => navigate('/barraco')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black flex flex-col text-white">
      <Header />

      <main className="flex-1 pt-[140px] md:pt-[160px]">
        <div className="relative w-full h-96">
          <video
            ref={videoRef}
            src="https://video.wixstatic.com/video/50f4bf_770eb01b5d5c4fab9227df7948ffb4da/720p/mp4/file.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-heading text-primary drop-shadow-lg">
              ARSENAL
            </h1>
            <p className="mt-3 text-lg text-zinc-200">
              Dirtymoney disponível:{' '}
              <span className="font-black text-yellow-400">
                {dirtyMoney.toLocaleString('pt-BR')} DM
              </span>
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border-b border-zinc-700 sticky top-[88px] md:top-[96px] z-40">
          <div className="max-w-7xl mx-auto px-4 flex gap-8">
            <button
              onClick={() => setActiveTab('weapons')}
              className={`py-4 px-6 font-heading text-lg transition-colors ${
                activeTab === 'weapons'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ARMAS ({weapons.length})
            </button>

            <button
              onClick={() => setActiveTab('cases')}
              className={`py-4 px-6 font-heading text-lg transition-colors ${
                activeTab === 'cases'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CASES ({cases.length})
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
          {activeTab === 'weapons' && (
            <div>
              <h2 className="text-3xl font-heading text-white mb-8">
                Catálogo de Armas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weapons.map((weapon) => {
                  const owned = weaponAlreadyOwned(player, weapon);

                  return (
                    <div
                      key={weapon._id}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden hover:border-primary transition-colors"
                    >
                      {weapon.weaponImage && (
                        <div className="h-48 bg-black overflow-hidden">
                          <Image
                            src={weapon.weaponImage}
                            alt={weapon.weaponName || 'Weapon'}
                            className="w-full h-full object-cover"
                            width={300}
                          />
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <h3 className="text-xl font-heading text-primary">
                            {weapon.weaponName}
                          </h3>
                          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            Nv. {weapon.level}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-3">
                          {weapon.description}
                        </p>

                        <p className="text-yellow-400 text-sm mb-2">
                          <span className="font-bold">Bônus:</span>{' '}
                          {weapon.abilityBonus || 'Sem bônus'}
                        </p>

                        <p className="text-white font-bold mb-4">
                          {Number(weapon.dirtyMoneyPrice || 0).toLocaleString('pt-BR')} DM
                        </p>

                        {owned && (
                          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                            Arma já comprada.
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSelectWeapon(weapon)}
                            disabled={owned}
                            className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {owned ? 'Comprada' : 'Comprar'}
                          </button>

                          <button
                            onClick={() => handleShowCases(weapon)}
                            className="flex-1 py-2 bg-zinc-700 text-white font-bold rounded-lg hover:bg-zinc-600 transition-colors"
                          >
                            Cases
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div>
              <h2 className="text-3xl font-heading text-white mb-8">
                Cases de Estampa
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((caseItem) => (
                  <div
                    key={caseItem._id}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden hover:border-primary transition-colors"
                  >
                    {caseItem.itemImage && (
                      <div className="h-48 bg-black overflow-hidden">
                        <Image
                          src={caseItem.itemImage}
                          alt={caseItem.itemName || 'Case'}
                          className="w-full h-full object-cover"
                          width={300}
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-xl font-heading text-primary mb-2">
                        {caseItem.itemName}
                      </h3>

                      <p className="text-gray-400 text-sm mb-3">
                        {caseItem.itemDescription}
                      </p>

                      <p className="text-green-400 text-sm mb-2">
                        <span className="font-bold">Bônus:</span> +1%{' '}
                        {caseItem.abilityBonusType || 'skill'}
                      </p>

                      <p className="text-yellow-400 font-bold text-lg mb-4">
                        R$ {Number(caseItem.itemPrice || 0).toFixed(2)}
                      </p>

                      <button
                        onClick={() => {
                          void handleBuyCase(caseItem);
                        }}
                        className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        Comprar Case
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={showWeaponModal} onOpenChange={setShowWeaponModal}>
        <DialogContent className="bg-zinc-900 border-2 border-primary max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl text-primary">
              {selectedWeapon?.weaponName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWeapon?.weaponImage && (
              <div className="h-64 bg-black rounded-lg overflow-hidden">
                <Image
                  src={selectedWeapon.weaponImage}
                  alt={selectedWeapon.weaponName || 'Weapon'}
                  className="w-full h-full object-cover"
                  width={400}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 rounded-lg p-3 text-center">
                <p className="text-gray-400 text-sm">Nível</p>
                <p className="text-2xl font-bold text-primary">
                  {selectedWeapon?.level}
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-3 text-center">
                <p className="text-gray-400 text-sm">Preço</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {Number(selectedWeapon?.dirtyMoneyPrice || 0).toLocaleString('pt-BR')} DM
                </p>
              </div>
            </div>

            <div className="bg-black/50 rounded-lg p-3">
              <p className="text-gray-400 text-sm mb-2">Descrição</p>
              <p className="text-white">{selectedWeapon?.description}</p>
            </div>

            <div className="bg-black/50 rounded-lg p-3">
              <p className="text-gray-400 text-sm mb-2">Bônus</p>
              <p className="text-green-400 font-bold">
                {selectedWeapon?.abilityBonus || 'Sem bônus'}
              </p>
            </div>

            {selectedWeaponOwned && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300 text-sm">
                Você já possui essa arma.
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setShowWeaponModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-heading py-6 rounded-lg"
              >
                CANCELAR
              </Button>

              <Button
                onClick={() => setShowVaultModal(true)}
                disabled={
                  selectedWeaponOwned ||
                  dirtyMoney < Number(selectedWeapon?.dirtyMoneyPrice || 0)
                }
                className="flex-1 bg-primary hover:bg-pink-600 text-white font-heading py-6 rounded-lg disabled:opacity-50"
              >
                COMPRAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCasesModal} onOpenChange={setShowCasesModal}>
        <DialogContent className="bg-zinc-900 border-2 border-primary max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl text-primary">
              Cases de {selectedWeapon?.weaponName}
            </DialogTitle>
          </DialogHeader>

          {selectedWeaponCases.length === 0 ? (
            <div className="rounded-lg border border-zinc-700 bg-black/40 p-6 text-center text-zinc-400">
              Nenhum case específico encontrado para essa arma.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWeaponCases.map((caseItem) => (
                <div
                  key={caseItem._id}
                  className="bg-black/50 rounded-lg p-4 border border-zinc-700"
                >
                  {caseItem.itemImage && (
                    <div className="h-32 bg-black rounded-lg overflow-hidden mb-3">
                      <Image
                        src={caseItem.itemImage}
                        alt={caseItem.itemName || 'Case'}
                        className="w-full h-full object-cover"
                        width={200}
                      />
                    </div>
                  )}

                  <h4 className="text-lg font-heading text-primary mb-2">
                    {caseItem.itemName}
                  </h4>

                  <p className="text-gray-400 text-sm mb-2">
                    {caseItem.itemDescription}
                  </p>

                  <p className="text-green-400 text-sm mb-3">
                    +1% {caseItem.abilityBonusType || 'skill'}
                  </p>

                  <p className="text-yellow-400 font-bold mb-3">
                    R$ {Number(caseItem.itemPrice || 0).toFixed(2)}
                  </p>

                  <button
                    onClick={() => {
                      void handleBuyCase(caseItem);
                    }}
                    className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Comprar
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showVaultModal} onOpenChange={setShowVaultModal}>
        <DialogContent className="bg-zinc-900 border-2 border-primary max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl text-center text-primary">
              Confirmar Compra
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-8 space-y-4">
            <p className="text-gray-300">Você está prestes a comprar:</p>
            <p className="text-2xl font-heading text-primary">
              {selectedWeapon?.weaponName}
            </p>
            <p className="text-yellow-400 text-xl font-bold">
              {Number(selectedWeapon?.dirtyMoneyPrice || 0).toLocaleString('pt-BR')} Dirtymoney
            </p>
            <p className="text-gray-400 text-sm">
              Saldo atual: {dirtyMoney.toLocaleString('pt-BR')} DM
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setShowVaultModal(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-heading py-6 rounded-lg"
            >
              CANCELAR
            </Button>

            <Button
              onClick={() => {
                void handleBuyWeapon();
              }}
              disabled={isProcessing}
              className="flex-1 bg-primary hover:bg-pink-600 text-white font-heading py-6 rounded-lg disabled:opacity-50"
            >
              {isProcessing ? 'PROCESSANDO...' : 'CONFIRMAR'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="bg-zinc-900 border-2 border-primary max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl text-center text-primary">
              Resultado
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-8">
            <p className="text-xl text-gray-200 whitespace-pre-line">{resultMessage}</p>
          </div>

          <Button
            onClick={handleCloseResult}
            className="w-full bg-primary hover:bg-pink-600 text-white font-heading text-lg py-6 rounded-lg"
          >
            FECHAR
          </Button>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-8 left-6 z-50">
        <button
          onClick={() => navigate('/game')}
          className="px-8 py-4 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-bold"
        >
          ← Voltar ao Game
        </button>
      </div>

      <Footer />
    </div>
  );
}