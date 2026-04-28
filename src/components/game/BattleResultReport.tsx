/**
 * COMMANDIA — BattleResultReport.tsx
 * Exibe resultado detalhado da batalha com todos os bônus
 */

import React from 'react';

interface BattleResult {
  winner: 'attacker' | 'defender';
  roundsFought: number;
  attackerPower: number;
  defenderPower: number;
  winChance: number;
  isCritical: boolean;
  loot: number;
  attackerLosses: {
    mortos: { [key: string]: number };
    feridos: { [key: string]: number };
  };
  defenderLosses: {
    mortos: { [key: string]: number };
    feridos: { [key: string]: number };
  };
  bonusApplied: string[];
  hospitalNewWounded: number;
  recoveryTimeHours: number;
}

interface Props {
  result: BattleResult;
  attackerName: string;
  defenderName: string;
  onClose?: () => void;
}

function BattleResultReport({
  result,
  attackerName,
  defenderName,
  onClose,
}: Props) {
  const totalAttackerDeaths = Object.values(result.attackerLosses.mortos).reduce((a, b) => a + b, 0);
  const totalAttackerWounded = Object.values(result.attackerLosses.feridos).reduce((a, b) => a + b, 0);
  const totalDefenderDeaths = Object.values(result.defenderLosses.mortos).reduce((a, b) => a + b, 0);
  const totalDefenderWounded = Object.values(result.defenderLosses.feridos).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl p-8 text-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {result.winner === 'attacker' ? '🎉 VITÓRIA!' : '💔 DERROTA!'}
        </h1>
        {result.isCritical && <p className="text-yellow-400 font-semibold">⚡ ATAQUE CRÍTICO!</p>}
      </div>

      {/* Battle Summary */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Atacante */}
        <div className={`p-6 rounded-lg border-2 ${result.winner === 'attacker' ? 'border-green-400 bg-green-900 bg-opacity-20' : 'border-red-400 bg-red-900 bg-opacity-20'}`}>
          <h2 className="text-xl font-bold mb-4">{attackerName}</h2>
          <div className="space-y-2 text-sm">
            <p>⚔️ Poder: <span className="font-bold text-xl">{result.attackerPower}</span></p>
            <p>👥 Perdidos: {totalAttackerDeaths + totalAttackerWounded}</p>
            <p className="text-red-400">💀 Mortos: {totalAttackerDeaths}</p>
            <p className="text-yellow-400">🏥 Feridos: {totalAttackerWounded}</p>
          </div>
        </div>

        {/* Defensor */}
        <div className={`p-6 rounded-lg border-2 ${result.winner === 'defender' ? 'border-green-400 bg-green-900 bg-opacity-20' : 'border-red-400 bg-red-900 bg-opacity-20'}`}>
          <h2 className="text-xl font-bold mb-4">{defenderName}</h2>
          <div className="space-y-2 text-sm">
            <p>🛡️ Poder: <span className="font-bold text-xl">{result.defenderPower}</span></p>
            <p>👥 Perdidos: {totalDefenderDeaths + totalDefenderWounded}</p>
            <p className="text-red-400">💀 Mortos: {totalDefenderDeaths}</p>
            <p className="text-yellow-400">🏥 Feridos: {totalDefenderWounded}</p>
          </div>
        </div>
      </div>

      {/* Battle Details */}
      <div className="bg-gray-700 bg-opacity-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-bold mb-4">📊 Detalhes da Batalha</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Rodadas Lutadas</p>
            <p className="text-2xl font-bold">{result.roundsFought}</p>
          </div>
          <div>
            <p className="text-gray-400">Chance de Vitória</p>
            <p className="text-2xl font-bold text-blue-400">{Math.round(result.winChance * 100)}%</p>
          </div>
          <div>
            <p className="text-gray-400">Saque</p>
            <p className="text-2xl font-bold text-green-400">R$ {result.loot.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Hospital Status */}
      {result.hospitalNewWounded > 0 && (
        <div className="bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold mb-2">🏥 Status do Hospital</h3>
          <div className="space-y-2 text-sm">
            <p>Novos feridos admitidos: <span className="font-bold text-yellow-400">{result.hospitalNewWounded}</span></p>
            <p>Tempo de recuperação estimado: <span className="font-bold">{result.recoveryTimeHours}h</span></p>
            <p className="text-gray-300 mt-2">Os feridos permanecerão incapazes de combate durante este período.</p>
          </div>
        </div>
      )}

      {/* Losses Breakdown */}
      <div className="bg-gray-700 bg-opacity-30 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-bold mb-4">📋 Detalhamento de Perdas</h3>

        {/* Attacker Losses */}
        <div className="mb-6">
          <h4 className="text-blue-400 font-semibold mb-2">Perdas do Atacante:</h4>
          <div className="space-y-1 text-sm ml-4">
            {Object.entries(result.attackerLosses.mortos).map(([type, count]) => (
              count > 0 && <p key={`${type}-mortos`}>💀 {type}: {count} morto(s)</p>
            ))}
            {Object.entries(result.attackerLosses.feridos).map(([type, count]) => (
              count > 0 && <p key={`${type}-feridos`}>🏥 {type}: {count} ferido(s)</p>
            ))}
          </div>
        </div>

        {/* Defender Losses */}
        <div>
          <h4 className="text-red-400 font-semibold mb-2">Perdas do Defensor:</h4>
          <div className="space-y-1 text-sm ml-4">
            {Object.entries(result.defenderLosses.mortos).map(([type, count]) => (
              count > 0 && <p key={`${type}-mortos`}>💀 {type}: {count} morto(s)</p>
            ))}
            {Object.entries(result.defenderLosses.feridos).map(([type, count]) => (
              count > 0 && <p key={`${type}-feridos`}>🏥 {type}: {count} ferido(s)</p>
            ))}
          </div>
        </div>
      </div>

      {/* Bonuses Applied */}
      {result.bonusApplied.length > 0 && (
        <div className="bg-purple-900 bg-opacity-30 border-l-4 border-purple-400 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold mb-3">⚡ Bônus Aplicados</h3>
          <div className="space-y-1 text-sm ml-4">
            {result.bonusApplied.map((bonus, i) => (
              <p key={i}>✦ {bonus}</p>
            ))}
          </div>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-all"
        >
          Fechar Relatório
        </button>
      )}
    </div>
  );
}

export default BattleResultReport;
