import { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GangMemberType } from '@/components/gang/GangMembros';
import GANG_MEMBROS from '@/components/gang/GangMembros';
import type {
  GangTrainingOperation,
  GangTrainingPlayerLike,
  GangTrainingState,
  QGSlotKey,
} from '@/components/gang/TreinamentoGang';
import {
  getGangTrainingCostDirty,
  getGangTrainingDurationMinutes,
  getGangTrainingOperationStatus,
  getGangTrainingQuantityPerOperation,
} from '@/components/gang/TreinamentoGang';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS (inalterados)
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  slotKey: QGSlotKey | null;
  player: GangTrainingPlayerLike;
  trainingState: GangTrainingState;
  onClose: () => void;
  onStartTraining: (slotKey: QGSlotKey, memberType: GangMemberType) => void;
  onCollectTraining: (slotKey: QGSlotKey) => void;
  isSubmitting?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES (inalteradas)
// ─────────────────────────────────────────────────────────────────────────────

const TRAINABLE_MEMBER_TYPES: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (inalterados)
// ─────────────────────────────────────────────────────────────────────────────

function getMemberName(type: GangMemberType) {
  return GANG_MEMBROS[type]?.nome ?? type;
}

function formatSlotLabel(slotKey: QGSlotKey) {
  return slotKey.toUpperCase();
}

function formatRemaining(operation: GangTrainingOperation) {
  const remainingMs = Math.max(0, operation.endsAt - Date.now());
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function GangTrainingModal({
  isOpen,
  slotKey,
  player,
  trainingState,
  onClose,
  onStartTraining,
  onCollectTraining,
  isSubmitting = false,
}: Props) {

  // ── STATE (inalterado) ──────────────────────────────────────────────────────
  const [trainingSlots, setTrainingSlots] = useState(trainingState.trainingSlots || []);

  useEffect(() => {
    setTrainingSlots(trainingState.trainingSlots || []);
  }, [trainingState.trainingSlots]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingSlots((prev) =>
        prev.map((slot) => {
          if (slot.status === 'training' && Date.now() >= slot.endsAt) {
            return { ...slot, status: 'completed' as const };
          }
          return slot;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const operation = useMemo(() => {
    if (!slotKey) return null;
    return trainingState.slots?.[slotKey] ?? null;
  }, [slotKey, trainingState]);

  const quantityPerOperation = getGangTrainingQuantityPerOperation(player);
  const durationMinutes      = getGangTrainingDurationMinutes(player);
  const dirtyCost            = getGangTrainingCostDirty(player);

  if (!slotKey) return null;

  const isReady = operation
    ? getGangTrainingOperationStatus(operation) === 'ready'
    : false;

  // Barra de progresso — apenas visual, sem lógica de negócio
  const progressPct = operation
    ? Math.min(100, Math.max(0,
        ((Date.now() - operation.startedAt) / (operation.endsAt - operation.startedAt)) * 100
      ))
    : 0;

  const barracoLevel = player.niveis?.barracoLevel ?? 1;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CSS mínimo: apenas o que Tailwind não consegue expressar ── */}
      <style>{`
        .ctm-top-line::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg,
            transparent 0%, #D4A017 25%, #F5C842 50%, #D4A017 75%, transparent 100%
          );
          z-index: 10;
          pointer-events: none;
        }
        .ctm-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #D4A017;
          flex-shrink: 0;
          animation: ctm-blink 2.2s ease-in-out infinite;
        }
        .ctm-pulse-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor; flex-shrink: 0;
          animation: ctm-blink 1.4s ease-in-out infinite;
        }
        @keyframes ctm-blink { 0%,100%{opacity:1} 50%{opacity:0.18} }

        .ctm-glow-text {
          animation: ctm-glow 1.6s ease-in-out infinite;
        }
        @keyframes ctm-glow {
          0%,100%{ text-shadow: 0 0 8px rgba(212,160,23,0.4); }
          50%    { text-shadow: 0 0 22px rgba(212,160,23,0.9), 0 0 44px rgba(212,160,23,0.3); }
        }

        .ctm-card {
          position: relative;
          transition: border-color 0.16s, background 0.16s, transform 0.14s;
        }
        .ctm-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: #D4A017; opacity: 0;
          transition: opacity 0.16s;
        }
        .ctm-card:hover { transform: translateY(-2px); }
        .ctm-card:hover::before { opacity: 1; }

        .ctm-prog-bar {
          position: relative; overflow: hidden;
        }
        .ctm-prog-bar::after {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 5px; height: 100%;
          background: rgba(255,255,255,0.45);
          filter: blur(3px);
        }

        .ctm-scan::before {
          content: '';
          position: absolute; top: -100%; left: 0; right: 0; height: 50%;
          background: linear-gradient(180deg, transparent, rgba(212,160,23,0.05), transparent);
          animation: ctm-scan 3.2s linear infinite;
          z-index: 2;
        }
        @keyframes ctm-scan { to { top: 200%; } }

        [data-dialog-content].ctm-dialog {
          padding: 0 !important;
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
        <DialogContent
          data-dialog-content
          className="ctm-dialog ctm-top-line max-w-2xl border border-amber-500/25 bg-[#0a0a0a] text-white p-0 overflow-hidden relative rounded-sm"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.9), 0 24px 64px rgba(0,0,0,0.75), 0 0 80px rgba(212,160,23,0.04)' }}
        >

          {/* ── CABEÇALHO ─────────────────────────────────────────────────── */}
          <div
            className="px-6 pt-5 pb-4 border-b border-white/[0.05]"
            style={{ background: 'linear-gradient(180deg, rgba(212,160,23,0.055) 0%, transparent 100%)' }}
          >
            <DialogHeader>
              <div className="flex flex-col gap-1.5">
                {/* Badge do slot */}
                <div className="flex items-center gap-2">
                  <div className="ctm-dot" />
                  <span className="text-[10px] font-bold tracking-[0.24em] uppercase text-amber-500">
                    Centro de Treinamento · {formatSlotLabel(slotKey)}
                  </span>
                </div>
                {/* Título */}
                <DialogTitle className="text-[28px] font-black uppercase tracking-[0.05em] text-zinc-100 leading-none">
                  Quartel General
                </DialogTitle>
                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-600">
                  Barraco Nível {barracoLevel}
                  {barracoLevel > 1 ? ` · ${barracoLevel} slots ativos` : ' · 1 slot ativo'}
                </p>
              </div>
            </DialogHeader>
          </div>

          {/* ── BARRA DE STATS ────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 border-b border-white/[0.05]">
            {[
              { label: 'Produção',  value: `+${quantityPerOperation}`, unit: 'membros / op.' },
              { label: 'Duração',   value: `${durationMinutes}`,        unit: 'minutos'      },
              { label: 'Custo',     value: dirtyCost.toLocaleString('pt-BR'), unit: 'dinheiro sujo' },
            ].map((s, i) => (
              <div
                key={i}
                className={`flex flex-col gap-0.5 px-5 py-3.5${i < 2 ? ' border-r border-white/[0.05]' : ''}`}
              >
                <span className="text-[9px] font-bold tracking-[0.26em] uppercase text-zinc-600">
                  {s.label}
                </span>
                <span className="text-[23px] font-black text-amber-400 leading-none">
                  {s.value}
                </span>
                <span className="text-[10px] font-medium text-zinc-600">
                  {s.unit}
                </span>
              </div>
            ))}
          </div>

          {/* ── CORPO ─────────────────────────────────────────────────────── */}
          <div
            className="p-5 flex flex-col gap-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-52deg, transparent, transparent 48px, rgba(255,255,255,0.007) 48px, rgba(255,255,255,0.007) 49px)',
            }}
          >

            {/* ── SLOTS LEGADOS (trainingSlots) ──────────────────────────── */}
            {trainingSlots.length > 0 && (
              <div className="flex flex-col gap-2">
                {/* Linha-seção */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold tracking-[0.26em] uppercase text-zinc-600 whitespace-nowrap">
                    Slots em treinamento
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {trainingSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 border border-white/[0.05] bg-[#111] rounded-sm"
                  >
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.04em] text-zinc-100">
                        {getMemberName(slot.troopType)}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">{slot.quantity} membros</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {slot.status === 'completed' ? (
                        <>
                          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-amber-400">
                            PRONTO
                          </span>
                          <Button
                            onClick={() => onCollectTraining(slotKey)}
                            disabled={isSubmitting}
                            className="h-8 px-4 rounded-sm bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black tracking-[0.14em] uppercase disabled:opacity-40"
                          >
                            Coletar
                          </Button>
                        </>
                      ) : (
                        <span className="font-mono text-base font-bold text-zinc-200">
                          {formatRemaining(slot as unknown as GangTrainingOperation)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── OPERAÇÃO ATIVA ─────────────────────────────────────────── */}
            {operation ? (
              <div className="flex flex-col gap-3">

                {/* Linha-seção com badge de status */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase${
                      isReady
                        ? ' bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : ' bg-sky-500/[0.07] border-sky-500/20 text-sky-400'
                    }`}
                  >
                    <div className="ctm-pulse-dot" />
                    {isReady ? 'Pronto para coletar' : 'Treinando'}
                  </div>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Painel da operação */}
                <div
                  className="border border-amber-500/20 bg-[#111] rounded-sm overflow-hidden relative"
                  style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)' }}
                >
                  {/* Linha dourada superior */}
                  <div
                    style={{
                      height: 1,
                      background:
                        'linear-gradient(90deg, transparent, rgba(212,160,23,0.55), #F5C842, rgba(212,160,23,0.55), transparent)',
                    }}
                  />

                  {/* Info principal */}
                  <div className="flex gap-5 p-5">
                    {/* Art placeholder */}
                    <div
                      className="ctm-scan w-[100px] h-[100px] flex-shrink-0 border border-amber-500/12 bg-[#0a0a0a] rounded-sm relative overflow-hidden"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute', inset: 0,
                          background:
                            'radial-gradient(ellipse at 50% 110%, rgba(212,160,23,0.14) 0%, transparent 65%)',
                        }}
                      />
                    </div>

                    {/* Texto */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      <div>
                        <h3 className="text-[25px] font-black uppercase tracking-[0.04em] text-zinc-100 leading-none">
                          {getMemberName(operation.memberType)}
                        </h3>
                        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-600 mt-1">
                          Barraco Nível {operation.barracoLevelAtStart} · iniciado às{' '}
                          {new Date(operation.startedAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Membros',     value: operation.quantity },
                          { label: 'Custo pago',  value: dirtyCost.toLocaleString('pt-BR') },
                          { label: 'Término',
                            value: new Date(operation.endsAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit', minute: '2-digit',
                            }),
                          },
                        ].map((m, i) => (
                          <div key={i}>
                            <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-zinc-600">
                              {m.label}
                            </p>
                            <p className="text-base font-black text-zinc-100 leading-none mt-0.5">
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="px-5 pb-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[9px] font-bold tracking-[0.26em] uppercase text-zinc-600">
                        {isReady ? 'Concluído' : 'Progresso'}
                      </span>
                      <span
                        className={`font-mono text-[22px] font-bold tracking-[0.06em] leading-none${
                          isReady ? ' text-amber-400 ctm-glow-text' : ' text-zinc-100'
                        }`}
                      >
                        {isReady ? 'PRONTO' : formatRemaining(operation)}
                      </span>
                    </div>

                    <div className="h-[5px] bg-white/[0.04] rounded-none overflow-visible relative">
                      <div
                        className={`h-full transition-[width] duration-1000 ease-linear${
                          isReady
                            ? ' ctm-prog-bar'
                            : ' ctm-prog-bar'
                        }`}
                        style={{
                          width: `${isReady ? 100 : progressPct}%`,
                          background: isReady
                            ? 'linear-gradient(90deg, #8B5E00, #D4A017, #F5C842, #FFF8E0)'
                            : 'linear-gradient(90deg, #6B4800, #D4A017, #F0C040)',
                          boxShadow: isReady
                            ? '0 0 12px rgba(212,160,23,0.55)'
                            : 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Banner de coleta */}
                {isReady && (
                  <div
                    className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-sm"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(212,160,23,0.08) 0%, rgba(212,160,23,0.03) 100%)',
                      border: '1px solid rgba(212,160,23,0.2)',
                    }}
                  >
                    <p className="text-xs font-bold tracking-[0.18em] uppercase text-amber-400">
                      ◈ {operation.quantity} {getMemberName(operation.memberType)}s prontos
                    </p>
                    <Button
                      onClick={() => onCollectTraining(slotKey)}
                      disabled={isSubmitting}
                      className="h-9 px-5 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-black text-xs tracking-[0.16em] uppercase disabled:opacity-40"
                    >
                      Coletar Tropa
                    </Button>
                  </div>
                )}

                {/* Botão de coleta (fallback visível mesmo sem banner) quando não ready */}
                {!isReady && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => onCollectTraining(slotKey)}
                      disabled={isSubmitting || true}
                      className="h-9 px-5 rounded-sm bg-amber-500/30 text-amber-500/40 font-black text-xs tracking-[0.16em] uppercase cursor-not-allowed"
                    >
                      Aguardando...
                    </Button>
                  </div>
                )}
              </div>

            ) : (
                            /* ── SELEÇÃO DE TROPA ──────────────────────────────────────── */
              <div className="flex flex-col gap-3">

                {/* Linha-seção */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold tracking-[0.26em] uppercase text-zinc-600 whitespace-nowrap">
                    Selecionar tropa
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Info de contexto */}
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Escolha o tipo de membro para treinar neste QG. Cada operação usa esse slot
                  apenas para este jogador e não bloqueia o QG de outros jogadores.
                </p>

                {/* Grade de tropas */}
                <div className="grid grid-cols-4 gap-2">
                  {TRAINABLE_MEMBER_TYPES.map((memberType) => (
                    <button
                      key={memberType}
                      onClick={() => onStartTraining(slotKey, memberType)}
                      disabled={isSubmitting}
                      className="ctm-card flex flex-col gap-2 p-3 border border-white/[0.05] bg-[#111] hover:border-amber-500/40 hover:bg-[#161616] text-left rounded-sm disabled:opacity-40"
                    >
                      {/* Art placeholder */}
                      <div
                        className="w-full aspect-square bg-[#0a0a0a] border border-white/[0.04] rounded-sm relative overflow-hidden"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.013) 4px, rgba(255,255,255,0.013) 5px)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
                            background:
                              'linear-gradient(0deg, rgba(212,160,23,0.07) 0%, transparent 100%)',
                          }}
                        />
                      </div>

                      {/* Nome */}
                      <p className="text-[13px] font-black uppercase tracking-[0.04em] text-zinc-100 leading-none">
                        {getMemberName(memberType)}
                      </p>

                      {/* Descrição */}
                      <p className="text-[9px] font-medium text-zinc-600 leading-snug">
                        {GANG_MEMBROS[memberType]?.descricao}
                      </p>

                      {/* CTA */}
                      <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-amber-500 mt-auto">
                        Treinar neste {formatSlotLabel(slotKey)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RODAPÉ ────────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.05]"
            style={{ background: 'rgba(0,0,0,0.22)' }}
          >
            <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-zinc-700">
              {isSubmitting ? 'Processando...' : `Barraco Nv.${barracoLevel}`}
            </p>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 px-5 rounded-sm border-white/[0.08] bg-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 text-xs font-bold tracking-[0.16em] uppercase"
            >
              Fechar
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
