# Sistema de Redução de Bônus do Inventário

## Objetivo
Implementar a redução de bônus do inventário baseada no sistema de punições (delação premiada). Quando a delação estiver ativa, TODOS os bônus vindos do inventário são reduzidos proporcionalmente, podendo chegar a 100% (zerando completamente os bônus).

## Funcionamento

### Função Principal: `getReducedInventoryBonus()`
Localização: `/src/utils/inventoryBonus.ts`

```typescript
export function getReducedInventoryBonus(baseValue: number, player: any): number {
  const reduction = getInventoryBonusReductionPercent(player);
  return baseValue * (1 - reduction / 100);
}
```

**Parâmetros:**
- `baseValue`: O valor base do bônus antes da redução
- `player`: Objeto do jogador contendo dados de punição

**Retorno:**
- Valor do bônus após aplicar a redução (0-100%)

### Regra de Funcionamento

- **reduction = 0** → bônus normal (sem delação ativa)
- **reduction = 100** → bônus totalmente zerado (delação ativa com 100% de redução)
- **valores intermediários** → reduzem proporcionalmente

### Exemplo de Cálculo

```
baseBonus = 5
reduction = 100 (delação ativa)
finalBonus = 5 * (1 - 100/100) = 5 * 0 = 0

baseBonus = 5
reduction = 50 (delação parcial)
finalBonus = 5 * (1 - 50/100) = 5 * 0.5 = 2.5

baseBonus = 5
reduction = 0 (sem delação)
finalBonus = 5 * (1 - 0/100) = 5 * 1 = 5
```

## Implementações Realizadas

### 1. Arquivo Utilitário
**Arquivo:** `/src/utils/inventoryBonus.ts`
- Função `getReducedInventoryBonus()` que calcula o bônus reduzido
- Importa `getInventoryBonusReductionPercent` do `punishmentService`
- Documentação completa com exemplos

### 2. Página de Itens de Luxo
**Arquivo:** `/src/components/pages/LuxoItemPage.tsx`

**Mudanças:**
- Importação: `import { getReducedInventoryBonus } from '@/utils/inventoryBonus';`
- No `useMemo` de `currentItem`:
  ```typescript
  const baseBonus = getBonusByLevel(barracoLevel);
  const reducedBonus = getReducedInventoryBonus(baseBonus, player);
  
  return {
    // ... outros campos
    bonusValue: reducedBonus,  // Agora usa o bônus reduzido
  };
  ```
- Adicionado `player` como dependência do `useMemo`

**Efeito:**
- Quando um item de luxo é comprado, o bônus aplicado ao jogador já leva em conta a redução por delação
- O bônus é exibido corretamente na UI (mostrando o valor reduzido)

### 3. Página de Galeria
**Arquivo:** `/src/components/pages/GaleriaPage.tsx`

**Mudanças:**
- Importação: `import { getReducedInventoryBonus } from '@/utils/inventoryBonus';`
- Na função `processTransaction()`:
  ```typescript
  skills: {
    ...player.skills,
    [bonus.skillType]: Number(
      ((player.skills?.[bonus.skillType] || 0) + 
       getReducedInventoryBonus(bonus.skillBonusPercent, player)
      ).toFixed(2)
    ),
  }
  ```

**Efeito:**
- Quando um item é comprado na galeria, o bônus de habilidade é reduzido se delação estiver ativa
- O cálculo é feito em tempo real durante a transação

## Garantias de Consistência

✅ **Todos os tipos de bônus do inventário passam por essa lógica:**
- Bônus de itens de luxo (LuxoItemPage)
- Bônus de itens da galeria (GaleriaPage)

✅ **Nenhum bônus bypass essa regra:**
- A função é centralizada em um único lugar
- Todos os pontos de aplicação de bônus usam a mesma função

✅ **Sistema funciona em tempo real:**
- Ao ativar delação: bônus são imediatamente reduzidos
- Ao desativar delação (após 72h): bônus voltam ao normal automaticamente

## Regras Importantes

- ❌ **NÃO alterar** valores base dos itens
- ❌ **NÃO remover** itens do inventário
- ❌ **NÃO alterar** estrutura do player
- ✅ **APENAS modificar** o resultado final do bônus

## Integração com Sistema de Punições

A redução é baseada em:
- `getInventoryBonusReductionPercent(player)` do `punishmentService`
- Retorna 0 se delação não estiver ativa
- Retorna `player.punishments.inventoryBonusReductionPercent` se delação estiver ativa
- Valor padrão é 100% quando delação é aplicada via `applyDelacaoPremiada()`

## Resultado Esperado

**Durante a delação:**
- ✅ Jogador mantém itens no inventário
- ✅ Mas perde completamente (ou parcialmente) os bônus
- ✅ Sistema é reversível automaticamente após 72h

**Após delação expirar:**
- ✅ Bônus voltam ao normal
- ✅ Jogador recebe +100% em todas as habilidades como recompensa
