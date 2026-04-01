import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { getCollectionNameByLevel, getLuxuryPrice, getLuxuryPriceWithInsurance, getSkillByItemId } from '@/data/luxoItems';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PurchaseInsuranceModal from '@/components/PurchaseInsuranceModal';
import CardTransactionModal from '@/components/CardTransactionModal';
import PurchaseResultModal from '@/components/PurchaseResultModal';
import { getReducedInventoryBonus } from '@/utils/inventoryBonus';

interface SelectedItem {
  id: number;
  name: string;
  price: number;
  skillType?: string;
}

interface SkillBonus {
  type: 'with' | 'without';
  skillType: string;
  skillBonus: number;
  skillBonusPercent: number;
}

export default function GaleriaPage() {
  const player = usePlayerStore((state) => state.player);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const barracoLevel = player?.niveis?.barracoLevel || 1;
  const collectionName = getCollectionNameByLevel(barracoLevel);

  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<'insufficient' | 'duplicate' | null>(null);
  const [skillBonus, setSkillBonus] = useState<SkillBonus | null>(null);
  const [insuranceType, setInsuranceType] = useState<'with' | 'without'>('without');

  const itemPrice = selectedItem ? getLuxuryPrice(barracoLevel) : 0;

  const handleBuyClick = (itemId: number) => {
    const itemName = `Item ${itemId}`;
    const skillType = getSkillByItemId(itemId);
    setSelectedItem({
      id: itemId,
      name: itemName,
      price: getLuxuryPrice(barracoLevel),
      skillType,
    });
    setShowInsuranceModal(true);
  };

  const handleInsuranceSelect = (type: 'with' | 'without') => {
    if (!selectedItem) return;
    
    // Get the skill associated with this item (1% per level)
    const skillType = selectedItem.skillType || getSkillByItemId(selectedItem.id);
    const skillBonusPercent = 1; // Fixed 1% per level
    
    const bonus: SkillBonus = {
      type,
      skillType,
      skillBonus: skillBonusPercent,
      skillBonusPercent,
    };
    setSkillBonus(bonus);
    setInsuranceType(type);
    setShowInsuranceModal(false);
    setShowCardModal(true);
  };

  const processTransaction = (bonus: SkillBonus, insuranceType: 'with' | 'without') => {
    // Validate player and item exist
    if (!player || !selectedItem) return;

    const cleanMoneyBalance = player?.balances?.cleanMoney || 0;
    const finalPrice = getLuxuryPriceWithInsurance(barracoLevel, insuranceType === 'with');

    // Check if player has enough clean money
    if (cleanMoneyBalance < finalPrice) {
      setIsProcessing(false);
      setShowCardModal(false);
      setPurchaseError('insufficient');
      setShowResultModal(true);
      return;
    }

    // Check if item already owned (prevent duplicate purchase)
    const alreadyOwned = (player?.inventory?.items || []).some(
      (item) => item.itemId === selectedItem.id && item.level === barracoLevel
    );
    
    if (alreadyOwned) {
      setIsProcessing(false);
      setShowCardModal(false);
      setPurchaseError('duplicate');
      setShowResultModal(true);
      return;
    }

    // Create new item with unique ID combining itemId, level, and timestamp
    const newItem = {
      id: `${selectedItem.id}-${barracoLevel}-${Date.now()}`,
      itemId: selectedItem.id,
      name: selectedItem.name,
      price: finalPrice,
      purchasedAt: new Date().toISOString(),
      insurance: insuranceType === 'with',
      level: barracoLevel,
    };

    // Update player state
    const updatedPlayer = {
      ...player,
      balances: {
        ...player.balances,
        cleanMoney: cleanMoneyBalance - finalPrice,
      },
      inventory: {
        ...player.inventory,
        items: [...(player.inventory?.items || []), newItem],
      },
      skills: {
        ...player.skills,
        [bonus.skillType]: Number(((player.skills?.[bonus.skillType] || 0) + getReducedInventoryBonus(bonus.skillBonusPercent, player)).toFixed(2)),
      },
    };

    setPlayer(updatedPlayer);
    setIsProcessing(false);
    setShowCardModal(false);
    setPurchaseError(null);
    setShowResultModal(true);
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    setSelectedItem(null);
    setSkillBonus(null);
    setPurchaseError(null);
  };

  const handleCardConfirm = () => {
    if (!skillBonus) return;
    setIsProcessing(true);
    // Process transaction immediately when card is tapped
    setTimeout(() => {
      processTransaction(skillBonus, insuranceType);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col relative bg-[#01020bff] overflow-hidden py-20 px-4">
        <div className="max-w-[100rem] mx-auto w-full">
          {/* Letreiro da Coleção */}
          <motion.div
            className="text-center mb-40 mt-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-heading text-primary tracking-widest">
              Coleção {collectionName}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4" />
          </motion.div>

          {/* Grid de Containers */}
          <div className="grid grid-cols-2 gap-8 justify-items-center mt-12">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="w-full max-w-sm flex flex-col items-center">
                <motion.div
                  className="w-full h-96 rounded-lg border border-white/20 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_rgba(255,0,127,0.3)] relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: item * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {item === 1 ? (
                    <video
                      src="https://video.wixstatic.com/video/50f4bf_5c5ff0aa73984169aee6006f54c6643a/480p/mp4/file.mp4"
                      controls
                      loop
                      autoPlay
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  ) : item === 2 ? (
                    <video
                      src="https://video.wixstatic.com/video/50f4bf_250b2ec2185b4a9f9ee60ee62867b785/720p/mp4/file.mp4"
                      controls
                      loop
                      autoPlay
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  ) : item === 3 ? (
                    <video
                      src="https://video.wixstatic.com/video/50f4bf_9b3fc97f452e45a7a1bde3afb5825aef/720p/mp4/file.mp4"
                      controls
                      loop
                      autoPlay
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4">
                        <span className="text-3xl font-bold text-primary">{item}</span>
                      </div>
                      <h3 className="text-xl font-heading text-white mb-2">Item {item}</h3>
                      <p className="text-sm font-paragraph text-white/60 text-center">Descrição do item {item}</p>
                    </>
                  )}
                </motion.div>
                
                {/* Espaço simétrico e botão comprar */}
                <motion.div
                  className="mt-6 w-full flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: item * 0.1 + 0.2, duration: 0.5 }}
                >
                  <button
                    onClick={() => handleBuyClick(item)}
                    className="px-8 py-3 bg-primary text-black font-heading text-lg rounded-lg hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,127,0.5)] active:scale-95"
                  >
                    Comprar Item {item}
                  </button>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <PurchaseInsuranceModal
        isOpen={showInsuranceModal}
        itemName={selectedItem?.name || ''}
        itemPrice={itemPrice}
        skillType={selectedItem?.skillType || 'attack'}
        playerLevel={barracoLevel}
        onSelect={handleInsuranceSelect}
        onClose={() => setShowInsuranceModal(false)}
      />

      <CardTransactionModal
        isOpen={showCardModal}
        isProcessing={isProcessing}
        onConfirm={handleCardConfirm}
        onClose={() => {
          if (!isProcessing) {
            setShowCardModal(false);
            setSelectedItem(null);
            setSkillBonus(null);
          }
        }}
      />

      <PurchaseResultModal
        isOpen={showResultModal}
        error={purchaseError}
        itemName={selectedItem?.name}
        skillBonus={skillBonus?.skillBonus}
        skillType={skillBonus?.skillType}
        skillBonusPercent={skillBonus?.skillBonusPercent}
        onClose={handleCloseResult}
      />

      <Footer />
    </div>
  );
}
