# Sistema de Talentos do Crime - Documentação Completa

## 📋 Visão Geral

O Sistema de Talentos do Crime é um sistema de progressão profundo que oferece 20 habilidades desbloqueáveis por nível, cada uma evoluível de 1 a 5 (exceto a última). Os efeitos são aplicados automaticamente em todas as mecânicas do jogo.

## 🎯 Arquitetura

### Estrutura de Arquivos

```
/src/
├── store/
│   ├── talentStore.ts (Zustand store básico)
│   └── playerTalentsStore.ts (Store persistente com cooldowns)
├── utils/
│   └── talentEffects.ts (Funções de cálculo de efeitos)
├── components/
│   ├── TalentsMenu.tsx (Interface principal)
│   ├── TalentNotification.tsx (Notificações em gíria)
│   ├── TalentProgressTracker.tsx (Rastreador de progresso)
│   ├── TalentSystemGuide.tsx (Guia completo)
│   ├── TalentIntegration.tsx (Integração com mecânicas)
│   └── pages/TalentsPage.tsx (Página de talentos)
├── hooks/
│   └── useTalentEffects.ts (Hook customizado)
├── data/
│   └── talents.ts (Dados dos talentos)
└── entities/
    └── talentosdocrime.d.ts (Tipos TypeScript)
```

## 🔧 Como Usar

### 1. Desbloquear um Talento

```typescript
import { usePlayerTalentsStore } from '@/store/playerTalentsStore';

const store = usePlayerTalentsStore();

// Desbloquear um talento
store.addUnlockedTalent({
  talentId: 'talent-1',
  skillName: 'Cria Esperto',
  currentLevel: 1,
  unlockedAt: new Date(),
});
```

### 2. Evoluir um Talento

```typescript
store.upgradeTalent('talent-1');
```

### 3. Aplicar Efeitos em Mecânicas

#### Slot Machine
```typescript
import { useTalentEffects } from '@/hooks/useTalentEffects';

const { applySlotBonusMultiplier, applySlotGainsMultiplier } = useTalentEffects();

// Calcular ganhos da slot
let slotWinnings = 1000;
const bonusChance = applySlotBonusMultiplier();
if (Math.random() < bonusChance) {
  slotWinnings *= 2; // Bônus duplo
}
slotWinnings *= applySlotGainsMultiplier(); // Coroa Suprema
```

#### Prisão
```typescript
const { applyPrisonTimeReduction, applyPrisonMoneyLossReduction } = useTalentEffects();

const prisonTime = applyPrisonTimeReduction(3600); // 1 hora
const moneyLoss = applyPrisonMoneyLossReduction(50000);
```

#### Lavagem de Dinheiro
```typescript
const { applyLaundryTimeReduction, applyLaundryCleanMoneyBonus } = useTalentEffects();

const laundryTime = applyLaundryTimeReduction(300); // 5 minutos
const cleanMoney = applyLaundryCleanMoneyBonus(100000);
```

#### Facção
```typescript
const { getAdditionalParallelSlots, applyFactionMemberXPBonus } = useTalentEffects();

const extraSlots = getAdditionalParallelSlots();
const memberXP = applyFactionMemberXPBonus(1000);
```

### 4. Verificar Habilidades Especiais

```typescript
const { canUseEyeAbility, canUseWarStrategy, canUseShadowAbility } = useTalentEffects();

if (canUseEyeAbility()) {
  // Transformar viatura em dinheiro
}

if (canUseWarStrategy()) {
  // Roubar dinheiro de alvo
}

if (canUseShadowAbility()) {
  // Travar lavagem de adversário
}
```

## 📊 Talentos Disponíveis

### Nível 1 - Cria Esperto (Atividade)
- **Efeito**: +5% a +25% de chance de bônus duplo na slot
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 5 - Fuga na Mão (Contenção)
- **Efeito**: Reduz tempo de prisão em 10% a 50%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 10 - Olho Vivo (Antena)
- **Efeito**: 1x por dia, transforma uma viatura da slot em dinheiro
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5
- **Cooldown**: 24 horas

### Nível 15 - Carregador Rápido (Mão de obra)
- **Efeito**: +10% a +50% de dinheiro sujo em missões de transporte
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 20 - Piloto de Fuga (Vapor)
- **Efeito**: +15% a +75% de velocidade de fuga
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 25 - Quebra de Braço (Frente)
- **Efeito**: Reduz perda de dinheiro na prisão em 20% a 100%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 30 - Pele de Aço (Soldado)
- **Efeito**: Reduz chance de ser preso em 10% a 50%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 35 - Mão de Vaca (Gerente de Asfalto)
- **Efeito**: Reduz custo de suborno em 15% a 75%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 40 - Lavagem Rápida (Gerente de Quebrada)
- **Efeito**: Reduz tempo de lavagem em 20% a 100%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 45 - Imposto da Quebrada (Dono da quebrada)
- **Efeito**: +5% a +25% de dinheiro limpo sobre lavagem
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 50 - Networking Sujo (Gerente do Complexo)
- **Efeito**: +1 a +5 slots extras de missão paralela por dia
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5
- **Restrição**: Apenas líder de facção

### Nível 55 - Mercado Negro (Chefe de Complexo)
- **Efeito**: Reduz custo de armas/veículos em 10% a 50%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 60 - Liderança Tóxica (Líder do Complexo)
- **Efeito**: Membros da facção ganham +5% a +25% de XP
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5
- **Restrição**: Apenas líder de facção

### Nível 65 - Contabilidade Criativa (Gerente do comando)
- **Efeito**: Converte 5% a 25% da perda da prisão em dinheiro limpo
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5

### Nível 70 - Intocável (Chefe do comando)
- **Efeito**: Ignora a primeira prisão do dia sem perda
- **Custo**: 1 real (simbólico)
- **Máx Nível**: 1
- **Desbloqueio**: Automático ao atingir nível 70

### Nível 75 - Estratégia de Guerra (Líder do Comando)
- **Efeito**: 1x por semana, rouba 10% a 30% do dinheiro sujo de um alvo
- **Custo**: 1 real (simbólico)
- **Máx Nível**: 1
- **Desbloqueio**: Automático ao atingir nível 75
- **Restrição**: Apenas líder de facção
- **Cooldown**: 7 dias

### Nível 80 - Voz da Razão (Conselheiro)
- **Efeito**: Reduz tempo de resgate de membro preso em 30% a 90%
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 5
- **Restrição**: Apenas líder de facção

### Nível 85 - Marca do Rei (Rei do Complexo)
- **Efeito**: Nome dourado no ranking, NPCs tratam com respeito
- **Custo**: 10.000 dinheiro sujo
- **Máx Nível**: 1
- **Tipo**: Cosmético

### Nível 90 - Sombra do Rei (Vice-rei do comando)
- **Efeito**: 1x por semana, trava lavagem de um adversário por 2 a 6 horas
- **Custo**: 1 real (simbólico)
- **Máx Nível**: 1
- **Desbloqueio**: Automático ao atingir nível 90
- **Restrição**: Apenas líder de facção
- **Cooldown**: 7 dias

### Nível 95 - Herdeiro do Trono (Príncipe do Comando)
- **Efeito**: Revive com 50% a 100% do dinheiro sujo ao ser preso
- **Custo**: 1 real (simbólico)
- **Máx Nível**: 1
- **Desbloqueio**: Automático ao atingir nível 95

### Nível 100 - Coroa Suprema (Rei do Comando)
- **Efeito**: Ativa todos os efeitos das habilidades anteriores permanentemente e dobra os ganhos da slot
- **Custo**: 1 real (simbólico)
- **Máx Nível**: 1
- **Desbloqueio**: Automático ao atingir nível 100
- **Tipo**: Talento Final

## 💰 Custos de Evolução

| Nível | Custo |
|-------|-------|
| 1 → 2 | 10.000 |
| 2 → 3 | 25.000 |
| 3 → 4 | 50.000 |
| 4 → 5 | 100.000 |
| 5 → 6 | 200.000 |

## 🔄 Integração com Mecânicas Existentes

### Slot Machine
- Aplica bônus duplo baseado em Cria Esperto
- Dobra ganhos se Coroa Suprema está ativa

### Prisão
- Reduz tempo com Fuga na Mão
- Reduz perda de dinheiro com Quebra de Braço
- Reduz chance de prisão com Pele de Aço
- Ignora primeira prisão com Intocável
- Converte perda em dinheiro limpo com Contabilidade Criativa
- Revive com dinheiro com Herdeiro do Trono

### Lavagem de Dinheiro
- Reduz tempo com Lavagem Rápida
- Aumenta dinheiro limpo com Imposto da Quebrada

### Suborno
- Reduz custo com Mão de Vaca

### Fuga
- Aumenta velocidade com Piloto de Fuga

### Transporte
- Aumenta ganhos com Carregador Rápido

### Facção
- Adiciona slots com Networking Sujo (apenas líder)
- Reduz custo de armas/veículos com Mercado Negro
- Aumenta XP de membros com Liderança Tóxica (apenas líder)
- Reduz tempo de resgate com Voz da Razão (apenas líder)

## 📱 Interface

### Menu de Talentos
- Abas para "Disponíveis" e "Desbloqueados"
- Visualização de efeitos e custos
- Botões para desbloquear e evoluir
- Barra de progresso de evolução

### Guia Completo
- Seções expansíveis com informações
- Dicas estratégicas
- Tabelas de custos
- Explicação de cada talento

### Rastreador de Progresso
- Total de talentos desbloqueados
- Nível médio de evolução
- Quantidade de talentos máximos

## 🎮 Notificações

Ao desbloquear um talento, o jogador recebe uma notificação em gíria:

- "Desbloqueou a braba: Cria Esperto, menor!"
- "Ó o talento aí! Fuga na Mão tá na conta!"
- "Bora lá! Conseguiu Olho Vivo!"

## 🔐 Restrições

### Talentos de Facção
Alguns talentos só funcionam se o jogador for **líder da facção**:
- Networking Sujo (50)
- Liderança Tóxica (60)
- Estratégia de Guerra (75)
- Sombra do Rei (90)
- Voz da Razão (80)

### Desbloqueio Automático
Estes talentos são desbloqueados automaticamente ao atingir o nível:
- Intocável (70)
- Estratégia de Guerra (75)
- Sombra do Rei (90)
- Herdeiro do Trono (95)
- Coroa Suprema (100)

## 🚀 Próximas Etapas

1. Integrar efeitos em todas as mecânicas do jogo
2. Adicionar persistência de dados do jogador
3. Implementar cooldowns de habilidades especiais
4. Adicionar animações de desbloqueio
5. Criar sistema de conquistas relacionadas a talentos

## 📝 Notas Importantes

- Todos os efeitos são aplicados automaticamente
- Não é necessário ativar manualmente os talentos
- Os cooldowns são rastreados automaticamente
- A persistência é feita via Zustand com localStorage
- Os dados são sincronizados com o CMS

## 🐛 Troubleshooting

### Talento não está aplicando efeito
- Verifique se o talento está desbloqueado
- Confirme se o nível do jogador é suficiente
- Verifique se é um talento de facção e se o jogador é líder

### Notificação não aparece
- Verifique se o componente TalentNotification está renderizado
- Confirme se a mensagem está sendo passada corretamente

### Cooldown não funciona
- Verifique se o talento tem cooldown definido
- Confirme se a data de último uso está sendo atualizada

---

**Versão**: 1.0
**Última Atualização**: 2026-04-10
**Status**: Produção
