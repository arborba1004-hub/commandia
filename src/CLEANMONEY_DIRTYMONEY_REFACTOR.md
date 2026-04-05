# Refactor: Única Fonte de Informação para cleanMoney e dirtyMoney

## Objetivo
Garantir que **cleanMoney** e **dirtyMoney** sejam lidos **exclusivamente** do `playerStore` em todas as páginas e componentes do jogo.

## Mudanças Realizadas

### 1. **Header.tsx**
- ✅ Removido uso de `??` (nullish coalescing) para `dirtyMoney`, `cleanMoney` e `corre`
- ✅ Agora lê diretamente: `player.balances.dirtyMoney`, `player.balances.cleanMoney`, `player.balances.corre`
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 2. **GiroPage.tsx**
- ✅ Removido uso de `??` para `dirtyMoney`, `cleanMoney` e `corre`
- ✅ Agora lê diretamente do playerStore
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 3. **LavagemDeDinheiroPage.tsx**
- ✅ Removido uso de `??` para `playerLevel` e `dirtyMoney`
- ✅ Agora lê diretamente: `player.niveis.playerLevel` e `player.balances.dirtyMoney`
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 4. **BarracoPage.tsx**
- ✅ Removido uso de `??` para `level` e `cleanMoney`
- ✅ Agora lê diretamente: `player.niveis.barracoLevel` e `player.balances.cleanMoney`
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 5. **LuxoItemPage.tsx**
- ✅ Removido uso de `??` para `barracoLevel`, `cleanMoney` e `inventoryItems`
- ✅ Agora lê diretamente do playerStore
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 6. **FugaIlustradaPage.tsx**
- ✅ Removido uso de `??` para `cleanMoney`, `ownedVehicles` e `purchasedAccessories`
- ✅ Agora lê diretamente do playerStore
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 7. **ArsenalPage.tsx**
- ✅ Removido uso de `??` para `dirtyMoney`
- ✅ Agora lê diretamente: `player.balances.dirtyMoney`
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 8. **ProfilePage.tsx**
- ✅ Removido uso de `??` para todos os valores de balances
- ✅ Agora lê diretamente do playerStore
- ✅ Adicionado comentário: `// ÚNICA FONTE: playerStore`

### 9. **GangPage.tsx**
- ✅ Já estava usando o playerStore corretamente
- ✅ Sem mudanças necessárias (apenas confirmação)

## Padrão Implementado

### Antes (❌ Inseguro)
```typescript
const dirtyMoney = player?.balances?.dirtyMoney ?? 0;
const cleanMoney = player?.balances?.cleanMoney ?? 0;
```

### Depois (✅ Seguro)
```typescript
// ÚNICA FONTE: playerStore
const dirtyMoney = player.balances.dirtyMoney;
const cleanMoney = player.balances.cleanMoney;
```

## Benefícios

1. **Consistência**: Todos os componentes leem do mesmo lugar
2. **Sincronização**: Mudanças no playerStore refletem imediatamente em todas as páginas
3. **Debugging**: Mais fácil rastrear onde os dados vêm
4. **Performance**: Sem fallbacks desnecessários
5. **Confiabilidade**: Garante que o Header sempre mostra os valores corretos

## Fluxo de Dados

```
playerStore (fonte única)
    ↓
    ├─ Header.tsx (exibe saldos)
    ├─ GiroPage.tsx (consome dirtyMoney)
    ├─ LavagemDeDinheiroPage.tsx (consome dirtyMoney)
    ├─ BarracoPage.tsx (consome cleanMoney)
    ├─ LuxoItemPage.tsx (consome cleanMoney)
    ├─ FugaIlustradaPage.tsx (consome cleanMoney)
    ├─ ArsenalPage.tsx (consome dirtyMoney)
    ├─ ProfilePage.tsx (exibe todos os saldos)
    └─ GangPage.tsx (exibe tesouro da gang)
```

## Sincronização com Backend

O playerStore já cuida de:
- ✅ Salvar dados localmente (localStorage)
- ✅ Agendar sincronização com backend
- ✅ Polling em tempo real (3 segundos)
- ✅ Validação de punições (cleanMoneyBlocked, dirtyMoneyBlocked)

Todas as páginas agora confiam 100% no playerStore como fonte única de verdade.
