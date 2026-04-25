# Arquitetura de Persistência - playerMapSpace, playerTeleport, OtherPlayerBarracoModal

## Status Atual

### ✅ Funcionando
1. **playerMapSpace.ts** - Renderização 3D do barraco do jogador
   - Carrega modelos GLB baseado no nível
   - Posiciona no mapa com validação de colisão
   - Suporta atualização de nível

2. **playerTeleport.ts** - Lógica de movimento
   - Calcula nova posição baseado em clique
   - Valida espaço disponível
   - Atualiza visual imediatamente (otimista)

3. **OtherPlayerBarracoModal.tsx** - UI de interação
   - Exibe informações do jogador
   - Botões de ação (mensagem, convite, ataque)
   - Estados de carregamento

### ⚠️ Problemas de Persistência

1. **Socket.io Stub** (`socket.ts`)
   - Retorna stubs vazios (não faz nada)
   - Não conecta ao backend real
   - Eventos não são emitidos/recebidos

2. **Movimento Não Persiste**
   - `teleportPlayerMapSpace()` atualiza visual apenas
   - `socket.emit('move', ...)` não funciona (stub)
   - Backend nunca recebe a nova posição
   - Ao recarregar, jogador volta para posição anterior

3. **Outros Jogadores Não Sincronizam**
   - `realtimeMapPlayersLayer` tenta usar socket
   - Socket stub não dispara eventos
   - Fallback REST funciona (polling a cada 10s)
   - Mas não há atualizações em tempo real

## Arquitetura Esperada

```
Frontend (GamePage.tsx)
    ↓
playerMapSpace (renderiza barraco do jogador)
playerTeleport (calcula nova posição)
    ↓
socket.emit('move', { tileX, tileY })  ← PROBLEMA: stub não funciona
    ↓
Backend (https://comando-backend.onrender.com)
    ↓
Salva em DB
    ↓
socket.emit('playerMoved', { playerId, tileX, tileY })
    ↓
Todos os clientes recebem atualização em tempo real
```

## Solução Implementada

### 1. Socket.io Real (socket.ts)
```typescript
// Antes: Retornava stubs vazios
// Depois: Conecta ao backend com JWT
```

### 2. Movimento Persistente (GamePage.tsx)
```typescript
// 1. Atualiza visual (otimista)
teleportPlayerMapSpace(playerMapSpace, { ... })

// 2. Atualiza store local
usePlayerStore.getState().applyPlayerUpdate(...)

// 3. Emite para backend (agora funciona)
socket.emit('move', { tileX, tileY })

// 4. Backend salva e broadcast
// 5. Socket recebe 'playerMoved' → atualiza visual de outros
```

### 3. Sincronização de Outros Jogadores (realtimeMapPlayersLayer.ts)
```typescript
// Socket em tempo real (primário)
socket.on('playerMoved', async (data) => {
  await realtimePlayersLayer.upsertPlayer(data)
})

// REST polling (fallback)
// Executa a cada 10s se socket falhar
```

### 4. Modal de Barraco (OtherPlayerBarracoModal.tsx)
```typescript
// Recebe dados do jogador clicado
// Exibe informações sincronizadas
// Botões de ação disparam eventos
```

## Fluxo Completo

### Movimento do Jogador
1. Clica no mapa → `handleClick()`
2. Calcula nova posição → `resolvePlayerTeleport()`
3. Atualiza visual → `teleportPlayerMapSpace()`
4. Atualiza store → `applyPlayerUpdate()`
5. Emite para backend → `socket.emit('move')`
6. Backend salva → `/player/move` endpoint
7. Backend broadcast → `socket.emit('playerMoved')`
8. Outros clientes recebem → `realtimePlayersLayer.upsertPlayer()`

### Clique em Outro Barraco
1. Raycaster detecta modelo 3D
2. Extrai ID do jogador
3. Busca dados do jogador → `fetchMapPlayersSnapshot()`
4. Abre modal → `OtherPlayerBarracoModal`
5. Usuário clica em ação (mensagem, convite, ataque)
6. Dispara callback → `onSendPrivateMessage()`, etc.

## Dependências Externas

### Backend
- URL: `https://comando-backend.onrender.com`
- Endpoints:
  - `GET /players/snapshot?limit=1000` - Lista de jogadores
  - `POST /player/move` - Atualiza posição
  - Socket events: `mapSnapshot`, `playerJoined`, `playerMoved`, `playerLeft`

### Autenticação
- JWT em `localStorage.authToken`
- Enviado em header: `Authorization: Bearer ${token}`
- Obtido via Google Auth

## Testes

### Teste 1: Movimento Persiste
1. Conectar ao jogo
2. Clicar em novo tile
3. Recarregar página
4. Verificar se posição foi salva

### Teste 2: Outros Jogadores Sincronizam
1. Abrir jogo em 2 abas
2. Mover jogador em aba 1
3. Verificar se aba 2 vê movimento em tempo real

### Teste 3: Modal Funciona
1. Clicar em barraco de outro jogador
2. Verificar dados exibidos
3. Clicar em botões de ação

## Arquivos Modificados

1. `socket.ts` - Implementação real de Socket.io
2. `GamePage.tsx` - Integração com socket para movimento
3. `realtimeMapPlayersLayer.ts` - Socket listeners
4. `OtherPlayerBarracoModal.tsx` - Sem mudanças (já funciona)
5. `playerMapSpace.ts` - Sem mudanças (já funciona)
6. `playerTeleport.ts` - Sem mudanças (já funciona)

## Status de Implementação

- ✅ playerMapSpace.ts - Funcionando
- ✅ playerTeleport.ts - Funcionando
- ✅ OtherPlayerBarracoModal.tsx - Funcionando
- ✅ Socket.io Real - Implementado
- ✅ Movimento Persistente - Implementado
- ✅ Sincronização em Tempo Real - Implementado
- ✅ Fallback REST - Implementado
