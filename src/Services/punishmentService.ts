// src/services/punishmentService.ts

// ================= TYPES =================

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

              // ================= HELPERS =================

              function addHours(hours: number) {
                return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
                }

                function now() {
                  return new Date();
                  }

                  // ================= PUNIÇÕES =================

                  export const PUNISHMENT_EFFECTS = {
                    fiscal: {
                        name: 'Operação Fiscal',
                            blocks: ['moneyLaundering'],
                              },
                                arsenal: {
                                    name: 'Invasão no Arsenal',
                                        blocks: ['arsenalBonus'],
                                          },
                                            militia: {
                                                name: 'Confisco de Luxo',
                                                    blocks: ['luxuryBonus'],
                                                      },
                                                        blitz: {
                                                            name: 'Reboque de Veículo',
                                                                blocks: ['lastVehicleLost'],
                                                                  },
                                                                    threat: {
                                                                        name: 'Ameaça de Morte',
                                                                            blocks: ['slotBlocked'],
                                                                              },
                                                                              };

                                                                              // ================= CORE =================

                                                                              const ALL_PUNISHMENTS: PunishmentType[] = [
                                                                                'fiscal',
                                                                                  'arsenal',
                                                                                    'militia',
                                                                                      'blitz',
                                                                                        'threat',
                                                                                        ];

                                                                                        // pega punição aleatória
                                                                                        export function getRandomPunishment(): PunishmentType {
                                                                                          return ALL_PUNISHMENTS[Math.floor(Math.random() * ALL_PUNISHMENTS.length)];
                                                                                          }

                                                                                          // aplica punição (24h)
                                                                                          export function applyPunishment(player: any, type: PunishmentType) {
                                                                                            const expiresAt = addHours(24);

                                                                                              const current = player?.punishments?.active || [];

                                                                                                const newPunishment: ActivePunishment = {
                                                                                                    type,
                                                                                                        expiresAt,
                                                                                                          };

                                                                                                            return {
                                                                                                                ...player,
                                                                                                                    punishments: {
                                                                                                                          ...player.punishments,
                                                                                                                                active: [...current, newPunishment],
                                                                                                                                    },
                                                                                                                                      };
                                                                                                                                      }

                                                                                                                                      // verifica se punição está ativa
                                                                                                                                      export function isPunishmentActive(player: any, type: PunishmentType): boolean {
                                                                                                                                        const list = player?.punishments?.active || [];

                                                                                                                                          return list.some((p: ActivePunishment) => {
                                                                                                                                              return p.type === type && new Date(p.expiresAt) > now();
                                                                                                                                                });
                                                                                                                                                }

                                                                                                                                                // ================= DELAÇÃO PREMIADA =================

                                                                                                                                                // aplica delação (72h)
                                                                                                                                                export function applyDelacaoPremiada(player: any) {
                                                                                                                                                  const expiresAt = addHours(72);

                                                                                                                                                    return {
                                                                                                                                                        ...player,
                                                                                                                                                            punishments: {
                                                                                                                                                                  ...player.punishments,

                                                                                                                                                                        // bloqueios globais
                                                                                                                                                                              delacao: {
                                                                                                                                                                                      active: true,
                                                                                                                                                                                              expiresAt,
                                                                                                                                                                                                    },

                                                                                                                                                                                                          // flags de bloqueio (tudo temporário)
                                                                                                                                                                                                                inventoryBlocked: true,
                                                                                                                                                                                                                      dirtyMoneyBlocked: true,
                                                                                                                                                                                                                            cleanMoneyBlocked: true,
                                                                                                                                                                                                                                  levelProgressionBlocked: true,
                                                                                                                                                                                                                                        inventoryBonusReductionPercent: 100,
                                                                                                                                                                                                                                              pvpProtectionUntil: expiresAt,

                                                                                                                                                                                                                                                    // recompensa futura
                                                                                                                                                                                                                                                          delacaoRewardPending: true,
                                                                                                                                                                                                                                                                delacaoRewardUnlockAt: expiresAt,
                                                                                                                                                                                                                                                                      pendingSkillBoost: 100,
                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                            };
                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                            // verifica se delação está ativa
                                                                                                                                                                                                                                                                            export function isDelacaoActive(player: any): boolean {
                                                                                                                                                                                                                                                                              const d = player?.punishments?.delacao;

                                                                                                                                                                                                                                                                                if (!d) return false;

                                                                                                                                                                                                                                                                                  return new Date(d.expiresAt) > now();
                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                  // ================= LIMPEZA AUTOMÁTICA =================

                                                                                                                                                                                                                                                                                  export function clearExpiredPunishments(player: any) {
                                                                                                                                                                                                                                                                                    let updated = { ...player };

                                                                                                                                                                                                                                                                                      const list = player?.punishments?.active || [];

                                                                                                                                                                                                                                                                                        // limpa punições normais
                                                                                                                                                                                                                                                                                          const filtered = list.filter(
                                                                                                                                                                                                                                                                                              (p: ActivePunishment) => new Date(p.expiresAt) > now()
                                                                                                                                                                                                                                                                                                );

                                                                                                                                                                                                                                                                                                  updated.punishments = {
                                                                                                                                                                                                                                                                                                      ...updated.punishments,
                                                                                                                                                                                                                                                                                                          active: filtered,
                                                                                                                                                                                                                                                                                                            };

                                                                                                                                                                                                                                                                                                              // ================= DELAÇÃO =================
                                                                                                                                                                                                                                                                                                                const delacao = updated?.punishments?.delacao;

                                                                                                                                                                                                                                                                                                                  if (delacao && new Date(delacao.expiresAt) <= now()) {
                                                                                                                                                                                                                                                                                                                      // remove bloqueios
                                                                                                                                                                                                                                                                                                                          updated.punishments.delacao.active = false;

                                                                                                                                                                                                                                                                                                                              updated.punishments.inventoryBlocked = false;
                                                                                                                                                                                                                                                                                                                                  updated.punishments.dirtyMoneyBlocked = false;
                                                                                                                                                                                                                                                                                                                                      updated.punishments.cleanMoneyBlocked = false;
                                                                                                                                                                                                                                                                                                                                          updated.punishments.levelProgressionBlocked = false;
                                                                                                                                                                                                                                                                                                                                              updated.punishments.inventoryBonusReductionPercent = 0;

                                                                                                                                                                                                                                                                                                                                                  // aplica bônus de 100% nas skills
                                                                                                                                                                                                                                                                                                                                                      if (updated.punishments.delacaoRewardPending) {
                                                                                                                                                                                                                                                                                                                                                            const skills = { ...(updated.skills || {}) };

                                                                                                                                                                                                                                                                                                                                                                  Object.keys(skills).forEach((key) => {
                                                                                                                                                                                                                                                                                                                                                                          skills[key] = (skills[key] || 0) + 100;
                                                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                                                      updated.skills = skills;

                                                                                                                                                                                                                                                                                                                                                                                            updated.punishments.delacaoRewardPending = false;
                                                                                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                                                    return updated;
                                                                                                                                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                                                                                                                                    // ================= HELPERS DE BLOQUEIO =================

                                                                                                                                                                                                                                                                                                                                                                                                    export function isMoneyLaunderingBlocked(player: any) {
                                                                                                                                                                                                                                                                                                                                                                                                      return isPunishmentActive(player, 'fiscal') || isDelacaoActive(player);
                                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                                      export function isArsenalBlocked(player: any) {
                                                                                                                                                                                                                                                                                                                                                                                                        return isPunishmentActive(player, 'arsenal') || isDelacaoActive(player);
                                                                                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                                                                                        export function isLuxuryBlocked(player: any) {
                                                                                                                                                                                                                                                                                                                                                                                                          return isPunishmentActive(player, 'militia') || isDelacaoActive(player);
                                                                                                                                                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                                                                                                                                                          export function isVehicleLost(player: any) {
                                                                                                                                                                                                                                                                                                                                                                                                            return isPunishmentActive(player, 'blitz');
                                                                                                                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                                                                                                                            export function isSlotBlocked(player: any) {
                                                                                                                                                                                                                                                                                                                                                                                                              return isPunishmentActive(player, 'threat') || isDelacaoActive(player);
                                                                                                                                                                                                                                                                                                                                                                                                              }
