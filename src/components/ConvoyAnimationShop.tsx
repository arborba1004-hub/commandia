import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConvoyAnimationStore, ConvoyAnimationType } from '@/store/convoyAnimationStore';

interface ConvoyAnimation {
  id: ConvoyAnimationType;
  name: string;
  description: string;
  price: number;
}

const ANIMATIONS: ConvoyAnimation[] = [
  {
    id: 'classic-truck',
    name: 'Caminhão Clássico',
    description: 'Um caminhão simples e confiável para transportar seus valores',
    price: 0,
  },
  {
    id: 'armored-van',
    name: 'Van Blindada',
    description: 'Transporte mais seguro com proteção reforçada',
    price: 0,
  },
  {
    id: 'motorcycle',
    name: 'Motocicleta Rápida',
    description: 'Transporte ágil e veloz para entregas urgentes',
    price: 0,
  },
];

export default function ConvoyAnimationShop() {
  const selectedAnimation = useConvoyAnimationStore((state) => state.selectedAnimation);
  const setSelectedAnimation = useConvoyAnimationStore((state) => state.setSelectedAnimation);

  const handleSelectAnimation = (id: ConvoyAnimationType) => {
    setSelectedAnimation(id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl font-bold text-[#d9b764] mb-2">
          ANIMAÇÕES DE COMBOIO
        </h2>
        <p className="font-paragraph text-white/60">
          Escolha a animação para seu serviço de transporte
        </p>
      </div>

      {/* Animations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ANIMATIONS.map((animation) => (
          <motion.div
            key={animation.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectAnimation(animation.id)}
            className={`relative p-6 rounded-lg cursor-pointer transition-all border-2 ${
              selectedAnimation === animation.id
                ? 'border-[#d9b764] bg-gradient-to-br from-[#d9b764]/20 to-transparent'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            {/* Animation Preview */}
            <div className="mb-6 h-40 flex items-center justify-center relative overflow-hidden rounded-lg bg-black/40 border border-white/10">
              <ConvoyAnimationPreview animationId={animation.id} />
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-lg font-bold text-white">
                  {animation.name}
                </h3>
                {selectedAnimation === animation.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-[#d9b764] flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-black" />
                  </motion.div>
                )}
              </div>

              <p className="font-paragraph text-white/60 text-sm">
                {animation.description}
              </p>

              {/* Price */}
              <div className="pt-3 border-t border-white/10">
                <p className="font-heading text-xl font-bold text-[#d9b764]">
                  {animation.price === 0 ? 'GRÁTIS' : `${animation.price} Moedas`}
                </p>
              </div>
            </div>

            {/* Selection Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full mt-4 py-2 rounded-lg font-heading font-bold transition-all ${
                selectedAnimation === animation.id
                  ? 'bg-gradient-to-r from-[#d9b764] to-[#f0d78c] text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {selectedAnimation === animation.id ? 'SELECIONADO' : 'SELECIONAR'}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 p-6 rounded-lg border border-[#d9b764]/30 bg-[#d9b764]/10"
      >
        <p className="font-paragraph text-white/80 text-center">
          ✨ Todas as animações são <span className="text-[#d9b764] font-bold">GRÁTIS</span> e podem ser usadas imediatamente no seu sistema de comboio!
        </p>
      </motion.div>
    </div>
  );
}

// Simple animation preview component
function ConvoyAnimationPreview({ animationId }: { animationId: ConvoyAnimationType }) {
  const getAnimationVariants = () => {
    switch (animationId) {
      case 'classic-truck':
        return {
          initial: { x: -100, opacity: 0 },
          animate: { x: 100, opacity: 1 },
          transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' as const },
        };
      case 'armored-van':
        return {
          initial: { x: -100, opacity: 0, scale: 0.8 },
          animate: { x: 100, opacity: 1, scale: 1 },
          transition: { duration: 1.5, repeat: Infinity, repeatType: 'reverse' as const },
        };
      case 'motorcycle':
        return {
          initial: { x: -100, opacity: 0, rotate: -10 },
          animate: { x: 100, opacity: 1, rotate: 0 },
          transition: { duration: 1, repeat: Infinity, repeatType: 'reverse' as const },
        };
      default:
        return {
          initial: { x: -100 },
          animate: { x: 100 },
          transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' as const },
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={variants.transition}
      className="flex items-center gap-2"
    >
      {animationId === 'classic-truck' && (
        <div className="flex items-center gap-1">
          <div className="w-12 h-8 bg-gradient-to-r from-[#d9b764] to-[#f0d78c] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xs">🚚</span>
          </div>
          <div className="w-8 h-6 bg-white/20 rounded-full"></div>
          <div className="w-8 h-6 bg-white/20 rounded-full"></div>
        </div>
      )}

      {animationId === 'armored-van' && (
        <div className="flex items-center gap-1">
          <div className="w-14 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center border-2 border-red-400">
            <span className="text-white font-bold text-xs">🛡️</span>
          </div>
          <div className="w-8 h-6 bg-white/20 rounded-full"></div>
          <div className="w-8 h-6 bg-white/20 rounded-full"></div>
        </div>
      )}

      {animationId === 'motorcycle' && (
        <div className="flex items-center gap-1">
          <div className="w-10 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xs">🏍️</span>
          </div>
          <div className="w-6 h-5 bg-white/20 rounded-full"></div>
          <div className="w-6 h-5 bg-white/20 rounded-full"></div>
        </div>
      )}
    </motion.div>
  );
}
