# Especificação Técnica do Backend - Sistema de Mapa em Tempo Real

## Documento de Conformidade Frontend-Backend
**Data**: 2026-04-25  
**Status**: Especificação Completa  
**Versão**: 1.0

---

## 1. AUTENTICAÇÃO E SEGURANÇA

### 1.1 Autenticação JWT
```
Requisito: Implementar autenticação baseada em JWT para todas as conexões WebSocket

Implementação:
- Gerar JWT na autenticação inicial do usuário
- Token deve conter: playerId, email, timestamp
- Validade: 1 hora
- Renovação automática: 15 minutos antes da expiração

Fluxo:
1. Cliente faz login (POST /auth/login)
2. Backend retorna JWT + refreshToken
3. Cliente armazena tokens localmente
4. Cliente envia JWT ao conectar no WebSocket
5. Backend valida JWT antes de aceitar conexão
6. Se JWT expirado, cliente usa refreshToken para obter novo JWT
```

### 1.2 Validação de Conexão WebSocket
```
Evento: connection
Dados esperados: { token: string }

Validação:
- Verificar se token é válido
- Extrair playerId do token
- Se inválido: desconectar cliente
- Se válido: aceitar conexão e enviar mapSnapshot

Código esperado:
io.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  if (!isValidToken(token)) {
    socket.disconnect();
    return;
  }
  const playerId = extractPlayerId(token);
  // Continuar com lógica de conexão
});
```

---

## 2. ENDPOINTS REST

### 2.1 GET /api/players/snapshot
**Propósito**: Obter snapshot de todos os jogadores no mapa (fallback para WebSocket)

**Parâmetros**:
- `limit` (query): número máximo de jogadores a retornar (padrão: 1000)
- `skip` (query): número de registros a pular para paginação (padrão: 0)

**Resposta (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "playerId": "player-123",
      "playerName": "NickName",
      "tileX": 50,
      "tileY": 75,
      "barracoLevel": 3,
      "faction": "Comando Vermelho",
      "level": 25,
      "status": "online",
      "lastUpdate": "2026-04-25T10:30:00Z"
    },
    {
      "playerId": "player-456",
      "playerName": "OutroJogador",
      "tileX": 100,
      "tileY": 120,
      "barracoLevel": 5,
      "faction": "PCC",
      "level": 30,
      "status": "online",
      "lastUpdate": "2026-04-25T10:29:55Z"
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 1000,
    "skip": 0,
    "hasNext": true
  }
}
```

**Resposta (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Token inválido ou expirado"
}
```

### 2.2 GET /api/players/:playerId/barraco
**Propósito**: Obter dados detalhados do barraco de um jogador específico

**Parâmetros**:
- `playerId` (path): ID do jogador

**Resposta (200 OK)**:
```json
{
  "success": true,
  "data": {
    "playerId": "player-123",
    "playerName": "NickName",
    "barracoLevel": 3,
    "barracoHealth": 450,
    "barracoMaxHealth": 500,
    "tileX": 50,
    "tileY": 75,
    "faction": "Comando Vermelho",
    "level": 25,
    "experiencePoints": 5000,
    "dirtyMoney": 50000,
    "cleanMoney": 10000,
    "defenseBonus": 15,
    "attackBonus": 20,
    "lastAttackedBy": "player-789",
    "lastAttackedAt": "2026-04-25T09:30:00Z",
    "defenders": [
      {
        "memberId": "member-1",
        "memberName": "Defensor1",
        "health": 100,
        "maxHealth": 100
      }
    ],
    "equipment": [
      {
        "itemId": "weapon-1",
        "itemName": "Pistola 9mm",
        "type": "weapon",
        "bonus": 10
      }
    ]
  }
}
```

### 2.3 POST /api/players/:playerId/teleport
**Propósito**: Teleportar jogador para nova posição (com validação)

**Parâmetros**:
- `playerId` (path): ID do jogador

**Body**:
```json
{
  "tileX": 100,
  "tileY": 150,
  "teleportType": "escape_vehicle",
  "vehicleId": "vehicle-123"
}
```

**Validações**:
- Verificar se jogador tem recurso para teleporte (dinheiro, item, etc)
- Verificar se posição de destino é válida (dentro dos limites do mapa)
- Verificar cooldown de teleporte (mínimo 30 segundos entre teleportes)
- Verificar se jogador não está em combate

**Resposta (200 OK)**:
```json
{
  "success": true,
  "data": {
    "playerId": "player-123",
    "oldPosition": { "tileX": 50, "tileY": 75 },
    "newPosition": { "tileX": 100, "tileY": 150 },
    "timestamp": "2026-04-25T10:30:00Z"
  }
}
```

**Resposta (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Posição inválida ou fora dos limites do mapa",
  "code": "INVALID_POSITION"
}
```

---

## 3. EVENTOS WEBSOCKET (Server-to-Client)

### 3.1 mapSnapshot
**Emitido**: Na conexão inicial do cliente

**Dados**:
```json
{
  "event": "mapSnapshot",
  "data": {
    "players": [
      {
        "playerId": "player-123",
        "playerName": "NickName",
        "tileX": 50,
        "tileY": 75,
        "barracoLevel": 3,
        "faction": "Comando Vermelho",
        "level": 25,
        "status": "online"
      }
    ],
    "timestamp": "2026-04-25T10:30:00Z",
    "totalPlayers": 1500
  }
}
```

**Uso no Frontend**:
```typescript
socket.on('mapSnapshot', (data) => {
  // Renderizar todos os jogadores no mapa
  // Atualizar playerMapSpace.ts com dados iniciais
  updateMapPlayers(data.players);
});
```

### 3.2 playerJoined
**Emitido**: Quando um novo jogador entra no mapa

**Dados**:
```json
{
  "event": "playerJoined",
  "data": {
    "playerId": "player-new",
    "playerName": "NovoJogador",
    "tileX": 200,
    "tileY": 250,
    "barracoLevel": 1,
    "faction": "Independente",
    "level": 1,
    "status": "online",
    "timestamp": "2026-04-25T10:31:00Z"
  }
}
```

**Uso no Frontend**:
```typescript
socket.on('playerJoined', (data) => {
  // Adicionar novo jogador ao mapa
  addPlayerToMap(data);
});
```

### 3.3 playerMoved
**Emitido**: Quando um jogador se move

**Dados**:
```json
{
  "event": "playerMoved",
  "data": {
    "playerId": "player-123",
    "tileX": 55,
    "tileY": 80,
    "timestamp": "2026-04-25T10:31:30Z",
    "moveType": "walk"
  }
}
```

**Uso no Frontend**:
```typescript
socket.on('playerMoved', (data) => {
  // Atualizar posição do jogador no mapa
  updatePlayerPosition(data.playerId, data.tileX, data.tileY);
});
```

### 3.4 playerTeleported
**Emitido**: Quando um jogador se teleporta

**Dados**:
```json
{
  "event": "playerTeleported",
  "data": {
    "playerId": "player-123",
    "oldPosition": { "tileX": 50, "tileY": 75 },
    "newPosition": { "tileX": 100, "tileY": 150 },
    "teleportType": "escape_vehicle",
    "timestamp": "2026-04-25T10:32:00Z"
  }
}
```

**Uso no Frontend**:
```typescript
socket.on('playerTeleported', (data) => {
  // Animar teleporte do jogador
  animateTeleport(data);
  updatePlayerPosition(data.playerId, data.newPosition.tileX, data.newPosition.tileY);
});
```

### 3.5 playerLeft
**Emitido**: Quando um jogador se desconecta

**Dados**:
```json
{
  "event": "playerLeft",
  "data": {
    "playerId": "player-123",
    "timestamp": "2026-04-25T10:33:00Z",
    "reason": "disconnect"
  }
}
```

**Uso no Frontend**:
```typescript
socket.on('playerLeft', (data) => {
  // Remover jogador do mapa
  removePlayerFromMap(data.playerId);
});
```

### 3.6 barracoAttacked
**Emitido**: Quando um barraco é atacado

**Dados**:
```json
{
  "event": "barracoAttacked",
  "data": {
    "defenderId": "player-123",
    "attackerId": "player-456",
    "damageDealt": 50,
    "barracoHealthAfter": 400,
    "timestamp": "2026-04-25T10:34:00Z"
  }
}
```

### 3.7 error
**Emitido**: Quando ocorre um erro

**Dados**:
```json
{
  "event": "error",
  "data": {
    "code": "INVALID_MOVE",
    "message": "Movimento inválido",
    "timestamp": "2026-04-25T10:35:00Z"
  }
}
```

---

## 4. EVENTOS WEBSOCKET (Client-to-Server)

### 4.1 move
**Enviado**: Quando o jogador se move

**Dados**:
```json
{
  "event": "move",
  "data": {
    "tileX": 55,
    "tileY": 80,
    "moveType": "walk",
    "timestamp": "2026-04-25T10:31:30Z"
  }
}
```

**Validações no Backend**:
- Verificar se posição é adjacente à posição atual (distância máxima: 1 tile)
- Verificar se posição está dentro dos limites do mapa
- Verificar se jogador não está em combate
- Verificar cooldown de movimento (mínimo 1 segundo entre movimentos)
- Verificar se jogador tem energia suficiente

**Ações no Backend**:
1. Validar movimento
2. Atualizar posição no banco de dados
3. Emitir `playerMoved` para todos os clientes
4. Atualizar timestamp de última atividade

**Código esperado**:
```javascript
socket.on('move', (data) => {
  const playerId = socket.playerId;
  
  // Validações
  if (!isValidMove(playerId, data.tileX, data.tileY)) {
    socket.emit('error', { code: 'INVALID_MOVE', message: 'Movimento inválido' });
    return;
  }
  
  // Atualizar banco de dados
  updatePlayerPosition(playerId, data.tileX, data.tileY);
  
  // Emitir para todos os clientes
  io.emit('playerMoved', {
    playerId,
    tileX: data.tileX,
    tileY: data.tileY,
    timestamp: new Date()
  });
});
```

### 4.2 teleport
**Enviado**: Quando o jogador se teleporta

**Dados**:
```json
{
  "event": "teleport",
  "data": {
    "tileX": 100,
    "tileY": 150,
    "teleportType": "escape_vehicle",
    "vehicleId": "vehicle-123"
  }
}
```

**Validações no Backend**:
- Verificar se jogador tem o item/recurso necessário
- Verificar se posição de destino é válida
- Verificar cooldown de teleporte (mínimo 30 segundos)
- Verificar se jogador não está em combate

**Ações no Backend**:
1. Validar teleporte
2. Consumir recurso (item, dinheiro, etc)
3. Atualizar posição no banco de dados
4. Emitir `playerTeleported` para todos os clientes

### 4.3 requestBarracoInfo
**Enviado**: Quando o jogador clica em um barraco para ver informações

**Dados**:
```json
{
  "event": "requestBarracoInfo",
  "data": {
    "targetPlayerId": "player-123"
  }
}
```

**Resposta do Backend**:
```json
{
  "event": "barracoInfo",
  "data": {
    "playerId": "player-123",
    "playerName": "NickName",
    "barracoLevel": 3,
    "barracoHealth": 450,
    "barracoMaxHealth": 500,
    "tileX": 50,
    "tileY": 75,
    "faction": "Comando Vermelho",
    "level": 25,
    "defenseBonus": 15,
    "attackBonus": 20,
    "defenders": [
      {
        "memberId": "member-1",
        "memberName": "Defensor1",
        "health": 100,
        "maxHealth": 100
      }
    ]
  }
}
```

---

## 5. PERSISTÊNCIA DE DADOS

### 5.1 Schema do Banco de Dados - Tabela: player_positions

```sql
CREATE TABLE player_positions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId VARCHAR(255) UNIQUE NOT NULL,
  tileX INT NOT NULL,
  tileY INT NOT NULL,
  lastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  moveType VARCHAR(50),
  INDEX idx_playerId (playerId),
  INDEX idx_position (tileX, tileY)
);
```

### 5.2 Schema do Banco de Dados - Tabela: player_barraco

```sql
CREATE TABLE player_barraco (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId VARCHAR(255) UNIQUE NOT NULL,
  barracoLevel INT DEFAULT 1,
  barracoHealth INT DEFAULT 100,
  barracoMaxHealth INT DEFAULT 100,
  defenseBonus INT DEFAULT 0,
  attackBonus INT DEFAULT 0,
  lastAttackedBy VARCHAR(255),
  lastAttackedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_playerId (playerId),
  FOREIGN KEY (playerId) REFERENCES player_positions(playerId)
);
```

### 5.3 Operações de Persistência

**Atualizar Posição**:
```sql
UPDATE player_positions 
SET tileX = ?, tileY = ?, lastUpdate = NOW(), moveType = ?
WHERE playerId = ?;
```

**Obter Posição Atual**:
```sql
SELECT playerId, tileX, tileY, moveType, lastUpdate 
FROM player_positions 
WHERE playerId = ?;
```

**Obter Todos os Jogadores**:
```sql
SELECT p.playerId, p.tileX, p.tileY, p.lastUpdate,
       b.barracoLevel, b.barracoHealth, b.defenseBonus
FROM player_positions p
LEFT JOIN player_barraco b ON p.playerId = b.playerId
LIMIT ? OFFSET ?;
```

**Atualizar Saúde do Barraco**:
```sql
UPDATE player_barraco 
SET barracoHealth = ?, lastAttackedBy = ?, lastAttackedAt = NOW()
WHERE playerId = ?;
```

---

## 6. FLUXO DE INTEGRAÇÃO COMPLETO

### 6.1 Inicialização do Mapa
```
1. Cliente carrega página do mapa
2. Cliente conecta ao WebSocket com JWT
3. Backend valida JWT
4. Backend emite 'mapSnapshot' com todos os jogadores
5. Frontend renderiza playerMapSpace.ts com dados iniciais
6. Frontend aguarda eventos de movimento em tempo real
```

### 6.2 Movimento de Jogador
```
1. Jogador clica em tile para se mover
2. Frontend valida movimento localmente
3. Frontend emite evento 'move' via WebSocket
4. Backend recebe 'move'
5. Backend valida movimento
6. Backend atualiza banco de dados
7. Backend emite 'playerMoved' para todos os clientes
8. Todos os clientes atualizam posição do jogador
```

### 6.3 Teleporte de Jogador
```
1. Jogador clica em botão de teleporte
2. Frontend abre seletor de destino
3. Jogador seleciona destino
4. Frontend emite evento 'teleport' via WebSocket
5. Backend recebe 'teleport'
6. Backend valida teleporte (recursos, cooldown, etc)
7. Backend consome recurso
8. Backend atualiza banco de dados
9. Backend emite 'playerTeleported' para todos os clientes
10. Todos os clientes atualizam posição do jogador com animação
```

### 6.4 Visualizar Barraco de Outro Jogador
```
1. Jogador clica em barraco no mapa
2. Frontend emite evento 'requestBarracoInfo' via WebSocket
3. Backend recebe 'requestBarracoInfo'
4. Backend busca dados do barraco no banco de dados
5. Backend emite 'barracoInfo' para o cliente
6. Frontend renderiza OtherPlayerBarracoModal com dados
```

---

## 7. TRATAMENTO DE ERROS

### 7.1 Códigos de Erro

| Código | Mensagem | Ação |
|--------|----------|------|
| INVALID_TOKEN | Token inválido ou expirado | Desconectar e redirecionar para login |
| INVALID_MOVE | Movimento inválido | Mostrar mensagem de erro |
| OUT_OF_BOUNDS | Posição fora dos limites | Mostrar mensagem de erro |
| IN_COMBAT | Jogador em combate | Mostrar mensagem de erro |
| INSUFFICIENT_RESOURCES | Recursos insuficientes | Mostrar mensagem de erro |
| COOLDOWN_ACTIVE | Ação em cooldown | Mostrar tempo restante |
| SERVER_ERROR | Erro no servidor | Reconectar automaticamente |

### 7.2 Reconexão Automática

```typescript
// Frontend deve implementar reconexão automática
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('disconnect', () => {
  console.log('Desconectado, tentando reconectar...');
});

socket.on('connect', () => {
  console.log('Reconectado com sucesso');
  // Solicitar novo mapSnapshot
  socket.emit('requestMapSnapshot');
});
```

---

## 8. PERFORMANCE E OTIMIZAÇÕES

### 8.1 Limitação de Taxa (Rate Limiting)

```javascript
// Máximo de eventos por segundo por cliente
const RATE_LIMITS = {
  move: 1,           // 1 movimento por segundo
  teleport: 0.033,   // 1 teleporte a cada 30 segundos
  attack: 0.5,       // 1 ataque a cada 2 segundos
  requestInfo: 2     // 2 requisições por segundo
};
```

### 8.2 Compressão de Dados

```javascript
// Usar compressão para eventos grandes
io.engine.on('connection', (rawSocket) => {
  rawSocket.on('packet', (packet) => {
    if (packet.data && packet.data.length > 1000) {
      // Aplicar compressão
    }
  });
});
```

### 8.3 Caching

```javascript
// Cache de dados de barraco (5 minutos)
const barracoCacheTime = 5 * 60 * 1000;
const barracoCache = new Map();

function getBarracoInfo(playerId) {
  const cached = barracoCache.get(playerId);
  if (cached && Date.now() - cached.timestamp < barracoCacheTime) {
    return cached.data;
  }
  
  const data = fetchFromDatabase(playerId);
  barracoCache.set(playerId, { data, timestamp: Date.now() });
  return data;
}
```

---

## 9. SEGURANÇA

### 9.1 Validação de Entrada

```javascript
// Validar todos os dados recebidos do cliente
function validateMove(data) {
  if (!Number.isInteger(data.tileX) || !Number.isInteger(data.tileY)) {
    throw new Error('Coordenadas inválidas');
  }
  if (data.tileX < 0 || data.tileX > MAP_WIDTH || 
      data.tileY < 0 || data.tileY > MAP_HEIGHT) {
    throw new Error('Posição fora dos limites');
  }
  return true;
}
```

### 9.2 Proteção contra Cheating

```javascript
// Verificar se movimento é fisicamente possível
function isValidMove(playerId, newX, newY) {
  const player = getPlayerPosition(playerId);
  const distance = Math.sqrt(
    Math.pow(newX - player.tileX, 2) + 
    Math.pow(newY - player.tileY, 2)
  );
  
  // Distância máxima: 1 tile (movimento adjacente)
  if (distance > 1) {
    return false;
  }
  
  return true;
}
```

### 9.3 Proteção contra DDoS

```javascript
// Limitar conexões por IP
const connectionLimits = new Map();

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  const count = connectionLimits.get(ip) || 0;
  
  if (count > 10) {
    socket.disconnect();
    return;
  }
  
  connectionLimits.set(ip, count + 1);
});
```

---

## 10. MONITORAMENTO E LOGGING

### 10.1 Eventos a Registrar

```javascript
// Registrar eventos importantes
logger.info('Player connected', { playerId, timestamp });
logger.info('Player moved', { playerId, from: oldPos, to: newPos });
logger.warn('Invalid move attempt', { playerId, reason });
logger.error('Database error', { error, query });
```

### 10.2 Métricas

```javascript
// Coletar métricas
metrics.gauge('active_players', activePlayersCount);
metrics.gauge('websocket_connections', connectionCount);
metrics.histogram('move_latency', latency);
metrics.counter('invalid_moves', 1);
```

---

## 11. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Implementar autenticação JWT
- [ ] Criar endpoints REST (/api/players/snapshot, etc)
- [ ] Implementar WebSocket com Socket.io
- [ ] Emitir eventos: mapSnapshot, playerJoined, playerMoved, playerLeft
- [ ] Receber eventos: move, teleport, requestBarracoInfo
- [ ] Criar tabelas no banco de dados
- [ ] Implementar persistência de posições
- [ ] Implementar validação de movimentos
- [ ] Implementar cooldowns
- [ ] Implementar rate limiting
- [ ] Implementar tratamento de erros
- [ ] Implementar logging e monitoramento
- [ ] Testar integração com frontend
- [ ] Implementar reconexão automática
- [ ] Documentar API

---

## 12. REFERÊNCIAS DE INTEGRAÇÃO COM FRONTEND

### 12.1 playerMapSpace.ts
Espera receber:
- `mapSnapshot` com array de jogadores
- `playerMoved` com atualizações de posição
- `playerJoined` com novos jogadores
- `playerLeft` com jogadores desconectados

### 12.2 playerTeleport.ts
Espera receber:
- Confirmação de teleporte via `playerTeleported`
- Validação de destino
- Animação de teleporte

### 12.3 OtherPlayerBarracoModal.tsx
Espera receber:
- `barracoInfo` com dados detalhados do barraco
- Informações de defesa
- Histórico de ataques

---

## Conclusão

Esta especificação fornece uma base sólida para implementar o backend que suporte o frontend em tempo real. Seguindo este documento, você garantirá que:

1. ✅ Todos os dados são persistidos corretamente
2. ✅ A comunicação em tempo real funciona sem latência
3. ✅ Os movimentos são validados e seguros
4. ✅ O sistema é escalável e performático
5. ✅ Os erros são tratados adequadamente
6. ✅ A segurança é mantida em todos os níveis

**Próximos Passos**:
1. Implementar autenticação JWT
2. Configurar banco de dados
3. Implementar WebSocket
4. Testar integração com frontend
5. Implementar monitoramento
