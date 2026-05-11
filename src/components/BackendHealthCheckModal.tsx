import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface BackendHealthCheckModalProps {
  isOpen: boolean;
  isChecking: boolean;
  message: string;
  isHealthy?: boolean;
  timedOut?: boolean;
  onRetry?: () => void;
  onClose?: () => void;
}

export default function BackendHealthCheckModal({
  isOpen,
  isChecking,
  message,
  isHealthy,
  timedOut,
  onRetry,
  onClose,
}: BackendHealthCheckModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-custom4 border border-secondary/20 rounded-lg p-8 max-w-md w-full space-y-6"
          >
            <div className="flex flex-col items-center gap-4">
              {isChecking ? (
                <>
                  <LoadingSpinner />
                  <div className="text-center space-y-2">
                    <h3 className="font-heading text-xl uppercase tracking-wider text-foreground">
                      Conectando ao servidor...
                    </h3>
                    <p className="font-paragraph text-sm text-foreground/70">
                      {message}
                    </p>
                  </div>
                </>
              ) : isHealthy ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  >
                    <CheckCircle className="w-12 h-12 text-primary" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="font-heading text-xl uppercase tracking-wider text-foreground">
                      Servidor Pronto
                    </h3>
                    <p className="font-paragraph text-sm text-foreground/70">
                      {message}
                    </p>
                  </div>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="w-full mt-4 px-6 py-3 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all"
                    >
                      Continuar
                    </button>
                  )}
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  >
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="font-heading text-xl uppercase tracking-wider text-foreground">
                      Erro de Conexão
                    </h3>
                    <p className="font-paragraph text-sm text-foreground/70">
                      {message}
                    </p>
                  </div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="w-full mt-4 px-6 py-3 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all"
                    >
                      Tentar Novamente
                    </button>
                  )}
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3 border-2 border-secondary/30 text-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-secondary/10 transition-all"
                    >
                      Fechar
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
