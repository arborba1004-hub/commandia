/**
 * components/gang/GangAttackModal.tsx
 * Modal de seleção de tropas para o ataque — estilo Mafia City.
 * Arquivo canônico. Substitui: GangAttackMembersModal.tsx, AttackMemberSelector.tsx (legado)
 *
 * Interface: seleção por QUANTIDADE POR TIPO (não por membro individual).
 * Igual ao modal de seleção de tropas do Mafia City antes de atacar.
 */

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Target, Zap, Coins, Radar } from 'lucide-react';
import type {
  GangMemberType,
  GangAttackSelection,
  AttackTarget,
  GangFormationType,
} from '@/types/gang';
import {
  ALL_GANG_MEMBER_TYPES,
  emptyGangAttackSelection,
} from '@/types/gang';
import { GANG_MEMBER_META } from '@/data/gangAtributos';
import { useGangStore } from '@/store/gangStore';
import { getCustomFormations } from '@/utils/customFormations';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type GangAttackModalProps = {
  isOpen:      boolean;
  target:      AttackTarget | null;
  onClose:     () => void;
  onConfirm:   (selection: GangAttackSelection) => void;
  isSubmitting?: boolean;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/** Capacidade máxima de marcha: barracoLevel × 100 (mín 100). */
function getMaxMarch(barracoLevel: number) {
  return Math.max(100, Math.floor(barracoLevel) * 100);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function toInt(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function totalSelected(selection: GangAttackSelection) {
  return ALL_GANG_MEMBER_TYPES.reduce((sum, t) => sum + (selection[t] ?? 0), 0);
}

// Ícones por papel do membro
function RoleIcon({ papel }: { papel: string }) {
  if (papel === 'tanque')         return <Shield  className="h-4 w-4 text-cyan-400"   />;
  if (papel === 'retaguarda')     return <Target  className="h-4 w-4 text-purple-400" />;
  if (papel === 'ofensivo')       return <Zap     className="h-4 w-4 text-red-400"    />;
  return                                 <Swords  className="h-4 w-4 text-amber-400"  />;
}

const ROLE_COLOR: Record<string, string> = {
  linha_de_frente: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  ofensivo:        'border-red-500/30    bg-red-500/10    text-red-300',
  tanque:          'border-cyan-500/30   bg-cyan-500/10   text-cyan-300',
  retaguarda:      'border-purple-500/30 bg-purple-500/10 text-purple-300',
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE LINHA DE TIPO
// ═════════════════════════════════════════════════════════════════════════════

function TroopRow({
  type,
  available,
  selected,
  maxAllowed,
  isSubmitting,
  onChange,
}: {
  type:        GangMemberType;
  available:   number;
  selected:    number;
  maxAllowed:  number;
  isSubmitting: boolean;
  onChange:    (qty: number) => void;
}) {
  const meta     = GANG_MEMBER_META[type];
  const canMore  = selected < available && selected < maxAllowed;
  const canLess  = selected > 0;

  function step(delta: number) {
    onChange(clamp(selected + delta, 0, Math.min(available, maxAllowed)));
  }

  function fillMax() {
    onChange(Math.min(available, maxAllowed));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Info do tipo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <RoleIcon papel={meta.papel} />
            <span className="text-lg font-black text-white">{meta.nome}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_COLOR[meta.papel]}`}>
              {meta.papel.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">{meta.descricao}</p>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300">
              Disponíveis: {available.toLocaleString('pt-BR')}
            </span>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
              Selecionados: {selected.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Controles de quantidade */}
        <div className="flex flex-col gap-2.5 lg:items-end">
          <div className="flex items-center gap-1.5">
            {([-100, -10, -1] as const).map((delta) => (
              <Button
                key={delta}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => step(delta)}
                disabled={isSubmitting || !canLess}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 w-12 text-xs font-bold"
              >
                {delta}
              </Button>
            ))}

            <input
              type="number"
              min={0}
              max={Math.min(available, maxAllowed)}
              value={selected}
              onChange={(e) => {
                const n = toInt(e.target.value, 0);
                onChange(clamp(n, 0, Math.min(available, maxAllowed)));
              }}
              disabled={isSubmitting}
              className="h-10 w-24 rounded-xl border border-white/10 bg-black/40 px-2 text-center text-base font-black text-white outline-none focus:border-red-500/50"
            />

            {([1, 10, 100] as const).map((delta) => (
              <Button
                key={delta}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => step(delta)}
                disabled={isSubmitting || !canMore}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 w-12 text-xs font-bold"
              >
                +{delta}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillMax}
            disabled={isSubmitting || selected >= Math.min(available, maxAllowed)}
            className="border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20 text-xs"
          >
            Máximo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

export default function GangAttackModal({
  isOpen,
  target,
  onClose,
  onConfirm,
  isSubmitting = false,
}: GangAttackModalProps) {
  const { gang, setFormation } = useGangStore();

  const barracoLevel = (gang as any)?.gangLevel ?? 1;
  const maxMarch     = getMaxMarch(barracoLevel);
  const available    = useGangStore((s) => s.getAvailableByType());
  const currentFormation = gang?.formation || 'pressao_total';

  const [selection, setSelection] = useState<GangAttackSelection>(emptyGangAttackSelection());
  const [showFormationSelector, setShowFormationSelector] = useState(false);

  // Load custom formations from localStorage
  const [customFormations] = useState(() => {
    return getCustomFormations();
  });

  const formations: Array<{ id: GangFormationType; title: string; icon: string }> = [
    { id: 'pressao_total', title: 'Pressão Total', icon: 'ATAQUE' },
    { id: 'linha_fechada', title: 'Linha Fechada', icon: 'DEFESA' },
    { id: 'bote_certo', title: 'Bote Certo', icon: 'ALVO' },
    { id: 'cerco', title: 'Cerco', icon: 'CERCO' },
    { id: 'saque_rapido', title: 'Saque Rápido', icon: 'ROUBO' },
    { id: 'custom_1', title: customFormations.custom_1?.title || 'Personalizada 1', icon: 'CUSTOM' },
    { id: 'custom_2', title: customFormations.custom_2?.title || 'Personalizada 2', icon: 'CUSTOM' },
    { id: 'custom_3', title: customFormations.custom_3?.title || 'Personalizada 3', icon: 'CUSTOM' },
  ];

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) setSelection(emptyGangAttackSelection());
  }, [isOpen]);

  const total     = useMemo(() => totalSelected(selection), [selection]);
  const remaining = Math.max(0, maxMarch - total);

  function updateType(type: GangMemberType, qty: number) {
    setSelection((prev) => {
      const currentForType = prev[type] ?? 0;
      const otherTotal     = total - currentForType;
      const maxForType     = Math.max(0, maxMarch - otherTotal);
      return { ...prev, [type]: clamp(qty, 0, Math.min(available[type] ?? 0, maxForType)) };
    });
  }

  function clearAll() {
    setSelection(emptyGangAttackSelection());
  }

  function handleConfirm() {
    if (total === 0) return;
    onConfirm(selection);
  }

  async function handleFormationChange(formationId: GangFormationType) {
    await setFormation(formationId);
    setShowFormationSelector(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#0a0a0a] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-[0.08em] flex items-center gap-2">
            <Swords className="h-6 w-6 text-red-400" />
            Selecionar membros para o ataque
            {target && (
              <span className="text-base font-normal text-zinc-400 ml-2">
                → {target.playerName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Seletor de Formação */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Formação Atual</div>
              <div className="mt-1 text-lg font-black text-white">
                {formations.find(f => f.id === currentFormation)?.title || 'Pressão Total'}
              </div>
            </div>
            <button
              onClick={() => setShowFormationSelector(!showFormationSelector)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/80 transition-all"
            >
              Mudar Formação
            </button>
          </div>

          {/* Grid de Formações */}
          {showFormationSelector && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {formations.map((formation) => (
                <button
                  key={formation.id}
                  onClick={() => handleFormationChange(formation.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    currentFormation === formation.id
                      ? 'bg-primary text-white'
                      : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {formation.icon} {formation.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Capacidade */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-[11px] uppercase tracking-widest text-red-300">Capacidade da marcha</div>
            <div className="mt-1.5 text-3xl font-black">{maxMarch.toLocaleString('pt-BR')}</div>
            <div className="mt-1 text-xs text-zinc-500">barraco nível {barracoLevel} × 100</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="text-[11px] uppercase tracking-widest text-amber-300">Selecionados</div>
            <div className="mt-1.5 text-3xl font-black">{total.toLocaleString('pt-BR')}</div>
            <div className="mt-1 text-xs text-zinc-500">membros nesta marcha</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-[11px] uppercase tracking-widest text-emerald-300">Vagas restantes</div>
            <div className="mt-1.5 text-3xl font-black">{remaining.toLocaleString('pt-BR')}</div>
            <div className="mt-1 text-xs text-zinc-500">ainda disponíveis</div>
          </div>
        </div>

        {/* Barra de progresso de capacidade */}
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${Math.min(100, (total / maxMarch) * 100)}%`,
              background: total >= maxMarch ? '#ef4444' : '#f59e0b',
            }}
          />
        </div>

        {/* Linhas de tipo */}
        <div className="grid grid-cols-1 gap-3">
          {ALL_GANG_MEMBER_TYPES.map((type) => {
            const currentForType = selection[type] ?? 0;
            const otherTotal     = total - currentForType;
            const maxAllowed     = Math.max(0, maxMarch - otherTotal);

            return (
              <TroopRow
                key={type}
                type={type}
                available={available[type] ?? 0}
                selected={currentForType}
                maxAllowed={maxAllowed}
                isSubmitting={isSubmitting}
                onChange={(qty) => updateType(type, qty)}
              />
            );
          })}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-2 md:flex-row md:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={clearAll}
            disabled={isSubmitting || total === 0}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Limpar seleção
          </Button>

          <div className="flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || total === 0}
              className="bg-red-600 hover:bg-red-500 font-black text-white disabled:opacity-50 px-8"
            >
              {isSubmitting
                ? 'Enviando marcha...'
                : `Atacar com ${total.toLocaleString('pt-BR')} membros`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
