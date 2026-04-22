import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, ShieldPlus, Swords, X } from 'lucide-react';
import { useMemo } from 'react';

export type OtherPlayerBarracoTarget = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  factionId?: string | null;
  factionName?: string | null;
  barracoLevel?: number;
};

export type OtherPlayerBarracoModalState = {
  isOpen: boolean;
  target: OtherPlayerBarracoTarget | null;
};

export type OtherPlayerBarracoModalProps = {
  state: OtherPlayerBarracoModalState;
  myFactionId?: string | null;
  onClose: () => void;
  onSendPrivateMessage: (target: OtherPlayerBarracoTarget) => void;
  onInviteToFaction: (target: OtherPlayerBarracoTarget) => void;
  onAttack: (target: OtherPlayerBarracoTarget) => void;
  isSendingMessage?: boolean;
  isInviting?: boolean;
  isAttacking?: boolean;
};

export function createOtherPlayerBarracoModalState(): OtherPlayerBarracoModalState {
  return {
    isOpen: false,
    target: null,
  };
}

export function openOtherPlayerBarracoModal(
  target: OtherPlayerBarracoTarget
): OtherPlayerBarracoModalState {
  return {
    isOpen: true,
    target,
  };
}

export function closeOtherPlayerBarracoModal(): OtherPlayerBarracoModalState {
  return {
    isOpen: false,
    target: null,
  };
}

function getFactionLabel(target: OtherPlayerBarracoTarget | null) {
  if (!target?.factionName?.trim()) {
    return 'Sem facção';
  }

  return target.factionName;
}

function getInitials(name?: string | null) {
  const parts = String(name || 'J').trim().split(/\s+/).slice(0, 2);
  return parts.map((item) => item.charAt(0).toUpperCase()).join('') || 'J';
}

function canInviteToFaction(
  target: OtherPlayerBarracoTarget,
  myFactionId?: string | null
) {
  if (!myFactionId) return false;
  if (!target.id) return false;
  if (target.factionId && target.factionId === myFactionId) return false;
  if (target.factionId) return false;
  return true;
}

export default function OtherPlayerBarracoModal({
  state,
  myFactionId = null,
  onClose,
  onSendPrivateMessage,
  onInviteToFaction,
  onAttack,
  isSendingMessage = false,
  isInviting = false,
  isAttacking = false,
}: OtherPlayerBarracoModalProps) {
  const target = state.target;

  const inviteEnabled = useMemo(() => {
    if (!target) return false;
    return canInviteToFaction(target, myFactionId);
  }, [target, myFactionId]);

  return (
    <Dialog open={state.isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-md border-white/10 bg-[#090909] p-0 text-white">
        {!target ? null : (
          <div className="overflow-hidden rounded-3xl">
            <div className="relative border-b border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/30 px-6 pb-5 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                {target.avatarUrl ? (
                  <img
                    src={target.avatarUrl}
                    alt={target.name}
                    className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-red-300">
                    {getInitials(target.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-300/80">
                    Barraco inimigo
                  </div>

                  <h2 className="mt-1 truncate text-2xl font-black">
                    {target.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      Facção: {getFactionLabel(target)}
                    </span>

                    {typeof target.barracoLevel === 'number' ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Barraco {target.barracoLevel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6">
              <Button
                type="button"
                onClick={() => onSendPrivateMessage(target)}
                disabled={isSendingMessage}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 text-base font-black text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <Mail size={18} />
                Mandar mensagem pessoal
              </Button>

              <Button
                type="button"
                onClick={() => onInviteToFaction(target)}
                disabled={!inviteEnabled || isInviting}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-base font-black text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                <ShieldPlus size={18} />
                Convidar para facção
              </Button>

              <Button
                type="button"
                onClick={() => onAttack(target)}
                disabled={isAttacking}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 text-base font-black text-white hover:bg-red-500 disabled:opacity-50"
              >
                <Swords size={18} />
                Atacar
              </Button>

              {!myFactionId ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  Você precisa estar em uma facção para convidar alguém.
                </div>
              ) : null}

              {target.factionId && target.factionId === myFactionId ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  Esse jogador já está na sua facção.
                </div>
              ) : null}

              {target.factionId && target.factionId !== myFactionId ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  Esse jogador já pertence a outra facção.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}