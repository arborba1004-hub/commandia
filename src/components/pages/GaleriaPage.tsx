import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import {
  getCollectionNameByLevel,
  getLuxuryPrice,
  getLuxuryPriceWithInsurance,
  getSkillByItemId,
} from '@/data/luxoItems';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PurchaseInsuranceModal from '@/components/PurchaseInsuranceModal';
import CardTransactionModal from '@/components/CardTransactionModal';
import PurchaseResultModal from '@/components/PurchaseResultModal';
import { getReducedInventoryBonus } from '@/utils/inventoryBonus';
import TintedVideoCard from '@/components/gallery/TintedVideoCard';
import { getGalleryVideoPalette } from '@/data/galleryVideoPalettes';

interface SelectedItem {
  id: number;
  name: string;
  basePrice: number;
  skillType: string;
}

interface SkillBonus {
  type: 'with' | 'without';
  skillType: string;
  skillBonus: number;
  skillBonusPercent: number;
}

type PurchaseErrorType = 'insufficient' | 'duplicate' | null;

type GalleryItemMeta = {
  id: number;
  name: string;
  description: string;
  videoSrc?: string;
};

const GALLERY_ITEMS: GalleryItemMeta[] = [
  {
    id: 1,
    name: 'Anel',
    description: 'Peça de ostentação com acabamento premium.',
    videoSrc:
      'https://video.wixstatic.com/video/50f4bf_5c5ff0aa73984169aee6006f54c6643a/480p/mp4/file.mp4',
  },
  {
    id: 2,
    name: 'Pulseira',
    description: 'Visual marcante para subir seu status.',
    videoSrc:
      'https://video.wixstatic.com/video/50f4bf_250b2ec2185b4a9f9ee60ee62867b785/720p/mp4/file.mp4',
  },
  {
    id: 3,
    name: 'Corrente',
    description: 'Presença pesada e estilo de alto padrão.',
    videoSrc:
      'https://video.wixstatic.com/video/50f4bf_9b3fc97f452e45a7a1bde3afb5825aef/720p/mp4/file.mp4',
  },
  {
    id: 4,
    name: 'Bolsa',
    description: 'Luxo discreto com assinatura exclusiva.',
  },
  {
    id: 5,
    name: 'Relógio',
    description: 'Precisão, respeito e presença.',
  },
  {
    id: 6,
    name: 'Óculos',
    description: 'Estilo blindado para dominar a cena.',
  },
];

export default function GaleriaPage() {
  const {
    player,
    isLoaded,
    loadPlayer,
    purchaseLuxuryItemLocal,
  } = usePlayerStore();

  const playerLevel = player?.niveis?.playerLevel ?? 1;
  const collectionName = getCollectionNameByLevel(playerLevel);
  const videoPalette = getGalleryVideoPalette(playerLevel);

  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<PurchaseErrorType>(null);
  const [skillBonus, setSkillBonus] = useState<SkillBonus | null>(null);
  const [insuranceType, setInsuranceType] = useState<'with' | 'without'>('without');

  const processingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }

    return () => {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [isLoaded, loadPlayer]);

  const selectedItemFinalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    return getLuxuryPriceWithInsurance(playerLevel, insuranceType === 'with');
  }, [selectedItem, playerLevel, insuranceType]);

  const resetTransientState = () => {
    setIsProcessing(false);
    setSkillBonus(null);
    setInsuranceType('without');
  };

  const resetAllState = () => {
    setSelectedItem(null);
    setShowInsuranceModal(false);
    setShowCardModal(false);
    setShowResultModal(false);
    setPurchaseError(null);
    resetTransientState();
  };

  const handleBuyClick = (itemId: number) => {
    if (!player?._id || isProcessing) return;

    const itemMeta = GALLERY_ITEMS.find((item) => item.id === itemId);
    if (!itemMeta) return;

    const skillType = getSkillByItemId(itemId);

    setSelectedItem({
      id: itemId,
      name: itemMeta.name,
      basePrice: getLuxuryPrice(playerLevel),
      skillType,
    });

    setPurchaseError(null);
    setSkillBonus(null);
    setInsuranceType('without');
    setShowInsuranceModal(true);
  };

  const handleInsuranceSelect = (type: 'with' | 'without') => {
    if (!selectedItem) return;

    const skillBonusPercent = 1;

    setSkillBonus({
      type,
      skillType: selectedItem.skillType,
      skillBonus: skillBonusPercent,
      skillBonusPercent,
    });

    setInsuranceType(type);
    setShowInsuranceModal(false);
    setShowCardModal(true);
  };

  const processTransaction = (
    bonus: SkillBonus,
    chosenInsuranceType: 'with' | 'without'
  ) => {
    if (!player || !selectedItem) return;

    const finalPrice = getLuxuryPriceWithInsurance(
      playerLevel,
      chosenInsuranceType === 'with'
    );

    const result = purchaseLuxuryItemLocal({
      itemId: selectedItem.id,
      name: selectedItem.name,
      price: finalPrice,
      skillType: bonus.skillType,
      skillBonusPercent: getReducedInventoryBonus(
        bonus.skillBonusPercent,
        player
      ),
      insurance: chosenInsuranceType === 'with',
    });

    setIsProcessing(false);
    setShowCardModal(false);

    if (!result.ok) {
      setPurchaseError(
        result.reason === 'Saldo insuficiente' ? 'insufficient' : 'duplicate'
      );
      setShowResultModal(true);
      return;
    }

    setPurchaseError(null);
    setShowResultModal(true);
  };

  const handleCardConfirm = () => {
    if (!skillBonus || !selectedItem || isProcessing) return;

    setIsProcessing(true);

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
    }

    processingTimeoutRef.current = window.setTimeout(() => {
      processTransaction(skillBonus, insuranceType);
    }, 1500);
  };

  const handleCloseInsurance = () => {
    if (isProcessing) return;
    setShowInsuranceModal(false);
    setSelectedItem(null);
    setSkillBonus(null);
    setInsuranceType('without');
  };

  const handleCloseCard = () => {
    if (isProcessing) return;
    setShowCardModal(false);
    setSelectedItem(null);
    setSkillBonus(null);
    setInsuranceType('without');
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    setSelectedItem(null);
    setSkillBonus(null);
    setPurchaseError(null);
    setInsuranceType('without');
  };

  const alreadyOwnedAtLevel = (itemId: number) => {
    const items = player?.inventory?.items || [];
    return items.some(
      (item: any) => item.itemId === itemId && item.level === playerLevel
    );
  };

  if (!isLoaded || !player?._id) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col relative bg-[#01020bff] overflow-hidden py-20 px-4 pt-[140px] md:pt-[160px]">
        <div className="max-w-[100rem] mx-auto w-full">
          <motion.div
            className="text-center mb-24 mt-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-heading text-primary tracking-widest">
              Coleção {collectionName}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4" />
            <p className="mt-5 text-white/70 text-sm md:text-base">
              Nível atual da coleção: <span className="text-primary font-bold">{playerLevel}</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
            {GALLERY_ITEMS.map((item, index) => {
              const owned = alreadyOwnedAtLevel(item.id);

              return (
                <div key={item.id} className="w-full max-w-sm flex flex-col items-center">
                  <motion.div
                    className={`w-full h-96 rounded-lg border backdrop-blur-sm p-6 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
                      owned
                        ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                        : 'border-white/20 bg-gradient-to-br from-white/5 to-white/2 hover:border-primary hover:shadow-[0_0_20px_rgba(255,0,127,0.3)]'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                    whileHover={{ scale: owned ? 1 : 1.02 }}
                  >
                    {item.videoSrc ? (
                      <TintedVideoCard src={item.videoSrc} palette={videoPalette} />
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4">
                          <span className="text-3xl font-bold text-primary">{item.id}</span>
                        </div>
                        <h3 className="text-xl font-heading text-white mb-2">{item.name}</h3>
                        <p className="text-sm font-paragraph text-white/60 text-center">
                          {item.description}
                        </p>
                      </>
                    )}

                    {owned && (
                      <div className="absolute top-3 right-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                        Comprado
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className="mt-6 w-full flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.2, duration: 0.5 }}
                  >
                    <div className="text-sm text-white/70">
                      Preço base: <span className="text-primary font-semibold">R$ {getLuxuryPrice(playerLevel).toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => handleBuyClick(item.id)}
                      disabled={owned || isProcessing}
                      className="px-8 py-3 bg-primary text-black font-heading text-lg rounded-lg hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,127,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {owned ? 'Já Comprado' : `Comprar ${item.name}`}
                    </button>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PurchaseInsuranceModal
        isOpen={showInsuranceModal}
        itemName={selectedItem?.name || ''}
        itemPrice={selectedItem?.basePrice || 0}
        skillType={selectedItem?.skillType || 'attack'}
        playerLevel={playerLevel}
        onSelect={handleInsuranceSelect}
        onClose={handleCloseInsurance}
      />

      <CardTransactionModal
        isOpen={showCardModal}
        isProcessing={isProcessing}
        onConfirm={handleCardConfirm}
        onClose={handleCloseCard}
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