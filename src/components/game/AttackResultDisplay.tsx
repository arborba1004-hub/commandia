import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Swords,
  Shield,
  Zap,
  Heart,
  Skull,
  TrendingUp,
  Coins,
  AlertTriangle,
} from 'lucide-react';
import type { AttackResolution } from '@/store/mapAttackStore';

interface AttackResultDisplayProps {
  result: AttackResolution;
  attackerName: string;
  defenderName: string;
}

function getMemberTypeName(type: string): string {
  const names: Record<string, string> = {
    capanga: 'Capanga',
    frente: 'Frente',
    executor: 'Executor',
    assassino: 'Assassino',
    muralha: 'Muralha',
    certeiro: 'Certeiro',
    motorista: 'Motorista',
    nitro: 'Nitro',
    armeiro: 'Armeiro',
    informante: 'Informante',
    wifi: 'WiFi',
    medico: 'Médico',
    lavador: 'Lavador',
    ladrao: 'Ladrão',
    negociador: 'Negociador',
  };
  return names[type] || type;
}

export default function AttackResultDisplay({
  result,
  attackerName,
  defenderName,
}: AttackResultDisplayProps) {
  const successRate = useMemo(() => {
    return Math.round(result.chance * 100);
  }, [result.chance]);

  const totalAttackerLosses = useMemo(() => {
    if (!result.attackerGangLosses) return 0;
    const mortos = Object.values(result.attackerGangLosses.mortos || {}).reduce(
      (a, b) => a + (b || 0),
      0
    );
    const feridos = Object.values(result.attackerGangLosses.feridos || {}).reduce(
      (a, b) => a + (b || 0),
      0
    );
    return mortos + feridos;
  }, [result.attackerGangLosses]);

  const totalDefenderLosses = useMemo(() => {
    if (!result.defenderGangLosses) return 0;
    const mortos = Object.values(result.defenderGangLosses.mortos || {}).reduce(
      (a, b) => a + (b || 0),
      0
    );
    const feridos = Object.values(result.defenderGangLosses.feridos || {}).reduce(
      (a, b) => a + (b || 0),
      0
    );
    return mortos + feridos;
  }, [result.defenderGangLosses]);

  const attackerDeaths = useMemo(() => {
    if (!result.attackerGangLosses?.mortos) return 0;
    return Object.values(result.attackerGangLosses.mortos).reduce((a, b) => a + (b || 0), 0);
  }, [result.attackerGangLosses]);

  const defenderDeaths = useMemo(() => {
    if (!result.defenderGangLosses?.mortos) return 0;
    return Object.values(result.defenderGangLosses.mortos).reduce((a, b) => a + (b || 0), 0);
  }, [result.defenderGangLosses]);

  return (
    <div className="space-y-4">
      {/* Main Result */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {result.success ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">VITÓRIA!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <span className="text-2xl font-bold text-red-400">DERROTA</span>
              </div>
            )}
            {result.critical && (
              <Badge className="bg-amber-500/30 border-amber-500/50 text-amber-300">
                CRÍTICO
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">Taxa de Sucesso</div>
            <div className="text-2xl font-bold text-primary">{successRate}%</div>
          </div>
        </div>

        <p className="text-slate-300 italic">{result.message}</p>
      </Card>

      {/* Power Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-slate-300">Poder Atacante</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{result.attackerPower}</div>
          <div className="text-xs text-slate-400 mt-1">{attackerName}</div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">Poder Defensor</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{result.defenderPower}</div>
          <div className="text-xs text-slate-400 mt-1">{defenderName}</div>
        </Card>
      </div>

      {/* Loot */}
      {result.success && (
        <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-emerald-300">Saque Obtido</span>
          </div>
          <div className="space-y-2 text-sm">
            {result.spoils.dirtyMoneyLoot > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">Dinheiro Sujo:</span>
                <span className="font-bold text-emerald-400">
                  ${result.spoils.dirtyMoneyLoot.toLocaleString()}
                </span>
              </div>
            )}
            {result.spoils.correLoot > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">Corré:</span>
                <span className="font-bold text-amber-400">+{result.spoils.correLoot}</span>
              </div>
            )}
            {result.spoils.prestigeLoot > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">Prestígio:</span>
                <span className="font-bold text-purple-400">+{result.spoils.prestigeLoot}</span>
              </div>
            )}
            {result.spoils.brokenLuxuryItemName && (
              <div className="flex justify-between">
                <span className="text-slate-300">Item Quebrado:</span>
                <span className="font-bold text-red-400">{result.spoils.brokenLuxuryItemName}</span>
              </div>
            )}
            {result.spoils.luxuryConvertedDirtyMoney > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">Conversão de Luxo:</span>
                <span className="font-bold text-emerald-400">
                  ${result.spoils.luxuryConvertedDirtyMoney.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Gang Casualties */}
      <div className="grid grid-cols-2 gap-3">
        {/* Attacker Losses */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="font-medium text-slate-300">Perdas Atacante</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Mortos:</span>
              <span className="font-bold text-red-400">{attackerDeaths}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Feridos:</span>
              <span className="font-bold text-amber-400">
                {(result.attackerGangLosses?.feridos
                  ? Object.values(result.attackerGangLosses.feridos).reduce(
                      (a, b) => a + (b || 0),
                      0
                    )
                  : 0) - attackerDeaths}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-300 font-medium">Total:</span>
              <span className="font-bold text-red-300">{totalAttackerLosses}</span>
            </div>
          </div>
        </Card>

        {/* Defender Losses */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skull className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-slate-300">Perdas Defensor</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Mortos:</span>
              <span className="font-bold text-red-400">{defenderDeaths}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Feridos:</span>
              <span className="font-bold text-amber-400">
                {(result.defenderGangLosses?.feridos
                  ? Object.values(result.defenderGangLosses.feridos).reduce(
                      (a, b) => a + (b || 0),
                      0
                    )
                  : 0) - defenderDeaths}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-300 font-medium">Total:</span>
              <span className="font-bold text-cyan-300">{totalDefenderLosses}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Casualties */}
      {result.attackerGangLosses && (
        <Card className="bg-slate-800/30 border-slate-700 p-4">
          <div className="text-sm font-medium text-slate-300 mb-3">Detalhes de Perdas</div>
          <ScrollArea className="h-48">
            <div className="space-y-2 pr-4">
              {/* Attacker Deaths */}
              {result.attackerGangLosses.mortos &&
                Object.entries(result.attackerGangLosses.mortos).map(([type, count]) => {
                  if (!count) return null;
                  return (
                    <div key={`attacker-morto-${type}`} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {getMemberTypeName(type)} (Morto):
                      </span>
                      <span className="text-red-400 font-bold">{count}</span>
                    </div>
                  );
                })}

              {/* Attacker Injuries */}
              {result.attackerGangLosses.feridos &&
                Object.entries(result.attackerGangLosses.feridos).map(([type, count]) => {
                  if (!count) return null;
                  return (
                    <div key={`attacker-ferido-${type}`} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {getMemberTypeName(type)} (Ferido):
                      </span>
                      <span className="text-amber-400 font-bold">{count}</span>
                    </div>
                  );
                })}

              {/* Defender Deaths */}
              {result.defenderGangLosses?.mortos &&
                Object.entries(result.defenderGangLosses.mortos).map(([type, count]) => {
                  if (!count) return null;
                  return (
                    <div key={`defender-morto-${type}`} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {getMemberTypeName(type)} Inimigo (Morto):
                      </span>
                      <span className="text-cyan-400 font-bold">{count}</span>
                    </div>
                  );
                })}

              {/* Defender Injuries */}
              {result.defenderGangLosses?.feridos &&
                Object.entries(result.defenderGangLosses.feridos).map(([type, count]) => {
                  if (!count) return null;
                  return (
                    <div key={`defender-ferido-${type}`} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {getMemberTypeName(type)} Inimigo (Ferido):
                      </span>
                      <span className="text-cyan-300 font-bold">{count}</span>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Gang Stats Comparison */}
      {result.attackerGangStats && result.defenderGangStats && (
        <Card className="bg-slate-800/30 border-slate-700 p-4">
          <div className="text-sm font-medium text-slate-300 mb-3">Composição de Gangue</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400 mb-2">Atacante</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Membros Ativos:</span>
                  <span className="font-bold text-emerald-400">
                    {result.attackerGangStats.ativos}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Poder Total:</span>
                  <span className="font-bold text-amber-400">
                    {result.attackerGangStats.totalPower}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-2">Defensor</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Membros Ativos:</span>
                  <span className="font-bold text-cyan-400">
                    {result.defenderGangStats.ativos}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Poder Total:</span>
                  <span className="font-bold text-cyan-300">
                    {result.defenderGangStats.totalPower}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
