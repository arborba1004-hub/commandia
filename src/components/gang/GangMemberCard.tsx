/**
 * COMMANDIA — GangMemberCard.tsx
 * Componente para exibir stats de um membro (Rajada, Blindagem, Fôlego, Quebra)
 */

import React from 'react';

interface Member {
  id: string;
  type: string;
  name?: string;
  level: number;
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;
  status: 'ativo' | 'ferido' | 'morto' | 'treinando';
  talent?: string;
  hasBonde?: boolean;
  injuryEndsAt?: string;
}

interface Props {
  member: Member;
  onSelect?: (member: Member) => void;
  isSelected?: boolean;
  showDetails?: boolean;
}

export const GangMemberCard: React.FC<Props> = ({
  member,
  onSelect,
  isSelected = false,
  showDetails = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500';
      case 'ferido':
        return 'bg-yellow-500';
      case 'morto':
        return 'bg-red-500';
      case 'treinando':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ativo: 'Ativo',
      ferido: 'Ferido',
      morto: 'Morto',
      treinando: 'Treinando',
    };
    return labels[status] || status;
  };

  const calculatePower = () => {
    const power = member.rajada * member.quebra + member.blindagem + member.folego;
    return Math.floor(power);
  };

  return (
    <div
      onClick={() => onSelect?.(member)}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}
        ${member.status === 'morto' ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{member.name || member.type}</h3>
          <p className="text-sm text-gray-600">Nível {member.level}</p>
        </div>

        {/* Status Badge */}
        <div className={`px-2 py-1 rounded text-white text-xs font-bold ${getStatusColor(member.status)}`}>
          {getStatusLabel(member.status)}
        </div>
      </div>

      {/* Talent Badge */}
      {member.talent && (
        <div className="mb-2">
          <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
            {member.hasBonde ? '⚡ ' : '✦ '}
            {member.talent}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Rajada */}
          <div className="bg-red-50 p-2 rounded">
            <p className="text-xs text-gray-600">Rajada</p>
            <p className="text-lg font-bold text-red-600">{member.rajada}</p>
          </div>

          {/* Quebra */}
          <div className="bg-orange-50 p-2 rounded">
            <p className="text-xs text-gray-600">Quebra</p>
            <p className="text-lg font-bold text-orange-600">{member.quebra.toFixed(1)}x</p>
          </div>

          {/* Blindagem */}
          <div className="bg-blue-50 p-2 rounded">
            <p className="text-xs text-gray-600">Blindagem</p>
            <p className="text-lg font-bold text-blue-600">{member.blindagem}</p>
          </div>

          {/* Fôlego */}
          <div className="bg-green-50 p-2 rounded">
            <p className="text-xs text-gray-600">Fôlego</p>
            <p className="text-lg font-bold text-green-600">{member.folego}</p>
          </div>
        </div>
      )}

      {/* Power Bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-600">Poder</span>
          <span className="text-xs font-bold text-gray-800">{calculatePower()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((calculatePower() / 500) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Injury Timer */}
      {member.status === 'ferido' && member.injuryEndsAt && (
        <div className="mt-2 text-xs text-yellow-600 font-semibold">
          Recupera em: {new Date(member.injuryEndsAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default GangMemberCard;
