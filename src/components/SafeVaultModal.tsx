import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type SafeVaultModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subornoValue: number;
  playerDirtyMoney: number;
  onConfirm: () => void;
  isProcessing?: boolean;
};

export default function SafeVaultModal({
  open,
  onOpenChange,
  subornoValue,
  playerDirtyMoney,
  onConfirm,
  isProcessing = false,
}: SafeVaultModalProps) {
  const dirtyMoney = Number(playerDirtyMoney || 0);
  const requiredMoney = Number(subornoValue || 0);

  const hasEnoughMoney = dirtyMoney >= requiredMoney;
  const isVaultEmpty = dirtyMoney <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-emerald-700 max-w-md text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-heading text-emerald-400">
            Cofre do Suborno
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center">
            <p className="text-sm uppercase tracking-widest text-emerald-300/70 mb-2">
              Dinheiro sujo disponível
            </p>
            <p className="text-4xl font-black text-emerald-400">
              R$ {dirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 text-center">
            <p className="text-sm uppercase tracking-widest text-gray-400 mb-2">
              Valor exigido
            </p>
            <p className="text-3xl font-black text-white">
              R$ {requiredMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {isVaultEmpty ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-center">
              <p className="text-lg font-bold text-red-400">Cofre vazio</p>
              <p className="text-sm text-gray-300 mt-2">
                Você não tem dinheiro sujo suficiente para pagar este suborno.
              </p>
            </div>
          ) : !hasEnoughMoney ? (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-950/20 p-4 text-center">
              <p className="text-lg font-bold text-yellow-400">Saldo insuficiente</p>
              <p className="text-sm text-gray-300 mt-2">
                Falta dinheiro sujo para completar esta operação.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
              <p className="text-lg font-bold text-emerald-400">Cofre pronto</p>
              <p className="text-sm text-gray-300 mt-2">
                Você tem saldo suficiente para pagar o suborno.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl py-6"
              disabled={isProcessing}
            >
              Cancelar
            </Button>

            <Button
              onClick={onConfirm}
              disabled={!hasEnoughMoney || isProcessing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-6 disabled:opacity-50"
            >
              {isProcessing ? 'Processando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}