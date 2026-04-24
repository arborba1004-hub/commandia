/**
 * MODELO DE BACKEND - ESTRUTURA CONSISTENTE DO SITE
 * Este arquivo serve como referência da arquitetura backend do jogo
 * Implementado em Wix, mas aqui está o modelo conceitual completo
 */

// ============================================================================
// 1. CONFIGURAÇÃO E DEPENDÊNCIAS
// ============================================================================

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// 2. SCHEMAS E MODELOS DE DADOS
// ============================================================================

// ---- PLAYER PROFILES ----
const PlayerProfileSchema = {
  _id: String,
  playerName: String,
  level: Number,
  experiencePoints: Number,
  dirtyMoney: Number,
  cleanMoney: Number,
  lastLoginDate: Date,
  creationDate: Date,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- PLAYER PROGRESS ----
const PlayerProgressSchema = {
  _id: String,
  playerId: String,
  availableSpins: Number,
  mapPosition: String,
  shackStatus: Boolean,
  bribeStatus: Boolean,
  moneyLaunderingStatus: Boolean,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- PLAYER INVENTORIES ----
const PlayerInventoriesSchema = {
  _id: String,
  playerId: String,
  acquiredItems: String, // JSON stringified array
  unlockedSkills: String, // JSON stringified array
  lastModified: Date,
  inventorySize: Number,
  skillSlotsUsed: Number,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- ARMAS ARSENAL ----
const ArmasArsenalSchema = {
  _id: String,
  weaponName: String,
  description: String,
  level: Number,
  dirtyMoneyPrice: Number,
  abilityBonus: String,
  weaponImage: String,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- WEAPON CASES ----
const WeaponCasesSchema = {
  _id: String,
  itemName: String,
  itemPrice: Number,
  itemImage: String,
  itemDescription: String,
  abilityBonusType: String,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- ACESSÓRIOS DE FUGA ----
const AcessoriosSchema = {
  _id: String,
  itemName: String,
  itemDescription: String,
  itemPrice: Number,
  itemImage: String,
  skillType: String,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- ESCAPE VEHICLES ----
const EscapeVehiclesSchema = {
  _id: String,
  name: String,
  level: Number,
  price: Number,
  image: String,
  abilityBonusType: String,
  description: String,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- CONCEPT ART GALLERY ----
const ConceptArtSchema = {
  _id: String,
  artworkTitle: String,
  artworkImage: String,
  artworkDescription: String,
  artistName: String,
  dateCreated: Date,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- GAME MECHANICS ----
const GameMechanicsSchema = {
  _id: String,
  title: String,
  description: String,
  mechanicImage: String,
  mechanicType: String,
  levelRequirement: Number,
  reward: String,
  _createdDate: Date,
  _updatedDate: Date,
};

// ---- MATCHES ----
const MatchesSchema = {
  _id: String,
  matchId: String,
  players: String, // JSON stringified array
  status: String, // 'pending', 'active', 'completed'
  currentTurnPlayerId: String,
  gameData: String, // JSON stringified game state
  createdAt: Date,
  updatedAt: Date,
  winnerId: String,
  _createdDate: Date,
  _updatedDate: Date,
};

// ============================================================================
// 3. AUTENTICAÇÃO
// ============================================================================

/**
 * Middleware de autenticação
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const authToken = authHeader && authHeader.split(' ')[1];

  if (!authToken) return res.sendStatus(401);

  // Validate authToken format (basic validation)
  if (authToken.length < 10) return res.sendStatus(403);
  
  // In production: verify authToken against database
  req.user = { authToken };
  next();
};

/**
 * Login - Gera authToken
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar credenciais (simplificado)
    // Em produção: buscar no banco, validar hash de senha, etc
    const user = {
      id: 'user-123',
      email: email,
      playerName: 'Player',
    };

    // Generate authToken (using crypto or similar)
    const authToken = require('crypto').randomBytes(32).toString('hex');
    res.json({ token: authToken, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Logout - Invalida token (client-side)
 */
app.post('/api/auth/logout', (req, res) => {
  // Em produção: adicionar token a blacklist
  res.json({ message: 'Logout successful' });
});

// ============================================================================
// 4. ENDPOINTS - PLAYER PROFILES
// ============================================================================

/**
 * GET /api/players/:playerId
 * Busca perfil do jogador
 */
app.get('/api/players/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    // const player = await PlayerProfile.findById(playerId);
    res.json({
      _id: playerId,
      playerName: 'Player Name',
      level: 5,
      experiencePoints: 1250,
      dirtyMoney: 50000,
      cleanMoney: 10000,
      lastLoginDate: new Date(),
      creationDate: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/players
 * Cria novo perfil de jogador
 */
app.post('/api/players', async (req, res) => {
  try {
    const { playerName } = req.body;
    const newPlayer = {
      _id: `player-${Date.now()}`,
      playerName,
      level: 1,
      experiencePoints: 0,
      dirtyMoney: 0,
      cleanMoney: 0,
      lastLoginDate: new Date(),
      creationDate: new Date(),
    };
    // await PlayerProfile.create(newPlayer);
    res.status(201).json(newPlayer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/players/:playerId
 * Atualiza perfil do jogador
 */
app.put('/api/players/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const updates = req.body;
    // const updatedPlayer = await PlayerProfile.findByIdAndUpdate(playerId, updates);
    res.json({ message: 'Player updated', playerId, updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 5. ENDPOINTS - PLAYER PROGRESS
// ============================================================================

/**
 * GET /api/progress/:playerId
 * Busca progresso do jogador
 */
app.get('/api/progress/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    res.json({
      _id: `progress-${playerId}`,
      playerId,
      availableSpins: 3,
      mapPosition: '0,0',
      shackStatus: false,
      bribeStatus: false,
      moneyLaunderingStatus: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/progress/:playerId
 * Atualiza progresso
 */
app.put('/api/progress/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { availableSpins, mapPosition, shackStatus, bribeStatus, moneyLaunderingStatus } = req.body;
    res.json({
      message: 'Progress updated',
      playerId,
      availableSpins,
      mapPosition,
      shackStatus,
      bribeStatus,
      moneyLaunderingStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 6. ENDPOINTS - INVENTÁRIO
// ============================================================================

/**
 * GET /api/inventory/:playerId
 * Busca inventário do jogador
 */
app.get('/api/inventory/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    res.json({
      _id: `inventory-${playerId}`,
      playerId,
      acquiredItems: JSON.stringify(['weapon-1', 'accessory-2']),
      unlockedSkills: JSON.stringify(['skill-1', 'skill-3']),
      lastModified: new Date(),
      inventorySize: 20,
      skillSlotsUsed: 2,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/inventory/:playerId/items
 * Adiciona item ao inventário
 */
app.post('/api/inventory/:playerId/items', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { itemId } = req.body;
    res.json({ message: 'Item added', playerId, itemId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/inventory/:playerId/items/:itemId
 * Remove item do inventário
 */
app.delete('/api/inventory/:playerId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { playerId, itemId } = req.params;
    res.json({ message: 'Item removed', playerId, itemId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 7. ENDPOINTS - ARMAS E ARSENAL
// ============================================================================

/**
 * GET /api/weapons
 * Lista todas as armas
 */
app.get('/api/weapons', async (req, res) => {
  try {
    const weapons = [
      {
        _id: 'weapon-1',
        weaponName: 'Pistola 9mm',
        description: 'Arma de fogo padrão',
        level: 1,
        dirtyMoneyPrice: 5000,
        abilityBonus: '+10% Damage',
        weaponImage: 'https://static.wixstatic.com/media/...',
      },
      {
        _id: 'weapon-2',
        weaponName: 'Rifle de Assalto',
        description: 'Arma de longo alcance',
        level: 5,
        dirtyMoneyPrice: 25000,
        abilityBonus: '+25% Damage',
        weaponImage: 'https://static.wixstatic.com/media/...',
      },
    ];
    res.json(weapons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weapons/:weaponId
 * Busca arma específica
 */
app.get('/api/weapons/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;
    res.json({
      _id: weaponId,
      weaponName: 'Pistola 9mm',
      description: 'Arma de fogo padrão',
      level: 1,
      dirtyMoneyPrice: 5000,
      abilityBonus: '+10% Damage',
      weaponImage: 'https://static.wixstatic.com/media/...',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weapons
 * Cria nova arma (admin)
 */
app.post('/api/weapons', authenticateToken, async (req, res) => {
  try {
    const { weaponName, description, level, dirtyMoneyPrice, abilityBonus } = req.body;
    const newWeapon = {
      _id: `weapon-${Date.now()}`,
      weaponName,
      description,
      level,
      dirtyMoneyPrice,
      abilityBonus,
    };
    res.status(201).json(newWeapon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 8. ENDPOINTS - WEAPON CASES
// ============================================================================

/**
 * GET /api/cases
 * Lista todos os cases de armas
 */
app.get('/api/cases', async (req, res) => {
  try {
    const cases = [
      {
        _id: 'case-1',
        itemName: 'Case Comum',
        itemPrice: 1000,
        itemDescription: 'Case com itens comuns',
        abilityBonusType: 'common',
      },
      {
        _id: 'case-2',
        itemName: 'Case Raro',
        itemPrice: 5000,
        itemDescription: 'Case com itens raros',
        abilityBonusType: 'rare',
      },
    ];
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cases/:caseId/open
 * Abre um case e retorna item aleatório
 */
app.post('/api/cases/:caseId/open', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { playerId } = req.body;

    // Lógica de abertura de case
    const reward = {
      itemId: `item-${Date.now()}`,
      itemName: 'Arma Rara',
      rarity: 'rare',
    };

    res.json({
      message: 'Case opened',
      playerId,
      caseId,
      reward,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 9. ENDPOINTS - ACESSÓRIOS
// ============================================================================

/**
 * GET /api/accessories
 * Lista todos os acessórios
 */
app.get('/api/accessories', async (req, res) => {
  try {
    const accessories = [
      {
        _id: 'acc-1',
        itemName: 'Mochila de Fuga',
        itemDescription: 'Aumenta capacidade de inventário',
        itemPrice: 2000,
        skillType: 'inventory',
      },
      {
        _id: 'acc-2',
        itemName: 'Disfarce',
        itemDescription: 'Reduz chance de detecção',
        itemPrice: 3000,
        skillType: 'stealth',
      },
    ];
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/accessories/:playerId/equip
 * Equipa acessório
 */
app.post('/api/accessories/:playerId/equip', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { accessoryId } = req.body;
    res.json({ message: 'Accessory equipped', playerId, accessoryId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 10. ENDPOINTS - VEÍCULOS DE FUGA
// ============================================================================

/**
 * GET /api/vehicles
 * Lista todos os veículos
 */
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = [
      {
        _id: 'vehicle-1',
        name: 'Carro Popular',
        level: 1,
        price: 10000,
        abilityBonusType: 'speed',
        description: 'Veículo rápido e discreto',
      },
      {
        _id: 'vehicle-2',
        name: 'Helicóptero',
        level: 10,
        price: 100000,
        abilityBonusType: 'escape',
        description: 'Fuga garantida',
      },
    ];
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vehicles/:playerId/purchase
 * Compra veículo
 */
app.post('/api/vehicles/:playerId/purchase', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { vehicleId } = req.body;
    res.json({ message: 'Vehicle purchased', playerId, vehicleId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 11. ENDPOINTS - MATCHES/PARTIDAS
// ============================================================================

/**
 * GET /api/matches
 * Lista todas as partidas
 */
app.get('/api/matches', async (req, res) => {
  try {
    const matches = [
      {
        _id: 'match-1',
        matchId: 'match-001',
        players: JSON.stringify(['player-1', 'player-2']),
        status: 'active',
        currentTurnPlayerId: 'player-1',
        createdAt: new Date(),
      },
    ];
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/matches
 * Cria nova partida
 */
app.post('/api/matches', authenticateToken, async (req, res) => {
  try {
    const { players } = req.body;
    const newMatch = {
      _id: `match-${Date.now()}`,
      matchId: `match-${Date.now()}`,
      players: JSON.stringify(players),
      status: 'pending',
      currentTurnPlayerId: players[0],
      gameData: JSON.stringify({}),
      createdAt: new Date(),
    };
    res.status(201).json(newMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/matches/:matchId
 * Atualiza estado da partida
 */
app.put('/api/matches/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status, currentTurnPlayerId, gameData } = req.body;
    res.json({
      message: 'Match updated',
      matchId,
      status,
      currentTurnPlayerId,
      gameData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/matches/:matchId/move
 * Registra movimento na partida
 */
app.post('/api/matches/:matchId/move', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { playerId, action, data } = req.body;
    res.json({
      message: 'Move registered',
      matchId,
      playerId,
      action,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 12. ENDPOINTS - GAME MECHANICS
// ============================================================================

/**
 * GET /api/mechanics
 * Lista todas as mecânicas do jogo
 */
app.get('/api/mechanics', async (req, res) => {
  try {
    const mechanics = [
      {
        _id: 'mechanic-1',
        title: 'Lavagem de Dinheiro',
        description: 'Converta dinheiro sujo em limpo',
        mechanicType: 'money-laundering',
        levelRequirement: 5,
        reward: '+1000 Clean Money',
      },
      {
        _id: 'mechanic-2',
        title: 'Suborno',
        description: 'Suborna autoridades',
        mechanicType: 'bribe',
        levelRequirement: 3,
        reward: '+500 Influence',
      },
    ];
    res.json(mechanics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mechanics/:mechanicId/execute
 * Executa mecânica do jogo
 */
app.post('/api/mechanics/:mechanicId/execute', authenticateToken, async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { playerId } = req.body;
    res.json({
      message: 'Mechanic executed',
      mechanicId,
      playerId,
      reward: '+1000 Clean Money',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 13. ENDPOINTS - CONCEPT ART GALLERY
// ============================================================================

/**
 * GET /api/gallery
 * Lista todas as artes conceituais
 */
app.get('/api/gallery', async (req, res) => {
  try {
    const gallery = [
      {
        _id: 'art-1',
        artworkTitle: 'Conceito de Personagem',
        artworkDescription: 'Design do personagem principal',
        artistName: 'Artist Name',
        dateCreated: new Date(),
      },
    ];
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 14. ENDPOINTS - TRANSAÇÕES E ECONOMIA
// ============================================================================

/**
 * POST /api/transactions/convert-money
 * Converte dinheiro sujo em limpo
 */
app.post('/api/transactions/convert-money', authenticateToken, async (req, res) => {
  try {
    const { playerId, amount } = req.body;

    // Validar se jogador tem dinheiro sujo suficiente
    // Aplicar taxa de conversão
    const fee = amount * 0.1; // 10% de taxa
    const cleanMoneyReceived = amount - fee;

    res.json({
      message: 'Money converted',
      playerId,
      dirtyMoneySpent: amount,
      cleanMoneyReceived,
      fee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/purchase
 * Compra item com dinheiro sujo ou limpo
 */
app.post('/api/transactions/purchase', authenticateToken, async (req, res) => {
  try {
    const { playerId, itemId, price, currencyType } = req.body; // currencyType: 'dirty' ou 'clean'

    res.json({
      message: 'Purchase successful',
      playerId,
      itemId,
      price,
      currencyType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 15. ENDPOINTS - GANG SYSTEM
// ============================================================================

/**
 * GET /api/gangs/:gangId
 * Busca informações da gang
 */
app.get('/api/gangs/:gangId', async (req, res) => {
  try {
    const { gangId } = req.params;
    res.json({
      _id: gangId,
      gangName: 'Gang Name',
      leader: 'player-1',
      members: ['player-1', 'player-2', 'player-3'],
      level: 5,
      treasury: 50000,
      territory: 'Downtown',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gangs
 * Cria nova gang
 */
app.post('/api/gangs', authenticateToken, async (req, res) => {
  try {
    const { gangName, playerId } = req.body;
    const newGang = {
      _id: `gang-${Date.now()}`,
      gangName,
      leader: playerId,
      members: [playerId],
      level: 1,
      treasury: 0,
      territory: null,
    };
    res.status(201).json(newGang);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gangs/:gangId/recruit
 * Recruta novo membro
 */
app.post('/api/gangs/:gangId/recruit', authenticateToken, async (req, res) => {
  try {
    const { gangId } = req.params;
    const { playerId } = req.body;
    res.json({ message: 'Player recruited', gangId, playerId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gangs/:gangId/battle
 * Inicia batalha entre gangs
 */
app.post('/api/gangs/:gangId/battle', authenticateToken, async (req, res) => {
  try {
    const { gangId } = req.params;
    const { opponentGangId } = req.body;
    res.json({
      message: 'Battle started',
      gangId,
      opponentGangId,
      battleId: `battle-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 16. ENDPOINTS - REALTIME UPDATES (WebSocket)
// ============================================================================

/**
 * WebSocket para atualizações em tempo real
 * Eventos: player-move, attack, chat, match-update
 */
const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);

    // Broadcast para outros clientes
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// ============================================================================
// 17. ENDPOINTS - ADMIN
// ============================================================================

/**
 * POST /api/admin/reset-player
 * Reseta dados do jogador (admin only)
 */
app.post('/api/admin/reset-player', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.body;
    res.json({ message: 'Player reset', playerId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * Retorna estatísticas do servidor
 */
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    res.json({
      totalPlayers: 1250,
      activePlayers: 342,
      totalMatches: 5678,
      activeMatches: 45,
      serverUptime: '15 days',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 18. MIDDLEWARE DE ERRO
// ============================================================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// ============================================================================
// 19. INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

app.listen(PORT, () => {
  console.log(`🎮 Game Server rodando em http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// ============================================================================
// 20. ESTRUTURA DE DIRETÓRIOS RECOMENDADA
// ============================================================================

/*
projeto-backend/
├── src/
│   ├── controllers/
│   │   ├── playerController.js
│   │   ├── weaponController.js
│   │   ├── matchController.js
│   │   ├── gangController.js
│   │   └── transactionController.js
│   ├── models/
│   │   ├── PlayerProfile.js
│   │   ├── PlayerProgress.js
│   │   ├── PlayerInventories.js
│   │   ├── ArmasArsenal.js
│   │   ├── WeaponCases.js
│   │   ├── Accessories.js
│   │   ├── EscapeVehicles.js
│   │   ├── GameMechanics.js
│   │   ├── Matches.js
│   │   └── Gang.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── players.js
│   │   ├── weapons.js
│   │   ├── matches.js
│   │   ├── gangs.js
│   │   ├── transactions.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── services/
│   │   ├── playerService.js
│   │   ├── matchService.js
│   │   ├── gangService.js
│   │   └── economyService.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   └── constants.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env
├── .env.example
├── package.json
├── server.js
└── README.md
*/

// ============================================================================
// 21. VARIÁVEIS DE AMBIENTE (.env)
// ============================================================================

/*
NODE_ENV=development
PORT=5000
AUTH_TOKEN_SECRET=seu-secret-key-super-seguro
MONGODB_URI=mongodb://localhost:27017/game-db
DATABASE_NAME=game-db
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
API_VERSION=v1
*/

// ============================================================================
// 22. DOCUMENTAÇÃO DE ENDPOINTS
// ============================================================================

/*
AUTENTICAÇÃO
POST   /api/auth/login              - Login do jogador
POST   /api/auth/logout             - Logout do jogador

PERFIL DO JOGADOR
GET    /api/players/:playerId       - Busca perfil
POST   /api/players                 - Cria novo perfil
PUT    /api/players/:playerId       - Atualiza perfil

PROGRESSO
GET    /api/progress/:playerId      - Busca progresso
PUT    /api/progress/:playerId      - Atualiza progresso

INVENTÁRIO
GET    /api/inventory/:playerId     - Busca inventário
POST   /api/inventory/:playerId/items - Adiciona item
DELETE /api/inventory/:playerId/items/:itemId - Remove item

ARMAS
GET    /api/weapons                 - Lista armas
GET    /api/weapons/:weaponId       - Busca arma
POST   /api/weapons                 - Cria arma (admin)

CASES
GET    /api/cases                   - Lista cases
POST   /api/cases/:caseId/open      - Abre case

ACESSÓRIOS
GET    /api/accessories             - Lista acessórios
POST   /api/accessories/:playerId/equip - Equipa acessório

VEÍCULOS
GET    /api/vehicles                - Lista veículos
POST   /api/vehicles/:playerId/purchase - Compra veículo

PARTIDAS
GET    /api/matches                 - Lista partidas
POST   /api/matches                 - Cria partida
PUT    /api/matches/:matchId        - Atualiza partida
POST   /api/matches/:matchId/move   - Registra movimento

MECÂNICAS
GET    /api/mechanics               - Lista mecânicas
POST   /api/mechanics/:mechanicId/execute - Executa mecânica

GALERIA
GET    /api/gallery                 - Lista artes

TRANSAÇÕES
POST   /api/transactions/convert-money - Converte dinheiro
POST   /api/transactions/purchase   - Compra item

GANGS
GET    /api/gangs/:gangId           - Busca gang
POST   /api/gangs                   - Cria gang
POST   /api/gangs/:gangId/recruit   - Recruta membro
POST   /api/gangs/:gangId/battle    - Inicia batalha

ADMIN
POST   /api/admin/reset-player      - Reseta jogador
GET    /api/admin/stats             - Estatísticas
*/

module.exports = app;
