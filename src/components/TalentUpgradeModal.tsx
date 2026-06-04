import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TalentosdoCrime } from '@/entities';
import { getEffectValue } from '@/utils/talentEffects';

interface TalentUpgradeModalProps {
  talent: TalentosdoCrime & { currentLevel: number };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nextLevelCost: number;
  canAfford: boolean;
  isMaxed: boolean;
}

export default function TalentUpgradeModal({
  talent,
  isOpen,
  onClose,
  onConfirm,
  nextLevelCost,
  canAfford,
  isMaxed,
}: TalentUpgradeModalProps) {
  const maxLevel = talent.maxSkillLevel || 5;
  const nextLevel = talent.currentLevel + 1;
  const currentEffect = getEffectValue(
    talent.minEffectValue || 0,
    talent.maxEffectValue || 0,
    talent.currentLevel
  );
  const nextEffect = getEffectValue(
    talent.minEffectValue || 0,
    talent.maxEffectValue || 0,
    nextLevel
  );

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          >
            <Card className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-primary bg-gray-900 sm:rounded-xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors z-10 touch-target"
                aria-label="Fechar modal"
                title="Fechar"
              >
                <X className="w-6 h-6 text-primary hover:text-pink-400 transition-colors" />
              </button>

              {/* Content */}
              <div className="p-6 pt-12">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold font-heading text-primary">
                      EVOLUÇÃO
                    </h2>
                  </div>
                  <h3 className="text-lg font-bold text-white">{talent.skillName}</h3>
                </div>

                {/* Talent Info */}
                <div className="mb-6 space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Descrição</p>
                    <p className="text-white text-sm">{talent.description}</p>
                  </div>

                  {/* Level Progress */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Nível Atual</span>
                      <span className="text-lg font-bold text-primary">
                        {talent.currentLevel}/{maxLevel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(talent.currentLevel / maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Effect Comparison */}
                  {!isMaxed && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Efeito Atual</p>
                        <p className="text-lg font-bold text-yellow-500">
                          {currentEffect}
                          {talent.effectUnit}
                        </p>
                      </div>
                      <div className="bg-primary/20 rounded-lg p-3 border border-primary">
                        <p className="text-xs text-gray-300 mb-1">Próximo Nível</p>
                        <p className="text-lg font-bold text-primary">
                          {nextEffect}
                          {talent.effectUnit}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cooldown Info */}
                  {talent.cooldownDescription && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Cooldown</p>
                      <p className="text-sm text-white">{talent.cooldownDescription}</p>
                    </div>
                  )}
                </div>

                {/* Cost Section */}
                {!isMaxed && (
                  <div className="mb-6 bg-gray-800 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-sm text-gray-400 mb-1">Custo da Evolução</p>
                    <p className={`text-2xl font-bold ${canAfford ? 'text-primary' : 'text-red-500'}`}>
                      ${nextLevelCost.toLocaleString()}
                    </p>
                    {!canAfford && (
                      <p className="text-xs text-red-400 mt-2">Dinheiro sujo insuficiente</p>
                    )}
                  </div>
                )}

                {/* Maxed Out Message */}
                {isMaxed && (
                  <div className="mb-6 bg-green-900/30 rounded-lg p-4 border border-green-500">
                    <p className="text-green-400 font-bold text-center">
                      ✓ Talento no nível máximo!
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!canAfford || isMaxed}
                    className={`flex-1 ${
                      isMaxed
                        ? 'bg-gray-700 cursor-not-allowed'
                        : canAfford
                          ? 'bg-primary hover:bg-pink-600'
                          : 'bg-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {isMaxed ? 'Máximo' : `Evoluir - $${nextLevelCost.toLocaleString()}`}
                  </Button>
                </div>

                {/* Info Text */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Clique em Cancelar ou no X para fechar sem evoluir
                </p>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
