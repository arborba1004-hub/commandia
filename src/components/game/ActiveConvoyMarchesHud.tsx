import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, RefreshCw, Route, ShieldAlert, Zap } from 'lucide-react';
import { getActiveBattles, type ActiveBattleResponse } from '@/api/attackApi';
import { getSocket } from '@/socket';
import { getConvoySkin } from '@/data/convoyCatalog';
import { useConvoyAcceleratorStore } from '@/store/convoyAcceleratorStore';

type Props = {
  /** Batalha iniciada nesta sessão pelo useMapAttack, com animação local controlada pelo hook. */
  localActiveBattleId?: string | null;
  /** Acelera a batalha local mantendo a animação 3D sincronizada. */
  onAccelerateLocalBattle?: (battleId: string) => Promise<void> | void;
};

function formatRemaining(ms: number) {
  const safeMs = Math.max(0, Math.floor(Number(ms) || 0));
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function getRemainingMs(battle: ActiveBattleResponse, now = Date.now()) {
  const arriveAtMs = Date.parse(String(battle.arriveAtIso || ''));
  if (Number.isFinite(arriveAtMs)) return Math.max(0, arriveAtMs - now);
  return Math.max(0, Number(battle.remainingMs || 0));
}

function getProgressPercent(battle: ActiveBattleResponse, now = Date.now()) {
  const total = Math.max(1, Number(battle.totalDurationMs || 0));
  const remaining = getRemainingMs(battle, now);
  const progress = 1 - remaining / total;
  return Math.max(4, Math.min(100, progress * 100));
}

export default function ActiveConvoyMarchesHud({
  localActiveBattleId,
  onAccelerateLocalBattle,
}: Props) {
  const twoX = useConvoyAcceleratorStore((state) => state.twoX);
  const isUsing = useConvoyAcceleratorStore((state) => state.isUsing);
  const loadAccelerators = useConvoyAcceleratorStore((state) => state.load);
  const useOnBattle = useConvoyAcceleratorStore((state) => state.useOnBattle);
  const acceleratorError = useConvoyAcceleratorStore((state) => state.error);

  const [battles, setBattles] = useState<ActiveBattleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [acceleratingBattleId, setAcceleratingBattleId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const attackerMarches = useMemo(
    () => battles
      .filter((battle) => battle?.role === 'attacker' && battle?.status === 'travelling')
      .filter((battle) => getRemainingMs(battle, now) > 0),
    [battles, now],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [active] = await Promise.all([
        getActiveBattles(),
        loadAccelerators().catch(() => undefined),
      ]);
      if (!mountedRef.current) return;
      setBattles(Array.isArray(active) ? active : []);
    } catch (error) {
      console.warn('[ActiveConvoyMarchesHud] Falha ao carregar marchas ativas:', error);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [loadAccelerators]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    const refreshId = window.setInterval(() => {
      void refresh();
    }, 12_000);
    const tickId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(refreshId);
      window.clearInterval(tickId);
    };
  }, [refresh]);

  useEffect(() => {
    let socket: any = null;
    const handleChanged = () => { void refresh(); };

    try {
      socket = getSocket();
      socket.on('attack:squadStarted', handleChanged);
      socket.on('attack:squadResolved', handleChanged);
      socket.on('attack:squadAccelerated', handleChanged);
      socket.on('playerUpdate', handleChanged);
    } catch {
      socket = null;
    }

    return () => {
      if (!socket) return;
      socket.off('attack:squadStarted', handleChanged);
      socket.off('attack:squadResolved', handleChanged);
      socket.off('attack:squadAccelerated', handleChanged);
      socket.off('playerUpdate', handleChanged);
    };
  }, [refresh]);

  const handleAccelerate = useCallback(async (battleId: string) => {
    if (!battleId || isUsing || acceleratingBattleId) return;
    if (twoX <= 0) return;

    setAcceleratingBattleId(battleId);
    try {
      if (battleId === localActiveBattleId && onAccelerateLocalBattle) {
        await onAccelerateLocalBattle(battleId);
      } else {
        await useOnBattle(battleId);
      }
      await refresh();
    } catch (error) {
      console.warn('[ActiveConvoyMarchesHud] Erro ao acelerar marcha:', error);
    } finally {
      if (mountedRef.current) setAcceleratingBattleId(null);
    }
  }, [acceleratingBattleId, isUsing, localActiveBattleId, onAccelerateLocalBattle, refresh, twoX, useOnBattle]);

  if (attackerMarches.length === 0) return null;

  return (
    <div className="fixed left-2 top-[92px] z-[82] w-[min(330px,calc(100vw-16px))] pointer-events-auto sm:left-4 sm:top-[104px]">
      <div className="rounded-3xl border border-yellow-300/20 bg-black/70 p-3 text-white shadow-[0_0_28px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-yellow-300/30 bg-yellow-300/10 text-yellow-200">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-wide text-yellow-100">Marchas ativas</div>
              <div className="text-[11px] font-bold text-white/55">Acelere sem caçar o comboio no mapa</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void refresh(); }}
            disabled={isLoading}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 active:scale-95 disabled:opacity-50"
            aria-label="Atualizar marchas"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
          <div className="text-xs font-bold text-white/60">Aceleradores 2x</div>
          <div className="flex items-center gap-2 text-sm font-black text-yellow-200">
            <Zap className="h-4 w-4" /> {twoX.toLocaleString('pt-BR')}
          </div>
        </div>

        {attackerMarches.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold text-white/55">
            Nenhuma marcha sua em andamento agora.
          </div>
        ) : (
          <div className="space-y-2">
            {attackerMarches.slice(0, 4).map((battle) => {
              const skin = getConvoySkin(battle.attackerConvoySkinId || 'comboio_padrao');
              const remainingMs = getRemainingMs(battle, now);
              const progress = getProgressPercent(battle, now);
              const isThisAccelerating = acceleratingBattleId === battle.battleId || isUsing;
              const canUse = twoX > 0 && !isThisAccelerating && remainingMs > 1200;
              return (
                <div key={battle.battleId} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white">{skin.icon} {skin.name}</div>
                      <div className="truncate text-[11px] font-bold text-white/55">
                        Alvo: {battle.defenderName || battle.targetName || 'jogador'} • {Number(battle.memberCount || 0).toLocaleString('pt-BR')} membros
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs font-black text-yellow-100">{formatRemaining(remainingMs)}</div>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/60">
                    <div
                      className="h-full rounded-full bg-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.7)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!canUse}
                    onClick={() => { void handleAccelerate(battle.battleId); }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-300/40 bg-yellow-300 px-3 py-2 text-xs font-black uppercase tracking-wide text-black shadow-[0_0_20px_rgba(250,204,21,0.25)] active:scale-[0.98] disabled:border-white/10 disabled:bg-white/10 disabled:text-white/35 disabled:shadow-none"
                  >
                    {isThisAccelerating ? <Gauge className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {isThisAccelerating ? 'Acelerando...' : 'Usar acelerador 2x'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {acceleratorError && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/70 px-3 py-2 text-xs font-bold text-red-100">
            <ShieldAlert className="h-4 w-4" /> {acceleratorError}
          </div>
        )}
      </div>
    </div>
  );
}
