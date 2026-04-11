# Sistema de Poder - Documentação Técnica

## Visão Geral

O Sistema de Poder é a arquitetura central do jogo que gerencia:
- **Skills** (Habilidades): Attack, Defense, Intelligence, Agility, Respect, Vigor
- **Investments** (Investimentos): War, Laundering, Fuga, Faction, Luxury, Comando
- **Gang Members** (Membros da Quadrilha): Frente, Muralha, Nitro, Certeiro, WiFi
- **Faction** (Facção): Sistema social coletivo de jogadores
- **Battle Stats** (Estatísticas de Batalha): Poder total, saúde, chances críticas
- **Progression** (Progressão): Leveling, experiência, pontos de skill/investimento

## Arquitetura

### Arquivos Principais

```
src/
├── types/
│   └── powerSystem.ts                 # Tipos e interfaces
├── Services/
│   ├── powerCalculationService.ts     # Cálculos de poder
│   ├── gangService.ts                 # Gerenciamento de quadrilha
│   ├── factionService.ts              # Gerenciamento de facção
│   ├── progressionService.ts          # Leveling e experiência
│   └── playerStateService.ts          # Estado central do jogador
└── store/
    └── powerSystemStore.ts            # Zustand store (estado global)
```

## Tipos Principais

### PlayerSkills
```typescript
{
  attack: number;        // Dano base
  defense: number;       // Redução de dano
  intelligence: number;  // Bônus em operações
  agility: number;       // Velocidade e esquiva
  respect: number;       // Influência social
  vigor: number;         // Resistência e saúde
}
```

### PlayerInvestments
```typescript
{
  war: number;           // Bônus de ataque
  laundering: number;    // Geração de renda
  fuga: number;          // Velocidade de escape
  faction: number;       // Bônus coletivo
  luxury: number;        // Respeito e status
  comando: number;       // Liderança da quadrilha
}
```

### GangMembers
```typescript
{
  frente: GangMember;    // Defesa
  muralha: GangMember;   // Proteção
  nitro: GangMember;     // Velocidade/Ataque
  certeiro: GangMember;  // Precisão/Inteligência
  wifi: GangMember;      // Informações/Suporte
}
```

### BattleStats
```typescript
{
  totalPower: number;
  attackPower: number;
  defensePower: number;
  intelligencePower: number;
  agilityPower: number;
  respectPower: number;
  vigorPower: number;
  healthPoints: number;
  maxHealthPoints: number;
  criticalChance: number;
  dodgeChance: number;
  damageReduction: number;
  timestamp: number;
}
```

## Cálculos de Poder

### Fórmula Principal

```
Total Power = (Base Skills + Skill Bonuses + Investment Bonuses + 
               Gang Member Bonuses + Faction Bonus) * Level Multiplier
```

### Componentes

1. **Base Skills Power**: `skill_value * 1.5`
2. **Skill Bonuses**: `base_bonus + skill_value * percent_bonus`
3. **Investment Bonuses**: `base_bonus + investment_value * percent_bonus`
4. **Gang Member Bonuses**: `member_level * bonus_per_level * bonus_multiplier`
5. **Faction Bonus**: `base_skills_power * (faction_level * 0.05)`
6. **Level Multiplier**: `1 + (player_level - 1) * 0.1`

### Exemplo de Cálculo

```typescript
import { calculateTotalPower } from '@/Services/powerCalculationService';

const skills = {
  attack: 10,
  defense: 8,
  intelligence: 5,
  agility: 6,
  respect: 4,
  vigor: 9
};

const investments = {
  war: 5,
  laundering: 3,
  fuga: 4,
  faction: 2,
  luxury: 3,
  comando: 6
};

const gangMembers = initializeGangMembers(); // Todos nível 1
const factionLevel = 5;
const playerLevel = 20;

const powerBreakdown = calculateTotalPower(
  skills,
  investments,
  gangMembers,
  factionLevel,
  playerLevel
);

console.log(powerBreakdown.totalPower); // Poder total
console.log(powerBreakdown.details);   // Breakdown detalhado
```

## Serviços

### powerCalculationService.ts

**Funções Principais:**
- `calculateTotalPower()` - Calcula poder total com breakdown
- `calculateBattleStats()` - Calcula estatísticas de batalha
- `createBattleSnapshot()` - Cria snapshot completo para batalha
- `applySkillBonus()` - Aplica bônus de skill a um valor
- `applyInvestmentBonus()` - Aplica bônus de investimento
- `applyGangMemberBonus()` - Aplica bônus de membro
- `applyFactionBonus()` - Aplica bônus de facção

### gangService.ts

**Funções Principais:**
- `initializeGangMembers()` - Cria quadrilha inicial
- `addGangMemberExperience()` - Adiciona XP a um membro
- `addGangExperience()` - Adiciona XP a toda quadrilha
- `damageGangMember()` - Aplica dano a um membro
- `healGangMember()` - Cura um membro
- `reviveGangMember()` - Revive um membro
- `calculateGangBonus()` - Calcula bônus total da quadrilha
- `getGangStats()` - Retorna estatísticas gerais

### factionService.ts

**Funções Principais:**
- `createFaction()` - Cria nova facção
- `addMemberToFaction()` - Adiciona membro à facção
- `removeMemberFromFaction()` - Remove membro
- `transferLeadership()` - Transfere liderança
- `addFactionExperience()` - Adiciona XP à facção
- `addToFactionTreasury()` - Adiciona dinheiro ao tesouro
- `removeFromFactionTreasury()` - Remove dinheiro do tesouro
- `getFactionBonus()` - Retorna bônus de facção
- `getFactionStats()` - Retorna estatísticas

### progressionService.ts

**Funções Principais:**
- `calculateExperienceForLevel()` - XP necessária para um nível
- `calculateLevelFromExperience()` - Nível baseado em XP total
- `addExperience()` - Adiciona XP e retorna leveling info
- `calculateSkillPointsForLevel()` - Pontos de skill por nível
- `calculateInvestmentPointsForLevel()` - Pontos de investimento por nível
- `getProgressionInfo()` - Informações detalhadas de progressão

### playerStateService.ts

**Funções Principais:**
- `createPlayerState()` - Cria novo estado de jogador
- `updatePlayerSkill()` - Atualiza um skill
- `updatePlayerInvestment()` - Atualiza um investimento
- `addPlayerExperience()` - Adiciona XP ao jogador
- `spendSkillPoints()` - Gasta pontos de skill
- `spendInvestmentPoints()` - Gasta pontos de investimento
- `createPlayerBattleSnapshot()` - Cria snapshot de batalha
- `getPlayerDetails()` - Retorna informações detalhadas
- `validatePlayerState()` - Valida integridade do estado

## Zustand Store

### usePowerSystemStore

**Estado:**
```typescript
{
  playerId: string | null;
  playerName: string;
  playerLevel: number;
  skills: PlayerSkills;
  skillPoints: number;
  investments: PlayerInvestments;
  investmentPoints: number;
  gangMembers: GangMembers;
  factionId: string | null;
  factionLevel: number;
  battleStats: BattleStats | null;
  lastBattleSnapshot: BattleSnapshot | null;
  powerBreakdown: PowerCalculationBreakdown | null;
}
```

**Ações:**
```typescript
// Inicialização
initializePlayer(playerId, playerName, playerLevel)

// Skills
updateSkill(skill, value)
addSkillPoints(points)
spendSkillPoints(skill, amount)

// Investments
updateInvestment(investment, value)
addInvestmentPoints(points)
spendInvestmentPoints(investment, amount)

// Gang
updateGangMembers(gangMembers)

// Faction
setFaction(factionId, factionLevel)

// Leveling
updatePlayerLevel(level)

// Cálculos
recalculatePower()
createSnapshot()

// Reset
reset()
```

**Seletores:**
```typescript
selectTotalPower(state)
selectCurrentHealth(state)
selectMaxHealth(state)
selectSkillsInfo(state)
selectInvestmentsInfo(state)
selectGangInfo(state)
selectFactionInfo(state)
selectBattleStats(state)
selectPowerBreakdown(state)
```

## Uso Prático

### Exemplo 1: Inicializar Jogador

```typescript
import { usePowerSystemStore } from '@/store/powerSystemStore';

const store = usePowerSystemStore();

store.initializePlayer('player_123', 'João', 1);
```

### Exemplo 2: Aumentar Skill

```typescript
// Opção 1: Usar store
store.spendSkillPoints('attack', 5);

// Opção 2: Usar serviço diretamente
import { updatePlayerSkill } from '@/Services/playerStateService';

const newState = updatePlayerSkill(currentState, 'attack', 15);
```

### Exemplo 3: Adicionar Experiência

```typescript
import { usePowerSystemStore } from '@/store/powerSystemStore';

const store = usePowerSystemStore();
const state = store.getState();

// Adicionar 500 XP
const result = addPlayerExperience(state, 500);

if (result.leveledUp) {
  console.log(`Subiu ${result.levelsGained} níveis!`);
  console.log(`Ganhou ${result.skillPointsGained} pontos de skill`);
}
```

### Exemplo 4: Criar Snapshot de Batalha

```typescript
import { createPlayerBattleSnapshot } from '@/Services/playerStateService';

const snapshot = createPlayerBattleSnapshot(playerState);

console.log(snapshot.battleStats.totalPower);
console.log(snapshot.battleStats.healthPoints);
```

### Exemplo 5: Gerenciar Quadrilha

```typescript
import { 
  addGangMemberExperience,
  damageGangMember,
  calculateGangBonus 
} from '@/Services/gangService';

// Adicionar XP a um membro
const result = addGangMemberExperience(gangMembers.frente, 100);
if (result.leveledUp) {
  console.log(`Frente subiu ${result.newLevels} níveis!`);
}

// Aplicar dano
const damagedMember = damageGangMember(gangMembers.nitro, 25);

// Calcular bônus total
const bonus = calculateGangBonus(gangMembers);
```

### Exemplo 6: Gerenciar Facção

```typescript
import { 
  createFaction,
  addMemberToFaction,
  addFactionExperience,
  getFactionStats 
} from '@/Services/factionService';

// Criar facção
const faction = createFaction('Minha Facção', 'Descrição', 'player_123');

// Adicionar membro
const updated = addMemberToFaction(faction, 'player_456');

// Adicionar XP
const result = addFactionExperience(updated, 1000);

// Obter estatísticas
const stats = getFactionStats(result.faction);
console.log(stats.level);
console.log(stats.bonusPercentage);
```

## Integração com Outros Sistemas

### Com Ataque
- Usar `BattleSnapshot` para comparar poder
- Usar `calculateBattleStats()` para determinar dano

### Com Lavagem de Dinheiro
- Usar `investments.laundering` para bônus de renda
- Usar `applyInvestmentBonus()` para cálculos

### Com Fuga
- Usar `investments.fuga` para velocidade
- Usar `skills.agility` para chance de escape

### Com Hierarquia
- Usar `skills.respect` para posição
- Usar `factionLevel` para influência

### Com Barraco
- Usar `gangMembers` para defesa
- Usar `battleStats` para resistência

### Com Header
- Usar `selectTotalPower()` para exibir poder
- Usar `selectCurrentHealth()` para exibir saúde
- Usar `selectBattleStats()` para estatísticas

## Configurações e Balanceamento

### Multiplicadores Base
```typescript
SKILL_POWER_MULTIPLIER = 1.5
INVESTMENT_POWER_MULTIPLIER = 2.0
GANG_MEMBER_POWER_MULTIPLIER = 0.8
FACTION_BONUS_BASE = 0.05 (5% por nível)
```

### Limites
```typescript
PLAYER_LEVEL_CAP = 100
GANG_MEMBER_LEVEL_CAP = 50
FACTION_LEVEL_CAP = 50
FACTION_MEMBER_LIMIT = 50
```

### Experiência
```typescript
BASE_EXPERIENCE_PER_LEVEL = 1000
EXPERIENCE_SCALING_FACTOR = 1.15 (15% mais XP por nível)
GANG_MEMBER_EXPERIENCE_PER_LEVEL = 1000
FACTION_EXPERIENCE_PER_LEVEL = 5000
```

## Próximos Passos

1. **Integração com Ataque**: Usar `BattleSnapshot` para cálculos de dano
2. **Integração com Lavagem**: Usar `investments.laundering` para renda
3. **Integração com Fuga**: Usar `investments.fuga` para velocidade
4. **Integração com Hierarquia**: Usar `skills.respect` para posição
5. **Integração com Barraco**: Usar `gangMembers` para defesa
6. **UI de Poder**: Criar componentes para exibir poder e estatísticas
7. **Balanceamento**: Ajustar multiplicadores e limites conforme necessário

## Notas Importantes

- Todos os cálculos são **determinísticos** (mesma entrada = mesma saída)
- O sistema é **escalável** e preparado para futuras expansões
- Todos os valores são **validados** antes de serem aplicados
- O estado é **imutável** (funções retornam novos objetos)
- Snapshots de batalha são **imutáveis** e servem como referência histórica
