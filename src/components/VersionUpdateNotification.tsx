import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function VersionUpdateNotification() {
  const { hasNewVersion, reloadPage, checkForNewVersion } = useVersionCheck();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (hasNewVersion) {
      setShowNotification(true);
    }
  }, [hasNewVersion]);

  const handleUpdate = () => {
    reloadPage();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full mx-4"
        >
          <div className="bg-primary border-2 border-primary/80 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-primary-foreground flex-shrink-0 animate-spin" />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm uppercase tracking-wider text-primary-foreground">
                  Nova versão disponível
                </p>
                <p className="font-paragraph text-xs text-primary-foreground/80 mt-1">
                  Clique em atualizar para carregar as últimas mudanças
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleUpdate}
                className="flex-1 px-3 py-2 bg-primary-foreground text-primary font-heading text-xs uppercase tracking-wider rounded hover:bg-primary-foreground/90 transition-colors"
              >
                Atualizar
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 border border-primary-foreground/30 text-primary-foreground font-heading text-xs uppercase tracking-wider rounded hover:bg-primary-foreground/10 transition-colors"
              >
                Depois
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
