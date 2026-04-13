import { useMemo } from 'react';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { useFactionStore } from '@/store/factionStore';
import { useFactionInviteStore } from '@/store/factionInviteStore';
import { usePlayerStore } from '@/store/playerStore';

export function useMapFactionInvite() {
  const previewTarget = useMapAttackStore((state) => state.target);

  const myFaction = useFactionStore((state) => state.myFaction);

  const playerState = usePlayerStore((state) => state.player);

  const sendFactionInvite = useFactionInviteStore(
    (state) => state.sendFactionInvite
  );
  const isSubmittingInvite = useFactionInviteStore(
    (state) => state.isSubmittingInvite
  );

  const currentFactionMember = useMemo(() => {
    if (!myFaction || !playerState?._id) return null;

    return (
      myFaction.members?.find(
        (member) => String(member.playerId) === String(playerState._id)
      ) || null
    );
  }, [myFaction, playerState?._id]);

  const canInviteToFaction =
    Boolean(currentFactionMember?.permissions?.canInvite) ||
    currentFactionMember?.role === 'leader';

  const previewTargetHasNoFaction =
    previewTarget?.factionId === null || previewTarget?.factionId === '';

  async function handleInviteFromPreview() {
    if (!previewTarget?.playerId) return false;
    if (!canInviteToFaction) return false;
    if (!previewTargetHasNoFaction) return false;

    const ok = await sendFactionInvite(String(previewTarget.playerId));

    if (ok) {
      useMapAttackStore.getState().closePreview();
    }

    return ok;
  }

  return {
    previewTarget,
    currentFactionMember,
    canInviteToFaction,
    previewTargetHasNoFaction,
    isSubmittingInvite,
    handleInviteFromPreview,
  };
}