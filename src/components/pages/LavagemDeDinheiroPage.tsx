import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Business {
  id: number;
  name: string;
  city: string;
  initialMoney: number;
  level: number;
  image: string;
  description: string;
  operationTimeSeconds: number; // Tempo da operação em segundos
  feePercentage: number; // Taxa em percentual (inversamente proporcional ao tempo)
}

const businesses: Business[] = [
  {
    id: 1,
    name: "Lava Jato do Zé",
    city: "São Paulo",
    initialMoney: 500,
    level: 1,
    image: "https://static.wixstatic.com/media/50f4bf_f42d528276564481a42597abd5b44820~mv2.png",
    description: "Lava tudo que é carro, moto, bicicleta... até reputação!",
    operationTimeSeconds: 15,
    feePercentage: 20 // Taxa alta, tempo curto
  },
  {
    id: 2,
    name: "Barbearia do Malandrão",
    city: "Rio de Janeiro",
    initialMoney: 500,
    level: 1,
    image: "https://static.wixstatic.com/media/50f4bf_333f49de4e3c4276a53d8b3c425f8c1d~mv2.png",
    description: "Corte, barba e muito sigilo. Discrição garantida!",
    operationTimeSeconds: 25,
    feePercentage: 12 // Taxa média
  },
  {
    id: 3,
    name: "Pizzaria do Clandestino",
    city: "São Paulo",
    initialMoney: 500,
    level: 1,
    image: "https://static.wixstatic.com/media/50f4bf_5aa149b5e2c34efd89ee1abf55b13f3d~mv2.png",
    description: "Pizza quentinha, dinheiro frio. Receita secreta!",
    operationTimeSeconds: 30,
    feePercentage: 10 // Taxa média-baixa
  },
  {
    id: 4,
    name: "Suqueria da Galera",
    city: "Rio de Janeiro",
    initialMoney: 500,
    level: 1,
    image: "https://static.wixstatic.com/media/50f4bf_2b009cc726f84c459f799b591a61dea7~mv2.png",
    description: "Suco natural, negócio artificial. Fresco demais!",
    operationTimeSeconds: 40,
    feePercentage: 8 // Taxa baixa, tempo mais longo
  },
  {
    id: 5,
    name: "Lavanderia da Dona Maria",
    city: "São Paulo",
    initialMoney: 500,
    level: 1,
    image: "https://static.wixstatic.com/media/50f4bf_0f1c29477d6344de97650e9485372983~mv2.png",
    description: "Roupa limpa, dinheiro mais limpo ainda. Confiável!",
    operationTimeSeconds: 50,
    feePercentage: 5 // Taxa muito baixa, tempo longo
  }
];

interface OperationState {
  isProcessing: boolean;
  timeRemaining: number;
  fee: number;
  netAmount: number;
}

export default function LavagemDeDinheiroPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [moneyLaundered, setMoneyLaundered] = useState<Record<number, number>>({});
  const [operationState, setOperationState] = useState<Record<number, OperationState>>({});

  // Efeito para processar operações em andamento
  useEffect(() => {
    const interval = setInterval(() => {
      setOperationState(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(businessIdStr => {
          const businessId = parseInt(businessIdStr);
          const state = updated[businessId];

          if (state.isProcessing && state.timeRemaining > 0) {
            state.timeRemaining -= 1;
            hasChanges = true;

            // Quando a operação termina
            if (state.timeRemaining === 0) {
              state.isProcessing = false;
              // Adiciona o dinheiro lavado (valor inicial menos a taxa)
              setMoneyLaundered(prev => ({
                ...prev,
                [businessId]: (prev[businessId] || 0) + state.netAmount
              }));
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLaunder = (businessId: number) => {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;

    const fee = (business.initialMoney * business.feePercentage) / 100;
    const netAmount = business.initialMoney - fee;

    setOperationState(prev => ({
      ...prev,
      [businessId]: {
        isProcessing: true,
        timeRemaining: business.operationTimeSeconds,
        fee,
        netAmount
      }
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="w-full max-w-[100rem] mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-7xl font-bold mb-4 text-primary">
              Lavagem de Dinheiro
            </h1>
            <p className="font-paragraph text-xl text-gray-300 max-w-2xl mx-auto">
              Escolha seu comércio favorito e comece a lavar dinheiro sujo. 
              Cada operação começa com R$ 500,00, mas a taxa varia conforme o tempo de processamento.
            </p>
          </motion.div>
        </section>

        {/* Businesses Grid */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border-primary/30 hover:border-primary/60 transition-all cursor-pointer overflow-hidden h-full flex flex-col"
                  onClick={() => setSelectedBusiness(business)}
                >
                  {/* Image */}
                  <div className="relative w-full h-48 overflow-hidden bg-gray-800">
                    <Image
                      src={business.image}
                      alt={business.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-primary px-3 py-1 rounded-full text-xs font-bold">
                      {business.city}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-heading text-2xl font-bold mb-2 text-primary">
                      {business.name}
                    </h3>
                    <p className="font-paragraph text-sm text-gray-400 mb-4 flex-1">
                      {business.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Tempo</p>
                        <p className="font-heading text-2xl font-bold text-primary">
                          {business.operationTimeSeconds}s
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Taxa</p>
                        <p className="font-heading text-2xl font-bold text-primary">
                          {business.feePercentage}%
                        </p>
                      </div>
                    </div>

                    {/* Total Laundered */}
                    {moneyLaundered[business.id] > 0 && (
                      <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total Lavado</p>
                        <p className="font-heading text-xl font-bold text-primary">
                          R$ {moneyLaundered[business.id].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    {/* Operation Status */}
                    {operationState[business.id]?.isProcessing && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Operação em Andamento</p>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-yellow-400">Tempo restante: {operationState[business.id].timeRemaining}s</span>
                          <span className="text-sm text-yellow-400">Taxa: R$ {operationState[business.id].fee.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            className="bg-yellow-500 h-2 rounded-full"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(operationState[business.id].timeRemaining / business.operationTimeSeconds) * 100}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunder(business.id);
                      }}
                      disabled={operationState[business.id]?.isProcessing}
                      className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 rounded"
                    >
                      {operationState[business.id]?.isProcessing 
                        ? `Processando... (${operationState[business.id].timeRemaining}s)`
                        : `Lavar R$ ${business.initialMoney.toFixed(2)}`
                      }
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Business Details Modal */}
        {selectedBusiness && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBusiness(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-primary/30 rounded-lg max-w-2xl w-full overflow-hidden"
            >
              {/* Modal Image */}
              <div className="relative w-full h-64 overflow-hidden">
                <Image
                  src={selectedBusiness.image}
                  alt={selectedBusiness.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-heading text-4xl font-bold text-primary mb-2">
                      {selectedBusiness.name}
                    </h2>
                    <p className="text-primary text-lg">{selectedBusiness.city}</p>
                  </div>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <p className="font-paragraph text-gray-300 mb-6 text-lg">
                  {selectedBusiness.description}
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8 p-6 bg-primary/10 border border-primary/30 rounded">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Valor Inicial</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      R$ {selectedBusiness.initialMoney.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Taxa</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      {selectedBusiness.feePercentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      {selectedBusiness.operationTimeSeconds}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Lavado</p>
                    <p className="font-heading text-2xl font-bold text-primary">
                      R$ {(moneyLaundered[selectedBusiness.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Operation Status */}
                {operationState[selectedBusiness.id]?.isProcessing && (
                  <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-sm text-yellow-400 mb-4 font-bold">OPERAÇÃO EM ANDAMENTO</p>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo Restante</p>
                        <p className="font-heading text-3xl font-bold text-yellow-400">
                          {operationState[selectedBusiness.id].timeRemaining}s
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Taxa Cobrada</p>
                        <p className="font-heading text-3xl font-bold text-yellow-400">
                          R$ {operationState[selectedBusiness.id].fee.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Valor Líquido</p>
                        <p className="font-heading text-3xl font-bold text-green-400">
                          R$ {operationState[selectedBusiness.id].netAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <motion.div
                        className="bg-yellow-500 h-3 rounded-full"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(operationState[selectedBusiness.id].timeRemaining / selectedBusiness.operationTimeSeconds) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      handleLaunder(selectedBusiness.id);
                    }}
                    disabled={operationState[selectedBusiness.id]?.isProcessing}
                    className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded text-lg"
                  >
                    {operationState[selectedBusiness.id]?.isProcessing 
                      ? `Processando... (${operationState[selectedBusiness.id].timeRemaining}s)`
                      : `Lavar R$ ${selectedBusiness.initialMoney.toFixed(2)}`
                    }
                  </Button>
                  <Button
                    onClick={() => setSelectedBusiness(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded text-lg"
                  >
                    Fechar
                  </Button>
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
