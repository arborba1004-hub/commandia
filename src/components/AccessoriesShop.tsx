import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getAccessoryBonus } from '@/utils/accessoryBonus';

interface Accessory {
  _id: string;
  itemName?: string;
  itemDescription?: string;
  itemPrice?: number;
  itemImage?: string;
  skillType?: string;
}

interface FugaVehicle {
  _id: string;
  name?: string;
  level?: number;
  price?: number;
  image?: string;
  abilityBonusType?: string;
  description?: string;
}

interface AccessoriesShopProps {
  ownedVehicles: string[];
  vehicles: FugaVehicle[];
}

const SKILL_TYPES = ['attack', 'defense', 'intelligence', 'agility', 'respect', 'vigor'];

export default function AccessoriesShop({ ownedVehicles, vehicles }: AccessoriesShopProps) {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  const player = usePlayerStore((state) => state.player);
  const removeCleanMoney = usePlayerStore((state) => state.removeCleanMoney);
  const purchaseAccessory = usePlayerStore((state) => state.purchaseAccessory);
  const addSkillBonus = usePlayerStore((state) => state.addSkillBonus);
  const cleanMoney = player.balances.cleanMoney || 0;
  const playerLevel = player.niveis.playerLevel || 1;
  const purchasedAccessories = player.purchasedAccessories || [];

  useEffect(() => {
    const loadAccessories = async () => {
      try {
        const result = await BaseCrudService.getAll<Accessory>('accessories', [], { limit: 100 });
        setAccessories(result.items);
      } catch (error) {
        console.error('Erro ao carregar acessórios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccessories();
  }, []);

  const handlePurchaseAccessory = (accessory: Accessory) => {
    const price = accessory.itemPrice || 1.99;
    const skillType = accessory.skillType || 'attack';

    // Verificar se já foi comprado
    if (purchasedAccessories.some((acc) => acc.accessoryId === accessory._id)) {
      setPurchaseMessage('Você já possui este acessório!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }

    // Verificar se tem dinheiro suficiente
    if (cleanMoney < price) {
      setPurchaseMessage('Você não tem dinheiro limpo suficiente!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }

    // Atualizar playerStore
    removeCleanMoney(price);
    purchaseAccessory(accessory._id, skillType);
    
    // Apply bonus based on player level
    const bonus = getAccessoryBonus(player.niveis.playerLevel);
    addSkillBonus(skillType, bonus);

    setPurchaseMessage(`${accessory.itemName} adquirido com sucesso! +${bonus}% em ${skillType}`);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <LoadingSpinner />
      </div>
    );
  }

  if (accessories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary text-lg">Nenhum acessório disponível.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h3 className="font-heading text-3xl font-bold text-primary mb-2">
          Acessórios Disponíveis
        </h3>
        <p className="text-secondary text-sm">
          Nível do Jogador: {playerLevel} | Bônus por Acessório: +{getAccessoryBonus(playerLevel)}%
        </p>
        <p className="text-secondary text-sm mt-2">
          Você possui {ownedVehicles.length} veículo(s). Compre acessórios apenas para os veículos que já possui!
        </p>
      </div>

      {/* Purchase Message */}
      {purchaseMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-4 rounded-lg text-center font-paragraph text-lg mb-8 ${
            purchaseMessage.includes('sucesso')
              ? 'bg-green-900 text-green-100'
              : 'bg-destructive text-destructiveforeground'
          }`}
        >
          {purchaseMessage}
        </motion.div>
      )}

      {/* Accessories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessories.map((accessory, index) => {
          const isPurchased = purchasedAccessories.some((acc) => acc.accessoryId === accessory._id);
          const price = accessory.itemPrice || 1.99;
          const canAfford = cleanMoney >= price;
          const skillType = accessory.skillType || 'attack';
          const bonus = getAccessoryBonus(playerLevel);
          // Verificar se o jogador possui algum veículo
          const canPurchase = ownedVehicles.length > 0;

          return (
            <motion.div
              key={accessory._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                isPurchased
                  ? 'border-primary bg-custom4 opacity-75'
                  : canAfford && canPurchase
                    ? 'border-secondary hover:border-primary bg-custom4'
                    : 'border-destructive bg-custom4 opacity-60'
              }`}
              onClick={() => setSelectedAccessory(accessory)}
            >
              {/* Accessory Image */}
              <div className="relative h-32 bg-black overflow-hidden">
                {accessory.itemImage ? (
                  <Image
                    src={accessory.itemImage}
                    alt={accessory.itemName || 'Acessório'}
                    className="w-full h-full object-cover"
                    width={300}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-custom4">
                    <span className="text-secondary text-sm">Sem imagem</span>
                  </div>
                )}
                {isPurchased && (
                  <div className="absolute top-2 right-2 bg-primary px-3 py-1 rounded text-black font-bold text-xs">
                    COMPRADO
                  </div>
                )}
                {!canPurchase && (
                  <div className="absolute top-2 right-2 bg-destructive px-3 py-1 rounded text-white font-bold text-xs">
                    SEM VEÍCULO
                  </div>
                )}
              </div>

              {/* Accessory Info */}
              <div className="p-4">
                <h4 className="font-heading text-lg font-bold text-primary mb-2">
                  {accessory.itemName}
                </h4>

                <p className="text-secondary text-xs mb-3 line-clamp-2">
                  {accessory.itemDescription}
                </p>

                <div className="mb-3 p-2 bg-black rounded">
                  <p className="text-secondary text-xs mb-1">
                    Habilidade: <span className="text-primary font-bold">{skillType}</span>
                  </p>
                  <p className="text-primary text-xs font-bold">
                    +{bonus}% em {skillType}
                  </p>
                </div>

                <div className="border-t border-secondary pt-3 mb-3">
                  <p className="text-primary font-heading text-xl font-bold">
                    R$ {price.toFixed(2)}
                  </p>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseAccessory(accessory);
                  }}
                  disabled={isPurchased || !canAfford || !canPurchase}
                  className={`w-full py-2 rounded font-heading font-bold transition-all text-sm ${
                    isPurchased
                      ? 'bg-custom4 text-secondary cursor-not-allowed'
                      : !canPurchase
                        ? 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                        : canAfford
                          ? 'bg-primary text-black hover:bg-secondary'
                          : 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                  }`}
                >
                  {isPurchased ? 'Comprado' : !canPurchase ? 'Sem Veículo' : canAfford ? 'Comprar' : 'Sem Fundos'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Accessory Detail Modal */}
      {selectedAccessory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedAccessory(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border-2 border-primary bg-custom4 p-4 sm:rounded-lg sm:p-8"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
              {/* Image */}
              <div className="flex flex-col items-center">
                {selectedAccessory.itemImage ? (
                  <Image
                    src={selectedAccessory.itemImage}
                    alt={selectedAccessory.itemName || 'Acessório'}
                    className="h-44 w-full rounded-lg object-cover sm:h-64"
                    width={400}
                  />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br sm:h-64 from-primary to-custom4 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-secondary">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary sm:text-4xl">
                  {selectedAccessory.itemName}
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-secondary text-sm">Descrição</p>
                    <p className="font-paragraph text-base text-secondary">
                      {selectedAccessory.itemDescription}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary text-sm">Habilidade Aprimorada</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      {selectedAccessory.skillType}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary text-sm">Bônus</p>
                    <p className="font-heading text-lg font-bold text-primary">
                      +{getAccessoryBonus(playerLevel)}% em {selectedAccessory.skillType}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary text-sm">Preço</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      R$ {(selectedAccessory.itemPrice || 1.99).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-black p-3 rounded">
                    <p className="text-secondary text-xs">Seu Nível: {playerLevel}</p>
                    <p className="text-primary text-xs font-bold">
                      {playerLevel <= 50
                        ? 'Bônus: +1% por acessório (até nível 50)'
                        : 'Bônus: +2% por acessório (nível 51+)'}
                    </p>
                    <p className="text-secondary text-xs mt-2">
                      Veículos Possuídos: {ownedVehicles.length}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handlePurchaseAccessory(selectedAccessory);
                    setSelectedAccessory(null);
                  }}
                  disabled={
                    purchasedAccessories.some((acc) => acc.accessoryId === selectedAccessory._id) ||
                    cleanMoney < (selectedAccessory.itemPrice || 1.99) ||
                    ownedVehicles.length === 0
                  }
                  className={`min-h-12 w-full rounded py-3 font-heading text-base font-bold sm:text-lg transition-all ${
                    purchasedAccessories.some((acc) => acc.accessoryId === selectedAccessory._id)
                      ? 'bg-custom4 text-secondary cursor-not-allowed'
                      : ownedVehicles.length === 0
                        ? 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                        : cleanMoney >= (selectedAccessory.itemPrice || 1.99)
                          ? 'bg-primary text-black hover:bg-secondary'
                          : 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                  }`}
                >
                  {purchasedAccessories.some((acc) => acc.accessoryId === selectedAccessory._id)
                    ? 'Já Comprado'
                    : ownedVehicles.length === 0
                      ? 'Compre um Veículo Primeiro'
                      : cleanMoney >= (selectedAccessory.itemPrice || 1.99)
                        ? 'Comprar Agora'
                        : 'Sem Fundos Suficientes'}
                </button>

                <button
                  onClick={() => setSelectedAccessory(null)}
                  className="mt-3 min-h-12 w-full rounded py-3 font-heading text-base font-bold sm:text-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-black transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
