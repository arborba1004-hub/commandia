import { useState, useEffect, useMemo } from 'react';
import { BaseCrudService } from '@/integrations';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';
import { AcessriosdeFuga, EscapeVehicles } from '@/entities';

const VEHICLE_ACCESSORIES = [
  { name: 'Turbo Reforçado', bonus: 'agility' },
  { name: 'Pneus de Alta Performance', bonus: 'defense' },
  { name: 'Motor Preparado', bonus: 'attack' },
  { name: 'Blindagem Leve', bonus: 'defense' },
  { name: 'Sistema Anti-Rastreamento', bonus: 'intelligence' },
  { name: 'Nitrox', bonus: 'agility' },
] as const;

interface PurchasedAccessory {
  accessoryId: string;
  skillType: string;
  purchasedAt: string;
}

export default function FugaIlustradaPage() {
  const [vehicles, setVehicles] = useState<EscapeVehicles[]>([]);
  const [accessories, setAccessories] = useState<AcessriosdeFuga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<EscapeVehicles | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'accessories'>('vehicles');
  const [selectedVehicleForAccessories, setSelectedVehicleForAccessories] =
    useState<EscapeVehicles | null>(null);

  const player = usePlayerStore((s) => s.player);
  const removeCleanMoney = usePlayerStore((s) => s.removeCleanMoney);
  const addOwnedVehicle = usePlayerStore((s) => s.addOwnedVehicle);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const purchaseAccessory = usePlayerStore((s) => s.purchaseAccessory);
  const addAccessory = usePlayerStore((s) => s.addAccessory);

  const cleanMoney = player.balances.cleanMoney;
  const ownedVehicles = player.ownedVehicles || [];
  const purchasedAccessories = player.purchasedAccessories || [];
  const attachedAccessories = player.accessories?.vehicles || {};

  useEffect(() => {
    const loadData = async () => {
      try {
        const vehiclesResult = await BaseCrudService.getAll<EscapeVehicles>(
          'fugavehicles',
          [],
          { limit: 100 }
        );
        const sortedVehicles = vehiclesResult.items.sort(
          (a, b) => (a.level || 0) - (b.level || 0)
        );
        setVehicles(sortedVehicles);

        const accessoriesResult = await BaseCrudService.getAll<AcessriosdeFuga>(
          'accessories',
          [],
          { limit: 100 }
        );
        setAccessories(accessoriesResult.items);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!purchaseMessage) return;

    const timer = window.setTimeout(() => {
      setPurchaseMessage('');
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [purchaseMessage]);

  const calculateVehiclePrice = (level: number): number => {
    const minPrice = 103;
    const maxPrice = 750000000;
    const maxLevel = 100;

    if (level <= 1) return minPrice;
    if (level >= maxLevel) return maxPrice;

    const ratio = Math.pow(maxPrice / minPrice, (level - 1) / (maxLevel - 1));
    return minPrice * ratio;
  };

  const isAccessoryOwnedForVehicle = (vehicleId: string, accessoryName: string) => {
    const currentAccessories = attachedAccessories[vehicleId] || [];
    return currentAccessories.includes(accessoryName);
  };

  const handlePurchaseVehicle = (vehicle: EscapeVehicles) => {
    const price = calculateVehiclePrice(vehicle.level || 1);

    if (cleanMoney < price) {
      setPurchaseMessage('Você não tem dinheiro limpo suficiente!');
      return;
    }

    if (ownedVehicles.includes(vehicle._id)) {
      setPurchaseMessage('Você já possui este veículo!');
      return;
    }

    removeCleanMoney(price);
    addOwnedVehicle(vehicle._id);

    setPurchaseMessage(`${vehicle.name} adquirido com sucesso!`);
  };

  const handlePurchaseAccessory = (accessory: AcessriosdeFuga) => {
    if (purchasedAccessories.some((acc) => acc.accessoryId === accessory._id)) {
      setPurchaseMessage('Você já comprou este acessório!');
      return;
    }

    const price = accessory.itemPrice || 0;

    if (cleanMoney < price) {
      setPurchaseMessage('Você não tem dinheiro suficiente!');
      return;
    }

    removeCleanMoney(price);
purchaseAccessory(accessory._id, accessory.skillType || 'unknown');

    setPlayer({
      purchasedAccessories: [
        ...purchasedAccessories,
        {
          accessoryId: accessory._id,
          skillType: accessory.skillType || 'unknown',
          purchasedAt: new Date().toISOString(),
        } as PurchasedAccessory,
      ],
    });

    setPurchaseMessage(`${accessory.itemName} comprado com sucesso!`);
  };

  const handleBuyVehicleAccessory = (
    vehicle: EscapeVehicles,
    accessory: (typeof VEHICLE_ACCESSORIES)[number]
  ) => {
    const accessoryPrice = 1.99;

    if (cleanMoney < accessoryPrice) {
      setPurchaseMessage('Você não tem dinheiro suficiente!');
      return;
    }

    if (isAccessoryOwnedForVehicle(vehicle._id, accessory.name)) {
      setPurchaseMessage('Você já possui este acessório neste veículo!');
      return;
    }

    removeCleanMoney(accessoryPrice);
    addAccessory('vehicles', vehicle._id, accessory.name);

    setPurchaseMessage(`${accessory.name} adicionado com sucesso!`);
  };

  async function handleBuyVehicleAccessoryPix(vehicle: EscapeVehicles, acc: (typeof VEHICLE_ACCESSORIES)[number]) {
    try {
      const response = await fetch(
        'https://comando-backend.onrender.com/create-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Acessório ${acc.name} - ${vehicle.name || 'Veículo'}`,
            amount: 1.99,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao gerar pagamento');
      }

      if (data.ticket_url) {
        window.open(data.ticket_url, '_blank');
        return;
      }

      alert('Pagamento gerado, mas não veio link.');
    } catch (error) {
      console.error('Erro ao gerar PIX do acessório:', error);
      alert('Erro ao gerar pagamento PIX');
    }
  }

  const vehicleCards = useMemo(() => vehicles, [vehicles]);
  const accessoryCards = useMemo(() => accessories, [accessories]);

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
                {vehicles.length}
              </p>
            </motion.div>
          </div>

          {purchaseMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
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
                {vehicleCards.map((vehicle, index) => {
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
                          <p className="text-secondary text-xs">
                            Bônus aplicado pelo sistema de itens/equipamentos
                          </p>
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVehicleForAccessories(vehicle);
                          }}
                          disabled={!isOwned}
                          className={`w-full mt-2 py-2 rounded font-heading font-bold transition-all ${
                            isOwned
                              ? 'bg-secondary text-black hover:bg-primary'
                              : 'bg-custom4 text-secondary cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isOwned ? 'Acessórios' : 'Compre Primeiro'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'accessories' && (
            <div>
              <h2 className="font-heading text-4xl font-bold mb-8 text-center">
                Loja de Acessórios
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {accessoryCards.map((accessory, index) => {
                  const isPurchased = purchasedAccessories.some(
                    (acc) => acc.accessoryId === accessory._id
                  );
                  const price = accessory.itemPrice || 0;
                  const canAfford = cleanMoney >= price;

                  return (
                    <motion.div
                      key={accessory._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={`rounded-lg overflow-hidden border-2 p-4 transition-all ${
                        isPurchased
                          ? 'border-primary bg-custom4 opacity-75'
                          : canAfford
                            ? 'border-secondary hover:border-primary bg-custom4'
                            : 'border-destructive bg-custom4 opacity-60'
                      }`}
                    >
                      <h4 className="font-heading text-lg font-bold text-primary mb-2">
                        {accessory.itemName}
                      </h4>

                      <p className="text-secondary text-xs mb-3 line-clamp-2">
                        {accessory.itemDescription}
                      </p>

                      <div className="mb-3">
                        <p className="text-secondary text-xs mb-1">
                          Tipo: <span className="text-primary">{accessory.skillType}</span>
                        </p>
                        <p className="text-secondary text-xs">
                          Bônus aplicado pelo sistema de itens/equipamentos
                        </p>
                      </div>

                      <div className="border-t border-secondary pt-3 mb-3">
                        <p className="text-primary font-heading text-lg font-bold">
                          R$ {price.toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => handlePurchaseAccessory(accessory)}
                        disabled={isPurchased || !canAfford}
                        className={`w-full py-2 rounded font-heading font-bold transition-all ${
                          isPurchased
                            ? 'bg-custom4 text-secondary cursor-not-allowed'
                            : canAfford
                              ? 'bg-primary text-black hover:bg-secondary'
                              : 'bg-destructive text-destructiveforeground cursor-not-allowed opacity-50'
                        }`}
                      >
                        {isPurchased ? 'Comprado' : canAfford ? 'Comprar' : 'Sem Fundos'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {selectedVehicle && activeTab === 'vehicles' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedVehicle(null)}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-custom4 rounded-lg max-w-2xl w-full border-2 border-primary p-8 max-h-[90vh] overflow-y-auto"
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
                        {selectedVehicle.abilityBonusType}
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

        {selectedVehicleForAccessories && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedVehicleForAccessories(null)}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
 className="bg-custom4 rounded-lg max-w-2xl w-full border-2 border-primary p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="font-heading text-3xl font-bold text-primary mb-6">
                Acessórios para {selectedVehicleForAccessories.name}
              </h2>

              <div className="space-y-3 mb-6">
                {VEHICLE_ACCESSORIES.map((acc) => {
                  const owned = isAccessoryOwnedForVehicle(
                    selectedVehicleForAccessories._id,
                    acc.name
                  );

                  return (
                    <div
                      key={acc.name}
                      className="w-full px-4 py-3 rounded font-heading font-bold transition-all text-left flex justify-between items-center bg-black/20 border border-white/10"
                    >
                      <div>
                        <div>{acc.name}</div>
                        <div className="text-xs text-secondary mt-1">
                          Bônus vinculado ao sistema de acessórios
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="text-sm">
                          {owned ? 'Comprado' : 'R$ 1,99'}
                        </span>

                        <button
                          disabled={owned}
                          onClick={() => handleBuyVehicleAccessory(selectedVehicleForAccessories, acc)}
                          className={`px-3 py-2 rounded ${
                            owned
                              ? 'bg-custom4 text-secondary cursor-not-allowed opacity-50'
                              : 'bg-primary text-black hover:bg-secondary'
                          }`}
                        >
                          {owned ? 'OK' : 'Comprar local'}
                        </button>

                        <button
                          disabled={owned}
                          onClick={() => handleBuyVehicleAccessoryPix(selectedVehicleForAccessories, acc)}
                          className={`px-3 py-2 rounded ${
                            owned
                              ? 'bg-custom4 text-secondary cursor-not-allowed opacity-50'
                              : 'bg-secondary text-black hover:bg-primary'
                          }`}
                        >
                          PIX
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setSelectedVehicleForAccessories(null)}
                className="w-full py-3 rounded font-heading font-bold text-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-black transition-all"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
