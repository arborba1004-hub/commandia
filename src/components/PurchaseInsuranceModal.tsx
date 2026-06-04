import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getLuxuryPriceWithInsurance, SkillType } from '@/data/luxoItems';

const skillNames: Record<SkillType, string> = {
  attack: 'Ataque',
  defense: 'Defesa',
  intelligence: 'Inteligência',
  agility: 'Agilidade',
  respect: 'Respeito',
  vigor: 'Vigor',
};

interface InsuranceOption {
  type: 'with' | 'without';
  label: string;
  description: string;
  skillBonus: number;
  skillType: SkillType;
  finalPrice: number;
}

interface PurchaseInsuranceModalProps {
  isOpen: boolean;
  itemName: string;
  itemPrice: number;
  skillType: SkillType;
  playerLevel: number;
  onSelect: (type: 'with' | 'without') => void;
  onClose: () => void;
}

export default function PurchaseInsuranceModal({
  isOpen,
  itemName,
  itemPrice,
  skillType,
  playerLevel,
  onSelect,
  onClose,
}: PurchaseInsuranceModalProps) {
  const priceWithInsurance = getLuxuryPriceWithInsurance(playerLevel, true);
  const priceWithoutInsurance = getLuxuryPriceWithInsurance(playerLevel, false);
  
  const insuranceOptions: InsuranceOption[] = [
    {
      type: 'with',
      label: 'Com Seguro',
      description: 'Proteção contra perda do item (+10% no preço)',
      skillBonus: 1,
      skillType: skillType,
      finalPrice: priceWithInsurance,
    },
    {
      type: 'without',
      label: 'Sem Seguro',
      description: 'Sem proteção adicional',
      skillBonus: 1,
      skillType: skillType,
      finalPrice: priceWithoutInsurance,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <motion.div
            className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-primary/30 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-2xl sm:mx-4 sm:rounded-lg sm:p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-heading text-primary mb-2">
                Comprar {itemName}
              </h2>
              <p className="text-white/70 font-paragraph">
                Escolha uma opção de compra
              </p>
            </div>

            {/* Item Info */}
            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/80 font-paragraph">
                Preço Base: <span className="text-primary font-heading text-lg">{priceWithoutInsurance} Clean Money</span>
              </p>
            </div>

            {/* Insurance Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {insuranceOptions.map((option) => (
                <motion.button
                  key={option.type}
                  onClick={() => onSelect(option.type)}
                  className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg hover:border-primary/50 transition-all duration-300 text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="text-xl font-heading text-white mb-2 group-hover:text-primary transition-colors">
                    {option.label}
                  </h3>
                  <p className="text-white/60 font-paragraph text-sm mb-4">
                    {option.description}
                  </p>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-white/70 font-paragraph mb-2">
                      Preço: <span className="text-primary font-heading">{option.finalPrice} Clean Money</span>
                    </p>
                    <p className="text-sm text-white/70 font-paragraph">
                      Bônus: <span className="text-green-400 font-heading">+{option.skillBonus}% {skillNames[option.skillType]}</span>
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Info Text */}
            <p className="text-center text-white/50 text-sm font-paragraph">
              Você pode cancelar a qualquer momento
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
