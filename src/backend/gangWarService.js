// backend/gangWarService.js
// Service para gerenciar operações de gangue e guerra

import GangWar from '../models/GangWar.js';
import { getCTStateFromLevel } from '../services/gangWarDefinitions.js';

/**
 * Reconcilia o estado da gangue, atualizando:
 * - Trabalhos de treinamento completados
 * - Status de membros feridos/treinando
 */
async function reconcileGangState(doc) {
  if (!doc) return false;

  const now = Date.now();
  let changed = false;

  // Processa trabalhos de treinamento completados
  for (const job of doc.trainingJobs) {
    if (!job.completed && new Date(job.endsAt).getTime() <= now) {
      job.completed = true;

      const member = doc.members.find((m) => m.id === job.memberId);
      if (member) {
        member.level = job.toLevel;
        member.status = 'ativo';
        member.trainingEndsAt = null;
      }

      changed = true;
    }
  }

  // Processa membros feridos que se recuperaram
  for (const member of doc.members) {
    if (
      member.status === 'ferido' &&
      member.injuryEndsAt &&
      new Date(member.injuryEndsAt).getTime() <= now
    ) {
      member.status = 'ativo';
      member.injuryEndsAt = null;
      changed = true;
    }

    // Limpa status de treinamento se o tempo expirou
    if (
      member.status === 'treinando' &&
      member.trainingEndsAt &&
      new Date(member.trainingEndsAt).getTime() <= now
    ) {
      member.trainingEndsAt = null;
      changed = true;
    }
  }

  if (changed) {
    await doc.save();
  }

  return changed;
}

/**
 * Obtém ou cria um documento de gangue para um jogador
 */
export async function getOrCreateGangWar(playerId) {
  let doc = await GangWar.findOne({ playerId });

  if (!doc) {
    doc = await GangWar.create({
      playerId,
      ct: getCTStateFromLevel(1),
      formation: 'pressao_total',
      members: [],
      trainingJobs: [],
      lastMaintenanceDate: null,
    });
  }

  // Reconcilia o estado antes de devolver
  await reconcileGangState(doc);
  return doc;
}

/**
 * Constrói stats de composição de batalha da gangue
 */
export function buildGangBattleCompositionStats(members) {
  const activeMembers = members.filter((m) => m.status === 'ativo');
  const feridos = members.filter((m) => m.status === 'ferido').length;
  const mortos = members.filter((m) => m.status === 'morto').length;

  let rajada = 0;
  let blindagem = 0;
  let folego = 0;
  let quebra = 0;

  for (const member of activeMembers) {
    rajada += member.stats?.rajada || 0;
    blindagem += member.stats?.blindagem || 0;
    folego += member.stats?.folego || 0;
    quebra += member.stats?.quebra || 0;
  }

  return {
    totalMembers: members.length,
    ativos: activeMembers.length,
    feridos,
    mortos,
    rajada,
    blindagem,
    folego,
    quebra,
    totalPower: rajada * 1.15 + blindagem * 1.05 + folego * 0.95 + quebra * 1.2,
  };
}

/**
 * Resolve casualidades de uma batalha de gangue
 */
export function resolveGangCasualties(params) {
  const { members, ownStats, enemyStats, ctLevel, side } = params;

  const ativos = members.filter((m) => m.status === 'ativo');
  const mortos = {};
  const feridos = {};

  if (!ativos.length) {
    return { mortos, feridos, preservadosPeloMedico: 0 };
  }

  const enemyPressure = enemyStats.rajada * 1.05 + enemyStats.quebra * 1.1;
  const ownProtection = ownStats.blindagem * 0.9 + ownStats.folego * 0.85;

  const rawLossRate = Math.max(
    0.04,
    Math.min(
      0.65,
      (enemyPressure - ownProtection * 0.55) / Math.max(ownStats.totalPower, 1)
    )
  );

  const sideModifier = side === 'attacker' ? 1.08 : 0.94;
  const casualtyCount = Math.min(
    ativos.length,
    Math.max(1, Math.round(ativos.length * rawLossRate * sideModifier))
  );

  let preservadosPeloMedico = 0;

  for (let i = 0; i < casualtyCount; i += 1) {
    const target = ativos[i % ativos.length];
    const saved = Math.random() < 0.25;

    if (saved) {
      feridos[target.type] = (feridos[target.type] || 0) + 1;
      preservadosPeloMedico += 1;
    } else {
      const deathChance = 0.52;
      if (Math.random() < deathChance) {
        mortos[target.type] = (mortos[target.type] || 0) + 1;
      } else {
        feridos[target.type] = (feridos[target.type] || 0) + 1;
      }
    }
  }

  return {
    mortos,
    feridos,
    preservadosPeloMedico,
  };
}

/**
 * Calcula o custo diário de manutenção da gangue
 */
export function getGangDailyUpkeep(members) {
  return members.length * 500; // 500 por membro
}

/**
 * Serializa o estado da gangue para resposta da API
 */
export async function serializeGang(doc, player) {
  const maxMembers = Math.min(10, 3 + Math.floor((doc.ct?.level || 1) / 2));

  return {
    gang: {
      members: doc.members,
      ct: doc.ct,
      trainingJobs: doc.trainingJobs,
      formation: doc.formation || 'pressao_total',
      maxMembers,
      dailyUpkeep: getGangDailyUpkeep(doc.members),
    },
    playerBalances: {
      dirtyMoney: Number(player?.balances?.dirtyMoney || 0),
      cleanMoney: Number(player?.balances?.cleanMoney || 0),
      corre: Number(player?.balances?.corre || 0),
    },
  };
}

/**
 * Formações válidas da gangue
 */
const VALID_FORMATIONS = [
  'pressao_total',
  'linha_fechada',
  'bote_certo',
  'cerco',
  'saque_rapido',
];

/**
 * Handler para alterar a formação da gangue
 */
export async function handleSetFormation(player, formation) {
  if (!player) {
    throw new Error('Jogador não autenticado');
  }

  if (!VALID_FORMATIONS.includes(formation)) {
    throw new Error('Formação inválida');
  }

  const doc = await getOrCreateGangWar(player._id);
  doc.formation = formation;
  await doc.save();

  return serializeGang(doc, player);
}
