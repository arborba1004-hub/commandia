/**
 * components/game/BattleReportPanel.tsx
 * Painel de relatório de batalha — seção separada (não modal).
 * Substitui: BattleResultReport.tsx, AttackResultDisplay.tsx (legado)
 *
 * Exibe: resultado, comparativo de poder, espólios, baixas por tipo,
 *        composição de gangue dos dois lados — análogo ao relatório
 *        de batalha do Mafia City.
 *
 * Pode ser usado:
 *   - Como página standalone (/relatorio-batalha/:id)
 *   - Como painel lateral após o ataque ser resolvido
 */

import { useMemo } from 'react';
import {
  Swords, Shield, Skull, Heart, Coins,
  TrendingUp, AlertTriangle, Zap, ChevronDown,
} from 'lucide-react';
import type { BattleResolution, GangMemberType } from '@/types/gang';
import { ALL_GANG_MEMBER_TYPES } from '@/types/gang';
import { GANG_MEMBER_META } from '@/data/gangAtributos';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type BattleReportPanelProps = {
  resolution:   BattleResolution;
  attackerName: string;
  defenderName: string;
  onClose?:     () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function sumLosses(losses: Record<string, number> | undefined) {
  if (!losses) return 0;
  return Object.values(losses).reduce((a, b) => a + (b ?? 0), 0);
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function money(n: number) {
  return `R$ ${n.toLocaleString('pt-BR')}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═════════════════════════════════════════════════════════════════════════════

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pctFill = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-white">{Math.round(value).toLocaleString('pt-BR')}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pctFill}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SideStats({ name, resolution, side }: {
  name: string;
  resolution: BattleResolution;
  side: 'attacker' | 'defender';
}) {
  const stats  = side === 'attacker' ? resolution.attackerGangStats  : resolution.defenderGangStats;
  const losses = side === 'attacker' ? resolution.attackerGangLosses : resolution.defenderGangLosses;
  const isWinner = (resolution.success && side === 'attacker') || (!resolution.success && side === 'defender');

  const totalMortos  = sumLosses(losses?.mortos);
  const totalFeridos = sumLosses(losses?.feridos);
  const maxStat      = Math.max(stats?.rajada ?? 0, stats?.blindagem ?? 0, stats?.folego ?? 0, stats?.quebra ?? 0, 1);

  return (
    <div className={`rounded-2xl border p-5 ${
      isWinner ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
    }`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black truncate">{name}</h3>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
          isWinner
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-red-500/20 text-red-300'
        }`}>
          {isWinner ? '✓ Vencedor' : '✗ Derrotado'}
        </span>
      </div>

      {/* Poder total */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
        <span className="text-sm text-zinc-400">Poder total</span>
        <span className="text-xl font-black text-amber-300">
          {(side === 'attacker' ? resolution.attackerPower : resolution.defenderPower).toLocaleString('pt-BR')}
        </span>
      </div>

      {/* Barras de atributos */}
      {stats && (
        <div className="mb-4 space-y-2.5">
          <StatBar label="Rajada (ATQ)"    value={stats.rajada}    max={maxStat} color="#ef4444" />
          <StatBar label="Blindagem (DEF)" value={stats.blindagem} max={maxStat} color="#22d3ee" />
          <StatBar label="Fôlego (HP)"     value={stats.folego}    max={maxStat} color="#10b981" />
          <StatBar label="Quebra (DANO)"   value={stats.quebra}    max={maxStat} color="#f59e0b" />
        </div>
      )}

      {/* Baixas */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-red-500/10 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <Skull className="h-3.5 w-3.5" /> Mortos
          </div>
          <div className="font-black text-red-400 text-lg">{totalMortos}</div>
        </div>
        <div className="rounded-xl bg-amber-500/10 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <Heart className="h-3.5 w-3.5" /> Feridos
          </div>
          <div className="font-black text-amber-400 text-lg">{totalFeridos}</div>
        </div>
      </div>

      {/* Detalhamento por tipo */}
      {losses && (
        <div className="mt-4 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Baixas por tipo</p>
          {ALL_GANG_MEMBER_TYPES.map((type) => {
            const mortos  = losses.mortos?.[type]  ?? 0;
            const feridos = losses.feridos?.[type] ?? 0;
            if (!mortos && !feridos) return null;
            const meta = GANG_MEMBER_META[type];
            return (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{meta.nome}</span>
                <div className="flex gap-2">
                  {mortos  > 0 && <span className="text-red-400">💀 {mortos}</span>}
                  {feridos > 0 && <span className="text-amber-400">🏥 {feridos}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAINEL PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

export default function BattleReportPanel({
  resolution,
  attackerName,
  defenderName,
  onClose,
}: BattleReportPanelProps) {
  const successRate = useMemo(
    () => Math.round(resolution.chance * (resolution.chance <= 1 ? 100 : 1)),
    [resolution.chance]
  );

  const totalSpoils = useMemo(() => {
    const s = resolution.spoils;
    return s.dirtyMoneyLoot + s.luxuryConvertedDirtyMoney;
  }, [resolution.spoils]);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#090909] text-white overflow-hidden">

      {/* Header com resultado */}
      <div className={`relative p-8 border-b border-white/10 ${
        resolution.success
          ? 'bg-gradient-to-br from-emerald-950/60 to-black'
          : 'bg-gradient-to-br from-red-950/60 to-black'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {resolution.success
                ? <TrendingUp className="h-8 w-8 text-emerald-400" />
                : <AlertTriangle className="h-8 w-8 text-red-400" />}
              <h1 className={`text-4xl font-black uppercase tracking-tight ${
                resolution.success ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {resolution.success ? 'VITÓRIA' : 'DERROTA'}
              </h1>
              {resolution.critical && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-black text-yellow-300 uppercase tracking-widest">
                  <Zap className="h-3.5 w-3.5" /> Crítico
                </span>
              )}
            </div>
            <p className="text-zinc-300 italic">{resolution.message}</p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Chance de vitória</div>
            <div className="text-4xl font-black text-white">{successRate}%</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Espólios */}
        {resolution.success && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-black text-emerald-300 uppercase tracking-wide">Espólios</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 text-sm">
              {resolution.spoils.dirtyMoneyLoot > 0 && (
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <div className="text-zinc-400 text-xs mb-1">Dinheiro Sujo</div>
                  <div className="font-black text-emerald-300 text-lg">{money(resolution.spoils.dirtyMoneyLoot)}</div>
                </div>
              )}
              {resolution.spoils.correLoot > 0 && (
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <div className="text-zinc-400 text-xs mb-1">Giros (Corré)</div>
                  <div className="font-black text-amber-300 text-lg">+{resolution.spoils.correLoot}</div>
                </div>
              )}
              {resolution.spoils.prestigeLoot > 0 && (
                <div className="rounded-xl bg-black/30 px-4 py-3">
                  <div className="text-zinc-400 text-xs mb-1">Prestígio</div>
                  <div className="font-black text-purple-300 text-lg">+{resolution.spoils.prestigeLoot}</div>
                </div>
              )}
              {resolution.spoils.brokenLuxuryItemName && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 col-span-2">
                  <div className="text-zinc-400 text-xs mb-1">Item de Luxo Danificado</div>
                  <div className="font-bold text-red-300">{resolution.spoils.brokenLuxuryItemName}</div>
                  {resolution.spoils.luxuryConvertedDirtyMoney > 0 && (
                    <div className="text-emerald-300 text-xs mt-1">
                      Convertido: {money(resolution.spoils.luxuryConvertedDirtyMoney)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparativo dos dois lados */}
        <div>
          <h2 className="mb-4 text-[11px] uppercase tracking-widest text-zinc-500">
            Relatório de batalha — comparativo
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SideStats name={attackerName} resolution={resolution} side="attacker" />
            <SideStats name={defenderName} resolution={resolution} side="defender" />
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-zinc-600">
          Um e-mail com este relatório foi enviado para ambos os jogadores.
        </p>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 font-bold text-white hover:bg-white/10 transition-colors"
          >
            Fechar relatório
          </button>
        )}
      </div>
    </div>
  );
}
