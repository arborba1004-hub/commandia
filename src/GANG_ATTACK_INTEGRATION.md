# Sistema de Ataque com Seleção de Membros da Gangue

## Visão Geral

Este documento descreve a integração completa do sistema de ataque com a funcionalidade de seleção de membros da gangue. O sistema permite que jogadores escolham quais membros enviar para um ataque, com cálculo de resultado baseado na comparação entre membros atacantes e defensores.

## Componentes Criados

### 1. **AttackMemberSelector.tsx**
Componente modal para seleção de membros da gangue para envio ao ataque.

**Localização:** `/src/components/gang/AttackMemberSelector.tsx`

**Funcionalidades:**
- Exibe lista de membros ativos disponíveis
- Permite seleção individual ou em lote (selecionar todos)
- Mostra estatísticas em tempo real (quantidade selecionada, poder total)
- Filtra apenas membros com status "ativo"
- Exibe tipo, nível e status de cada membro

**Props:**
```typescript
interface AttackMemberSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMemberIds: string[]) => void;
  isLoading?: boolean;
}
```

### 2. **AttackResultDisplay.tsx**
Componente para exibição detalhada do resultado do ataque.

**Localização:** `/src/components/game/AttackResultDisplay.tsx`

**Funcionalidades:**
- Exibe resultado geral (vitória/derrota)
- Mostra taxa de sucesso do ataque
- Exibe saque obtido (dinheiro sujo, corré, prestígio)
- Mostra perdas de membros (mortos e feridos)
- Comparação de poder atacante vs defensor
- Detalhes de perdas por tipo de membro
- Composição de gangue antes/depois

**Props:**
```typescript
interface AttackResultDisplayProps {
  result: AttackResolution;
  attackerName: string;
  defenderName: string;
}
```

### 3. **MapAttackWithGangModal.tsx**
Modal completo para fluxo de ataque com gangue.

**Localização:** `/src/components/game/MapAttackWithGangModal.tsx`

**Funcionalidades:**
- Fluxo em 3 fases: Selecionar → Prévia → Resultado
- Seleção de membros com interface intuitiva
- Prévia do ataque com estimativas
- Exibição de resultado detalhado
- Integração com stores de gangue e jogador

**Props:**
```typescript
interface MapAttackWithGangModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: AttackTarget | null;
  onAttackConfirmed?: (result: any) => void;
}
```

## Serviços Criados

### 1. **attackResolverService.ts**
Serviço de resolução de ataques com cálculo de casualidades.

**Localização:** `/src/services/attackResolverService.ts`

**Funções Principais:**

#### `resolveAttackWithGangMembers(input: AttackResolverInput): AttackResolution`
Resolve um ataque completo com base nos membros selecionados.

**Parâmetros:**
```typescript
interface PlayerAttackData {
  playerId: string;
  playerName: string;
  level: number;
  attack: number;
  agility: number;
  defense: number;
  resistance: number;
  prestige: number;
  dirtyMoney: number;
  gang?: GangStateSnapshot | null;
  selectedMemberIds?: string[];
}

interface AttackResolverInput {
  attacker: PlayerAttackData;
  defender: PlayerAttackData;
}
```

**Retorno:**
```typescript
interface AttackResolution {
  success: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  critical?: boolean;
  spoils: SpoilsResult;
  attackerGangLosses?: GangBattleCasualtyResult;
  defenderGangLosses?: GangBattleCasualtyResult;
  attackerGangStats?: GangBattleCompositionStats;
  defenderGangStats?: GangBattleCompositionStats;
}
```

#### `estimateAttackOutcome(input: AttackResolverInput): EstimationResult`
Estima o resultado de um ataque sem executá-lo.

**Retorno:**
```typescript
{
  estimatedChance: number;      // 0-1
  estimatedLoot: number;        // Dinheiro estimado
  estimatedCasualties: number;  // Membros perdidos estimados
}
```

#### `calculateAttackChance(attackerPower: number, defenderPower: number): number`
Calcula a chance de sucesso do ataque (0-1).

## Hook Customizado

### **useMapAttackWithGang.ts**
Hook para gerenciar o fluxo completo de ataque com gangue.

**Localização:** `/src/hooks/useMapAttackWithGang.ts`

**Funcionalidades:**
- Gerencia estado do modal
- Controla seleção de membros
- Executa ataque e resolve resultado
- Integra com stores de gangue e ataque

**Retorno:**
```typescript
{
  isModalOpen: boolean;
  selectedTarget: AttackTarget | null;
  isResolving: boolean;
  selectedMemberIds: string[];
  openAttackModal: (target: AttackTarget) => void;
  closeAttackModal: () => void;
  estimateAttack: (memberIds: string[]) => EstimationResult | null;
  executeAttack: (memberIds: string[]) => Promise<boolean>;
}
```

## Integração com Componentes Existentes

### Como Usar em Componentes de Mapa/Ataque

```typescript
import { useMapAttackWithGang } from '@/hooks/useMapAttackWithGang';
import MapAttackWithGangModal from '@/components/game/MapAttackWithGangModal';

function GameMap() {
  const {
    isModalOpen,
    selectedTarget,
    openAttackModal,
    closeAttackModal,
    executeAttack,
  } = useMapAttackWithGang();

  const handlePlayerClick = (target: AttackTarget) => {
    openAttackModal(target);
  };

  return (
    <>
      {/* Seu mapa aqui */}
      <MapAttackWithGangModal
        isOpen={isModalOpen}
        onClose={closeAttackModal}
        target={selectedTarget}
        onAttackConfirmed={(result) => {
          console.log('Ataque confirmado:', result);
          // Processar resultado
        }}
      />
    </>
  );
}
```

## Fluxo de Dados

### 1. Seleção de Membros
```
Jogador clica em alvo
  ↓
Modal abre com lista de membros ativos
  ↓
Jogador seleciona membros
  ↓
Sistema estima resultado
```

### 2. Resolução de Ataque
```
Jogador confirma ataque
  ↓
Sistema filtra membros selecionados
  ↓
Calcula estatísticas de gangue (atacante e defensor)
  ↓
Resolve ataque usando mapAttackResolver
  ↓
Calcula casualidades de membros
  ↓
Exibe resultado detalhado
```

### 3. Cálculo de Poder
```
Poder Atacante = Poder Pessoal + Poder de Gangue
  ├─ Poder Pessoal = attack + (agility × 0.5) + (prestige × 0.1)
  └─ Poder de Gangue = (rajada × 1.15) + (quebra × 1.2) + ...

Poder Defensor = Poder Pessoal + Poder de Gangue
  ├─ Poder Pessoal = defense + (resistance × 0.7) + (prestige × 0.08)
  └─ Poder de Gangue = (blindagem × 1.2) + (folego × 1.05) + ...

Taxa de Sucesso = Poder Atacante / (Poder Atacante + Poder Defensor)
```

## Integração com Stores

### PlayerStore
- `player.gangMembers`: Lista de membros da gangue
- `player.skills`: Habilidades do jogador (attack, defense, agility, resistance)
- `player.balances.dirtyMoney`: Dinheiro sujo (alvo de saque)
- `player.power`: Prestígio do jogador

### GangStore
- `gang.members`: Lista completa de membros
- `gang.ct.level`: Nível de CT (afeta casualidades)
- `getBattleStats()`: Calcula estatísticas de batalha

### MapAttackStore
- `setResolution()`: Define resultado do ataque
- `startReturn()`: Inicia retorno da gangue
- `finishAttack()`: Finaliza ataque

## Cálculo de Casualidades

O sistema usa `resolveGangCasualties` do `gangWarCalculationService` para calcular:

1. **Membros Mortos**: Baseado em poder inimigo vs defesa própria
2. **Membros Feridos**: Baseado em dano residual
3. **Preservados pelo Médico**: Membros salvos por médicos na gangue

Cada tipo de membro tem resistência diferente baseada em seu papel:
- **Ofensivos** (assassino, executor): Alta mortalidade
- **Defensivos** (muralha): Baixa mortalidade
- **Suporte** (médico): Proteção adicional

## Exemplo de Uso Completo

```typescript
import { useMapAttackWithGang } from '@/hooks/useMapAttackWithGang';
import MapAttackWithGangModal from '@/components/game/MapAttackWithGangModal';

function GamePage() {
  const {
    isModalOpen,
    selectedTarget,
    openAttackModal,
    closeAttackModal,
  } = useMapAttackWithGang();

  const handleAttackTarget = (target: AttackTarget) => {
    // Verificar se jogador tem gangue
    if (!gang?.members?.length) {
      showError('Você não possui membros na gangue');
      return;
    }

    // Abrir modal de seleção
    openAttackModal(target);
  };

  return (
    <>
      <div className="game-map">
        {/* Renderizar alvos clicáveis */}
        {targets.map((target) => (
          <button
            key={target.playerId}
            onClick={() => handleAttackTarget(target)}
          >
            {target.playerName}
          </button>
        ))}
      </div>

      <MapAttackWithGangModal
        isOpen={isModalOpen}
        onClose={closeAttackModal}
        target={selectedTarget}
        onAttackConfirmed={(result) => {
          // Processar resultado
          if (result.success) {
            // Adicionar saque ao jogador
            player.addDirtyMoney(result.loot);
            // Aplicar casualidades
            gang.applyBattleLossesToBackend(result.attackerGangLosses);
          }
        }}
      />
    </>
  );
}
```

## Próximos Passos

1. **Integrar com API Backend**: Enviar resultado do ataque para servidor
2. **Sincronizar Casualidades**: Aplicar perdas de membros no backend
3. **Notificações**: Notificar defensor sobre ataque recebido
4. **Histórico**: Registrar ataque no histórico de batalhas
5. **Retaliation**: Permitir retaliação do defensor
6. **Cooldown**: Implementar cooldown entre ataques

## Troubleshooting

### Problema: Membros não aparecem na seleção
**Solução**: Verificar se `gang.members` está carregado e se existem membros com status "ativo"

### Problema: Resultado não é exibido
**Solução**: Verificar se `setResolution` foi chamado corretamente no `mapAttackStore`

### Problema: Casualidades incorretas
**Solução**: Verificar se `buildGangBattleCompositionStats` está calculando corretamente

## Referências

- `mapAttackResolver.ts`: Lógica de resolução de ataque
- `gangWarCalculationService.ts`: Cálculo de casualidades
- `gangStore.ts`: Gerenciamento de gangue
- `playerStore.ts`: Gerenciamento de jogador
- `mapAttackStore.ts`: Gerenciamento de estado de ataque
