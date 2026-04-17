/**
 * COMMANDIA — InvestmentDashboard.tsx
 * Dashboard de 26 investimentos em 6 categorias
 */

import React, { useState } from 'react';

interface Investment {
  key: string;
  name: string;
  description: string;
  category: string;
  level: number;
  maxLevel: number;
  cost: number;
  benefit: string;
}

interface Props {
  investments: Investment[];
  onUpgrade?: (investmentKey: string) => void;
  dirtyMoney?: number;
  title?: string;
}

const CATEGORIES = [
  { key: 'resources', name: '💰 Recursos', color: 'bg-amber-50 border-amber-200' },
  { key: 'enterprises', name: '🏢 Empreendimentos', color: 'bg-blue-50 border-blue-200' },
  { key: 'weapons', name: '⚔️ Armamentos', color: 'bg-red-50 border-red-200' },
  { key: 'crew', name: '👥 Capacidades', color: 'bg-purple-50 border-purple-200' },
  { key: 'defense', name: '🛡️ Defesa', color: 'bg-green-50 border-green-200' },
  { key: 'operations', name: '⚡ Operações', color: 'bg-indigo-50 border-indigo-200' },
];

export const InvestmentDashboard: React.FC<Props> = ({
  investments,
  onUpgrade,
  dirtyMoney = 0,
  title = 'Centro de Investimentos',
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('resources');
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null);

  const getInvestmentsByCategory = (category: string) => {
    return investments.filter(inv => inv.category === category);
  };

  const getTotalLevel = (category: string) => {
    const categoryInvs = getInvestmentsByCategory(category);
    return categoryInvs.reduce((sum, inv) => sum + inv.level, 0);
  };

  const getMaxTotalLevel = (category: string) => {
    const categoryInvs = getInvestmentsByCategory(category);
    return categoryInvs.reduce((sum, inv) => sum + inv.maxLevel, 0);
  };

  const canUpgrade = (investment: Investment) => {
    return investment.level < investment.maxLevel && dirtyMoney >= investment.cost;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>

      {/* Money Display */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-gray-600">Dinheiro Disponível</p>
        <p className="text-3xl font-bold text-green-600">R$ {dirtyMoney.toLocaleString()}</p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map(category => {
          const categoryInvs = getInvestmentsByCategory(category.key);
          const currentTotal = getTotalLevel(category.key);
          const maxTotal = getMaxTotalLevel(category.key);
          const progress = Math.round((currentTotal / maxTotal) * 100);
          const isExpanded = expandedCategory === category.key;

          return (
            <div key={category.key} className={`border-2 ${category.color} rounded-lg overflow-hidden`}>
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-black hover:bg-opacity-5 transition-all"
              >
                <div className="text-left flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-600">
                    {categoryInvs.length} investimentos • {currentTotal}/{maxTotal} níveis
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12 text-right">{progress}%</span>
                  <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="border-t-2 border-inherit p-4 space-y-2">
                  {categoryInvs.map(investment => (
                    <div
                      key={investment.key}
                      onClick={() => setSelectedInvestment(investment.key)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedInvestment === investment.key
                          ? 'bg-white border-blue-500 shadow-lg'
                          : 'bg-white border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{investment.name}</h4>
                          <p className="text-xs text-gray-600">{investment.description}</p>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-700">
                            {investment.level}/{investment.maxLevel}
                          </p>
                        </div>
                      </div>

                      {/* Level Progress */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(investment.level / investment.maxLevel) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Cost and Button */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                          Custo próx. nível: <span className="font-bold text-gray-800">R$ {investment.cost.toLocaleString()}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            canUpgrade(investment) && onUpgrade?.(investment.key);
                          }}
                          disabled={!canUpgrade(investment) || investment.level >= investment.maxLevel}
                          className={`px-3 py-1 rounded text-sm font-bold text-white transition-all ${
                            investment.level >= investment.maxLevel
                              ? 'bg-gray-400 cursor-not-allowed'
                              : canUpgrade(investment)
                                ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                : 'bg-orange-400 cursor-not-allowed'
                          }`}
                        >
                          {investment.level >= investment.maxLevel ? '✓ Máx' : 'Upgrade'}
                        </button>
                      </div>

                      {/* Benefit Info */}
                      {selectedInvestment === investment.key && (
                        <div className="mt-3 pt-3 border-t-2 border-gray-200">
                          <p className="text-xs text-gray-600">
                            <strong>Benefício próximo:</strong> {investment.benefit}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">💡 Dicas de Investimento</h3>
        <ul className="text-xs text-purple-800 space-y-1 ml-4 list-disc">
          <li><strong>Prioridade 1:</strong> "Doutrina Criminal" + "Arsenal Coletivo" para +power</li>
          <li><strong>Prioridade 2:</strong> "Expansão do Hospital" para aumentar capacidade</li>
          <li><strong>Prioridade 3:</strong> "Tática de BONDE" para potencializar Nitros/Capangas</li>
          <li><strong>Dica:</strong> Alguns investimentos desbloqueiam outros como pré-requisito</li>
        </ul>
      </div>
    </div>
  );
};

export default InvestmentDashboard;
