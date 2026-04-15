import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttackMemberSelector from '@/components/gang/AttackMemberSelector';
import AttackResultDisplay from '@/components/game/AttackResultDisplay';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import {
  resolveAttackWithGangMembers,
  estimateAttackOutcome,
} from '@/services/attackResolverService';
import {
  AlertTriangle,
  Swords,
  Users,
  TrendingUp,
  Coins,
  Zap,
} from 'lucide-react';
import type { AttackTarget } from '@/store/mapAttackStore';

interface MapAttackWithGangModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: AttackTarget | null;
  onAttackConfirmed?: (result: any) => void;
}

export default function MapAttackWithGangModal({
  isOpen,
  onClose,
  target,
  onAttackConfirmed,
}: MapAttackWithGangModalProps) {
  const { gang } = useGangStore();
  const { player } = usePlayerStore();
  const { setResolution } = useMapAttackStore();

  const [phase, setPhase] = useState<'select' | 'preview' | 'result'>('select');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [estimation, setEstimation] = useState<any>(null);

  const handleMembersSelected = useCallback(
    (memberIds: string[]) => {
      setSelectedMemberIds(memberIds);

      // Estimate outcome
      if (target && gang && player) {
        const estimation = estimateAttackOutcome({
          attacker: {
            playerId: player._id || '',
            playerName: player.name || 'Você',
            level: player.niveis.playerLevel,
            attack: player.skills.attack,
            agility: player.skills.agility,
            defense: player.skills.defense,
            resistance: player.skills.resistance,
            prestige: player.power,
            dirtyMoney: player.balances.dirtyMoney,
            gang,
            selectedMemberIds: memberIds,
          },
          defender: {
            playerId: target.playerId,
            playerName: target.playerName,
            level: 1, // Would need to fetch from server
            attack: 10,
            agility: 5,
            defense: 15,
            resistance: 8,
            prestige: target.power || 0,
            dirtyMoney: target.dirtyMoney || 0,
            gang: null, // Would need to fetch from server
          },
        });

        setEstimation(estimation);
      }

      setPhase('preview');
    },
    [target, gang, player]
  );

  const handleConfirmAttack = useCallback(async () => {
    if (!target || !gang || !player) return;

    setIsResolving(true);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const attackResult = resolveAttackWithGangMembers({
        attacker: {
          playerId: player._id || '',
          playerName: player.name || 'Você',
          level: player.niveis.playerLevel,
          attack: player.skills.attack,
          agility: player.skills.agility,
          defense: player.skills.defense,
          resistance: player.skills.resistance,
          prestige: player.power,
          dirtyMoney: player.balances.dirtyMoney,
          gang,
          selectedMemberIds,
        },
        defender: {
          playerId: target.playerId,
          playerName: target.playerName,
          level: 1,
          attack: 10,
          agility: 5,
          defense: 15,
          resistance: 8,
          prestige: target.power || 0,
          dirtyMoney: target.dirtyMoney || 0,
          gang: null,
        },
      });

      setResult(attackResult);
      setResolution(attackResult);
      setPhase('result');

      if (onAttackConfirmed) {
        onAttackConfirmed(attackResult);
      }
    } catch (error) {
      console.error('Erro ao resolver ataque:', error);
    } finally {
      setIsResolving(false);
    }
  }, [target, gang, player, selectedMemberIds, setResolution, onAttackConfirmed]);

  const handleClose = () => {
    setPhase('select');
    setSelectedMemberIds([]);
    setResult(null);
    setEstimation(null);
    onClose();
  };

  const activeMembers = gang?.members.filter((m) => m.status === 'ativo') || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-heading">
              <Swords className="w-5 h-5 text-primary" />
              Ataque com Gangue
            </DialogTitle>
          </DialogHeader>

          <Tabs value={phase} onValueChange={(v) => setPhase(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="select" disabled={phase !== 'select' && phase !== 'preview'}>
                Selecionar
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={phase === 'select' || phase === 'result'}>
                Prévia
              </TabsTrigger>
              <TabsTrigger value="result" disabled={phase !== 'result'}>
                Resultado
              </TabsTrigger>
            </TabsList>

            {/* Select Phase */}
            <TabsContent value="select" className="space-y-4">
              {target && (
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg text-slate-200">{target.playerName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                        <Badge variant="outline" className="border-slate-600">
                          Nível {target.barracoLevel || 1}
                        </Badge>
                        <span>Poder: {target.power || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-1">Dinheiro Sujo</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        ${(target.dirtyMoney || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="bg-slate-800/30 border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-medium text-slate-300">Membros Disponíveis</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{activeMembers.length}</div>
                <p className="text-xs text-slate-400 mt-2">
                  Selecione os membros que deseja enviar para o ataque
                </p>
              </Card>

              <AttackMemberSelector
                isOpen={true}
                onClose={() => {}}
                onConfirm={handleMembersSelected}
              />
            </TabsContent>

            {/* Preview Phase */}
            <TabsContent value="preview" className="space-y-4">
              {target && estimation && (
                <>
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <h3 className="font-heading text-lg text-slate-200 mb-4">
                      Prévia do Ataque
                    </h3>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-xs text-slate-400">Taxa de Sucesso</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(estimation.estimatedChance * 100)}%
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-slate-400">Saque Estimado</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                          ${estimation.estimatedLoot.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-slate-400">Perdas Estimadas</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-400">
                          ~{estimation.estimatedCasualties}
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-300">
                        Você está enviando {selectedMemberIds.length} membros para o ataque.
                        Prepare-se para possíveis perdas.
                      </p>
                    </div>
                  </Card>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setPhase('select')}
                      className="border-slate-600 hover:bg-slate-800"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleConfirmAttack}
                      disabled={isResolving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isResolving ? 'Resolvendo...' : 'Confirmar Ataque'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Result Phase */}
            <TabsContent value="result" className="space-y-4">
              {result && target && (
                <>
                  <AttackResultDisplay
                    result={result}
                    attackerName={player?.name || 'Você'}
                    defenderName={target.playerName}
                  />

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
                    <Button
                      onClick={handleClose}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Fechar
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
