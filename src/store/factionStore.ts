import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FactionRole =
  | 'leader'
  | 'subleader'
  | 'captain'
  | 'soldier'
  | 'member';

export type FactionMember = {
  playerId: string;
  name: string;
  power: number;
  role: FactionRole;
  joinedAt: string;
  lastSeenAt?: string;
};

export type FactionInvite = {
  id: string;
  factionId: string;
  factionName: string;
  factionTag: string;
  invitedPlayerId: string;
  invitedPlayerName: string;
  invitedByPlayerId: string;
  invitedByPlayerName: string;
  createdAt: string;
};

export type FactionJoinRequest = {
  id: string;
  playerId: string;
  playerName: string;
  power: number;
  createdAt: string;
};

export type Faction = {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  description: string;
  minPowerToJoin: number;
  maxMembers: number;
  totalPower: number;
  createdAt: string;
  updatedAt: string;
  members: FactionMember[];
  invites: FactionInvite[];
  joinRequests: FactionJoinRequest[];
};

type CreateFactionPayload = {
  name: string;
  tag: string;
  leader: Omit<FactionMember, 'role' | 'joinedAt'> & {
    role?: FactionRole;
  };
  description?: string;
  minPowerToJoin?: number;
  maxMembers?: number;
};

type FactionStore = {
  faction: Faction | null;
  myPlayerId: string | null;

  setMyPlayerId: (playerId: string | null) => void;
  clearFaction: () => void;

  createFaction: (payload: CreateFactionPayload) => void;
  disbandFaction: (requesterPlayerId: string) => void;

  invitePlayer: (
    invitedPlayer: {
      playerId: string;
      name: string;
    },
    invitedByPlayerId: string
  ) => void;

  revokeInvite: (inviteId: string, requesterPlayerId: string) => void;
  acceptInvite: (inviteId: string, member: Omit<FactionMember, 'joinedAt' | 'role'>) => void;
  declineInvite: (inviteId: string) => void;

  requestToJoin: (player: {
    playerId: string;
    name: string;
    power: number;
  }) => void;

  cancelJoinRequest: (playerId: string) => void;
  approveJoinRequest: (
    requestId: string,
    approvedByPlayerId: string
  ) => void;
  rejectJoinRequest: (
    requestId: string,
    rejectedByPlayerId: string
  ) => void;

  leaveFaction: (playerId: string) => void;
  kickMember: (targetPlayerId: string, requesterPlayerId: string) => void;
  promoteMember: (
    targetPlayerId: string,
    newRole: Exclude<FactionRole, 'leader'>,
    requesterPlayerId: string
  ) => void;
  transferLeadership: (
    newLeaderPlayerId: string,
    currentLeaderPlayerId: string
  ) => void;

  updateFactionInfo: (
    requesterPlayerId: string,
    updates: Partial<Pick<Faction, 'name' | 'tag' | 'description' | 'minPowerToJoin' | 'maxMembers'>>
  ) => void;

  updateMemberPower: (playerId: string, power: number) => void;
  syncMemberName: (playerId: string, name: string) => void;
  markMemberOnline: (playerId: string) => void;

  isInFaction: (playerId: string) => boolean;
  isSameFaction: (playerId: string) => boolean;
  isLeader: (playerId: string) => boolean;
  isOfficer: (playerId: string) => boolean;
  canManageFaction: (playerId: string) => boolean;

  getMemberById: (playerId: string) => FactionMember | null;
  getMyMember: () => FactionMember | null;
  getTotalPower: () => number;
  getMemberCount: () => number;
  getAvailableSlots: () => number;
};

const nowIso = () => new Date().toISOString();

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `faction_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeTag = (tag: string) =>
  tag.trim().toUpperCase().replace(/\s+/g, '').slice(0, 5);

const normalizeName = (name: string) => name.trim().slice(0, 24);

const calculateTotalPower = (members: FactionMember[]) =>
  members.reduce((sum, member) => sum + Math.max(0, Number(member.power) || 0), 0);

const roleWeight: Record<FactionRole, number> = {
  leader: 5,
  subleader: 4,
  captain: 3,
  soldier: 2,
  member: 1,
};

const sortMembers = (members: FactionMember[]) => {
  return [...members].sort((a, b) => {
    const roleDiff = roleWeight[b.role] - roleWeight[a.role];
    if (roleDiff !== 0) return roleDiff;
    return b.power - a.power;
  });
};

const recalcFaction = (faction: Faction): Faction => {
  const members = sortMembers(faction.members);

  return {
    ...faction,
    members,
    totalPower: calculateTotalPower(members),
    updatedAt: nowIso(),
  };
};

const getMemberRole = (faction: Faction | null, playerId: string): FactionRole | null => {
  if (!faction) return null;
  return faction.members.find((member) => member.playerId === playerId)?.role ?? null;
};

const isOfficerRole = (role: FactionRole | null) => {
  return role === 'leader' || role === 'subleader' || role === 'captain';
};

export const useFactionStore = create<FactionStore>()(
  persist(
    (set, get) => ({
      faction: null,
      myPlayerId: null,

      setMyPlayerId: (playerId) => {
        set({ myPlayerId: playerId });
      },

      clearFaction: () => {
        set({ faction: null });
      },

      createFaction: ({
        name,
        tag,
        leader,
        description = '',
        minPowerToJoin = 0,
        maxMembers = 20,
      }) => {
        const safeName = normalizeName(name);
        const safeTag = normalizeTag(tag);

        if (!safeName) return;
        if (!safeTag) return;

        const leaderMember: FactionMember = {
          playerId: leader.playerId,
          name: leader.name.trim(),
          power: Math.max(0, Number(leader.power) || 0),
          role: 'leader',
          joinedAt: nowIso(),
        };

        const newFaction: Faction = recalcFaction({
          id: makeId(),
          name: safeName,
          tag: safeTag,
          leaderId: leaderMember.playerId,
          description: description.trim().slice(0, 180),
          minPowerToJoin: Math.max(0, minPowerToJoin),
          maxMembers: Math.max(2, maxMembers),
          totalPower: leaderMember.power,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          members: [leaderMember],
          invites: [],
          joinRequests: [],
        });

        set({
          faction: newFaction,
          myPlayerId: leaderMember.playerId,
        });
      },

      disbandFaction: (requesterPlayerId) => {
        const faction = get().faction;
        if (!faction) return;
        if (faction.leaderId !== requesterPlayerId) return;

        set({ faction: null });
      },

      invitePlayer: (invitedPlayer, invitedByPlayerId) => {
        const faction = get().faction;
        if (!faction) return;

        const requesterRole = getMemberRole(faction, invitedByPlayerId);
        if (!isOfficerRole(requesterRole)) return;

        const alreadyMember = faction.members.some(
          (member) => member.playerId === invitedPlayer.playerId
        );
        if (alreadyMember) return;

        const alreadyInvited = faction.invites.some(
          (invite) => invite.invitedPlayerId === invitedPlayer.playerId
        );
        if (alreadyInvited) return;

        if (faction.members.length >= faction.maxMembers) return;

        const inviter = faction.members.find(
          (member) => member.playerId === invitedByPlayerId
        );
        if (!inviter) return;

        const invite: FactionInvite = {
          id: makeId(),
          factionId: faction.id,
          factionName: faction.name,
          factionTag: faction.tag,
          invitedPlayerId: invitedPlayer.playerId,
          invitedPlayerName: invitedPlayer.name,
          invitedByPlayerId,
          invitedByPlayerName: inviter.name,
          createdAt: nowIso(),
        };

        set({
          faction: {
            ...faction,
            invites: [...faction.invites, invite],
            updatedAt: nowIso(),
          },
        });
      },

      revokeInvite: (inviteId, requesterPlayerId) => {
        const faction = get().faction;
        if (!faction) return;

        const requesterRole = getMemberRole(faction, requesterPlayerId);
        if (!isOfficerRole(requesterRole)) return;

        set({
          faction: {
            ...faction,
            invites: faction.invites.filter((invite) => invite.id !== inviteId),
            updatedAt: nowIso(),
          },
        });
      },

      acceptInvite: (inviteId, member) => {
        const faction = get().faction;
        if (!faction) return;

        const invite = faction.invites.find((item) => item.id === inviteId);
        if (!invite) return;

        const alreadyMember = faction.members.some(
          (existingMember) => existingMember.playerId === member.playerId
        );
        if (alreadyMember) return;

        if (faction.members.length >= faction.maxMembers) return;

        const newMember: FactionMember = {
          playerId: member.playerId,
          name: member.name.trim(),
          power: Math.max(0, Number(member.power) || 0),
          role: 'member',
          joinedAt: nowIso(),
        };

        const updatedFaction = recalcFaction({
          ...faction,
          members: [...faction.members, newMember],
          invites: faction.invites.filter((item) => item.id !== inviteId),
          joinRequests: faction.joinRequests.filter(
            (request) => request.playerId !== member.playerId
          ),
        });

        set({ faction: updatedFaction });
      },

      declineInvite: (inviteId) => {
        const faction = get().faction;
        if (!faction) return;

        set({
          faction: {
            ...faction,
            invites: faction.invites.filter((invite) => invite.id !== inviteId),
            updatedAt: nowIso(),
          },
        });
      },

      requestToJoin: (player) => {
        const faction = get().faction;
        if (!faction) return;

        const alreadyMember = faction.members.some(
          (member) => member.playerId === player.playerId
        );
        if (alreadyMember) return;

        const alreadyRequested = faction.joinRequests.some(
          (request) => request.playerId === player.playerId
        );
        if (alreadyRequested) return;

        if ((Number(player.power) || 0) < faction.minPowerToJoin) return;
        if (faction.members.length >= faction.maxMembers) return;

        const request: FactionJoinRequest = {
          id: makeId(),
          playerId: player.playerId,
          playerName: player.name.trim(),
          power: Math.max(0, Number(player.power) || 0),
          createdAt: nowIso(),
        };

        set({
          faction: {
            ...faction,
            joinRequests: [...faction.joinRequests, request],
            updatedAt: nowIso(),
          },
        });
      },

      cancelJoinRequest: (playerId) => {
        const faction = get().faction;
        if (!faction) return;

        set({
          faction: {
            ...faction,
            joinRequests: faction.joinRequests.filter(
              (request) => request.playerId !== playerId
            ),
            updatedAt: nowIso(),
          },
        });
      },

      approveJoinRequest: (requestId, approvedByPlayerId) => {
        const faction = get().faction;
        if (!faction) return;

        const approverRole = getMemberRole(faction, approvedByPlayerId);
        if (!isOfficerRole(approverRole)) return;

        const request = faction.joinRequests.find((item) => item.id === requestId);
        if (!request) return;

        const alreadyMember = faction.members.some(
          (member) => member.playerId === request.playerId
        );
        if (alreadyMember) return;

        if (faction.members.length >= faction.maxMembers) return;

        const newMember: FactionMember = {
          playerId: request.playerId,
          name: request.playerName,
          power: request.power,
          role: 'member',
          joinedAt: nowIso(),
        };

        const updatedFaction = recalcFaction({
          ...faction,
          members: [...faction.members, newMember],
          joinRequests: faction.joinRequests.filter((item) => item.id !== requestId),
          invites: faction.invites.filter(
            (invite) => invite.invitedPlayerId !== request.playerId
          ),
        });

        set({ faction: updatedFaction });
      },

      rejectJoinRequest: (requestId, rejectedByPlayerId) => {
        const faction = get().faction;
        if (!faction) return;

        const rejectorRole = getMemberRole(faction, rejectedByPlayerId);
        if (!isOfficerRole(rejectorRole)) return;

        set({
          faction: {
            ...faction,
            joinRequests: faction.joinRequests.filter(
              (request) => request.id !== requestId
            ),
            updatedAt: nowIso(),
          },
        });
      },

      leaveFaction: (playerId) => {
        const faction = get().faction;
        if (!faction) return;

        const memberExists = faction.members.some((member) => member.playerId === playerId);
        if (!memberExists) return;

        const remainingMembers = faction.members.filter(
          (member) => member.playerId !== playerId
        );

        if (remainingMembers.length === 0) {
          set({ faction: null });
          return;
        }

        let nextLeaderId = faction.leaderId;
        let updatedMembers = [...remainingMembers];

        if (playerId === faction.leaderId) {
          const sorted = sortMembers(updatedMembers);
          const newLeader = sorted[0];

          updatedMembers = updatedMembers.map((member) =>
            member.playerId === newLeader.playerId
              ? { ...member, role: 'leader' }
              : member.role === 'leader'
              ? { ...member, role: 'subleader' }
              : member
          );

          nextLeaderId = newLeader.playerId;
        }

        const updatedFaction = recalcFaction({
          ...faction,
          leaderId: nextLeaderId,
          members: updatedMembers,
          invites: faction.invites.filter((invite) => invite.invitedPlayerId !== playerId),
          joinRequests: faction.joinRequests.filter(
            (request) => request.playerId !== playerId
          ),
        });

        set({ faction: updatedFaction });
      },

      kickMember: (targetPlayerId, requesterPlayerId) => {
        const faction = get().faction;
        if (!faction) return;

        if (targetPlayerId === faction.leaderId) return;

        const requesterRole = getMemberRole(faction, requesterPlayerId);
        if (!isOfficerRole(requesterRole)) return;
        if (targetPlayerId === requesterPlayerId) return;

        const updatedFaction = recalcFaction({
          ...faction,
          members: faction.members.filter((member) => member.playerId !== targetPlayerId),
          invites: faction.invites.filter((invite) => invite.invitedPlayerId !== targetPlayerId),
          joinRequests: faction.joinRequests.filter(
            (request) => request.playerId !== targetPlayerId
          ),
        });

        if (updatedFaction.members.length === 0) {
          set({ faction: null });
          return;
        }

        set({ faction: updatedFaction });
      },

      promoteMember: (targetPlayerId, newRole, requesterPlayerId) => {
        const faction = get().faction;
        if (!faction) return;
        if (targetPlayerId === faction.leaderId) return;
        if (faction.leaderId !== requesterPlayerId) return;

        const memberExists = faction.members.some((member) => member.playerId === targetPlayerId);
        if (!memberExists) return;

        const updatedFaction = recalcFaction({
          ...faction,
          members: faction.members.map((member) =>
            member.playerId === targetPlayerId
              ? { ...member, role: newRole }
              : member
          ),
        });

        set({ faction: updatedFaction });
      },

      transferLeadership: (newLeaderPlayerId, currentLeaderPlayerId) => {
        const faction = get().faction;
        if (!faction) return;
        if (faction.leaderId !== currentLeaderPlayerId) return;
        if (!faction.members.some((member) => member.playerId === newLeaderPlayerId)) return;
        if (newLeaderPlayerId === currentLeaderPlayerId) return;

        const updatedFaction = recalcFaction({
          ...faction,
          leaderId: newLeaderPlayerId,
          members: faction.members.map((member) => {
            if (member.playerId === currentLeaderPlayerId) {
              return { ...member, role: 'subleader' };
            }

            if (member.playerId === newLeaderPlayerId) {
              return { ...member, role: 'leader' };
            }

            return member;
          }),
        });

        set({ faction: updatedFaction });
      },

      updateFactionInfo: (requesterPlayerId, updates) => {
        const faction = get().faction;
        if (!faction) return;
        if (faction.leaderId !== requesterPlayerId) return;

        const nextName = updates.name ? normalizeName(updates.name) : faction.name;
        const nextTag = updates.tag ? normalizeTag(updates.tag) : faction.tag;

        set({
          faction: {
            ...faction,
            name: nextName,
            tag: nextTag,
            description:
              updates.description !== undefined
                ? updates.description.trim().slice(0, 180)
                : faction.description,
            minPowerToJoin:
              updates.minPowerToJoin !== undefined
                ? Math.max(0, updates.minPowerToJoin)
                : faction.minPowerToJoin,
            maxMembers:
              updates.maxMembers !== undefined
                ? Math.max(2, updates.maxMembers)
                : faction.maxMembers,
            updatedAt: nowIso(),
          },
        });
      },

      updateMemberPower: (playerId, power) => {
        const faction = get().faction;
        if (!faction) return;

        const memberExists = faction.members.some((member) => member.playerId === playerId);
        if (!memberExists) return;

        const updatedFaction = recalcFaction({
          ...faction,
          members: faction.members.map((member) =>
            member.playerId === playerId
              ? { ...member, power: Math.max(0, Number(power) || 0) }
              : member
          ),
        });

        set({ faction: updatedFaction });
      },

      syncMemberName: (playerId, name) => {
        const faction = get().faction;
        if (!faction) return;

        const trimmed = name.trim();
        if (!trimmed) return;

        const updatedFaction = recalcFaction({
          ...faction,
          members: faction.members.map((member) =>
            member.playerId === playerId
              ? { ...member, name: trimmed }
              : member
          ),
          invites: faction.invites.map((invite) =>
            invite.invitedPlayerId === playerId
              ? { ...invite, invitedPlayerName: trimmed }
              : invite.invitedByPlayerId === playerId
              ? { ...invite, invitedByPlayerName: trimmed }
              : invite
          ),
          joinRequests: faction.joinRequests.map((request) =>
            request.playerId === playerId
              ? { ...request, playerName: trimmed }
              : request
          ),
        });

        set({ faction: updatedFaction });
      },

      markMemberOnline: (playerId) => {
        const faction = get().faction;
        if (!faction) return;

        set({
          faction: {
            ...faction,
            members: faction.members.map((member) =>
              member.playerId === playerId
                ? { ...member, lastSeenAt: nowIso() }
                : member
            ),
            updatedAt: nowIso(),
          },
        });
      },
isInFaction: (playerId) => {
        const faction = get().faction;
        if (!faction) return false;
        return faction.members.some((member) => member.playerId === playerId);
      },

      isSameFaction: (playerId) => {
        const faction = get().faction;
        const myPlayerId = get().myPlayerId;

        if (!faction || !myPlayerId) return false;

        const meIsMember = faction.members.some((member) => member.playerId === myPlayerId);
        const otherIsMember = faction.members.some((member) => member.playerId === playerId);

        return meIsMember && otherIsMember;
      },

      isLeader: (playerId) => {
        const faction = get().faction;
        if (!faction) return false;
        return faction.leaderId === playerId;
      },

      isOfficer: (playerId) => {
        const role = getMemberRole(get().faction, playerId);
        return isOfficerRole(role);
      },

      canManageFaction: (playerId) => {
        const role = getMemberRole(get().faction, playerId);
        return isOfficerRole(role);
      },

      getMemberById: (playerId) => {
        const faction = get().faction;
        if (!faction) return null;
        return faction.members.find((member) => member.playerId === playerId) ?? null;
      },

      getMyMember: () => {
        const faction = get().faction;
        const myPlayerId = get().myPlayerId;
        if (!faction || !myPlayerId) return null;
        return faction.members.find((member) => member.playerId === myPlayerId) ?? null;
      },

      getTotalPower: () => {
        return get().faction?.totalPower ?? 0;
      },

      getMemberCount: () => {
        return get().faction?.members.length ?? 0;
      },

      getAvailableSlots: () => {
        const faction = get().faction;
        if (!faction) return 0;
        return Math.max(0, faction.maxMembers - faction.members.length);
      },
    }),
    {
      name: 'faction-storage',
      partialize: (state) => ({
        faction: state.faction,
        myPlayerId: state.myPlayerId,
      }),
    }
  )
);