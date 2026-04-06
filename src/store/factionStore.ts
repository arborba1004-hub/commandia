import { create } from 'zustand';

type FactionMember = {
  playerId: string;
  name: string;
  power: number;
  role: 'leader' | 'captain' | 'member';
};

type Faction = {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  members: FactionMember[];
};

type FactionStore = {
  faction: Faction | null;

  createFaction: (name: string, tag: string, leader: FactionMember) => void;

  joinFaction: (faction: Faction, member: FactionMember) => void;

  leaveFaction: (playerId: string) => void;

  isSameFaction: (playerId: string) => boolean;
};

export const useFactionStore = create<FactionStore>((set, get) => ({
  faction: null,

  createFaction: (name, tag, leader) => {
    const newFaction: Faction = {
      id: crypto.randomUUID(),
      name,
      tag,
      leaderId: leader.playerId,
      members: [leader],
    };

    set({ faction: newFaction });
  },

  joinFaction: (faction, member) => {
    const exists = faction.members.some(m => m.playerId === member.playerId);
    if (exists) return;

    set({
      faction: {
        ...faction,
        members: [...faction.members, member],
      },
    });
  },

  leaveFaction: (playerId) => {
    const faction = get().faction;
    if (!faction) return;

    set({
      faction: {
        ...faction,
        members: faction.members.filter(m => m.playerId !== playerId),
      },
    });
  },

  isSameFaction: (playerId) => {
    const faction = get().faction;
    if (!faction) return false;

    return faction.members.some(m => m.playerId === playerId);
  },
}));