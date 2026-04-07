# Sistema de Partidas em Tempo Real - Guia Completo

## 📋 Visão Geral

Este guia descreve como usar o sistema de partidas multiplayer em tempo real implementado para seu jogo. O sistema utiliza:

- **Wix Data (CMS)**: Armazena o estado das partidas
- **Wix Realtime**: Sincroniza atualizações em tempo real entre jogadores
- **Backend (Velo)**: Processa jogadas e gerencia lógica do jogo

---

## 🗄️ Estrutura da Coleção "Partidas"

### Campos da Coleção

```typescript
interface Partidas {
  _id: string;                    // ID único do documento
  matchId: string;                // ID legível da partida (ex: "match_1712345678_abc123")
  players: string;                // JSON array de IDs de jogadores
  status: string;                 // 'waiting' | 'inProgress' | 'finished'
  currentTurnPlayerId: string;    // ID do jogador cuja vez é agora
  gameData: string;               // JSON object com estado do jogo
  createdAt: Date;                // Timestamp de criação
  updatedAt: Date;                // Timestamp da última atualização
  winnerId: string;               // ID do vencedor (se finalizada)
}
```

### Exemplo de Documento

```json
{
  "_id": "doc_123abc",
  "matchId": "match_1712345678_abc123",
  "players": "[\"player_1\", \"player_2\", \"player_3\"]",
  "status": "inProgress",
  "currentTurnPlayerId": "player_2",
  "gameData": "{\"board\": [...], \"hands\": {...}, \"deck\": [...]}",
  "createdAt": "2026-04-07T21:00:00Z",
  "updatedAt": "2026-04-07T21:15:30Z",
  "winnerId": null
}
```

---

## 🔧 Backend - Serviço de Partidas

### Arquivo: `src/backend/matchService.jsw`

#### Funções Disponíveis

##### 1. `createMatch(matchData)`
Cria uma nova partida.

```javascript
const match = await createMatch({
  players: ['player_1', 'player_2', 'player_3'],
  gameData: {
    board: [],
    hands: { player_1: [], player_2: [], player_3: [] },
    deck: []
  }
});
```

**Retorna**: Documento da partida criada

---

##### 2. `getMatchState(matchId)`
Obtém o estado atual da partida.

```javascript
const match = await getMatchState('match_1712345678_abc123');
// Retorna com campos JSON parseados
```

**Retorna**: Objeto com `players` e `gameData` parseados

---

##### 3. `makeMove(matchId, playerId, moveData)`
Processa uma jogada e sincroniza com todos os jogadores.

```javascript
const updatedMatch = await makeMove(
  'match_1712345678_abc123',
  'player_1',
  {
    action: 'play_card',
    cardId: 'card_456',
    targetPlayer: 'player_2'
  }
);
```

**Fluxo**:
1. Valida se é a vez do jogador
2. Aplica a jogada ao estado do jogo
3. Determina o próximo jogador
4. Verifica se há vencedor
5. Atualiza o banco de dados
6. **Publica atualização no canal `partida_{matchId}`**

**Retorna**: Partida atualizada

---

##### 4. `updateMatchState(matchId, updateData)`
Atualiza o estado da partida e publica para todos.

```javascript
const updated = await updateMatchState('match_1712345678_abc123', {
  status: 'inProgress',
  gameData: { /* novo estado */ }
});
```

**Retorna**: Partida atualizada

---

##### 5. `finishMatch(matchId, winnerId)`
Finaliza a partida.

```javascript
const finished = await finishMatch('match_1712345678_abc123', 'player_2');
```

**Retorna**: Partida finalizada

---

##### 6. `abandonMatch(matchId, playerId)`
Remove um jogador da partida. Se restar apenas 1 jogador, ele vence.

```javascript
const updated = await abandonMatch('match_1712345678_abc123', 'player_1');
```

**Retorna**: Partida atualizada

---

## 🌐 API REST - Endpoints

### Arquivo: `src/backend/matchApi.jsw`

#### POST `/api/match/create`
Cria uma nova partida.

```bash
curl -X POST https://seu-site.com/api/match/create \
  -H "Content-Type: application/json" \
  -d '{
    "players": ["player_1", "player_2"],
    "gameData": { "board": [] }
  }'
```

**Resposta**:
```json
{
  "success": true,
  "match": { /* documento completo */ }
}
```

---

#### POST `/api/match/state`
Obtém o estado da partida.

```bash
curl -X POST https://seu-site.com/api/match/state \
  -H "Content-Type: application/json" \
  -d '{ "matchId": "match_1712345678_abc123" }'
```

---

#### POST `/api/match/move`
Processa uma jogada.

```bash
curl -X POST https://seu-site.com/api/match/move \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_1712345678_abc123",
    "playerId": "player_1",
    "moveData": { "action": "play_card", "cardId": "card_456" }
  }'
```

---

#### POST `/api/match/abandon`
Abandona a partida.

```bash
curl -X POST https://seu-site.com/api/match/abandon \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_1712345678_abc123",
    "playerId": "player_1"
  }'
```

---

#### POST `/api/match/finish`
Finaliza a partida.

```bash
curl -X POST https://seu-site.com/api/match/finish \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_1712345678_abc123",
    "winnerId": "player_2"
  }'
```

---

## 📱 Frontend - Hook de Sincronização

### Arquivo: `src/hooks/useMatchSync.ts`

Hook React para sincronizar o estado da partida em tempo real.

#### Uso Básico

```typescript
import { useMatchSync } from '@/hooks/useMatchSync';

function MyGameComponent() {
  const { matchState, isLoading, error, makeMove, abandonMatch } = useMatchSync('match_1712345678_abc123');

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Partida: {matchState?.matchId}</h1>
      <p>Status: {matchState?.status}</p>
      <p>Turno: {matchState?.currentTurnPlayerId}</p>
      
      <button onClick={() => makeMove('player_1', { action: 'play_card' })}>
        Fazer Jogada
      </button>
    </div>
  );
}
```

#### Retorno do Hook

```typescript
{
  matchState: MatchState | null;           // Estado atual da partida
  isLoading: boolean;                      // Carregando estado inicial
  error: string | null;                    // Mensagem de erro
  lastUpdate: MatchUpdate | null;          // Última atualização recebida
  makeMove: (playerId, moveData) => Promise; // Fazer uma jogada
  abandonMatch: (playerId) => Promise;     // Abandonar partida
  finishMatch: (winnerId?) => Promise;     // Finalizar partida
}
```

#### Tipos

```typescript
interface MatchState {
  _id: string;
  matchId: string;
  players: string[];
  status: 'waiting' | 'inProgress' | 'finished';
  currentTurnPlayerId: string | null;
  gameData: any;
  createdAt: Date;
  updatedAt: Date;
  winnerId: string | null;
}

interface MatchUpdate {
  event: string;  // 'matchCreated' | 'stateUpdated' | 'moveMade'
  match?: MatchState;
  playerId?: string;
  move?: any;
  nextTurn?: string;
  winner?: string | null;
  gameState?: any;
  timestamp?: string;
}
```

---

## 🔄 Fluxo de Sincronização em Tempo Real

### 1. Criação da Partida

```
Cliente A                Backend              Wix Realtime         Cliente B
   |                        |                      |                    |
   |--POST /match/create---->|                      |                    |
   |                        |--insert doc--------->|                    |
   |                        |--publish event------>|                    |
   |<--match created--------|                      |--notify----------->|
   |                        |                      |<--subscribe--------|
```

### 2. Jogada e Sincronização

```
Cliente A                Backend              Wix Realtime         Cliente B
   |                        |                      |                    |
   |--POST /match/move------>|                      |                    |
   |                        |--validate turn-------|                    |
   |                        |--apply move----------|                    |
   |                        |--update doc--------->|                    |
   |                        |--publish update----->|                    |
   |<--move processed--------|                      |--notify----------->|
   |                        |                      |<--update state-----|
```

### 3. Canais de Comunicação

Cada partida usa um canal Realtime dedicado:

```
Canal: partida_{matchId}

Exemplo: partida_match_1712345678_abc123

Eventos publicados:
- matchCreated: Partida foi criada
- stateUpdated: Estado foi atualizado
- moveMade: Uma jogada foi processada
```

---

## 🎮 Exemplo Completo - Jogo de Cartas

### 1. Criar Partida

```typescript
// Frontend
const response = await fetch('/api/match/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    players: ['alice', 'bob', 'charlie'],
    gameData: {
      deck: generateDeck(),
      hands: {
        alice: drawCards(5),
        bob: drawCards(5),
        charlie: drawCards(5)
      },
      discard: [],
      currentColor: 'red'
    }
  })
});

const { match } = await response.json();
const matchId = match.matchId;
```

### 2. Sincronizar Partida

```typescript
// Frontend
function GameBoard() {
  const { matchState, makeMove, lastUpdate } = useMatchSync(matchId);

  useEffect(() => {
    if (lastUpdate?.event === 'moveMade') {
      console.log(`${lastUpdate.playerId} jogou:`, lastUpdate.move);
      // Animar a jogada
    }
  }, [lastUpdate]);

  return (
    <div>
      <div>Turno: {matchState?.currentTurnPlayerId}</div>
      <div>Sua mão: {matchState?.gameData.hands[currentPlayer]}</div>
      
      <button onClick={() => makeMove(currentPlayer, {
        action: 'play_card',
        cardId: selectedCard
      })}>
        Jogar Carta
      </button>
    </div>
  );
}
```

### 3. Processar Jogada no Backend

```javascript
// backend/matchService.jsw - Customize applyMove()

function applyMove(gameData, playerId, moveData) {
  const updated = { ...gameData };

  if (moveData.action === 'play_card') {
    const card = updated.hands[playerId].find(c => c.id === moveData.cardId);
    
    // Validar se a carta é válida
    if (!isValidMove(card, updated.currentColor)) {
      throw new Error('Jogada inválida');
    }

    // Remover da mão
    updated.hands[playerId] = updated.hands[playerId].filter(c => c.id !== moveData.cardId);

    // Adicionar ao descarte
    updated.discard.push(card);
    updated.currentColor = card.color;

    // Aplicar efeito especial
    if (card.type === 'draw_two') {
      const nextPlayer = getNextPlayer(playerId, updated.players);
      updated.hands[nextPlayer].push(...drawCards(2));
    }
  }

  return updated;
}
```

---

## ⚙️ Customização

### Adicionar Lógica de Jogo

Edite `src/backend/matchService.jsw`:

1. **`applyMove()`**: Implemente a lógica específica da sua jogada
2. **`checkWinner()`**: Defina as condições de vitória
3. **`generateMatchId()`**: Customize o formato do ID

### Adicionar Campos à Partida

1. Vá para https://manage.wix.com/dashboard/84fc9d6f-1446-4900-8d2c-4549b8788103/database
2. Abra a coleção "Partidas"
3. Adicione novos campos (ex: `maxPlayers`, `difficulty`, etc.)
4. Atualize a interface `Partidas` em `src/entities/index.ts`

---

## 🐛 Troubleshooting

### Partida não sincroniza em tempo real

1. Verifique se o canal está sendo criado: `partida_{matchId}`
2. Confirme que `publish()` é chamado após cada atualização
3. Verifique permissões de Realtime no Wix

### Jogada não é processada

1. Valide que `currentTurnPlayerId` corresponde ao jogador
2. Confirme que `moveData` tem a estrutura esperada
3. Verifique logs do backend

### Estado desincronizado entre clientes

1. Sempre use `getMatchState()` para carregar estado inicial
2. Processe eventos em ordem (use `timestamp`)
3. Implemente retry logic para falhas de rede

---

## 📚 Referências

- [Wix Data Documentation](https://www.wix.com/velo/reference/wix-data)
- [Wix Realtime Documentation](https://www.wix.com/velo/reference/wix-realtime)
- [Wix HTTP Functions](https://www.wix.com/velo/reference/wix-http-functions)

---

## 🚀 Próximos Passos

1. **Implementar UI de Lobby**: Criar página para listar partidas disponíveis
2. **Adicionar Persistência**: Salvar histórico de partidas
3. **Implementar Ranking**: Rastrear vitórias/derrotas dos jogadores
4. **Adicionar Chat**: Comunicação entre jogadores durante a partida
5. **Implementar Replay**: Permitir assistir a partidas anteriores

---

**Última atualização**: 2026-04-07
