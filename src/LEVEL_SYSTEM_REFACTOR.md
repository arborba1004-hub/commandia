# Sistema de Nível do Jogador - Refatoração Completa

## Objetivo
Refatorar todos os arquivos do jogo para que o **nível do jogador (playerLevel)** seja o determinante para a evolução e liberação de novos níveis para todas as funcionalidades principais.

## Mudanças Implementadas

### 1. Novo Arquivo: `/src/utils/levelRequirements.ts`
Arquivo central que define os requisitos de nível para cada funcionalidade:

```typescript
LEVEL_REQUIREMENTS = {
  suborno: { unlock: 1, maxLevel: 100 },
  fuga: { unlock: 5, maxLevel: 100 },
  arsenal: { unlock: 10, maxLevel: 100 },
  luxo: { unlock: 15, maxLevel: 100 },
  gang: { unlock: 20, maxLevel: 100 },
  lavagem: { unlock: 25, maxLevel: 100 },
  talentos: { unlock: 1, maxLevel: 100 },
  giro: { unlock: 1, maxLevel: 100 },
}
```

**Funções Disponíveis:**
- `canAccessFeature(playerLevel, featureKey)` - Verifica se pode acessar
- `getFeatureLevelRequirement(featureKey)` - Retorna nível mínimo
- `getFeatureBlockMessage(playerLevel, featureKey)` - Mensagem de bloqueio

### 2. Novo Componente: `/src/components/FeatureLevelLock.tsx`
Componente visual que exibe quando uma funcionalidade está bloqueada:
- Mostra o nível atual do jogador
- Mostra o nível necessário
- Exibe barra de progresso
- Botão para ir ao Barraco e evoluir

### 3. Páginas Refatoradas

#### SubornoIlustradoPage.tsx
- ✅ Importa `canAccessFeature` e `getFeatureLevelRequirement`
- ✅ Verifica `playerLevel` do player store
- ✅ Exibe `FeatureLevelLock` se nível < 1
- ✅ Usa `playerLevel` como fonte de verdade

#### FugaIlustradaPage.tsx
- ✅ Importa `canAccessFeature` e `getFeatureLevelRequirement`
- ✅ Verifica `playerLevel` do player store
- ✅ Exibe `FeatureLevelLock` se nível < 5
- ✅ Usa `playerLevel` como fonte de verdade

#### ArsenalPage.tsx
- ✅ Importa `canAccessFeature` e `getFeatureLevelRequirement`
- ✅ Verifica `playerLevel` do player store
- ✅ Exibe `FeatureLevelLock` se nível < 10
- ✅ Usa `playerLevel` como fonte de verdade

#### LuxuryshowroomPage.tsx
- ✅ Importa `canAccessFeature` e `getFeatureLevelRequirement`
- ✅ Verifica `playerLevel` do player store
- ✅ Exibe `FeatureLevelLock` se nível < 15
- ✅ Usa `playerLevel` como fonte de verdade

#### LavagemDeDinheiroPage.tsx
- ✅ Importa `canAccessFeature` e `getFeatureLevelRequirement`
- ✅ Verifica `playerLevel` do player store
- ✅ Exibe `FeatureLevelLock` se nível < 25
- ✅ Usa `playerLevel` como fonte de verdade

#### GangPage.tsx
- ✅ Importa `canAccessFeature` e `getFeatureLevelRequirement`
- ✅ Verifica `playerLevel` do player store
- ✅ Exibe `FeatureLevelLock` se nível < 20
- ✅ Usa `playerLevel` como fonte de verdade

#### TalentsMenu.tsx
- ✅ Importa `usePlayerStore` para obter dados do jogador
- ✅ Usa `player.niveis.playerLevel` como fonte de verdade
- ✅ Atualiza player store ao desbloquear/evoluir talentos
- ✅ Sincroniza dinheiro sujo com player store

### 4. Relação com Barraco

O **nível do Barraco** (`barracoLevel`) é **IGUAL** ao **nível do Jogador** (`playerLevel`):
- Quando o jogador paga suborno no Suborno Ilustrado, o `barracoLevel` aumenta
- O `playerLevel` deve ser sincronizado com `barracoLevel`
- Ambos determinam o acesso às funcionalidades

### 5. Fluxo de Desbloqueio

```
Nível 1: Suborno, Talentos, Giro
Nível 5: Fuga
Nível 10: Arsenal
Nível 15: Loja de Luxo
Nível 20: Gang
Nível 25: Lavagem de Dinheiro
```

## Padrão de Implementação

Cada página segue este padrão:

```typescript
// 1. Importar utilitários
import { canAccessFeature, getFeatureLevelRequirement } from '@/utils/levelRequirements';
import FeatureLevelLock from '@/components/FeatureLevelLock';

// 2. Obter dados do player
const playerLevel = player.niveis.playerLevel || 1;
const requiredLevel = getFeatureLevelRequirement('feature-key');
const isFeatureUnlocked = canAccessFeature(playerLevel, 'feature-key');

// 3. Verificar acesso
if (!isFeatureUnlocked) {
  return (
    <FeatureLevelLock
      playerLevel={playerLevel}
      requiredLevel={requiredLevel}
      featureName="Nome da Funcionalidade"
      onNavigateToBarraco={() => navigate('/barraco')}
    />
  );
}

// 4. Renderizar conteúdo normal
```

## Próximas Etapas (Opcional)

1. **Sincronizar playerLevel com barracoLevel** - Garantir que ambos estejam sempre sincronizados
2. **Adicionar animações de desbloqueio** - Quando um nível é atingido
3. **Notificações de desbloqueio** - Avisar o jogador quando novas funcionalidades são desbloqueadas
4. **Progressão visual** - Mostrar quais funcionalidades estão próximas de desbloquear

## Testes Recomendados

- [ ] Verificar se Suborno está acessível no nível 1
- [ ] Verificar se Fuga está bloqueada até nível 5
- [ ] Verificar se Arsenal está bloqueado até nível 10
- [ ] Verificar se Loja de Luxo está bloqueada até nível 15
- [ ] Verificar se Gang está bloqueado até nível 20
- [ ] Verificar se Lavagem está bloqueada até nível 25
- [ ] Verificar se Talentos está acessível no nível 1
- [ ] Verificar se Giro está acessível no nível 1
- [ ] Verificar se o botão "Ir para Barraco" funciona
- [ ] Verificar se a barra de progresso atualiza corretamente
