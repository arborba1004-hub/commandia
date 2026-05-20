import { useEffect, useMemo } from 'react';
import { CONVOY_CATALOG, getConvoySkin } from '@/data/convoyCatalog';
import { usePlayerConvoyStore } from '@/store/playerConvoyStore';
import type { ConvoySkinId } from '@/types/convoy';

export default function AttackConvoyPicker() {
  const ownedSkinIds = usePlayerConvoyStore((s) => s.ownedSkinIds);
  const selectedSkinId = usePlayerConvoyStore((s) => s.selectedSkinId);
  const isLoading = usePlayerConvoyStore((s) => s.isLoading);
  const error = usePlayerConvoyStore((s) => s.error);
  const backendSynced = usePlayerConvoyStore((s) => s.backendSynced);
  const loadMyConvoys = usePlayerConvoyStore((s) => s.loadMyConvoys);
  const selectConvoy = usePlayerConvoyStore((s) => s.selectConvoy);

  useEffect(() => {
    void loadMyConvoys();
  }, [loadMyConvoys]);

  const ownedConvoys = useMemo(
    () => CONVOY_CATALOG.filter((item) => ownedSkinIds.includes(item.id)),
    [ownedSkinIds]
  );

  const selected = getConvoySkin(selectedSkinId);

  return (
    <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-cyan-300">
            Comboio do ataque
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            A animação usada no mapa sai desta seleção. Só aparecem comboios comprados/liberados.
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
          Atual: <span className="font-black text-white">{selected.name}</span>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
          Carregando comboios comprados...
        </div>
      )}

      {!isLoading && ownedConvoys.length > 0 && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {ownedConvoys.map((skin) => {
            const active = selectedSkinId === skin.id;
            return (
              <button
                key={skin.id}
                type="button"
                onClick={() => { void selectConvoy(skin.id as ConvoySkinId); }}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-cyan-300 bg-cyan-400/15 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                    : 'border-white/10 bg-black/30 hover:border-cyan-400/50 hover:bg-cyan-400/10'
                }`}
              >
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-2xl"
                  style={{ boxShadow: active ? `0 0 18px ${skin.accentColor}55` : undefined }}
                >
                  {skin.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-black text-white">{skin.name}</span>
                    {active && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] font-black text-black">EQUIPADO</span>}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-zinc-400">{skin.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && ownedConvoys.length === 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          Nenhum comboio liberado. O backend deve sempre liberar o Comboio Padrão.
        </div>
      )}

      {!backendSynced && error && (
        <div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-100">
          Backend de comboio ainda não sincronizado: usando somente o Comboio Padrão.
        </div>
      )}
    </div>
  );
}
