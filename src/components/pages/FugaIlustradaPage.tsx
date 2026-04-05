import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';
import AccessoriesShop from '@/components/AccessoriesShop';

interface FugaVehicle {
  _id: string;
  name?: string;
  level?: number;
  price?: number;
  image?: string;
  abilityBonusType?: string;
  description?: string;
}

interface Accessory {
  id: string;
  name: string;
  bonusType: string;
  bonusAmount: number;
  price: number;
  vehicleId: string;
  maxLevel: number;
}

export default function FugaIlustradaPage() {
  const [vehicles, setVehicles] = useState<FugaVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<FugaVehicle | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'accessories'>('vehicles');

  const playerStore = usePlayerStore();
  const player = playerStore.player;
  const cleanMoney = player.balances.cleanMoney || 0;
  const ownedVehicles = player.ownedVehicles || [];
  const playerLevel = player?.niveis?.playerLevel || 1;

  const visibleVehicles = vehicles.filter(
    (vehicle) => (vehicle.level || 1) === playerLevel
  );

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const result = await BaseCrudService.getAll<FugaVehicle>('fugavehicles', [], { limit: 100 });
        const sortedVehicles = result.items.sort((a, b) => (a.level || 0) - (b.level || 0));
        setVehicles(sortedVehicles);
      } catch (error) {
        console.error('Erro ao carregar veículos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, []);

  const calculateVehiclePrice = (level: number): number => {
    const minPrice = 103;
    const maxPrice = 750000000;
    const maxLevel = 100;

    if (level <= 1) return minPrice;
    if (level >= maxLevel) return maxPrice;

    const ratio = Math.pow(maxPrice / minPrice, (level - 1) / (maxLevel - 1));
    return minPrice * ratio;
  };

  const handlePurchaseVehicle = (vehicle: FugaVehicle) => {
    const price = calculateVehiclePrice(vehicle.level || 1);

    if (cleanMoney < price) {
      setPurchaseMessage('Você não tem dinheiro limpo suficiente!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }

    if (ownedVehicles.includes(vehicle._id)) {
      setPurchaseMessage('Você já possui este veículo!');
      setTimeout(() => setPurchaseMessage(''), 3000);
      return;
    }

    playerStore.removeCleanMoney(price);
    playerStore.addOwnedVehicle(vehicle._id);

    if (vehicle.abilityBonusType) {
      playerStore.addSkillBonus(vehicle.abilityBonusType, 1);
    }

    setPurchaseMessage(`${vehicle.name} adquirido com sucesso!`);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-[120rem] mx-auto px-4 py-12">
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="font-heading text-7xl font-bold mb-4 text-primary">
              Fuga Ilustrada
            </h1>
            <p className="font-paragraph text-xl text-secondary mb-6">
              Garagem de Veículos de Fuga - Escolha seu meio de escape
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-custom4 p-6 rounded-lg border border-primary"
            >
              <p className="text-secondary text-sm mb-2">Dinheiro Limpo</p>
              <p className="font-heading text-4xl font-bold text-primary">
                R$ {cleanMoney.toFixed(2)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-custom4 p-6 rounded-lg border border-primary"
            >
              <p className="text-secondary text-sm mb-2">Veículos Possuídos</p>
              <p className="font-heading text-4xl font-bold text-primary">
                {ownedVehicles.length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-custom4 p-6 rounded-lg border border-primary"
            >
              <p className="text-secondary text-sm mb-2">Total de Veículos</p>
              <p className="font-heading text-4xl font-bold text-primary">
                {visibleVehicles.length}
              </p>
            </motion.div>
          </div>

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
        </section>

        <section className="mb-12">
          <div className="flex gap-4 mb-8 border-b border-secondary">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-6 py-3 font-heading font-bold text-lg transition-all ${
                activeTab === 'vehicles'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Veículos
            </button>
            <button
              onClick={() => setActiveTab('accessories')}
              className={`px-6 py-3 font-heading font-bold text-lg transition-all ${
                activeTab === 'accessories'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Acessórios
            </button>
          </div>

          {activeTab === 'vehicles' && (
            <div>
              <h2 className="font-heading text-4xl font-bold mb-8 text-center">
                Catálogo de Veículos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleVehicles.map((vehicle, index) => {
                  const isOwned = ownedVehicles.includes(vehicle._id);
                  const price = calculateVehiclePrice(vehicle.level || 1);
                  const canAfford = cleanMoney >= price;

                  return (
                    <motion.div
                      key={vehicle._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isOwned
                          ? 'border-primary bg-custom4 opacity-75'
                          : canAfford
                            ? 'border-secondary hover:border-primary bg-custom4'
                            : 'border-destructive bg-custom4 opacity-60'
                      }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="relative h-40 bg-black overflow-hidden">
                        {vehicle.image ? (
                          <Image
                            src={vehicle.image}
                            alt={vehicle.name || 'Veículo'}
                            className="w-full h-full object-cover"
                            width={300}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-custom4">
                            <span className="text-secondary text-sm">Sem imagem</span>
                          </div>
                        )}
                        {isOwned && (
                          <div className="absolute top-2 right-2 bg-primary px-3 py-1 rounded text-black font-bold text-sm">
                            POSSUÍDO
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-heading text-lg font-bold text-primary">
                            {vehicle.name}
                          </h3>
                          <span className="bg-primary text-black px-2 py-1 rounded text-xs font-bold">
                            Nv. {vehicle.level}
                          </span>
                        </div>

                        <p className="text-secondary text-xs mb-3 line-clamp-2">
                          {vehicle.description}
                        </p>

                        <div className="mb-3">
                          <p className="text-secondary text-xs mb-1">
                            Bônus: <span className="text-primary">{vehicle.abilityBonusType}</span>
                          </p>
                          <p className="text-secondary text-xs">+1% em {vehicle.abilityBonusType}</p>
                        </div>

                        <div className="border-t border-secondary pt-3 mb-3">
                          <p className="text-primary font-heading text-xl font-bold">
                            R$ {price.toFixed(2)}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseVehicle(vehicle);
                          }}
                          disabled={isOwned || !canAfford}
                          className={`w-full py-2 rounded font-heading font-bold transition-all ${
                            isOwned
                              ? 'bg-custom4 text-secondary cursor-not-allowed'
                              : canAfford
                                ? 'bg-primary text-black hover:bg-secondary'
                                : 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isOwned ? 'Possuído' : canAfford ? 'Comprar' : 'Sem Fundos'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'accessories' && (
            <AccessoriesShop ownedVehicles={ownedVehicles} vehicles={vehicles} />
          )}
        </section>

        {selectedVehicle && activeTab === 'vehicles' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVehicle(null)}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-custom4 rounded-lg max-w-2xl w-full border-2 border-primary p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center">
                  {selectedVehicle.image ? (
                    <Image
                      src={selectedVehicle.image}
                      alt={selectedVehicle.name || 'Veículo'}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                      width={400}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-primary to-custom4 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-secondary">Sem imagem</span>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-heading text-4xl font-bold text-primary mb-4">
                    {selectedVehicle.name}
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-secondary text-sm">Nível</p>
                      <p className="font-heading text-2xl font-bold text-primary">
                        {selectedVehicle.level}
                      </p>
                    </div>

                    <div>
                      <p className="text-secondary text-sm">Preço</p>
                      <p className="font-heading text-2xl font-bold text-primary">
                        R$ {calculateVehiclePrice(selectedVehicle.level || 1).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-secondary text-sm">Bônus de Habilidade</p>
                      <p className="font-heading text-lg font-bold text-primary">
                        +1% em {selectedVehicle.abilityBonusType}
                      </p>
                    </div>

                    <div>
                      <p className="text-secondary text-sm">Descrição</p>
                      <p className="font-paragraph text-base text-secondary">
                        {selectedVehicle.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handlePurchaseVehicle(selectedVehicle);
                      setSelectedVehicle(null);
                    }}
                    disabled={
                      ownedVehicles.includes(selectedVehicle._id) ||
                      cleanMoney < calculateVehiclePrice(selectedVehicle.level || 1)
                    }
                    className={`w-full py-3 rounded font-heading font-bold text-lg transition-all ${
                      ownedVehicles.includes(selectedVehicle._id)
                        ? 'bg-custom4 text-secondary cursor-not-allowed'
                        : cleanMoney >= calculateVehiclePrice(selectedVehicle.level || 1)
                          ? 'bg-primary text-black hover:bg-secondary'
                          : 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                    }`}
                  >
                    {ownedVehicles.includes(selectedVehicle._id)
                      ? 'Já Possuído'
                      : cleanMoney >= calculateVehiclePrice(selectedVehicle.level || 1)
                        ? 'Comprar Agora'
                        : 'Sem Fundos Suficientes'}
                  </button>

                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="w-full mt-3 py-3 rounded font-heading font-bold text-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-black transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
