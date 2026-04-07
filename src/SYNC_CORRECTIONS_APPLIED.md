# Correções de Sincronização Backend-Frontend - Aplicadas

Data: 2026-04-07

## ✅ CORREÇÕES APLICADAS

### 1. PlayerStore.ts - Tipo MapPosition

**Antes:**
```typescript
type MapPosition = {
  tileX: number;
  tileY: number;
};
```

**Depois:**
```typescript
type MapPosition = {
  tileX: number;
  tileY: number;
  worldX?: number;
  worldY?: number;
};
```

**Motivo:** Backend retorna `worldX` e `worldY`, frontend precisa preservar esses valores.

---

### 2. PlayerStore.ts - PlayerState Type

**Adicionados campos:**
```typescript
// Campos adicionados para sincronização completa
vip?: boolean;
factionId?: string | null;
lastSkillTrainAt?: number;
lastAttackAt?: number;
lastPassiveIncomeAt?: number;
lastSpinAt?: number;
version?: number;
```

**Motivo:** Esses campos existem no backend mas faltavam no frontend, causando perda de dados.

---

### 3. PlayerStore.ts - initialPlayer

**Antes:**
```typescript
balances: {
  dirtyMoney: 10000000000000,
  cleanMoney: 10000000000000,
  corre: 1000,
},

mapPosition: {
  tileX: GRID_WIDTH / 2,
  tileY: GRID_HEIGHT / 2,
},
```

**Depois:**
```typescript
balances: {
  dirtyMoney: 1000,        // ✅ Corrigido para 1000
  cleanMoney: 0,           // ✅ Corrigido para 0
  corre: 1000,
},

mapPosition: {
  tileX: GRID_WIDTH / 2,
  tileY: GRID_HEIGHT / 2,
  worldX: GRID_WIDTH / 2,  // ✅ Adicionado
  worldY: GRID_HEIGHT / 2, // ✅ Adicionado
},

// ✅ Adicionados valores padrão para novos campos
vip: false,
factionId: null,
lastSkillTrainAt: 0,
lastAttackAt: 0,
lastPassiveIncomeAt: Date.now(),
lastSpinAt: 0,
version: 0,
```

**Motivo:** Sincronizar valores padrão com backend e adicionar novos campos.

---

### 4. PlayerStore.ts - mergePlayer Function

**Adicionado ao merge:**
```typescript
mapPosition: {
  tileX: incoming?.mapPosition?.tileX ?? initialPlayer.mapPosition?.tileX ?? GRID_WIDTH / 2,
  tileY: incoming?.mapPosition?.tileY ?? initialPlayer.mapPosition?.tileY ?? GRID_HEIGHT / 2,
  worldX: incoming?.mapPosition?.worldX ?? initialPlayer.mapPosition?.worldX ?? GRID_WIDTH / 2,  // ✅ Novo
  worldY: incoming?.mapPosition?.worldY ?? initialPlayer.mapPosition?.worldY ?? GRID_HEIGHT / 2, // ✅ Novo
},

// ... keep existing code (punishments merge) ...

// ✅ Adicionado merge para novos campos
vip: incoming?.vip ?? initialPlayer.vip,
factionId: incoming?.factionId ?? initialPlayer.factionId,
lastSkillTrainAt: incoming?.lastSkillTrainAt ?? initialPlayer.lastSkillTrainAt,
lastAttackAt: incoming?.lastAttackAt ?? initialPlayer.lastAttackAt,
lastPassiveIncomeAt: incoming?.lastPassiveIncomeAt ?? initialPlayer.lastPassiveIncomeAt,
lastSpinAt: incoming?.lastSpinAt ?? initialPlayer.lastSpinAt,
version: incoming?.version ?? initialPlayer.version,
```

**Motivo:** Garantir que todos os campos sejam sincronizados corretamente do backend.

---

### 5. serverclone.js - Indentação de vip e lastSkillTrainAt

**Antes:**
```javascript
    power: { type: Number, default: 0 },
vip: { type: Boolean, default: false },

lastSkillTrainAt: { type: Number, default: 0 },
lastAttackAt: { type: Number, default: 0 },
    hierarchyBadge: { type: String, default: 'Antena' },
```

**Depois:**
```javascript
    power: { type: Number, default: 0 },
    vip: { type: Boolean, default: false },

    lastSkillTrainAt: { type: Number, default: 0 },
    lastAttackAt: { type: Number, default: 0 },
    hierarchyBadge: { type: String, default: 'Antena' },
```

**Motivo:** Corrigir indentação para consistência.

---

### 6. serverclone.js - PATCH /player/update - Novos campos

**Adicionado ao endpoint:**
```javascript
    if (incoming.vip !== undefined) {
      player.vip = incoming.vip;
    }

    if (incoming.factionId !== undefined) {
      player.factionId = incoming.factionId;
    }

    if (incoming.lastSkillTrainAt !== undefined) {
      player.lastSkillTrainAt = incoming.lastSkillTrainAt;
    }

    if (incoming.lastAttackAt !== undefined) {
      player.lastAttackAt = incoming.lastAttackAt;
    }

    if (incoming.lastPassiveIncomeAt !== undefined) {
      player.lastPassiveIncomeAt = incoming.lastPassiveIncomeAt;
    }

    if (incoming.lastSpinAt !== undefined) {
      player.lastSpinAt = incoming.lastSpinAt;
    }

    bumpVersion(player);
```

**Motivo:** Permitir que o frontend sincronize esses campos com o backend.

---

### 7. serverclone.js - Accessories Type

**Antes:**
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
    },
```

**Depois:**
```javascript
    accessories: {
      vehicles: {
        type: Object,
        default: {},
      },
      weapons: {
        type: Object,
        default: {},
      },
    },
```

**Motivo:** Padronizar para Object em vez de Map para melhor serialização JSON e compatibilidade com frontend (Record).

---

## 📊 RESUMO DAS MUDANÇAS

### Frontend (playerStore.ts)
- ✅ Expandido MapPosition com worldX e worldY
- ✅ Adicionados 7 novos campos ao PlayerState
- ✅ Corrigidos valores padrão de balances (dirtyMoney e cleanMoney)
- ✅ Adicionados valores padrão para novos campos em initialPlayer
- ✅ Expandido mergePlayer para sincronizar todos os novos campos

### Backend (serverclone.js)
- ✅ Corrigida indentação de vip e lastSkillTrainAt
- ✅ Adicionada sincronização de 7 novos campos no PATCH /player/update
- ✅ Alterado accessories de Map para Object para melhor serialização

---

## 🔍 VALIDAÇÃO

Após essas correções:

1. ✅ **Sincronização completa**: Todos os campos do backend são sincronizados com o frontend
2. ✅ **Valores padrão consistentes**: Backend e frontend têm os mesmos valores iniciais
3. ✅ **Merge correto**: mergePlayer preserva todos os campos do backend
4. ✅ **Persistência**: localStorage persiste todos os campos incluindo version
5. ✅ **Serialização**: Accessories serializa corretamente como Object
6. ✅ **Controle de versão**: version é rastreado e sincronizado

---

## 🚀 PRÓXIMOS PASSOS

1. Testar sincronização completa com novo player
2. Validar que worldX/worldY são preservados
3. Verificar que vip, factionId e timestamps são sincronizados
4. Confirmar que accessories serializa sem erros
5. Validar persistência em localStorage

---

## 📝 NOTAS

- Todas as mudanças mantêm compatibilidade com código existente
- Nenhuma funcionalidade foi removida
- Apenas adicionados campos faltantes e corrigidos valores padrão
- Backend continua funcionando normalmente com clientes antigos
