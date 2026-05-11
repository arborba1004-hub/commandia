/**
 * COMMANDIA — GangLayerVisualization.tsx
 * Visualiza os membros organizados em camadas (1-8)
 */

import React from 'react';
import GangMemberCard from './GangMemberCard';

interface Member {
  id: string;
  type: string;
  name?: string;
  level: number;
  layer: number;
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;
  status: 'ativo' | 'ferido' | 'morto' | 'treinando';
  talent?: string;
  hasBonde?: boolean;
}

interface Props {
  members: Member[];
  selectedMemberId?: string;
  onSelectMember?: (member: Member) => void;
  title?: string;
}

const LAYER_CONFIG = [
  { layer: 1, name: 'Muralha', color: 'bg-red-100', textColor: 'text-red-800' },
  { layer: 2, name: 'Motorista', color: 'bg-orange-100', textColor: 'text-orange-800' },
  { layer: 3, name: 'Frente', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { layer: 4, name: 'Nitro (BONDE)', color: 'bg-green-100', textColor: 'text-green-800' },
  { layer: 5, name: 'Capanga (BONDE)', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { layer: 6, name: 'Wifi', color: 'bg-indigo-100', textColor: 'text-indigo-800' },
  { layer: 7, name: 'Certeiro', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { layer: 8, name: 'Executor', color: 'bg-pink-100', textColor: 'text-pink-800' },
];

export const GangLayerVisualization: React.FC<Props> = ({
  members,
  selectedMemberId,
  onSelectMember,
  title = 'Formação de Combate',
}) => {
  const getMembersByLayer = (layer: number) => {
    return members.filter(m => m.layer === layer).sort((a, b) => {
      if (a.status === 'ativo' && b.status !== 'ativo') return -1;
      if (a.status !== 'ativo' && b.status === 'ativo') return 1;
      return 0;
    });
  };

  const getLayerStats = (layer: number) => {
    const layerMembers = getMembersByLayer(layer);
    const active = layerMembers.filter(m => m.status === 'ativo').length;
    const wounded = layerMembers.filter(m => m.status === 'ferido').length;
    const dead = layerMembers.filter(m => m.status === 'morto').length;

    return { total: layerMembers.length, active, wounded, dead };
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>

      {/* Legend */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-2">LEGENDA:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>✅ Ativo (Verde)</div>
          <div>⚠️ Ferido (Amarelo)</div>
          <div>❌ Morto (Vermelho)</div>
          <div>⚡ BONDE (Layer 4-5)</div>
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-4">
        {LAYER_CONFIG.map(({ layer, name, color, textColor }) => {
          const layerMembers = getMembersByLayer(layer);
          const stats = getLayerStats(layer);

          return (
            <div key={layer} className={`${color} rounded-lg p-4 border-2 border-gray-200`}>
              {/* Layer Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${textColor} w-8 h-8 flex items-center justify-center rounded-full bg-white`}>
                    {layer}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${textColor}`}>{name}</h3>
                    <p className="text-xs text-gray-600">
                      {stats.active} ativo{stats.active !== 1 ? 's' : ''} • {stats.wounded} ferido{stats.wounded !== 1 ? 's' : ''} • {stats.dead} morto{stats.dead !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="text-right">
                  <p className={`font-bold text-lg ${textColor}`}>{stats.total}</p>
                  <p className="text-xs text-gray-600">membros</p>
                </div>
              </div>

              {/* Members Grid */}
              {layerMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {layerMembers.map(member => (
                    <GangMemberCard
                      key={member.id}
                      member={member}
                      isSelected={selectedMemberId === member.id}
                      onSelect={onSelectMember}
                      showDetails={false}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Sem membros nesta camada</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-semibold text-blue-900 mb-2">💡 Dicas de Formação:</p>
        <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
          <li><strong>BONDE:</strong> Nitros e Capangas (camadas 4-5) bypassa camadas 1-3 e ataca ranged (5-8)</li>
          <li><strong>Defesa:</strong> Use muitas Muralhas (camada 1) - talento COLETE reduz dano de ranged em 30%</li>
          <li><strong>Ataque:</strong> Coloque Executores (camada 8) na retaguarda para dano máximo</li>
        </ul>
      </div>
    </div>
  );
};

export default GangLayerVisualization;
