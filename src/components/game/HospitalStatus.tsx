/**
 * COMMANDIA — HospitalStatus.tsx
 * Exibe status do hospital com capacidade dinâmica
 */

import React from 'react';

interface HospitalData {
  capacity: number;
  currentWounded: number;
  recoverySpeedBonus: number;
  baseRecoveryHours: number;
  actualRecoveryHours: number;
}

interface Wounded {
  type: string;
  count: number;
  injuryEndsAt: string;
}

interface Props {
  hospital: HospitalData;
  wounded: Wounded[];
  title?: string;
}

function HospitalStatus({
  hospital,
  wounded,
  title = 'Status do Hospital',
}: Props) {
  const occupancyPercent = Math.round((hospital.currentWounded / hospital.capacity) * 100);
  const isFull = hospital.currentWounded >= hospital.capacity;
  const availableSpace = hospital.capacity - hospital.currentWounded;

  const getOccupancyColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    if (percent >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getRecoveryTimeRemaining = (injuryEndsAt: string) => {
    const now = new Date();
    const end = new Date(injuryEndsAt);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return 'Pronto';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>

      {/* Alerts */}
      {isFull && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-700">🚨 HOSPITAL CHEIO! Não é possível aceitar mais feridos.</p>
        </div>
      )}

      {occupancyPercent >= 70 && !isFull && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-700">⚠️ Hospital está {occupancyPercent}% ocupado</p>
        </div>
      )}

      {/* Capacity Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-gray-800">Capacidade</span>
          <span className="text-2xl font-bold text-gray-700">
            {hospital.currentWounded}/{hospital.capacity}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all ${getOccupancyColor(occupancyPercent)}`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {occupancyPercent}% ocupado • {availableSpace} espaço{availableSpace !== 1 ? 's' : ''} disponível
        </p>
      </div>

      {/* Recovery Info */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Base Recovery Time */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Tempo Base de Recuperação</p>
          <p className="text-2xl font-bold text-blue-600">{hospital.baseRecoveryHours}h</p>
        </div>

        {/* Recovery Speed Bonus */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Bônus de Velocidade</p>
          <p className="text-2xl font-bold text-green-600">+{Math.round(hospital.recoverySpeedBonus * 100)}%</p>
        </div>

        {/* Actual Recovery Time */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Tempo Real</p>
          <p className="text-2xl font-bold text-purple-600">{hospital.actualRecoveryHours}h</p>
        </div>
      </div>

      {/* Wounded Members */}
      {wounded.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Membros Feridos</h3>

          <div className="space-y-2">
            {wounded.map((member, i) => {
              const timeRemaining = getRecoveryTimeRemaining(member.injuryEndsAt);

              return (
                <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{member.type}</p>
                    <p className="text-sm text-gray-600">{member.count} membro{member.count !== 1 ? 's' : ''} ferido{member.count !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-bold ${timeRemaining === 'Pronto' ? 'text-green-600' : 'text-orange-600'}`}>
                      {timeRemaining}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(member.injuryEndsAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-center text-gray-600">✅ Nenhum membro ferido. Gangue 100% operacional!</p>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas</h3>
        <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
          <li><strong>Investimento:</strong> "Expansão do Hospital" aumenta capacidade em +500 por nível</li>
          <li><strong>Velocidade:</strong> "Recuperação Rápida" reduz tempo de cura em até 40%</li>
          <li><strong>Estratégia:</strong> Hospital cheio = não pode atacar (sem espaço para novos feridos)</li>
        </ul>
      </div>
    </div>
  );
};

export default HospitalStatus;
