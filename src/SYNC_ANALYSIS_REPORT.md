# Análise de Sincronização Backend-Frontend - Relatório Completo

## 📋 Resumo Executivo

Análise aprofundada das inconsistências entre o backend (serverclone.js) e o frontend (playerStore.ts) realizada em 2026-04-07.

---

## 1️⃣ COMPARAÇÃO DE TIPOS DE DADOS

### ✅ CONSISTENTES

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `niveis` | Objeto com 8 níveis | Tipo `Niveis` com 8 níveis | ✅ OK |
| `balances` | 3 campos (dirtyMoney, cleanMoney, corre) | Tipo `Balances` com 3 campos | ✅ OK |
| `skills` | 6 skills (attack, defense, intelligence, agility, respect, vigor) | Tipo `Skills` com 6 skills | ✅ OK |
| `power` | Number | number | ✅ OK |
| `hierarchyBadge` | String | string | ✅ OK |
| `mapPosition` | {tileX, tileY, worldX, worldY} | {tileX, tileY} | ⚠️ PARCIAL |
| `laundryProgress` | {activeOperations[], dailyOperations[]} | Tipo `LaundryProgress` | ✅ OK |
| `punishments` | Objeto complexo | Tipo `PunishmentsState` | ✅ OK |
| `skillBoostMultiplier` | Number | number | ✅ OK |
| `headerCustomization` | {playerNameFont, playerNameFontSize, playerNameColor} | Tipo `HeaderCustomization` | ✅ OK |
| `ownedVehicles` | String[] | string[] | ✅ OK |
| `purchasedAccessories` | purchasedAccessorySchema[] | PurchasedAccessory[] | ✅ OK |

### ⚠️ INCONSISTÊNCIAS ENCONTRADAS

#### 1. **ACCESSORIES - TIPO INCONSISTENTE**
- **Backend**: `accessories: { vehicles: Map<string, string[]>, weapons: Map<string, string[]> }`
- **Frontend**: `accessories?: { vehicles?: Record<string, string[]>, weapons?: Record<string, string[]> }`
- **Problema**: Backend usa Mongoose Map, Frontend usa Record. Serialização pode falhar.
- **Solução**: Padronizar para `Record<string, string[]>` em ambos.

#### 2. **MAPPOSITION - CAMPOS FALTANDO NO FRONTEND**
- **Backend**: `mapPosition: { tileX, tileY, worldX, worldY }`
- **Frontend**: `mapPosition?: { tileX, tileY }` (faltam worldX, worldY)
- **Problema**: Dados do backend são perdidos ao sincronizar.
- **Solução**: Adicionar `worldX` e `worldY` ao tipo `MapPosition` no frontend.

#### 3. **VIP - CAMPO FALTANDO NO FRONTEND**
- **Backend**: `vip: { type: Boolean, default: false }`
- **Frontend**: Não existe no `PlayerState`
- **Problema**: Campo não é sincronizado.
- **Solução**: Adicionar `vip?: boolean` ao `PlayerState`.

#### 4. **FACTIONID - CAMPO FALTANDO NO FRONTEND**
- **Backend**: `factionId: { type: String, default: null }`
- **Frontend**: Não existe no `PlayerState`
- **Problema**: Informação de facção não é sincronizada.
- **Solução**: Adicionar `factionId?: string | null` ao `PlayerState`.

#### 5. **LASTSKILLTRAIN / LASTATTACKAT - CAMPOS FALTANDO**
- **Backend**: `lastSkillTrainAt`, `lastAttackAt` (timestamps)
- **Frontend**: Não existem no `PlayerState`
- **Problema**: Controle de cooldowns não é sincronizado.
- **Solução**: Adicionar estes campos ao `PlayerState`.

#### 6. **LASTPASSIVEINCOMEAT / LASTSPINAT - CAMPOS FALTANDO**
- **Backend**: `lastPassiveIncomeAt`, `lastSpinAt` (timestamps)
- **Frontend**: Não existem no `PlayerState`
- **Problema**: Timing de eventos não é sincronizado.
- **Solução**: Adicionar estes campos ao `PlayerState`.

#### 7. **VERSION - CAMPO CRÍTICO FALTANDO**
- **Backend**: `version: { type: Number, default: 0 }`
- **Frontend**: Não existe no `PlayerState` (existe apenas em `PlayerStore`)
- **Problema**: Controle de versão não é persistido no estado do player.
- **Solução**: Adicionar `version?: number` ao `PlayerState`.

---

## 2️⃣ VALORES PADRÃO

### Backend (playerSchema defaults)

```javascript
niveis: {
  playerLevel: 1,
  barracoLevel: 1,
  hierarchyLevel: 1,
  arsenalLevel: 1,
  giroLevel: 1,
  lavagemLevel: 1,
  luxuryLevel: 1,
  briberyLevel: 1,
}

balances: {
  dirtyMoney: 1000,
  cleanMoney: 0,
  corre: 1000,
}

skills: {
  attack: 0,
  defense: 0,
  intelligence: 0,
  agility: 0,
  respect: 0,
  vigor: 0,
}

power: 0
hierarchyBadge: 'Antena'
vip: false
version: 0
```

### Frontend (initialPlayer)

```typescript
balances: {
  dirtyMoney: 10000000000000,  // ❌ DIFERENTE: Backend = 1000
  cleanMoney: 10000000000000,  // ❌ DIFERENTE: Backend = 0
  corre: 1000,                  // ✅ OK
}

// Todos os outros valores estão corretos
```

### ⚠️ INCONSISTÊNCIAS DE VALORES PADRÃO

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `dirtyMoney` | 1000 | 10000000000000 | ❌ CRÍTICO |
| `cleanMoney` | 0 | 10000000000000 | ❌ CRÍTICO |
| `corre` | 1000 | 1000 | ✅ OK |
| `vip` | false | (não existe) | ⚠️ FALTA |
| `version` | 0 | (não existe) | ⚠️ FALTA |

---

## 3️⃣ LÓGICA DE MESCLAGEM

### Backend (PATCH /player/update)

```javascript
// Padrão: merge shallow para objetos aninhados
if (incoming.niveis) {
  player.niveis = {
    ...player.niveis.toObject(),
    ...incoming.niveis,
  };
}

// Aplicado para: niveis, balances, inventory, pageLevels, skills, 
// barracoPosition, mapPosition, headerCustomization

// Para arrays e campos simples: substituição direta
if (incoming.ownedVehicles !== undefined) {
  player.ownedVehicles = incoming.ownedVehicles;
}

// Sempre bumpa versão
bumpVersion(player);
```

### Frontend (mergePlayer)

```typescript
// Padrão: merge shallow para objetos aninhados
niveis: {
  ...initialPlayer.niveis,
  ...(incoming?.niveis || {}),
},

// Aplicado para: niveis, balances, inventory, pageLevels, skills,
// barracoPosition, headerCustomization

// Para mapPosition: merge com fallback
mapPosition: {
  tileX: incoming?.mapPosition?.tileX ?? initialPlayer.mapPosition?.tileX ?? GRID_WIDTH / 2,
  tileY: incoming?.mapPosition?.tileY ?? initialPlayer.mapPosition?.tileY ?? GRID_HEIGHT / 2,
},

// Para arrays: substituição direta
ownedVehicles: incoming?.ownedVehicles || initialPlayer.ownedVehicles || [],
```

### ✅ ANÁLISE: Lógica é CONSISTENTE

Ambos usam o mesmo padrão:
1. Merge shallow para objetos aninhados
2. Substituição direta para arrays
3. Fallback para valores iniciais

**Porém, há um problema crítico:**

#### ⚠️ PROBLEMA: mapPosition no Backend vs Frontend

**Backend**: Retorna `{ tileX, tileY, worldX, worldY }`
**Frontend mergePlayer**: Só preserva `{ tileX, tileY }`

```typescript
// ATUAL (ERRADO)
mapPosition: {
  tileX: incoming?.mapPosition?.tileX ?? initialPlayer.mapPosition?.tileX ?? GRID_WIDTH / 2,
  tileY: incoming?.mapPosition?.tileY ?? initialPlayer.mapPosition?.tileY ?? GRID_HEIGHT / 2,
},

// CORRETO
mapPosition: {
  tileX: incoming?.mapPosition?.tileX ?? initialPlayer.mapPosition?.tileX ?? GRID_WIDTH / 2,
  tileY: incoming?.mapPosition?.tileY ?? initialPlayer.mapPosition?.tileY ?? GRID_HEIGHT / 2,
  worldX: incoming?.mapPosition?.worldX ?? initialPlayer.mapPosition?.worldX ?? GRID_WIDTH / 2,
  worldY: incoming?.mapPosition?.worldY ?? initialPlayer.mapPosition?.worldY ?? GRID_HEIGHT / 2,
},
```

---

## 4️⃣ SINCRONIZAÇÃO COMPLETA

### Campos que PRECISAM ser sincronizados mas FALTAM

| Campo | Backend | Frontend | Sincronizado? |
|-------|---------|----------|---------------|
| `vip` | ✅ | ❌ | ❌ NÃO |
| `factionId` | ✅ | ❌ | ❌ NÃO |
| `lastSkillTrainAt` | ✅ | ❌ | ❌ NÃO |
| `lastAttackAt` | ✅ | ❌ | ❌ NÃO |
| `lastPassiveIncomeAt` | ✅ | ❌ | ❌ NÃO |
| `lastSpinAt` | ✅ | ❌ | ❌ NÃO |
| `version` | ✅ | ❌ (só em store) | ⚠️ PARCIAL |
| `worldX` (mapPosition) | ✅ | ❌ | ❌ NÃO |
| `worldY` (mapPosition) | ✅ | ❌ | ❌ NÃO |

### Backend PATCH /player/update - Campos sincronizados

```javascript
// ✅ Sincronizados
niveis, balances, inventory, pageLevels, skills, power, hierarchyBadge,
barracoPosition, mapPosition, laundryProgress, punishments, skillBoostMultiplier,
headerCustomization, ownedVehicles, purchasedAccessories, accessories

// ❌ NÃO sincronizados (não há if para eles)
vip, factionId, lastSkillTrainAt, lastAttackAt, lastPassiveIncomeAt, lastSpinAt
```

---

## 5️⃣ CONTROLE DE VERSÃO

### Backend

```javascript
function bumpVersion(player) {
  player.version = (player.version || 0) + 1;
}

// Chamado em:
// - /auth/google (ao criar novo player)
// - /player/me (a cada fetch)
// - /player/update (a cada atualização)
// - /game/action (a cada ação)
// - /laundry/start (ao iniciar operação)
// - /laundry/complete (ao completar operação)
```

### Frontend

```typescript
// playerStore.ts
localVersion: number;  // Rastreado no store

// Incrementado em:
setPlayer() -> localVersion + 1
applyPlayerUpdate() -> localVersion + 1

// Sincronizado com backend em:
syncPlayerToBackend() -> localVersion = Math.max(state.localVersion, data.player.version)
```

### ⚠️ PROBLEMA: Versão não é persistida no PlayerState

**Problema**: `version` é rastreado apenas em `PlayerStore`, não em `PlayerState`.

Quando o player é salvo em localStorage e recarregado, a versão é perdida.

```typescript
// ATUAL
localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
// player.version não existe em PlayerState

// CORRETO
// Adicionar version ao PlayerState para persistência
```

---

## 6️⃣ TIPO ACCESSORIES - PADRONIZAÇÃO

### Problema Atual

**Backend**: Mongoose Map
```javascript
accessories: {
  vehicles: {
    type: Map,
    of: [String],
    default: {},
  },
  weapons: {
    type: Map,
    of: [String],
    default: {},
  },
}
```

**Frontend**: Record
```typescript
accessories?: {
  vehicles?: Record<string, string[]>;
  weapons?: Record<string, string[]>;
};
```

### Problema de Serialização

Quando Mongoose serializa um Map para JSON, pode não ser consistente com Record.

### Solução

Padronizar para `Record<string, string[]>` em ambos:

**Backend** (serverclone.js):
```javascript
accessories: {
  vehicles: {
    type: Object,  // Usar Object em vez de Map
    default: {},
  },
  weapons: {
    type: Object,
    default: {},
  },
}
```

**Frontend** (playerStore.ts):
```typescript
accessories: {
  vehicles: Record<string, string[]>;
  weapons: Record<string, string[]>;
};
```

---

## 📊 RESUMO DE CORREÇÕES NECESSÁRIAS

### CRÍTICAS (Afetam sincronização)

1. ✅ **Adicionar campos ao PlayerState**:
   - `vip?: boolean`
   - `factionId?: string | null`
   - `lastSkillTrainAt?: number`
   - `lastAttackAt?: number`
   - `lastPassiveIncomeAt?: number`
   - `lastSpinAt?: number`
   - `version?: number`

2. ✅ **Expandir MapPosition**:
   - Adicionar `worldX?: number` e `worldY?: number`

3. ✅ **Corrigir valores padrão**:
   - `dirtyMoney: 1000` (não 10000000000000)
   - `cleanMoney: 0` (não 10000000000000)

4. ✅ **Adicionar sincronização no backend**:
   - Adicionar `if (incoming.vip !== undefined)` no PATCH /player/update
   - Adicionar `if (incoming.factionId !== undefined)` no PATCH /player/update
   - Adicionar `if (incoming.lastSkillTrainAt !== undefined)` no PATCH /player/update
   - Adicionar `if (incoming.lastAttackAt !== undefined)` no PATCH /player/update
   - Adicionar `if (incoming.lastPassiveIncomeAt !== undefined)` no PATCH /player/update
   - Adicionar `if (incoming.lastSpinAt !== undefined)` no PATCH /player/update

5. ✅ **Corrigir mergePlayer para mapPosition**:
   - Incluir `worldX` e `worldY` no merge

6. ✅ **Padronizar accessories**:
   - Backend: Mudar de Map para Object
   - Frontend: Manter Record (já está correto)

### IMPORTANTES (Melhorias)

7. ✅ **Adicionar version ao PlayerState**:
   - Permite persistência e rastreamento de versão

8. ✅ **Documentar campos de timestamp**:
   - Adicionar comentários sobre campos de controle de tempo

---

## 🔍 VALIDAÇÃO

Após as correções, validar:

1. ✅ Novo player criado no backend tem valores padrão corretos
2. ✅ Sincronização PATCH /player/update inclui todos os campos
3. ✅ mergePlayer preserva todos os campos do backend
4. ✅ localStorage persiste version corretamente
5. ✅ Accessories serializa/deserializa sem erros
6. ✅ mapPosition inclui worldX e worldY

---

## 📝 PRÓXIMOS PASSOS

1. Aplicar correções ao playerStore.ts
2. Aplicar correções ao serverclone.js
3. Testar sincronização completa
4. Validar persistência em localStorage
5. Verificar serialização de accessories
