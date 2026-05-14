import {
  GangMember,
  GangMemberType,
} from '@/types/gang';

export function getActiveMembers(
  members: GangMember[]
) {
  return members.filter(
    member =>
      member.status === 'ativo'
  );
}

export function getMembersByType(
  members: GangMember[],
  type: GangMemberType
) {
  return getActiveMembers(
    members
  ).filter(
    member => member.type === type
  );
}

export function countMembersByType(
  members: GangMember[],
  type: GangMemberType
) {
  return getMembersByType(
    members,
    type
  ).length;
}

export function countTotalMembers(
  members: GangMember[]
) {
  return getActiveMembers(
    members
  ).length;
}

const POWER_MAP = {
  capanga: 14,
  frente: 18,
  executor: 22,
  assassino: 20,
  muralha: 16,
  certeiro: 18,
  motorista: 12,
  nitro: 16,
};

export function calculateGangPower(
  members: GangMember[]
) {
  return getActiveMembers(
    members
  ).reduce((total, member) => {
    return (
      total +
      (POWER_MAP[
        member.type
      ] || 0)
    );
  }, 0);
}
