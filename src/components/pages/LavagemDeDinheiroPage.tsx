import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/playerStore';
import { useNavigate } from 'react-router-dom';
import SoapBubbleAnimation from '@/components/SoapBubbleAnimation';
import FeatureLevelLock from '@/components/FeatureLevelLock';

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

type FeedbackState = {
  type: 'error' | 'success' | 'info';
  message: string;
} | null;

const BUSINESSES: Business[] = [
  {
    id: 1,
    name: 'Lava Jato do Zé',
    city: 'São Paulo',
    initialMoney: 500,
    level: 1,
    image:
      'https://static.wixstatic.com/media/50f4bf_f42d528276564481a42597abd5b44820~mv2.png',
    description: 'Lava tudo que é carro, moto, bicicleta... até reputação!',
    operationTimeSeconds: 15,
    feePercentage: 20,
  },
  {
    id: 2,
    name: 'Barbearia do Malandrão',
    city: 'Rio de Janeiro',
    initialMoney: 500,
    level: 1,
    image:
      'https://static.wixstatic.com/media/50f4bf_333f49de4e3c4276a53d8b3c425f8c1d~mv2.png',
    description: 'Corte, barba e muito sigilo. Discrição garantida!',
    operationTimeSeconds: 25,
    feePercentage: 12,
  },
  {
    id: 3,
    name: 'Pizzaria do Clandestino',
    city: 'Belo Horizonte',
    initialMoney: 500,
    level: 1,
    image:
      'https://static.wixstatic.com/media/50f4bf_5aa149b5e2c34efd89ee1abf55b13f3d~mv2.png',
    description: 'Pizza quentinha, dinheiro frio. Receita secreta!',
    operationTimeSeconds: 30,
    feePercentage: 10,
  },
  {
    id: 4,
    name: 'Suqueria da Galera',
    city: 'Salvador',
    initialMoney: 500,
    level: 1,
    image:
      'https://static.wixstatic.com/media/50f4bf_2b009cc726f84c459f799b591a61dea7~mv2.png',
    description: 'Suco natural, negócio artificial. Fresco demais!',
    operationTimeSeconds: 40,
    feePercentage: 8,
  },
  {
    id: 5,
    name: 'Lavanderia da Dona Maria',
    city: 'Brasília',
    initialMoney: 500,
    level: 1,
    image:
      'https://static.wixstatic.com/media/50f4bf_0f1c29477d6344de97650e9485372983~mv2.png',
    description: 'Roupa limpa, dinheiro mais limpo ainda. Confiável!',
    operationTimeSeconds: 50,
    feePercentage: 5,
  },
];

export default function LavagemDeDinheiroPage() {
  const navigate = useNavigate();

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [animatingBusinessId, setAnimatingBusinessId] = useState<number | null>(null);
  const [timerStates, setTimerStates] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const animationTimeoutRef = useRef<number | null>(null);
  const completingOperationsRef = useRef<Set<string>>(new Set());

  const {
    player,
    isLoaded,
    loadPlayer,
    startLaundryOperation,
    completeLaundryOperation,
    canOperateLaundryToday,
    clearFinishedLaundryOperations,
  } = usePlayerStore();

  const playerLevel = player.niveis.playerLevel || 1;
  const levelMultiplier = Math.pow(1.1, playerLevel - 1);
  const dirtyMoney = player.balances.dirtyMoney;
  const activeOperations = player?.laundryProgress?.activeOperations || [];
  const taxReduction = 0;

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  useEffect(() => {
    if (!isLoaded) return;
    clearFinishedLaundryOperations();
  }, [isLoaded, clearFinishedLaundryOperations]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeOperations.length === 0) {
      setTimerStates({});
      completingOperationsRef.current.clear();
      return;
    }

    const interval = window.setInterval(() => {
      setTimerStates((prev) => {
        const updated: Record<number, number> = { ...prev };
        let changed = false;

        activeOperations.forEach((op) => {
          if (op.status !== 'processing') return;

          const endsAt = new Date(op.endsAt).getTime();
          const now = Date.now();
          const timeRemaining = Math.max(0, Math.floor((endsAt - now) / 1000));

          if (updated[op.businessId] !== timeRemaining) {
            updated[op.businessId] = timeRemaining;
            changed = true;
          }

          if (
            timeRemaining === 0 &&
            !completingOperationsRef.current.has(op.operationId)
          ) {
            completingOperationsRef.current.add(op.operationId);

            void completeLaundryOperation(op.operationId)
              .catch((error) => {
                console.error('Erro ao completar lavagem automaticamente:', error);
              })
              .finally(() => {
                completingOperationsRef.current.delete(op.operationId);
              });
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOperations, completeLaundryOperation]);

  const getScaledValues = (business: Business) => {
    const scaledMoney = Number((business.initialMoney * levelMultiplier).toFixed(2));
    const scaledTime = Math.ceil(business.operationTimeSeconds * levelMultiplier);
    const fee = Number(
      (((scaledMoney * business.feePercentage) / 100) * (1 - taxReduction / 100)).toFixed(2)
    );
    const netAmount = Number(Math.max(0, scaledMoney - fee).toFixed(2));

    return {
      scaledMoney,
      scaledTime,
      fee,
      netAmount,
    };
  };

  const getActiveOperation = (businessId: number) => {
    return activeOperations.find(
      (op) => op.businessId === businessId && op.status === 'processing'
    );
  };

  const clearFeedbackLater = () => {
    window.setTimeout(() => {
      setFeedback((current) => (current ? null : current));
    }, 3500);
  };

  const handleLaunder = async (businessId: number) => {
    const business = BUSINESSES.find((item) => item.id === businessId);
    if (!business) return;

    const activeOp = getActiveOperation(businessId);
    if (activeOp) {
      setFeedback({
        type: 'info',
        message: 'Esse comércio já está com uma operação em andamento.',
      });
      clearFeedbackLater();
      return;
    }

    setIsProcessing(String(businessId));
    setFeedback(null);

    try {
      const canOperate = await canOperateLaundryToday(businessId);
      if (!canOperate) {
        setFeedback({
          type: 'error',
          message: 'Você já operou nesse comércio hoje. Volte amanhã.',
        });
        clearFeedbackLater();
        return;
      }

      const { scaledMoney, fee, netAmount } = getScaledValues(business);

      if (dirtyMoney < scaledMoney) {
        setFeedback({
          type: 'error',
          message: 'Você não tem dinheiro sujo suficiente para essa operação.',
        });
        clearFeedbackLater();
        return;
      }

      setAnimatingBusinessId(businessId);
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimatingBusinessId(null);
      }, 2000);

      const success = await startLaundryOperation({
        businessId,
        businessName: business.name,
        startedAt: new Date().toISOString(),
        endsAt: '',
        grossAmount: scaledMoney,
        feePercentage: business.feePercentage,
        feeAmount: fee,
        netAmount,
        operationId: '',
      });

      if (!success) {
        setFeedback({
          type: 'error',
          message: 'Não foi possível iniciar a operação. Tente novamente.',
        });
        clearFeedbackLater();
        return;
      }

      setFeedback({
        type: 'success',
        message: `Operação iniciada em ${business.name}.`,
      });
      clearFeedbackLater();
    } catch (error: any) {
      console.error('Erro ao iniciar operação:', error);
      setFeedback({
        type: 'error',
        message:
          error?.message || 'Erro inesperado ao iniciar a operação de lavagem.',
      });
      clearFeedbackLater();
    } finally {
      setIsProcessing(null);
    }
  };

  const getProgressPercent = (business: Business, businessId: number) => {
    const timeRemaining = timerStates[businessId] ?? 0;
    const { scaledTime } = getScaledValues(business);

    if (scaledTime <= 0) return 0;
    const percent = (timeRemaining / scaledTime) * 100;
    return Math.min(100, Math.max(0, percent));
  };

  const feedbackClasses =
    feedback?.type === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : feedback?.type === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';

  if (!isLoaded || !player?._id) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <SoapBubbleAnimation
        isAnimating={animatingBusinessId !== null}
        buttonRef={
          buttonRefs.current[animatingBusinessId || 0]
            ? { current: buttonRefs.current[animatingBusinessId || 0] }
            : { current: null }
        }
      />

      <main className="w-full max-w-[100rem] mx-auto px-4 py-16 pt-[140px] md:pt-[160px]">
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-5xl md:text-7xl font-bold mb-4 text-primary">
              Lavagem de Dinheiro
            </h1>
            <p className="font-paragraph text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Escolha seu comércio favorito e converta dinheiro sujo em dinheiro limpo.
              O valor escala com seu nível e cada negócio tem tempo e taxa próprios.
            </p>

            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-6 py-3 mb-6">
              <p className="text-primary font-bold text-lg">
                Nível do Jogador: <span className="text-2xl">{playerLevel}</span> | Multiplicador:{' '}
                <span className="text-2xl">{levelMultiplier.toFixed(2)}x</span>
              </p>
            </div>

            <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
              Dinheiro Sujo disponível: R$ {dirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>
        </section>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={`mb-8 rounded-xl border px-4 py-3 text-center text-sm font-semibold ${feedbackClasses}`}
            >
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BUSINESSES.map((business, index) => {
              const { scaledMoney, scaledTime, fee, netAmount } = getScaledValues(business);
              const activeOp = getActiveOperation(business.id);
              const timeRemaining = timerStates[business.id] ?? 0;
              const hasActiveOp = Boolean(activeOp);
              const cannotAfford = dirtyMoney < scaledMoney;
              const progressPercent = getProgressPercent(business, business.id);

              return (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                >
                  <Card
                    className="bg-gray-900 border-primary/30 hover:border-primary/60 transition-all cursor-pointer overflow-hidden h-full flex flex-col"
                    onClick={() => setSelectedBusiness(business)}
                  >
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

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-heading text-2xl font-bold mb-2 text-primary">
                        {business.name}
                      </h3>

                      <p className="font-paragraph text-sm text-gray-400 mb-4 flex-1">
                        {business.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Tempo</p>
                          <p className="font-heading text-2xl font-bold text-primary">
                            {scaledTime}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Taxa Final
                          </p>
                          <p className="font-heading text-lg font-bold text-destructive">
                            R$ {fee.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                          Você Recebe
                        </p>
                        <p className="font-heading text-xl font-bold text-green-400">
                          R$ {netAmount.toFixed(2)}
                        </p>
                      </div>

                      {hasActiveOp && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                            Operação em Andamento
                          </p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-yellow-400">
                              Tempo restante: {timeRemaining}s
                            </span>
                            <span className="text-sm text-yellow-400">
                              Taxa: R$ {activeOp?.feeAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="bg-yellow-500 h-2 rounded-full"
                              initial={{ width: '100%' }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 1, ease: 'linear' }}
                            />
                          </div>
                        </div>
                      )}

                      {!hasActiveOp && cannotAfford && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                          Saldo insuficiente para operar esse comércio.
                        </div>
                      )}

                      <Button
                        ref={(el) => {
                          if (el) buttonRefs.current[business.id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLaunder(business.id);
                        }}
                        disabled={
                          hasActiveOp ||
                          isProcessing === String(business.id) ||
                          cannotAfford
                        }
                        className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 rounded"
                      >
                        {isProcessing === String(business.id)
                          ? 'Iniciando...'
                          : hasActiveOp
                          ? `Processando... (${timeRemaining}s)`
                          : `Lavar R$ ${scaledMoney.toFixed(2)}`}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <AnimatePresence>
          {selectedBusiness && (() => {
            const { scaledMoney, scaledTime, fee, netAmount } = getScaledValues(selectedBusiness);
            const activeOp = getActiveOperation(selectedBusiness.id);
            const timeRemaining = timerStates[selectedBusiness.id] ?? 0;
            const hasActiveOp = Boolean(activeOp);
            const cannotAfford = dirtyMoney < scaledMoney;
            const progressPercent = getProgressPercent(selectedBusiness, selectedBusiness.id);

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
                  <div className="relative w-full h-64 overflow-hidden">
                    <Image
                      src={selectedBusiness.image}
                      alt={selectedBusiness.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>

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

                    <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-primary/10 border border-primary/30 rounded">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Valor Inicial Escalado
                        </p>
                        <p className="font-heading text-2xl font-bold text-primary">
                          R$ {scaledMoney.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Tempo de Processamento
                        </p>
                        <p className="font-heading text-2xl font-bold text-primary">
                          {scaledTime}s
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Taxa Final
                        </p>
                        <p className="font-heading text-2xl font-bold text-destructive">
                          R$ {fee.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Você Recebe
                        </p>
                        <p className="font-heading text-2xl font-bold text-green-400">
                          R$ {netAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {hasActiveOp && (
                      <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <p className="text-sm text-yellow-400 mb-4 font-bold">
                          OPERAÇÃO EM ANDAMENTO
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                              Tempo Restante
                            </p>
                            <p className="font-heading text-3xl font-bold text-yellow-400">
                              {timeRemaining}s
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                              Taxa Cobrada
                            </p>
                            <p className="font-heading text-3xl font-bold text-yellow-400">
                              R$ {activeOp?.feeAmount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                              Valor Líquido
                            </p>
                            <p className="font-heading text-3xl font-bold text-green-400">
                              R$ {activeOp?.netAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <motion.div
                            className="bg-yellow-500 h-3 rounded-full"
                            initial={{ width: '100%' }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    )}

                    {!hasActiveOp && cannotAfford && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-300">
                        Você não tem dinheiro sujo suficiente para essa operação.
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        ref={(el) => {
                          if (el) buttonRefs.current[selectedBusiness.id] = el;
                        }}
                        onClick={() => {
                          void handleLaunder(selectedBusiness.id);
                        }}
                        disabled={
                          hasActiveOp ||
                          isProcessing === String(selectedBusiness.id) ||
                          cannotAfford
                        }
                        className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded text-lg"
                      >
                        {isProcessing === String(selectedBusiness.id)
                          ? 'Iniciando...'
                          : hasActiveOp
                          ? `Processando... (${timeRemaining}s)`
                          : `Lavar R$ ${scaledMoney.toFixed(2)}`}
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
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}