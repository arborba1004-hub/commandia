import { create } from 'zustand';
import { Gang, GangMember } from '@/types/gang';
import * as gangApi from '@/api/gangApi';

interface GangStore {
  myGang: Gang | null;
  isLoading: boolean;
  error: string | null;

  fetchMyGang: () => Promise<void>;
  recruitMember: (method: string) => Promise<GangMember | null>;
  trainMember: (memberId: string, usePremium?: boolean) => Promise<void>;
  equipMember: (memberId: string, equipmentType: 'weapon' | 'armor' | 'vehicle', itemId: string) => Promise<void>;
  toggleActive: (memberId: string) => Promise<void>;
  dismissMember: (memberId: string) => Promise<void>;
  donateToTreasury: (type: 'dirtyMoney' | 'cleanMoney' | 'corre', amount: number) => Promise<void>;
  upgradeGangSkill: (skillId: string) => Promise<void>;
}

export const useGangStore = create<GangStore>((set, get) => ({
  myGang: null,
  isLoading: false,
  error: null,

  fetchMyGang: async () => {
    set({ isLoading: true, error: null });
    try {
      const gang = await gangApi.fetchMyGang();
      set({ myGang: gang, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  recruitMember: async (method) => {
    set({ isLoading: true });
    try {
      const newMember = await gangApi.recruitMember(method);
      const current = get().myGang;
      if (current) {
        set({
          myGang: { ...current, members: [...current.members, newMember] },
          isLoading: false,
        });
      }
      return newMember;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  trainMember: async (memberId, usePremium = false) => {
    set({ isLoading: true });
    try {
      const updatedMember = await gangApi.trainMember(memberId, usePremium);
      const current = get().myGang;
      if (current) {
        const newMembers = current.members.map(m =>
          m.id === memberId ? updatedMember : m
        );
        set({ myGang: { ...current, members: newMembers }, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  equipMember: async (memberId, equipmentType, itemId) => {
    set({ isLoading: true });
    try {
      const updatedMember = await gangApi.equipMember(memberId, equipmentType, itemId);
      const current = get().myGang;
      if (current) {
        const newMembers = current.members.map(m =>
          m.id === memberId ? updatedMember : m
        );
        set({ myGang: { ...current, members: newMembers }, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  toggleActive: async (memberId) => {
    const current = get().myGang;
    if (!current) return;
    const member = current.members.find(m => m.id === memberId);
    if (!member) return;
    const newActive = !member.active;
    set({ isLoading: true });
    try {
      await gangApi.toggleActiveMember(memberId, newActive);
      const updatedMembers = current.members.map(m =>
        m.id === memberId ? { ...m, active: newActive } : m
      );
      const newActiveIds = newActive
        ? [...current.activeMemberIds, memberId]
        : current.activeMemberIds.filter(id => id !== memberId);
      set({
        myGang: { ...current, members: updatedMembers, activeMemberIds: newActiveIds },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  dismissMember: async (memberId) => {
    if (!confirm('Deseja demitir este membro? Ele será removido permanentemente.')) return;
    set({ isLoading: true });
    try {
      await gangApi.dismissMember(memberId);
      const current = get().myGang;
      if (current) {
        const newMembers = current.members.filter(m => m.id !== memberId);
        const newActiveIds = current.activeMemberIds.filter(id => id !== memberId);
        set({
          myGang: { ...current, members: newMembers, activeMemberIds: newActiveIds },
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  donateToTreasury: async (type, amount) => {
    set({ isLoading: true });
    try {
      const updatedTreasury = await gangApi.donateToTreasury(type, amount);
      const current = get().myGang;
      if (current) {
        set({
          myGang: { ...current, treasury: updatedTreasury },
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  upgradeGangSkill: async (skillId) => {
    set({ isLoading: true });
    try {
      const updatedSkills = await gangApi.upgradeGangSkill(skillId);
      const current = get().myGang;
      if (current) {
        set({
          myGang: { ...current, skills: updatedSkills },
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
