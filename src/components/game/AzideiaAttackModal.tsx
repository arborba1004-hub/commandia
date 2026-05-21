import { useState } from 'react';
import { Image } from '@/components/ui/image';
import type { AzideiaAttackResult, AzideiaX9Target } from '@/types/azideia';
import { AZIDEIA_ICON_URL } from '@/data/azideiaCatalog';

export default function AzideiaAttackModal({
  target,
  onClose,
  onConfirm,
}: {
  target: AzideiaX9Target | null;
  onClose: () => void;
  onConfirm: (target: AzideiaX9Target) => Promise<AzideiaAttackResult | void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!target) return null;

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(target);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao lançar Azidéia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <Image src={AZIDEIA_ICON_URL} alt="Azidéia" className="h-16 w-16 object-contain" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Azidéia</p>
            <h2 className="font-heading text-2xl font-black uppercase text-white">Eliminar X9</h2>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
          <p>
            Use seu comboio para eliminar o X9 marcado no mapa.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-900 p-3">
              <p className="text-[10px] font-black uppercase text-zinc-500">Custo</p>
              <p className="text-lg font-black text-red-300">{target.costDirtyMoney.toLocaleString('pt-BR')} sujo</p>
            </div>
            <div className="rounded-xl bg-zinc-900 p-3">
              <p className="text-[10px] font-black uppercase text-zinc-500">Recompensa</p>
              <p className="text-lg font-black text-emerald-300">+1 acelerador</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Se você tiver facção, cada membro recebe +1 acelerador para coletar no chat da facção pelo ícone Azidéia.
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-black uppercase text-zinc-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black uppercase text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
          >
            {isSubmitting ? 'Atacando...' : 'Lançar Azidéia'}
          </button>
        </div>
      </div>
    </div>
  );
}
