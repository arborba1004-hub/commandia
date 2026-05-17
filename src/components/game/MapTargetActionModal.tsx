/**
 * components/game/MapTargetActionModal.tsx
 *
 * Modal "preview de alvo + montar marcha + invadir" que aparece ao clicar
 * num barraco inimigo no mapa.
 *
 * Mostra:
 *  - Info pública do alvo (nome, facção, distância em tiles, tempo de viagem)
 *  - Status do ataque (disponível / escudo / cooldown / mesma facção)
 *  - Seleção de tropas por tipo (apenas os 8 tipos reais do Sistema A)
 *  - Botão "Invadir" (desabilitado se bloqueado ou seleção vazia)
 *  - Opção de convidar pra facção (quando o alvo não tem facção)
 *
 * Princípios:
 *  - Nenhum stat do defensor exposto além do nome (estilo "scout cego" do Mafia City)
 *  - Rota Manhattan calculada localmente apenas para *exibição* de distância/tempo
 *    (o cálculo autoritativo continua sendo do backend ao chamar /battle/start)
 */

import { useEffect, useMemo, useState } from 'react';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { useMapFactionInvite } from '@/components/game/useMapFactionInvite';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { canAttack, type CanAttackResponse } from '@/api/attackApi';
import type { GangMemberType } from '@/types/gang';

interface MapTargetActionModalProps {
  isStartingBattle: boolean;
  onAttack: () => void;
}

// ─── 8 tipos reais do Sistema A (treináveis pelo CT do mapa) ──────────────────
const TROOP_ORDER: Array<{ type: GangMemberType; label: string }> = [
  { type: 'muralha',   label: 'Muralha'   },
  { type: 'frente',    label: 'Frente'    },
  { type: 'executor',  label: 'Executor'  },
  { type: 'assassino', label: 'Assassino' },
  { type: 'capanga',   label: 'Capanga'   },
  { type: 'nitro',     label: 'Nitro'     },
  { type: 'certeiro',  label: 'Certeiro'  },
  { type: 'motorista', label: 'Motorista' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Distância Manhattan (fiel a Mafia City: dx + dy, sem diagonais) */
function manhattanDistance(
  fromX: number, fromY: number,
  toX: number,   toY: number,
): number {
  return Math.abs(toX - fromX) + Math.abs(toY - fromY);
}

/**
 * Tempo por tile, fiel ao cálculo do backend (resolveAttack.js):
 *   timePerTileMs = 5000 / (1 + 0.05 × (barraco − 1))
 *   timePerTileMs *= (1 − velocityBonus) — futuros pacotes
 */
function timePerTileMs(barracoLevel: number, velocityBonus = 0): number {
  const safeLevel = Math.max(1, Math.floor(barracoLevel));
  const safeBonus = Math.max(0, Math.min(0.9, velocityBonus));
  const levelFactor = 1 + 0.05 * (safeLevel - 1);
  const baseSpeed = 5000 / levelFactor;
  return Math.max(50, Math.floor(baseSpeed * (1 - safeBonus)));
}

/** Formata duração em ms para mm:ss ou h:mm */
function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0)   return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  if (minutes > 0) return `${minutes}min ${seconds.toString().padStart(2, '0')}s`;
  return `${seconds}s`;
}

/** Formata timestamp como contagem regressiva relativa */
function formatRelativeFromNow(ms: number): string {
  const delta = Math.max(0, ms - Date.now());
  return formatDuration(delta);
}

/** Traduz a razão de bloqueio do backend para texto amigável */
function formatBlockReason(info: CanAttackResponse): string {
  switch (info.reason) {
    case 'same_faction':
      return 'Aliado de facção — ataques entre membros da mesma facção são proibidos.';
    case 'shield_active': {
      const fonte = info.shieldSource === 'novato' ? 'novato'
                  : info.shieldSource === 'derrota' ? 'recuperação pós-derrota'
                  : info.shieldSource === 'pacote'  ? 'pacote'
                  : 'desconhecida';
      const expira = info.shieldExpiresAt
        ? formatRelativeFromNow(info.shieldExpiresAt)
        : 'tempo indeterminado';
      return `Alvo protegido (escudo de ${fonte}) por mais ${expira}.`;
    }
    case 'cooldown': {
      const expira = info.cooldownExpiresAt
        ? formatRelativeFromNow(info.cooldownExpiresAt)
        : 'tempo indeterminado';
      return `Cooldown ativo — você poderá atacar este alvo de novo em ${expira}.`;
    }
    case 'self_attack':
      return 'Você não pode atacar a si mesmo.';
    case 'target_not_found':
      return 'Alvo não encontrado.';
    case 'server_error':
      return info.message || 'Erro no servidor — tente novamente.';
    default:
      return info.message || 'Ataque indisponível.';
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═════════════════════════════════════════════════════════════════════════════

export default function MapTargetActionModal({
  isStartingBattle,
  onAttack,
}: MapTargetActionModalProps) {
  const previewOpen          = useMapAttackStore((state) => state.previewOpen);
  const closePreview         = useMapAttackStore((state) => state.closePreview);
  const selectedTroops       = useMapAttackStore((state) => state.selectedTroops);
  const updateTroopSelection = useMapAttackStore((state) => state.updateTroopSelection);
  const clearSelectedTroops  = useMapAttackStore((state) => state.clearSelectedTroops);

  // CUIDADO: Não use useGangStore((s) => s.getAvailableByType()) — essa chamada
  // retorna objeto novo a cada render e causa loop infinito (React error #185).
  // Lemos gang.members direto e calculamos com useMemo.
  const gangMembers = useGangStore((state) => state.gang?.members);
  const loadGang    = useGangStore((state) => state.loadGang);

  const availableByType = useMemo(() => {
    const counts: Partial<Record<GangMemberType, number>> = {};
    for (const m of (gangMembers || [])) {
      if (m.status !== 'ativo') continue;
      const t = m.type as GangMemberType;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [gangMembers]);

  const player = usePlayerStore((state) => state.player);

  const {
    previewTarget,
    canInviteToFaction,
    previewTargetHasNoFaction,
    isSubmittingInvite,
    handleInviteFromPreview,
  } = useMapFactionInvite();

  // ── Estado de validação do ataque (canAttack) ────────────────────────────
  const [attackInfo, setAttackInfo]     = useState<CanAttackResponse | null>(null);
  const [isCheckingAttack, setChecking] = useState<boolean>(false);

  // Recarrega gang ao abrir modal
  useEffect(() => {
    if (previewOpen) void loadGang();
  }, [previewOpen, loadGang]);

  // Chama canAttack sempre que abre num novo alvo
  useEffect(() => {
    if (!previewOpen || !previewTarget) {
      setAttackInfo(null);
      return;
    }
    let canceled = false;
    setChecking(true);

    canAttack(previewTarget.playerId)
      .then((info) => { if (!canceled) setAttackInfo(info); })
      .catch(() => {
        if (!canceled) setAttackInfo({
          canAttack: false,
          reason: 'server_error',
          message: 'Não foi possível verificar o ataque',
          shieldExpiresAt: null,
          shieldSource: null,
          cooldownExpiresAt: null,
        });
      })
      .finally(() => { if (!canceled) setChecking(false); });

    return () => { canceled = true; };
  }, [previewOpen, previewTarget?.playerId]);

  // ── Cálculo de viagem (Manhattan + curva do barraco) ─────────────────────
  const travel = useMemo(() => {
    if (!previewTarget || !player?.mapPosition) return null;
    const fromX = Number(player.mapPosition.tileX || 0);
    const fromY = Number(player.mapPosition.tileY || 0);
    const toX   = Number(previewTarget.tileX || 0);
    const toY   = Number(previewTarget.tileY || 0);
    const tiles = manhattanDistance(fromX, fromY, toX, toY);
    const barraco = Number(player.niveis?.barracoLevel || 1);
    const velocityBonus = Number((player as any).combatModifiers?.velocityBonus || 0);
    const perTile = timePerTileMs(barraco, velocityBonus);
    return {
      tiles,
      perTileMs: perTile,
      totalMs:   tiles * perTile,
    };
  }, [previewTarget, player?.mapPosition?.tileX, player?.mapPosition?.tileY, player?.niveis?.barracoLevel]);

  const selectedTotal = useMemo(
    () => selectedTroops.reduce((sum, troop) => sum + troop.quantity, 0),
    [selectedTroops]
  );

  const selectedMap = useMemo(
    () => Object.fromEntries(selectedTroops.map((troop) => [troop.type, troop.quantity])),
    [selectedTroops]
  );

  if (!previewOpen || !previewTarget) return null;

  const canDoAttack = (attackInfo?.canAttack ?? false) && selectedTotal > 0 && !isStartingBattle && !isCheckingAttack;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-xl rounded-t-3xl border border-red-500/30 bg-[#090909] p-5 text-white">
        <h2 className="mb-2 text-2xl font-black">Invadir barraco</h2>

        {/* ─── Info pública do alvo ─── */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-400">Alvo</div>
          <div className="mt-1 text-lg font-bold">{previewTarget.playerName}</div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-black/30 p-3">
              <div className="text-zinc-500">Distância</div>
              <div className="mt-1 font-bold">
                {travel ? `${travel.tiles} tiles` : '—'}
              </div>
            </div>

            <div className="rounded-xl bg-black/30 p-3">
              <div className="text-zinc-500">Tempo de viagem</div>
              <div className="mt-1 font-bold">
                {travel ? formatDuration(travel.totalMs) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Status do ataque (canAttack) ─── */}
        {isCheckingAttack && (
          <div className="mb-4 rounded-xl border border-zinc-600/30 bg-zinc-800/30 p-3 text-sm text-zinc-300">
            Verificando alvo...
          </div>
        )}

        {!isCheckingAttack && attackInfo && !attackInfo.canAttack && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
            <div className="font-bold text-red-300">Ataque bloqueado</div>
            <div className="mt-1 text-red-200">{formatBlockReason(attackInfo)}</div>
          </div>
        )}

        {!isCheckingAttack && attackInfo?.canAttack && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
            Alvo disponível para invasão
          </div>
        )}

        {/* ─── Seleção de tropas (apenas se permitido atacar) ─── */}
        {attackInfo?.canAttack && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">
              Montar marcha
            </div>

            <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
              {TROOP_ORDER.map(({ type, label }) => {
                const available = availableByType[type] || 0;
                const selected  = Number(selectedMap[type] || 0);

                return (
                  <div
                    key={type}
                    className="rounded-xl border border-white/10 bg-black/30 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-bold">{label}</div>
                      <div className="text-xs text-zinc-400">
                        Disponível: <span className="font-bold text-white">{available}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateTroopSelection(type, Math.max(0, selected - 1))}
                        disabled={selected <= 0}
                        className="rounded-lg bg-zinc-800 px-3 py-2 font-black disabled:opacity-30"
                      >
                        -
                      </button>

                      <input
                        value={selected}
                        onChange={(e) => {
                          const next = Math.max(
                            0,
                            Math.min(available, Number(e.target.value || 0))
                          );
                          updateTroopSelection(type, next);
                        }}
                        className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-center font-black"
                        inputMode="numeric"
                      />

                      <button
                        onClick={() => updateTroopSelection(type, Math.min(available, selected + 1))}
                        disabled={selected >= available}
                        className="rounded-lg bg-zinc-800 px-3 py-2 font-black disabled:opacity-30"
                      >
                        +
                      </button>

                      <button
                        onClick={() => updateTroopSelection(type, available)}
                        disabled={available === 0 || selected === available}
                        className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black disabled:opacity-30"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="text-zinc-400">
                Tropas selecionadas:{' '}
                <span className="font-black text-white">{selectedTotal}</span>
              </div>

              <button
                onClick={clearSelectedTroops}
                disabled={selectedTotal === 0}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-black disabled:opacity-30"
              >
                LIMPAR
              </button>
            </div>
          </div>
        )}

        {/* ─── Convite de facção (independente do ataque) ─── */}
        <div className="mb-4 rounded-xl bg-black/30 p-3 text-sm">
          {previewTargetHasNoFaction
            ? 'Este jogador não pertence a nenhuma facção.'
            : 'Este jogador já pertence a uma facção.'}
        </div>

        {/* ─── Ações ─── */}
        <div className="flex flex-col gap-3">
          {canInviteToFaction && previewTargetHasNoFaction && (
            <button
              onClick={() => { void handleInviteFromPreview(); }}
              disabled={isSubmittingInvite}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white disabled:opacity-50"
            >
              {isSubmittingInvite ? 'CONVIDANDO...' : 'CONVIDAR PARA FACÇÃO'}
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                clearSelectedTroops();
                closePreview();
              }}
              className="flex-1 rounded-2xl bg-zinc-700 px-4 py-4 font-bold text-white"
            >
              Cancelar
            </button>

            <button
              onClick={onAttack}
              disabled={!canDoAttack}
              className="flex-1 rounded-2xl bg-red-600 px-4 py-4 font-black text-white disabled:opacity-50"
            >
              {isStartingBattle ? 'INVADINDO...' : 'INVADIR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
