import { create } from 'zustand';
import { Faction, FactionMember } from '@/types/faction';

interface FactionState {
  faction: Faction | null;

  createFaction: (player: any, name: string, tag: string) => void;
  joinFaction: (player: any, faction: Faction) => void;
  leaveFaction: (playerId: string) => void;

  addMember: (member: FactionMember) => void;
  removeMember: (playerId: string) => void;

  addContribution: (playerId: string, value: number) => void;

  clearFaction: () => void;
}

export const useFactionStore = create<FactionState>((set, get) => ({
  faction: null,

  createFaction: (player, name, tag) => {
    const newFaction: Faction = {
      id: crypto.randomUUID(),
      name,
      tag,
      leaderId: player._id,
      leaderName: player.name,

      members: [
        {
          playerId: player._id,
          playerName: player.name,
          role: 'leader',
          joinedAt: new Date().toISOString(),
          contribution: 0,
          power: player.power || 100,
        },
      ],

      memberCount: 1,
      createdAt: new Date().toISOString(),

      prestige: 0,
      power: player.power || 100,

      treasuryDirtyMoney: 0,
      treasuryCleanMoney: 0,

      eventPoints: 0,

      isOpen: true,
    };

    set({ faction: newFaction });
  },

  joinFaction: (player, faction) => {
    const member: FactionMember = {
      playerId: player._id,
      playerName: player.name,
      role: 'member',
      joinedAt: new Date().toISOString(),
      contribution: 0,
      power: player.power || 100,
    };

    const updated = {
      ...faction,
      members: [...faction.members, member],
      memberCount: faction.members.length + 1,
    };

    set({ faction: updated });
  },

  leaveFaction: (playerId) => {
    const faction = get().faction;
    if (!faction) return;

    const members = faction.members.filter((m) => m.playerId !== playerId);

    set({
      faction: {
        ...faction,
        members,
        memberCount: members.length,
      },
    });
  },

  addMember: (member) => {
    const faction = get().faction;
    if (!faction) return;

    set({
      faction: {
        ...faction,
        members: [...faction.members, member],
        memberCount: faction.members.length + 1,
      },
    });
  },

  removeMember: (playerId) => {
    const faction = get().faction;
    if (!faction) return;

    const members = faction.members.filter((m) => m.playerId !== playerId);

    set({
      faction: {
        ...faction,
        members,
        memberCount: members.length,
      },
    });
  },

  addContribution: (playerId, value) => {
    const faction = get().faction;
    if (!faction) return;

    const members = faction.members.map((m) => {
      if (m.playerId === playerId) {
        return { ...m, contribution: m.contribution + value };
      }
      return m;
    });

    set({
      faction: {
        ...faction,
        members,
        eventPoints: faction.eventPoints + value,
      },
    });
  },

  clearFaction: () => set({ faction: null }),
}));