import { useMemo } from 'react';
import type { GangMemberType, GangUnit } from '@/types/gangWar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/playerStore';
// ... keep existing code (imports are clean, no old references to remove)

interface Props {
  isOpen: boolean;
  member: GangUnit | null;
  onClose: () => void;
}
// ... keep existing code (Props interface is correct)

function getMemberLabel(type: GangMemberType) {
  if (type === 'capanga') return 'Capanga';
  if (type === 'frente') return 'Frente';
  if (type === 'executor') return 'Executor';
  if (type === 'assassino') return 'Assassino';
  if (type === 'muralha') return 'Muralha';
  if (type === 'certeiro') return 'Certeiro';
  if (type === 'motorista') return 'Motorista';
  if (type === 'nitro') return 'Nitro';
  if (type === 'armeiro') return 'Armeiro';
  if (type === 'informante') return 'Informante';
  if (type === 'wifi') return 'WiFi';
  if (type === 'medico') return 'Médico';
  if (type === 'lavador') return 'Lavador';
  if (type === 'ladrao') return 'Ladrão';
  return 'Negociador';
}

function getMemberRole(type: GangMemberType) {
  if (type === 'capanga' || type === 'frente' || type === 'executor') {
    return 'Linha de frente';
  }
  if (type === 'muralha') return 'Defesa pesada';
  if (type === 'assassino' || type === 'certeiro') return 'Ofensiva';
  if (type === 'motorista' || type === 'nitro') return 'Mobilidade';
  if (type === 'armeiro' || type === 'informante' || type === 'wifi') {
    return 'Tático';
  }
  if (type === 'medico' || type === 'negociador') return 'Suporte';
  return 'Econômico';
}

function getStatusLabel(status: GangUnit['status']) {
  if (status === 'ativo') return 'Ativo';
  if (status === 'ferido') return 'Ferido';
  if (status === 'morto') return 'Morto';
  return 'Treinando';
}

export default function EquipModal({ isOpen, member, onClose }: Props) {
  const player = usePlayerStore((state) => state.player);

  const inventoryItems = useMemo(() => {
    return Array.isArray(player?.inventory?.items) ? player.inventory.items : [];
  }, [player?.inventory?.items]);

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border border-white/10 bg-zinc-900 text-white">
        <DialogHeader>
          <DialogTitle>
            Equipamentos de {getMemberLabel(member.type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Função:</span>{' '}
              <span className="font-bold text-white">{getMemberRole(member.type)}</span>
            </p>
            <p className="mt-2">
              <span className="text-zinc-500">Nível:</span>{' '}
              <span className="font-bold text-white">{member.level}</span>
            </p>
            <p className="mt-2">
              <span className="text-zinc-500">Status:</span>{' '}
              <span className="font-bold text-white">{getStatusLabel(member.status)}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            O sistema individual de equipamento da gangue ainda não foi ligado ao store novo.
            Este modal foi ajustado para não quebrar a interface, mas equipar arma, armadura
            ou veículo em integrante ainda precisa ser implementado no backend, na API e no
            <code className="ml-1 rounded bg-black/30 px-1 py-0.5 text-amber-100">gangStore</code>.
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-white">Itens disponíveis no inventário</h3>

            {inventoryItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-500">
                Nenhum item encontrado no inventário do jogador.
              </div>
            ) : (
              <div className="max-h-[42dvh] space-y-2 overflow-y-auto pr-1 sm:max-h-64">
                {inventoryItems.map((item: any) => (
                  <div
                    key={item.id || item._id || item.itemId}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {item.name || item.itemId || 'Item'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.category || item.type || 'Sem categoria'}
                      </p>
                    </div>

                    <Button disabled className="cursor-not-allowed opacity-50">
                      Em breve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}