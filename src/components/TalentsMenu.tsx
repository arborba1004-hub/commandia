import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { TalentosdoCrime } from '@/entities';
import { useTalentStore } from '@/store/talentStore';
import { usePlayerStore } from '@/store/playerStore';
import { getEffectValue } from '@/utils/talentEffects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Lock, Unlock, Star, TrendingUp } from 'lucide-react';
import TalentUpgradeModal from '@/components/TalentUpgradeModal';

interface TalentWithProgress extends TalentosdoCrime {
  currentLevel: number;
  isUnlocked: boolean;
}

const LEVEL_COSTS = {
  1: 10000,
  2: 25000,
  3: 50000,
  4: 100000,
  5: 200000,
};

export default function TalentsMenu() {
  const [talents, setTalents] = useState<TalentWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('available');
  const [notification, setNotification] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTalentForUpgrade, setSelectedTalentForUpgrade] =
    useState<TalentWithProgress | null>(null);

  const talentStore = useTalentStore();
  const player = usePlayerStore((state) => state.player);
  const applyPlayerUpdate = usePlayerStore((state) => state.applyPlayerUpdate);
  const syncPlayerToBackend = usePlayerStore((state) => state.syncPlayerToBackend);

  const dirtyMoney = Number(player?.balances?.dirtyMoney || 0);
  const playerLevel = Number(player?.niveis?.playerLevel || 1);

  useEffect(() => {
    void loadTalents();
  }, [playerLevel]);

  const loadTalents = async () => {
    try {
      setIsLoading(true);

      const result = await BaseCrudService.getAll<TalentosdoCrime>('talentosdocrime', [], {
        limit: 100,
      });

      const talentsWithProgress = result.items.map((talent) => ({
        ...talent,
        currentLevel: talentStore.getTalentLevel(talent._id!),
        isUnlocked: talentStore.isTalentUnlocked(talent._id!),
      }));

      setTalents(
        talentsWithProgress.sort((a, b) => (a.unlockLevel || 0) - (b.unlockLevel || 0))
      );
    } catch (error) {
      console.error('Erro ao carregar talentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canUnlockTalent = (talent: TalentosdoCrime): boolean => {
    if (talent.isAutoUnlock && playerLevel >= (talent.unlockLevel || 0)) {
      return true;
    }

    return (
      playerLevel >= (talent.unlockLevel || 0) &&
      !talentStore.isTalentUnlocked(talent._id!)
    );
  };

  const canUpgradeTalent = (talent: TalentWithProgress): boolean => {
    const nextLevel = talent.currentLevel + 1;
    if (nextLevel > (talent.maxSkillLevel || 5)) return false;
    const cost = LEVEL_COSTS[nextLevel as keyof typeof LEVEL_COSTS];
    return dirtyMoney >= cost;
  };

  const handleUnlockTalent = async (talent: TalentosdoCrime) => {
    const cost = talent.isAutoUnlock ? 1 : talent.unlockCostDirtyMoney || 10000;

    if (dirtyMoney < cost) {
      showNotification('❌ Dinheiro sujo insuficiente!');
      return;
    }

    try {
      talentStore.unlockTalent(talent._id!, talent.skillName || '');

      applyPlayerUpdate((currentPlayer) => ({
        ...currentPlayer,
        balances: {
          ...currentPlayer.balances,
          dirtyMoney: Math.max(
            0,
            Number(currentPlayer.balances?.dirtyMoney || 0) - cost
          ),
        },
      }));

      await syncPlayerToBackend();

      const slang = [
        `Desbloqueou a braba: ${talent.skillName}, menor!`,
        `Ó o talento aí! ${talent.skillName} tá na conta!`,
        `Bora lá! Conseguiu ${talent.skillName}!`,
      ];

      showNotification(slang[Math.floor(Math.random() * slang.length)]);
      await loadTalents();
    } catch (error) {
      console.error('Erro ao desbloquear talento:', error);
      showNotification('❌ Erro ao desbloquear talento.');
    }
  };

  const handleUpgradeTalent = async (talent: TalentWithProgress) => {
    const nextLevel = talent.currentLevel + 1;
    const cost = LEVEL_COSTS[nextLevel as keyof typeof LEVEL_COSTS];

    if (dirtyMoney < cost) {
      showNotification('❌ Dinheiro sujo insuficiente!');
      return;
    }

    try {
      talentStore.upgradeTalent(talent._id!);

      applyPlayerUpdate((currentPlayer) => ({
        ...currentPlayer,
        balances: {
          ...currentPlayer.balances,
          dirtyMoney: Math.max(
            0,
            Number(currentPlayer.balances?.dirtyMoney || 0) - cost
          ),
        },
      }));

      await syncPlayerToBackend();

      showNotification(`⬆️ ${talent.skillName} evoluiu para nível ${nextLevel}!`);
      await loadTalents();
    } catch (error) {
      console.error('Erro ao evoluir talento:', error);
      showNotification('❌ Erro ao evoluir talento.');
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3000);
  };

  const availableTalents = talents.filter((t) => !t.isUnlocked && canUnlockTalent(t));
  const unlockedTalents = talents.filter((t) => t.isUnlocked);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-black text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-heading text-primary mb-2">
          TALENTOS DO CRIME
        </h1>
        <p className="text-gray-400 font-paragraph">
          Desbloqueie habilidades criminosas e evolua seu império. Cada talento oferece
          bônus únicos nas suas operações.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gray-900 border-primary p-4">
          <div className="text-sm text-gray-400">Nível</div>
          <div className="text-2xl font-bold text-primary">{playerLevel}</div>
        </Card>
        <Card className="bg-gray-900 border-primary p-4">
          <div className="text-sm text-gray-400">Dinheiro Sujo</div>
          <div className="text-2xl font-bold text-primary">
            ${dirtyMoney.toLocaleString()}
          </div>
        </Card>
      </div>

      {notification && (
        <div className="mb-4 p-4 bg-primary text-black rounded-lg font-bold text-center animate-pulse">
          {notification}
        </div>
      )}

      <Card className="bg-gray-900 border-gray-700 p-4 mb-6">
        <h3 className="font-bold text-lg mb-2">📚 COMO FUNCIONA</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Desbloqueie talentos ao atingir o nível necessário</li>
          <li>• Evolua cada talento de 1 a 5 com dinheiro sujo</li>
          <li>• Alguns talentos são desbloqueados automaticamente</li>
          <li>• Talentos especiais dependem das regras do próprio sistema</li>
          <li>• Efeitos são aplicados automaticamente nas operações</li>
        </ul>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
          <TabsTrigger value="available" className="data-[state=active]:bg-primary">
            Disponíveis ({availableTalents.length})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="data-[state=active]:bg-primary">
            Desbloqueados ({unlockedTalents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableTalents.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700 p-8 text-center">
              <p className="text-gray-400">Nenhum talento disponível no seu nível</p>
            </Card>
          ) : (
            availableTalents.map((talent) => (
              <TalentCard
                key={talent._id}
                talent={talent}
                onUnlock={() => void handleUnlockTalent(talent)}
                cost={talent.unlockCostDirtyMoney || 10000}
                canAfford={dirtyMoney >= (talent.unlockCostDirtyMoney || 10000)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="unlocked" className="space-y-4">
          {unlockedTalents.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700 p-8 text-center">
              <p className="text-gray-400">Desbloqueie seus primeiros talentos</p>
            </Card>
          ) : (
            unlockedTalents.map((talent) => (
              <UnlockedTalentCard
                key={talent._id}
                talent={talent}
                onUpgrade={() => {
                  setSelectedTalentForUpgrade(talent);
                  setUpgradeModalOpen(true);
                }}
                canUpgrade={canUpgradeTalent(talent)}
                nextLevelCost={
                  talent.currentLevel < (talent.maxSkillLevel || 5)
                    ? LEVEL_COSTS[(talent.currentLevel + 1) as keyof typeof LEVEL_COSTS]
                    : 0
                }
                canAfford={
                  talent.currentLevel < (talent.maxSkillLevel || 5)
                    ? dirtyMoney >=
                      LEVEL_COSTS[(talent.currentLevel + 1) as keyof typeof LEVEL_COSTS]
                    : false
                }
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedTalentForUpgrade && (
        <TalentUpgradeModal
          talent={selectedTalentForUpgrade}
          isOpen={upgradeModalOpen}
          onClose={() => {
            setUpgradeModalOpen(false);
            setSelectedTalentForUpgrade(null);
          }}
          onConfirm={() => void handleUpgradeTalent(selectedTalentForUpgrade)}
          nextLevelCost={
            selectedTalentForUpgrade.currentLevel < (selectedTalentForUpgrade.maxSkillLevel || 5)
              ? LEVEL_COSTS[
                  (selectedTalentForUpgrade.currentLevel + 1) as keyof typeof LEVEL_COSTS
                ]
              : 0
          }
          canAfford={
            selectedTalentForUpgrade.currentLevel < (selectedTalentForUpgrade.maxSkillLevel || 5)
              ? dirtyMoney >=
                LEVEL_COSTS[
                  (selectedTalentForUpgrade.currentLevel + 1) as keyof typeof LEVEL_COSTS
                ]
              : false
          }
          isMaxed={
            selectedTalentForUpgrade.currentLevel >=
            (selectedTalentForUpgrade.maxSkillLevel || 5)
          }
        />
      )}
    </div>
  );
}

interface TalentCardProps {
  talent: TalentosdoCrime;
  onUnlock: () => void;
  cost: number;
  canAfford: boolean;
}

function TalentCard({ talent, onUnlock, cost, canAfford }: TalentCardProps) {
  const isAutoUnlock = talent.isAutoUnlock;

  return (
    <Card className="bg-gray-900 border-gray-700 p-4 hover:border-primary transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <h3 className="text-lg font-bold text-primary">{talent.skillName}</h3>
            <span className="text-xs bg-gray-800 px-2 py-1 rounded">{talent.category}</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{talent.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="text-gray-400">Nível necessário:</span> {talent.unlockLevel}
            </div>
            <div>
              <span className="text-gray-400">Efeito:</span> {talent.minEffectValue}% -{' '}
              {talent.maxEffectValue}% {talent.effectUnit}
            </div>
            {talent.cooldownDescription && (
              <div className="col-span-2">
                <span className="text-gray-400">Cooldown:</span> {talent.cooldownDescription}
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={onUnlock}
          disabled={!canAfford}
          className={`ml-4 whitespace-nowrap ${
            isAutoUnlock
              ? 'bg-green-600 hover:bg-green-700'
              : canAfford
              ? 'bg-primary hover:bg-pink-600'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
        >
          {isAutoUnlock ? (
            <>
              <Unlock className="w-4 h-4 mr-2" />
              Automático
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />${cost.toLocaleString()}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

interface UnlockedTalentCardProps {
  talent: TalentWithProgress;
  onUpgrade: () => void;
  canUpgrade: boolean;
  nextLevelCost: number;
  canAfford: boolean;
}

function UnlockedTalentCard({
  talent,
  onUpgrade,
  canUpgrade,
  nextLevelCost,
  canAfford,
}: UnlockedTalentCardProps) {
  const maxLevel = talent.maxSkillLevel || 5;
  const isMaxed = talent.currentLevel >= maxLevel;

  return (
    <Card className="bg-gray-900 border-primary p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Unlock className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-bold text-primary">{talent.skillName}</h3>
            <span className="text-xs bg-primary text-black px-2 py-1 rounded font-bold">
              LV {talent.currentLevel}/{maxLevel}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{talent.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="text-gray-400">Efeito atual:</span>{' '}
              {getEffectValue(
                talent.minEffectValue || 0,
                talent.maxEffectValue || 0,
                talent.currentLevel
              )}
              {talent.effectUnit}
            </div>
            {talent.cooldownDescription && (
              <div>
                <span className="text-gray-400">Cooldown:</span> {talent.cooldownDescription}
              </div>
            )}
          </div>

          <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(talent.currentLevel / maxLevel) * 100}%` }}
            />
          </div>
        </div>
        <Button
          onClick={onUpgrade}
          disabled={!canUpgrade || isMaxed}
          className={`ml-4 whitespace-nowrap ${
            isMaxed
              ? 'bg-gray-700 cursor-not-allowed'
              : canAfford
              ? 'bg-primary hover:bg-pink-600'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
        >
          {isMaxed ? (
            <>
              <Star className="w-4 h-4 mr-2" />
              Máximo
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />${nextLevelCost.toLocaleString()}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}