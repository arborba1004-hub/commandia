// backend/attackController.js
// Controller para gerenciar ataques e batalhas

import Attack from '../models/Attack.js';
import Player from '../models/Player.js';
import Faction from '../models/Faction.js';
import GangWar from '../models/GangWar.js';
import {
  bumpVersion,
  calculateLoot,
  calculatePlayerPower,
  calculateWinChance,
  generateId,
} from '../utils/gameHelpers.js';
import {
  buildGangBattleCompositionStats as buildOfficialGangBattleCompositionStats,
  resolveGangCasualties as resolveOfficialGangCasualties,
} from '../services/gangWarService.js';

/**
 * Normaliza membros da gangue para o formato esperado
 */
function normalizeGangMembers(members = []) {
  if (!Array.isArray(members)) return [];
  return members.map(m => ({
    id: m.id || m._id,
    level: typeof m.level === 'number' ? m.level : 1,
    health: typeof m.health === 'number' ? m.health : 100,
    maxHealth: typeof m.maxHealth === 'number' ? m.maxHealth : 100,
    power: typeof m.power === 'number' ? m.power : 10,
    active: m.active !== false,
    ...m,
  }));
}

/**
 * Retorna stats vazios da gangue
 */
function emptyGangStats() {
  return {
    totalMembers: 0,
    averageLevel: 0,
    totalPower: 0,
    morale: 0,
  };
}

/**
 * Converte valor para número seguro
 */
function safeNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Carrega o contexto de combate da gangue oficial do jogador
 */
async function getGangCombatContext(playerId) {
  try {
    if (!playerId) {
      return { members: [], stats: emptyGangStats(), ctLevel: 1, doc: null };
    }

    const gangDoc = await GangWar.findOne({ playerId: String(playerId) });
    if (!gangDoc) {
      return { members: [], stats: emptyGangStats(), ctLevel: 1, doc: null };
    }

    const members = normalizeGangMembers(gangDoc.members || []);
    const stats = buildOfficialGangBattleCompositionStats(members);
    const ctLevel = Math.max(1, safeNumber(gangDoc?.ct?.level, 1));

    return { 
      members,
      stats,
      ctLevel,
      doc: gangDoc,
    };
  } catch (error) {
    console.error('Erro ao carregar contexto da gangue no ataque:', error);
    return { members: [], stats: emptyGangStats(), ctLevel: 1, doc: null };
  }
}

/**
 * Carrega o contexto de combate da facção do jogador
 */
async function getFactionCombatContext(player) {
  try {
    if (!player || !player.factionId) {
      return { members: [], stats: { totalMembers: 0, totalPower: 0 }, level: 1 };
    }

    const faction = await Faction.findById(player.factionId);
    if (!faction) {
      return { members: [], stats: { totalMembers: 0, totalPower: 0 }, level: 1 };
    }

    return {
      members: faction.members || [],
      stats: {
        totalMembers: (faction.members || []).length,
        totalPower: safeNumber(faction.power, 0),
      },
      level: safeNumber(faction.level, 1),
    };
  } catch (error) {
    console.error('Erro ao carregar contexto da facção:', error);
    return { members: [], stats: { totalMembers: 0, totalPower: 0 }, level: 1 };
  }
}

/**
 * Inicia uma batalha entre dois jogadores
 */
export async function startBattle(req, res) {
  try {
    const attacker = req.player;
    const {
      targetId,
      targetName,
      targetTileX,
      targetTileY,
      originTileX,
      originTileY,
    } = req.body || {};

    // Validações básicas
    if (!attacker || !targetId) {
      return res.status(400).json({ error: 'Atacante ou alvo inválido' });
    }

    // Busca o defensor
    const defender = await Player.findById(targetId);
    if (!defender) {
      return res.status(404).json({ error: 'Defensor não encontrado' });
    }

    // Carrega contextos de combate
    const attackerFaction = await getFactionCombatContext(attacker);
    const defenderFaction = await getFactionCombatContext(defender);

    // Carrega contextos de gangue OFICIAIS
    const attackerGangContext = await getGangCombatContext(attacker._id);
    const defenderGangContext = await getGangCombatContext(defender._id);

    const normalizedAttackerGangMembers = attackerGangContext.members;
    const normalizedAttackerGangStats = attackerGangContext.stats;
    const attackerCTLevel = attackerGangContext.ctLevel;

    // Calcula poder do atacante
    const attackerPower = calculatePlayerPower(attacker, {
      gangStats: normalizedAttackerGangStats,
      factionStats: attackerFaction.stats,
    });

    // Calcula poder do defensor
    const defenderPower = calculatePlayerPower(defender, {
      gangStats: defenderGangContext.stats,
      factionStats: defenderFaction.stats,
    });

    // Calcula chance de vitória
    const winChance = calculateWinChance(attackerPower, defenderPower);

    // Calcula saque estimado
    const estimatedLoot = calculateLoot(defender.balances?.dirtyMoney || 0, attacker.skills?.attack || 0);

    // Cria registro de ataque
    const battleId = generateId();
    const attack = new Attack({
      _id: battleId,
      attackerId: attacker._id,
      attackerName: attacker.playerName,
      defenderId: defender._id,
      defenderName: defender.playerName,
      status: 'pending',
      attackerPower,
      defenderPower,
      winChance,
      estimatedLoot,
      attackerGangMembers: normalizedAttackerGangMembers.length,
      attackerGangStats: normalizedAttackerGangStats,
      attackerCTLevel,
      defenderGangMembers: defenderGangContext.members.length,
      defenderGangStats: defenderGangContext.stats,
      defenderCTLevel: defenderGangContext.ctLevel,
      route: {
        fromTileX: originTileX,
        fromTileY: originTileY,
        toTileX: targetTileX,
        toTileY: targetTileY,
      },
      createdAt: new Date(),
    });

    await attack.save();

    return res.json({
      success: true,
      battleId,
      message: 'Batalha iniciada com sucesso',
      estimatedLoot,
      estimatedChance: winChance * 100,
      attackerPower,
      defenderPower,
      route: {
        fromTileX: originTileX,
        fromTileY: originTileY,
        toTileX: targetTileX,
        toTileY: targetTileY,
      },
    });
  } catch (error) {
    console.error('Erro ao iniciar batalha:', error);
    return res.status(500).json({ error: error.message || 'Erro ao iniciar batalha' });
  }
}

/**
 * Estima o resultado de uma batalha antes de iniciá-la
 */
export async function estimateBattle(req, res) {
  try {
    const attacker = req.player;
    const { targetId } = req.body || {};

    // Validações básicas
    if (!attacker || !targetId) {
      return res.status(400).json({ error: 'Atacante ou alvo inválido' });
    }

    // Busca o defensor
    const defender = await Player.findById(targetId);
    if (!defender) {
      return res.status(404).json({ error: 'Defensor não encontrado' });
    }

    // Carrega contextos de combate
    const attackerFaction = await getFactionCombatContext(attacker);
    const defenderFaction = await getFactionCombatContext(defender);

    // Carrega contextos de gangue OFICIAIS
    const attackerGangContext = await getGangCombatContext(attacker._id);
    const defenderGangContext = await getGangCombatContext(defender._id);

    const normalizedAttackerGangMembers = attackerGangContext.members;
    const normalizedAttackerGangStats = attackerGangContext.stats;

    // Calcula poder do atacante
    const attackerPower = calculatePlayerPower(attacker, {
      gangStats: normalizedAttackerGangStats,
      factionStats: attackerFaction.stats,
    });

    // Calcula poder do defensor
    const defenderPower = calculatePlayerPower(defender, {
      gangStats: defenderGangContext.stats,
      factionStats: defenderFaction.stats,
    });

    // Calcula chance de vitória
    const winChance = calculateWinChance(attackerPower, defenderPower);

    // Calcula saque estimado
    const estimatedLoot = calculateLoot(defender.balances?.dirtyMoney || 0, attacker.skills?.attack || 0);

    return res.json({
      success: true,
      estimatedLoot,
      estimatedChance: winChance * 100,
      attackerPower,
      defenderPower,
      attackerGangMembers: normalizedAttackerGangMembers.length,
      attackerGangStats: normalizedAttackerGangStats,
      defenderGangMembers: defenderGangContext.members.length,
      defenderGangStats: defenderGangContext.stats,
    });
  } catch (error) {
    console.error('Erro ao estimar batalha:', error);
    return res.status(500).json({ error: error.message || 'Erro ao estimar batalha' });
  }
}

/**
 * Resolve uma batalha já iniciada
 */
export async function resolveBattle(req, res) {
  try {
    const { battleId } = req.params;

    if (!battleId) {
      return res.status(400).json({ error: 'battleId é obrigatório' });
    }

    const attack = await Attack.findById(battleId);
    if (!attack) {
      return res.status(404).json({ error: 'Batalha não encontrada' });
    }

    if (attack.status !== 'pending') {
      return res.status(400).json({ error: 'Batalha já foi resolvida' });
    }

    // Determina resultado
    const random = Math.random();
    const success = random < attack.winChance;

    // Processa resultado
    const attacker = await Player.findById(attack.attackerId);
    const defender = await Player.findById(attack.defenderId);

    if (!attacker || !defender) {
      return res.status(404).json({ error: 'Jogadores não encontrados' });
    }

    let loot = 0;
    let message = '';

    if (success) {
      loot = Math.floor(attack.estimatedLoot * (0.8 + Math.random() * 0.4));
      attacker.balances.dirtyMoney += loot;
      defender.balances.dirtyMoney = Math.max(0, defender.balances.dirtyMoney - loot);
      message = `Vitória! Você roubou ${loot} de dinheiro sujo`;
    } else {
      message = 'Derrota! O defensor resistiu ao ataque';
    }

    // Processa perdas da gangue se houver
    let attackerGangLosses = { membersKilled: 0, membersInjured: 0, totalLosses: 0 };
    let defenderGangLosses = { membersKilled: 0, membersInjured: 0, totalLosses: 0 };

    if (attack.attackerGangMembers > 0) {
      attackerGangLosses = await resolveOfficialGangCasualties({
        ownStats: attack.attackerGangStats,
        enemyStats: attack.defenderGangStats,
        battleOutcome: success ? 'victory' : 'defeat',
      });
    }

    if (attack.defenderGangMembers > 0) {
      defenderGangLosses = await resolveOfficialGangCasualties({
        ownStats: attack.defenderGangStats,
        enemyStats: attack.attackerGangStats,
        battleOutcome: success ? 'defeat' : 'victory',
      });
    }

    // Atualiza status da batalha
    attack.status = 'resolved';
    attack.success = success;
    attack.loot = loot;
    attack.message = message;
    attack.attackerGangLosses = attackerGangLosses;
    attack.defenderGangLosses = defenderGangLosses;
    attack.resolvedAt = new Date();

    await attack.save();
    await attacker.save();
    await defender.save();

    return res.json({
      battleId,
      success,
      loot,
      message,
      attackerGangLosses,
      defenderGangLosses,
      attackerGangStats: attack.attackerGangStats,
      defenderGangStats: attack.defenderGangStats,
    });
  } catch (error) {
    console.error('Erro ao resolver batalha:', error);
    return res.status(500).json({ error: error.message || 'Erro ao resolver batalha' });
  }
}

/**
 * Obtém relatório de uma batalha
 */
export async function getBattleReport(req, res) {
  try {
    const { battleId } = req.params;

    if (!battleId) {
      return res.status(400).json({ error: 'battleId é obrigatório' });
    }

    const attack = await Attack.findById(battleId);
    if (!attack) {
      return res.status(404).json({ error: 'Batalha não encontrada' });
    }

    return res.json({
      battleId,
      attacker: {
        playerId: attack.attackerId,
        playerName: attack.attackerName,
      },
      defender: {
        playerId: attack.defenderId,
        playerName: attack.defenderName,
      },
      resolution: {
        success: attack.success,
        loot: attack.loot,
        message: attack.message,
        attackerPower: attack.attackerPower,
        defenderPower: attack.defenderPower,
        attackerGangLosses: attack.attackerGangLosses,
        defenderGangLosses: attack.defenderGangLosses,
        attackerGangStats: attack.attackerGangStats,
        defenderGangStats: attack.defenderGangStats,
      },
    });
  } catch (error) {
    console.error('Erro ao obter relatório de batalha:', error);
    return res.status(500).json({ error: error.message || 'Erro ao obter relatório' });
  }
}

/**
 * Obtém histórico de batalhas de um jogador
 */
export async function getBattleHistory(req, res) {
  try {
    const playerId = req.player?._id;

    if (!playerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const attacks = await Attack.find({
      $or: [
        { attackerId: playerId },
        { defenderId: playerId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      battles: attacks.map(attack => ({
        battleId: attack._id,
        attacker: {
          playerId: attack.attackerId,
          playerName: attack.attackerName,
        },
        defender: {
          playerId: attack.defenderId,
          playerName: attack.defenderName,
        },
        resolution: {
          success: attack.success,
          loot: attack.loot,
          message: attack.message,
          attackerPower: attack.attackerPower,
          defenderPower: attack.defenderPower,
          attackerGangLosses: attack.attackerGangLosses,
          defenderGangLosses: attack.defenderGangLosses,
          attackerGangStats: attack.attackerGangStats,
          defenderGangStats: attack.defenderGangStats,
        },
      })),
    });
  } catch (error) {
    console.error('Erro ao obter histórico de batalhas:', error);
    return res.status(500).json({ error: error.message || 'Erro ao obter histórico' });
  }
}
