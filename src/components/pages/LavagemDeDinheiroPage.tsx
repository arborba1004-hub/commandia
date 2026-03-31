import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/playerStore';
import SoapBubbleAnimation from '@/components/SoapBubbleAnimation';

interface Business {
  id: number;
  name: string;
  city: string;
  initialMoney: number;
  level: number;
  image: string;
  description: string;
  operationTimeSeconds: number;
  feePercentage: number;
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
    feePercentage: 20
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
    feePercentage: 12
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
    feePercentage: 10
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
    feePercentage: 8
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
    feePercentage: 5
  }
];

export default function LavagemDeDinheiroPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [animatingBusinessId, setAnimatingBusinessId] = useState<number | null>(null);
  const [timerStates, setTimerStates] = useState<Record<number, number>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const { player, isLoaded, loadPlayer, startLaundryOperation, completeLaundryOperation, canOperateLaundryToday, hydrateLaundryProgress } = usePlayerStore();
  
  // Calculate level multiplier (1.1 per level)
  const barracoLevel = player?.niveis?.barracoLevel || 1;
  const levelMultiplier = Math.pow(1.1, barracoLevel - 1);
  const dirtyMoney = player?.balances?.dirtyMoney || 0;
  const activeOperations = player?.laundryProgress?.activeOperations || [];

  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    } else {
      // Hidrata operações ao carregar a página (restaura operações expiradas)
      hydrateLaundryProgress();
    }
  }, [isLoaded, loadPlayer, hydrateLaundryProgress]);

  // Timer para processar operações ativas - calcula baseado em startedAt e endsAt persistidos
  useEffect(() => {
    if (activeOperations.length === 0) return;

    const interval = setInterval(() => {
      setTimerStates(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        activeOperations.forEach(op => {
          const endsAt = new Date(op.endsAt);
          const now = new Date();
          const timeRemaining = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));

          if (timeRemaining !== (prev[op.businessId] ?? -1)) {
            updated[op.businessId] = timeRemaining;
            hasChanges = true;

            // Completa a operação quando o tempo chega a 0
            if (timeRemaining === 0 && op.status === 'processing') {
              completeLaundryOperation(op.businessId);
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOperations, completeLaundryOperation]);

  const handleLaunder = (businessId: number) => {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;

    // Verifica se pode operar hoje (máximo 1 operação por dia por negócio)
    if (!canOperateLaundryToday(businessId, 1)) {
      alert('Você já realizou uma operação neste comércio hoje. Volte amanhã!');
      return;
    }

    // Apply level multiplier to values
    const scaledMoney = business.initialMoney * levelMultiplier;
    
    // Validação: verifica se o jogador possui dirtyMoney suficiente ANTES de iniciar
    if (dirtyMoney < scaledMoney) {
      alert('Você não tem dinheiro sujo suficiente.');
      return;
    }

    // Calculate values
    const scaledTime = Math.ceil(business.operationTimeSeconds * levelMultiplier);
    const fee = (scaledMoney * business.feePercentage) / 100;
    const netAmount = scaledMoney - fee;

    // Trigger animation
    setAnimatingBusinessId(businessId);
    setTimeout(() => setAnimatingBusinessId(null), 2000);

    // Inicia a operação na store
    // Ao iniciar, debita imediatamente o valor bruto de dirtyMoney
    // Ao concluir, credita apenas o netAmount em cleanMoney
    // O valor bruto, a taxa e o líquido ficam salvos dentro da operação persistente
    const now = new Date();
    const endsAt = new Date(now.getTime() + scaledTime * 1000);

    startLaundryOperation({
      businessId,
      businessName: business.name,
      startedAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      grossAmount: scaledMoney,
      feePercentage: business.feePercentage,
      feeAmount: fee,
      netAmount,
    });
  };

  // Get scaled values for display
  const getScaledValues = (business: Business) => {
    const scaledMoney = business.initialMoney * levelMultiplier;
    const scaledTime = Math.ceil(business.operationTimeSeconds * levelMultiplier);
    const fee = (scaledMoney * business.feePercentage) / 100;
    const netAmount = scaledMoney - fee;
    return { scaledMoney, scaledTime, fee, netAmount };
  };

  // Obtém a operação ativa para um negócio
  const getActiveOperation = (businessId: number) => {
    return activeOperations.find(op => op.businessId === businessId && op.status === 'processing');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Soap Bubble Animation */}
      <SoapBubbleAnimation 
        isAnimating={animatingBusinessId !== null} 
        buttonRef={buttonRefs.current[animatingBusinessId || 0] ? { current: buttonRefs.current[animatingBusinessId || 0] } : { current: null }}
      />
      
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
            <p className="font-paragraph text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Escolha seu comércio favorito e comece a lavar dinheiro sujo. 
              Cada operação começa com R$ 500,00, mas a taxa varia conforme o tempo de processamento.
            </p>
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-6 py-3 mb-6">
              <p className="text-primary font-bold text-lg">
                Nível do Barraco: <span className="text-2xl">{barracoLevel}</span> | Multiplicador: <span className="text-2xl">{levelMultiplier.toFixed(2)}x</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Businesses Grid */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((business, index) => {
              const { scaledMoney, scaledTime, fee, netAmount } = getScaledValues(business);
              const activeOp = getActiveOperation(business.id);
              const timeRemaining = timerStates[business.id] ?? 0;
              const canOperate = canOperateLaundryToday(business.id, 1);
              
              return (
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
                      <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Tempo</p>
                          <p className="font-heading text-2xl font-bold text-primary">
                            {scaledTime}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Taxa Descontada</p>
                          <p className="font-heading text-lg font-bold text-destructive">
                            {business.feePercentage}%
                          </p>
                        </div>
                      </div>

                      {/* Net Amount Info */}
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Você Recebe</p>
                        <p className="font-heading text-xl font-bold text-green-400">
                          R$ {netAmount.toFixed(2)}
                        </p>
                      </div>

                      {/* Daily Operation Status */}
                      {canOperate ? (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                          <p className="text-xs text-blue-400 uppercase tracking-wider font-bold">✓ Disponível Hoje</p>
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                          <p className="text-xs text-red-400 uppercase tracking-wider font-bold">✗ Já Operou Hoje</p>
                        </div>
                      )}

                      {/* Operation Status */}
                      {activeOp && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Operação em Andamento</p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-yellow-400">Tempo restante: {timeRemaining}s</span>
                            <span className="text-sm text-yellow-400">Taxa: R$ {activeOp.feeAmount.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="bg-yellow-500 h-2 rounded-full"
                              initial={{ width: '100%' }}
                              animate={{ width: `${(timeRemaining / scaledTime) * 100}%` }}
                              transition={{ duration: 1, ease: 'linear' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        ref={(el) => {
                          if (el) buttonRefs.current[business.id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunder(business.id);
                        }}
                        disabled={!!activeOp || !canOperate}
                        className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 rounded"
                      >
                        {activeOp 
                          ? `Processando... (${timeRemaining}s)`
                          : canOperate
                          ? `Lavar R$ ${scaledMoney.toFixed(2)}`
                          : 'Já Operou Hoje'
                        }
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Business Details Modal */}
        {selectedBusiness && (() => {
          const { scaledMoney, scaledTime, fee, netAmount } = getScaledValues(selectedBusiness);
          const activeOp = getActiveOperation(selectedBusiness.id);
          const timeRemaining = timerStates[selectedBusiness.id] ?? 0;
          const canOperate = canOperateLaundryToday(selectedBusiness.id, 1);
          
          return (
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
                  <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-primary/10 border border-primary/30 rounded">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Valor Inicial (Escalado)</p>
                      <p className="font-heading text-2xl font-bold text-primary">
                        R$ {scaledMoney.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo de Processamento (Escalado)</p>
                      <p className="font-heading text-2xl font-bold text-primary">
                        {scaledTime}s
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Taxa Descontada</p>
                      <p className="font-heading text-2xl font-bold text-destructive">
                        {selectedBusiness.feePercentage}% (R$ {fee.toFixed(2)})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Você Recebe</p>
                      <p className="font-heading text-2xl font-bold text-green-400">
                        R$ {netAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Operation Status */}
                  {activeOp && (
                    <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded">
                      <p className="text-sm text-yellow-400 mb-4 font-bold">OPERAÇÃO EM ANDAMENTO</p>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo Restante</p>
                          <p className="font-heading text-3xl font-bold text-yellow-400">
                            {timeRemaining}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Taxa Cobrada</p>
                          <p className="font-heading text-3xl font-bold text-yellow-400">
                            R$ {activeOp.feeAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Valor Líquido</p>
                          <p className="font-heading text-3xl font-bold text-green-400">
                            R$ {activeOp.netAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <motion.div
                          className="bg-yellow-500 h-3 rounded-full"
                          initial={{ width: '100%' }}
                          animate={{ width: `${(timeRemaining / scaledTime) * 100}%` }}
                          transition={{ duration: 1, ease: 'linear' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      ref={(el) => {
                        if (el) buttonRefs.current[selectedBusiness.id] = el;
                      }}
                      onClick={() => {
                        handleLaunder(selectedBusiness.id);
                      }}
                      disabled={!!activeOp || !canOperate}
                      className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded text-lg"
                    >
                      {activeOp 
                        ? `Processando... (${timeRemaining}s)`
                        : canOperate
                        ? `Lavar R$ ${scaledMoney.toFixed(2)}`
                        : 'Já Operou Hoje'
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
          );
        })()}
      </main>

      <Footer />
    </div>
  );
}
