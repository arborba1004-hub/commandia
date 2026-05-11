import type { GangMemberType } from '@/components/gang/GangMembros';

export type GangAtributos = {
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;
};

export type GangAtributosPorNivel = {
  1: GangAtributos;
  2: GangAtributos;
  3: GangAtributos;
  4: GangAtributos;
  5: GangAtributos;
  6: GangAtributos;
  7: GangAtributos;
  8: GangAtributos;
  9: GangAtributos;
  10: GangAtributos;
  comando: GangAtributos;
};

export const ATRIBUTOS_GANG: Record<GangMemberType, GangAtributosPorNivel> = {
  capanga: {
    1: { rajada: 9, blindagem: 13, folego: 12, quebra: 8 },
    2: { rajada: 10, blindagem: 15, folego: 14, quebra: 9 },
    3: { rajada: 11, blindagem: 17, folego: 16, quebra: 10 },
    4: { rajada: 13, blindagem: 19, folego: 18, quebra: 11 },
    5: { rajada: 15, blindagem: 21, folego: 20, quebra: 12 },
    6: { rajada: 17, blindagem: 23, folego: 22, quebra: 13 },
    7: { rajada: 19, blindagem: 25, folego: 24, quebra: 14 },
    8: { rajada: 21, blindagem: 27, folego: 26, quebra: 15 },
    9: { rajada: 23, blindagem: 29, folego: 28, quebra: 16 },
    10: { rajada: 25, blindagem: 31, folego: 30, quebra: 17 },
    comando: { rajada: 30, blindagem: 36, folego: 35, quebra: 22 },
  },

  frente: {
    1: { rajada: 12, blindagem: 9, folego: 10, quebra: 12 },
    2: { rajada: 14, blindagem: 10, folego: 11, quebra: 14 },
    3: { rajada: 16, blindagem: 11, folego: 12, quebra: 16 },
    4: { rajada: 18, blindagem: 12, folego: 13, quebra: 18 },
    5: { rajada: 20, blindagem: 14, folego: 15, quebra: 21 },
    6: { rajada: 22, blindagem: 15, folego: 16, quebra: 23 },
    7: { rajada: 25, blindagem: 17, folego: 18, quebra: 26 },
    8: { rajada: 27, blindagem: 18, folego: 19, quebra: 28 },
    9: { rajada: 30, blindagem: 20, folego: 21, quebra: 31 },
    10: { rajada: 32, blindagem: 22, folego: 23, quebra: 34 },
    comando: { rajada: 38, blindagem: 27, folego: 28, quebra: 40 },
  },

  executor: {
    1: { rajada: 11, blindagem: 7, folego: 9, quebra: 12 },
    2: { rajada: 13, blindagem: 8, folego: 10, quebra: 14 },
    3: { rajada: 15, blindagem: 9, folego: 11, quebra: 16 },
    4: { rajada: 17, blindagem: 10, folego: 12, quebra: 18 },
    5: { rajada: 19, blindagem: 11, folego: 13, quebra: 21 },
    6: { rajada: 21, blindagem: 12, folego: 14, quebra: 23 },
    7: { rajada: 24, blindagem: 13, folego: 15, quebra: 26 },
    8: { rajada: 26, blindagem: 14, folego: 16, quebra: 29 },
    9: { rajada: 29, blindagem: 15, folego: 17, quebra: 32 },
    10: { rajada: 31, blindagem: 16, folego: 18, quebra: 35 },
    comando: { rajada: 37, blindagem: 20, folego: 22, quebra: 41 },
  },

  assassino: {
    1: { rajada: 12, blindagem: 7, folego: 8, quebra: 13 },
    2: { rajada: 14, blindagem: 8, folego: 9, quebra: 15 },
    3: { rajada: 16, blindagem: 9, folego: 10, quebra: 17 },
    4: { rajada: 18, blindagem: 10, folego: 11, quebra: 20 },
    5: { rajada: 20, blindagem: 11, folego: 12, quebra: 23 },
    6: { rajada: 22, blindagem: 12, folego: 13, quebra: 26 },
    7: { rajada: 25, blindagem: 13, folego: 14, quebra: 29 },
    8: { rajada: 27, blindagem: 14, folego: 15, quebra: 32 },
    9: { rajada: 30, blindagem: 15, folego: 16, quebra: 35 },
    10: { rajada: 33, blindagem: 16, folego: 17, quebra: 38 },
    comando: { rajada: 39, blindagem: 20, folego: 21, quebra: 44 },
  },

  muralha: {
    1: { rajada: 6, blindagem: 15, folego: 16, quebra: 5 },
    2: { rajada: 7, blindagem: 17, folego: 18, quebra: 6 },
    3: { rajada: 8, blindagem: 19, folego: 20, quebra: 7 },
    4: { rajada: 9, blindagem: 21, folego: 22, quebra: 8 },
    5: { rajada: 10, blindagem: 24, folego: 25, quebra: 9 },
    6: { rajada: 11, blindagem: 26, folego: 27, quebra: 10 },
    7: { rajada: 12, blindagem: 29, folego: 30, quebra: 11 },
    8: { rajada: 13, blindagem: 31, folego: 32, quebra: 12 },
    9: { rajada: 14, blindagem: 34, folego: 35, quebra: 13 },
    10: { rajada: 15, blindagem: 37, folego: 38, quebra: 14 },
    comando: { rajada: 19, blindagem: 43, folego: 44, quebra: 18 },
  },

  certeiro: {
    1: { rajada: 9, blindagem: 10, folego: 10, quebra: 8 },
    2: { rajada: 10, blindagem: 11, folego: 11, quebra: 9 },
    3: { rajada: 11, blindagem: 12, folego: 12, quebra: 10 },
    4: { rajada: 12, blindagem: 13, folego: 13, quebra: 11 },
    5: { rajada: 13, blindagem: 15, folego: 14, quebra: 12 },
    6: { rajada: 14, blindagem: 16, folego: 15, quebra: 13 },
    7: { rajada: 16, blindagem: 18, folego: 17, quebra: 15 },
    8: { rajada: 17, blindagem: 19, folego: 18, quebra: 16 },
    9: { rajada: 19, blindagem: 21, folego: 20, quebra: 18 },
    10: { rajada: 21, blindagem: 23, folego: 22, quebra: 20 },
    comando: { rajada: 25, blindagem: 28, folego: 27, quebra: 24 },
  },

  motorista: {
    1: { rajada: 7, blindagem: 14, folego: 14, quebra: 7 },
    2: { rajada: 8, blindagem: 16, folego: 16, quebra: 8 },
    3: { rajada: 9, blindagem: 18, folego: 18, quebra: 9 },
    4: { rajada: 10, blindagem: 20, folego: 20, quebra: 10 },
    5: { rajada: 11, blindagem: 23, folego: 23, quebra: 11 },
    6: { rajada: 12, blindagem: 25, folego: 25, quebra: 12 },
    7: { rajada: 13, blindagem: 28, folego: 28, quebra: 13 },
    8: { rajada: 14, blindagem: 30, folego: 30, quebra: 14 },
    9: { rajada: 15, blindagem: 33, folego: 33, quebra: 15 },
    10: { rajada: 17, blindagem: 36, folego: 36, quebra: 17 },
    comando: { rajada: 21, blindagem: 41, folego: 41, quebra: 21 },
  },

  nitro: {
    1: { rajada: 8, blindagem: 13, folego: 15, quebra: 8 },
    2: { rajada: 9, blindagem: 15, folego: 17, quebra: 9 },
    3: { rajada: 10, blindagem: 17, folego: 19, quebra: 10 },
    4: { rajada: 11, blindagem: 19, folego: 21, quebra: 11 },
    5: { rajada: 12, blindagem: 21, folego: 24, quebra: 12 },
    6: { rajada: 13, blindagem: 23, folego: 26, quebra: 13 },
    7: { rajada: 15, blindagem: 26, folego: 29, quebra: 15 },
    8: { rajada: 17, blindagem: 28, folego: 32, quebra: 17 },
    9: { rajada: 19, blindagem: 31, folego: 35, quebra: 19 },
    10: { rajada: 21, blindagem: 34, folego: 38, quebra: 21 },
    comando: { rajada: 25, blindagem: 39, folego: 44, quebra: 25 },
  },
};

export function getGangAtributos(
  memberType: GangMemberType,
  nivel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
) {
  return ATRIBUTOS_GANG[memberType][nivel];
}

export function getGangAtributosComando(memberType: GangMemberType) {
  return ATRIBUTOS_GANG[memberType].comando;
}

export default ATRIBUTOS_GANG;