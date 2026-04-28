/**
 * COMMANDIA — AttackEstimator.tsx
 * Estima poder, chance de vitória e perdas estimadas
 */

import React, { useState, useEffect } from 'react';

interface Stats {
  power: number;
  rajada: number;
  blindagem: number;
  folego: number;
  membersActive: number;
  hospitalFull: boolean;
}

interface Props {
  attackerStats: Stats;
  defenderStats: Stats;
  formationBonus?: number;
  onAttack?: (canAttack: boolean, chance: number) => void;
}

function AttackEstimator({
  attackerStats,
  defenderStats,
  formationBonus = 0,
  onAttack,
}: Props) {
  const [chance, setChance] = useState(0);
  const [estimatedLosses, setEstimatedLosses] = useState({ attacker: 0, defender: 0 });
  const [canAttack, setCanAttack] = useState(false);

  useEffect(() => {
    // Calcular chance de vitória
    const totalPower = attackerStats.power + defenderStats.power;
    let winChance = totalPower > 0 ? attackerStats.power / totalPower : 0.5;

    // Aplicar formação
    winChance *= 1 + formationBonus / 100;

    // Clampar entre 30% e 90%
    winChance = Math.max(0.3, Math.min(0.9, winChance));
    setChance(Math.round(winChance * 100));

    // Calcular perdas estimadas
    const attackerLossRate = Math.max(0.04, Math.min(0.65, defenderStats.power / Math.max(1, attackerStats.power) * 0.2));
    const defenderLossRate = Math.max(0.04, Math.min(0.65, attackerStats.power / Math.max(1, defenderStats.power) * 0.2));

    setEstimatedLosses({
      attacker: Math.round(attackerStats.membersActive * attackerLossRate),
      defender: Math.round(defenderStats.membersActive * defenderLossRate),
    });

    // Validar se pode atacar
    const canAttackNow = !defenderStats.hospitalFull && attackerStats.membersActive > 0;
    setCanAttack(canAttackNow);

    onAttack?.(canAttackNow, winChance);
  }, [attackerStats, defenderStats, formationBonus, onAttack]);

  const getChanceColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getChanceBg = (value: number) => {
    if (value >= 70) return 'bg-green-50 border-green-200';
    if (value >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Estimador de Ataque</h2>

      {/* Alertas */}
      {!canAttack && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-700">
            ⚠️ Você não pode atacar agora:
            {defenderStats.hospitalFull && ' Hospital cheio'}
            {attackerStats.membersActive === 0 && ' Sem membros ativos'}
          </p>
        </div>
      )}

      {/* Power Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Seu Poder */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">Seu Poder</p>
          <p className="text-3xl font-bold text-blue-600">{attackerStats.power}</p>
          <div className="mt-2 text-xs text-gray-600">
            <p>👥 {attackerStats.membersActive} membros ativos</p>
            <p>⚔️ Rajada: {attackerStats.rajada}</p>
          </div>
        </div>

        {/* Poder do Inimigo */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600 mb-2">Poder do Inimigo</p>
          <p className="text-3xl font-bold text-red-600">{defenderStats.power}</p>
          <div className="mt-2 text-xs text-gray-600">
            <p>👥 {defenderStats.membersActive} membros ativos</p>
            <p>🛡️ Blindagem: {defenderStats.blindagem}</p>
          </div>
        </div>
      </div>

      {/* Chance de Vitória */}
      <div className={`p-6 rounded-lg border-2 mb-6 ${getChanceBg(chance)}`}>
        <p className="text-sm text-gray-600 mb-2">Chance de Vitória</p>
        <p className={`text-5xl font-bold ${getChanceColor(chance)}`}>{chance}%</p>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              chance >= 70
                ? 'bg-green-500'
                : chance >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${chance}%` }}
          />
        </div>

        {/* Interpretação */}
        <p className="mt-3 text-sm font-semibold text-gray-700">
          {chance >= 70
            ? '✅ Você tem grande chance de vencer'
            : chance >= 50
              ? '⚠️ Resultado incerto'
              : '❌ Você tem pequena chance de vencer'}
        </p>
      </div>

      {/* Perdas Estimadas */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Perdas Estimadas</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Suas Perdas */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Seus Feridos/Mortos</p>
            <p className="text-2xl font-bold text-orange-600">{estimatedLosses.attacker}</p>
            <p className="text-xs text-gray-500 mt-1">
              ({Math.round((estimatedLosses.attacker / attackerStats.membersActive) * 100)}% da gangue)
            </p>
          </div>

          {/* Perdas do Inimigo */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Perdas do Inimigo</p>
            <p className="text-2xl font-bold text-green-600">{estimatedLosses.defender}</p>
            <p className="text-xs text-gray-500 mt-1">
              ({Math.round((estimatedLosses.defender / defenderStats.membersActive) * 100)}% da gangue)
            </p>
          </div>
        </div>

        {/* Hospital Check */}
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700">
            ℹ️ Hospital do inimigo está
            <span className={`font-bold ${defenderStats.hospitalFull ? 'text-red-600' : 'text-green-600'}`}>
              {defenderStats.hospitalFull ? ' CHEIO' : ' COM ESPAÇO'}
            </span>
          </p>
        </div>
      </div>

      {/* Recomendação */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">💡 Recomendação</h3>
        <p className="text-sm text-purple-800">
          {chance >= 70
            ? 'Ataque! Você tem grande vantagem.'
            : chance >= 50
              ? 'Considere atacar. Risco moderado.'
              : chance >= 30
                ? 'Ataque somente se quiser arriscar.'
                : 'Não recomendado. Procure adversário mais fraco.'}
        </p>
      </div>

      {/* Button */}
      <button
        disabled={!canAttack}
        className={`w-full mt-4 py-3 px-4 rounded-lg font-bold text-white transition-all ${
          canAttack
            ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
            : 'bg-gray-400 cursor-not-allowed opacity-50'
        }`}
      >
        {canAttack ? '⚔️ ATACAR AGORA' : '🚫 Não pode atacar'}
      </button>
    </div>
  );
}

export default AttackEstimator;
