// src/services/punishmentService.ts

export type PunishmentType =
  | 'fiscal'
  | 'arsenal'
  | 'militia'
  | 'blitz'
  | 'threat';

export interface ActivePunishment {
  type: PunishmentType;
  expiresAt: string;
}

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function now() {
  return new Date();
}

const ALL_PUNISHMENTS: PunishmentType[] = [
  'fiscal',
  'arsenal',
  'militia',
  'blitz',
  'threat',
];

export function getRandomPunishment(): PunishmentType {
  return ALL_PUNISHMENTS[Math.floor(Math.random() * ALL_PUNISHMENTS.length)];
}

export function isPunishmentActive(player: any, type: PunishmentType): boolean {
  const list = player?.punishments?.active || [];
  return list.some(
    (p: ActivePunishment) =>
      p.type === type && new Date(p.expiresAt).getTime() > now().getTime()
  );
}

export function isDelacaoActive(player: any): boolean {
  const delacao = player?.punishments?.delacao;
  if (!delacao?.active || !delacao?.expiresAt) return false;
  return new Date(delacao.expiresAt).getTime() > now().getTime();
}

export function isMoneyLaunderingBlocked(player: any): boolean {
  return isPunishmentActive(player, 'fiscal') || !!player?.punishments?.dirtyMoneyBlocked || isDelacaoActive(player);
}

export function isArsenalBonusBlocked(player: any): boolean {
  return isPunishmentActive(player, 'arsenal') || isDelacaoActive(player);
}

export function isLuxuryBonusBlocked(player: any): boolean {
  return isPunishmentActive(player, 'militia') || isDelacaoActive(player);
}

export function isSlotBlocked(player: any): boolean {
  return isPunishmentActive(player, 'threat') || isDelacaoActive(player);
}

export function isPvpProtected(player: any): boolean {
  const until = player?.punishments?.pvpProtectionUntil;
  if (!until) return false;
  return new Date(until).getTime() > now().getTime();
}

export function isDirtyMoneyBlocked(player: any): boolean {
  return !!player?.punishments?.dirtyMoneyBlocked || isDelacaoActive(player);
}

export function isCleanMoneyBlocked(player: any): boolean {
  return !!player?.punishments?.cleanMoneyBlocked || isDelacaoActive(player);
}

export function isInventoryBlocked(player: any): boolean {
  return !!player?.punishments?.inventoryBlocked || isDelacaoActive(player);
}

export function isLevelProgressionBlocked(player: any): boolean {
  return !!player?.punishments?.levelProgressionBlocked || isDelacaoActive(player);
}

export function getInventoryBonusReductionPercent(player: any): number {
  if (!isDelacaoActive(player)) return 0;
  return player?.punishments?.inventoryBonusReductionPercent || 0;
}

export function applyPunishment(player: any, type: PunishmentType) {
  const expiresAt = addHours(24);
  const current = player?.punishments?.active || [];

  const updated = {
    ...player,
    punishments: {
      ...player.punishments,
      active: [
        ...current,
        {
          type,
          expiresAt,
        },
      ],
    },
  };

  // Blitz é instantânea: perde o último veículo já na aplicação
  if (type === 'blitz') {
    const fugaVehicles = [...(updated?.fugaVehicles || [])];
    if (fugaVehicles.length > 0) {
      fugaVehicles.pop();

      return {
        ...updated,
        fugaVehicles,
        punishments: {
          ...updated.punishments,
          lastVehicleLost: true,
        },
      };
    }
  }

  return updated;
}

export function applyDelacaoPremiada(player: any) {
  const expiresAt = addHours(72);

  return {
    ...player,
    punishments: {
      ...player.punishments,
      delacao: {
        active: true,
        expiresAt,
      },
      inventoryBlocked: true,
      dirtyMoneyBlocked: true,
      cleanMoneyBlocked: true,
      levelProgressionBlocked: true,
      inventoryBonusReductionPercent: 100,
      pvpProtectionUntil: expiresAt,
      delacaoRewardPending: true,
      delacaoRewardUnlockAt: expiresAt,
      pendingSkillBoost: 100,
    },
  };
}

export function clearExpiredPunishments(player: any) {
  const updated = {
    ...player,
    punishments: {
      ...(player?.punishments || {}),
    },
  };

  const activeList = updated?.punishments?.active || [];
  updated.punishments.active = activeList.filter(
    (p: ActivePunishment) => new Date(p.expiresAt).getTime() > now().getTime()
  );

  const delacao = updated?.punishments?.delacao;

  if (delacao?.active && delacao?.expiresAt) {
    const expired = new Date(delacao.expiresAt).getTime() <= now().getTime();

    if (expired) {
      const skills = { ...(updated.skills || {}) };

      Object.keys(skills).forEach((key) => {
        skills[key] = (skills[key] || 0) + (updated?.punishments?.pendingSkillBoost || 0);
      });

      updated.skills = skills;

      updated.punishments.delacao = {
        active: false,
        expiresAt: null,
      };

      updated.punishments.inventoryBlocked = false;
      updated.punishments.dirtyMoneyBlocked = false;
      updated.punishments.cleanMoneyBlocked = false;
      updated.punishments.levelProgressionBlocked = false;
      updated.punishments.inventoryBonusReductionPercent = 0;
      updated.punishments.pvpProtectionUntil = null;
      updated.punishments.delacaoRewardPending = false;
      updated.punishments.delacaoRewardUnlockAt = null;
      updated.punishments.pendingSkillBoost = 0;
    }
  }

  return updated;
}