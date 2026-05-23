/**
 * COMMANDIA — GangMemberCard.tsx
 * Componente para exibir stats de um membro (Rajada, Blindagem, Fôlego, Quebra)
 */

import React from 'react';
import type { GangAtributos, GangMember } from '@/types/gang';

type Member = GangMember & {
  name?: string;
  talent?: string;
  hasBonde?: boolean;
  rajada?: number;
  blindagem?: number;
  folego?: number;
  quebra?: number;
};

interface Props {
  member: Member;
  onSelect?: (member: Member) => void;
  isSelected?: boolean;
  showDetails?: boolean;
}

const EMPTY_ATTRS: GangAtributos = { rajada: 0, blindagem: 0, folego: 0, quebra: 0 };

function resolveCardStats(member: Member): {
  base: GangAtributos;
  bonusPercent: GangAtributos;
  effective: GangAtributos;
} {
  const legacyEffective = {
    rajada: Number(member.rajada ?? 0),
    blindagem: Number(member.blindagem ?? 0),
    folego: Number(member.folego ?? 0),
    quebra: Number(member.quebra ?? 0),
  };

  return {
    base: member.baseAttributes ?? legacyEffective,
    bonusPercent: member.bonusPercent ?? EMPTY_ATTRS,
    effective: member.effectiveStats ?? legacyEffective,
  };
}

export const GangMemberCard: React.FC<Props> = ({
  member,
  onSelect,
  isSelected = false,
  showDetails = true,
}) => {
  const stats = resolveCardStats(member);

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
    const power =
      stats.effective.rajada * 1.35 +
      stats.effective.blindagem * 1.1 +
      stats.effective.folego * 1.05 +
      stats.effective.quebra * 1.2;
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
            <p className="text-lg font-bold text-red-600">{stats.effective.rajada}</p>
          </div>

          {/* Quebra */}
          <div className="bg-orange-50 p-2 rounded">
            <p className="text-xs text-gray-600">Quebra</p>
            <p className="text-lg font-bold text-orange-600">{stats.effective.quebra.toFixed(1)}</p>
          </div>

          {/* Blindagem */}
          <div className="bg-blue-50 p-2 rounded">
            <p className="text-xs text-gray-600">Blindagem</p>
            <p className="text-lg font-bold text-blue-600">{stats.effective.blindagem}</p>
          </div>

          {/* Fôlego */}
          <div className="bg-green-50 p-2 rounded">
            <p className="text-xs text-gray-600">Fôlego</p>
            <p className="text-lg font-bold text-green-600">{stats.effective.folego}</p>
          </div>
        </div>
      )}

      {showDetails && member.effectiveStats && (
        <div className="mt-2 rounded bg-black/5 p-2 text-xs text-gray-600">
          Base R/B/F/Q: {stats.base.rajada}/{stats.base.blindagem}/{stats.base.folego}/{stats.base.quebra}
          {' '}• Bônus %: {stats.bonusPercent.rajada}/{stats.bonusPercent.blindagem}/{stats.bonusPercent.folego}/{stats.bonusPercent.quebra}
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
