import { useState } from "react";
import { Image } from "@/components/ui/image";
import type { AzideiaAttackResult, AzideiaX9Target } from "@/types/azideia";
import {
  AZIDEIA_CORRERIA_ICON_URL,
  AZIDEIA_ICON_URL,
  AZIDEIA_MESTRE_OBRAS_ICON_EMOJI,
} from "@/data/azideiaCatalog";

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

  const isCorreria = target.type === "correria";
  const isMestreObras = target.type === "mestre_obras";
  const iconUrl = isCorreria ? AZIDEIA_CORRERIA_ICON_URL : AZIDEIA_ICON_URL;
  const accentClass = isMestreObras
    ? "text-amber-300"
    : isCorreria
      ? "text-emerald-300"
      : "text-red-300";
  const borderClass = isMestreObras
    ? "border-amber-500/40"
    : isCorreria
      ? "border-emerald-500/40"
      : "border-red-500/40";
  const buttonClass = isMestreObras
    ? "bg-amber-500 text-black shadow-amber-900/40"
    : isCorreria
      ? "bg-emerald-600 text-white shadow-emerald-900/40"
      : "bg-red-600 text-white shadow-red-900/40";
  const actionName = isMestreObras
    ? "Pagar Mestre de Obras"
    : isCorreria
      ? "Negociar Corre"
      : "Eliminar X9";
  const submittingLabel = isMestreObras
    ? "Pagando..."
    : isCorreria
      ? "Negociando..."
      : "Atacando...";
  const confirmLabel = isMestreObras
    ? "Pagar"
    : isCorreria
      ? "Negociar"
      : "Lançar Azidéia";

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(target);
    } catch (err: any) {
      setError(
        err?.message ??
          (isMestreObras
            ? "Erro ao pagar Mestre de Obras"
            : isCorreria
              ? "Erro ao negociar com Correria"
              : "Erro ao lançar Azidéia"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-3xl border ${borderClass} bg-zinc-950 p-5 shadow-2xl`}
      >
        <div className="flex items-center gap-3">
          {isMestreObras ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-4xl">
              {AZIDEIA_MESTRE_OBRAS_ICON_EMOJI}
            </div>
          ) : (
            <Image
              src={iconUrl}
              alt={isCorreria ? "Correria" : "Azidéia"}
              className="h-16 w-16 object-contain"
            />
          )}
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.24em] ${accentClass}`}
            >
              {isMestreObras
                ? "Mestre de Obras"
                : isCorreria
                  ? "Correria"
                  : "Azidéia"}
            </p>
            <h2 className="font-heading text-2xl font-black uppercase text-white">
              {actionName}
            </h2>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
          {isMestreObras ? (
            <p>
              Pague o Mestre de Obras com Commands sujo. O comboio vai até ele,
              a animação de Commands sobe no mapa, o Mestre desaparece e o
              comboio retorna ao seu barraco.
            </p>
          ) : isCorreria ? (
            <p>
              Envie o comboio para negociar com o Correria. Quando o comboio
              chegar, aparece +1 Corre, o Correria desaparece e o comboio
              retorna ao seu barraco.
            </p>
          ) : (
            <p>
              Use seu comboio para eliminar o X9 marcado no mapa. O X9 só cai
              morto quando o comboio chegar nele, e o retorno do comboio fica
              visível até seu barraco.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-900 p-3">
              <p className="text-[10px] font-black uppercase text-zinc-500">
                Custo
              </p>
              <p className={`text-lg font-black ${accentClass}`}>
                {isCorreria
                  ? "Grátis"
                  : `${target.costDirtyMoney.toLocaleString("pt-BR")} sujo`}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-900 p-3">
              <p className="text-[10px] font-black uppercase text-zinc-500">
                Recompensa
              </p>
              <p
                className={`text-lg font-black ${isMestreObras ? "text-amber-300" : "text-emerald-300"}`}
              >
                {isMestreObras
                  ? "+1h +1min"
                  : isCorreria
                    ? "+1 Corre"
                    : "+1 acelerador"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            {isMestreObras
              ? "Limite: 10 pagamentos por dia. Recompensa pessoal: acelerador de barraco de 1 hora + 1 minuto. Na facção, cada membro elegível coleta +5 minutos de acelerador de barraco, limitado a 100 coletas diárias por membro."
              : isCorreria
                ? "Limite: 10 negociações por dia. Se você tiver facção, cada membro elegível recebe +1 Corre, limitado a 100 Corres diários por membro."
                : "Se você tiver facção, cada membro recebe +1 acelerador para coletar no chat da facção pelo ícone Azidéia. Você pode manter até 3 Azidéias simultâneas, desde que tenha membros ativos da gangue."}
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
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black uppercase shadow-lg disabled:opacity-50 ${buttonClass}`}
          >
            {isSubmitting ? submittingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
