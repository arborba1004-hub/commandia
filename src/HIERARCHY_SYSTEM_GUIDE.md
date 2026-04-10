# Sistema Hierárquico de Cargos - Guia Completo

## 📋 Visão Geral

O sistema hierárquico implementa 21 cargos progressivos para jogadores, baseados no nível do barraco (1-100, a cada 5 níveis). Cada promoção é acompanhada de notificações visuais, animações e persistência de dados.

## 🎖️ Cargos Disponíveis

| Nível | Cargo | Ícone | Cor | Gíria |
|-------|-------|-------|-----|-------|
| 1 | Atividade | 🟢 | Verde | "Tá começando a jornada, mano!" |
| 5 | Contenção | 🟡 | Amarelo | "Tá segurando a onda, irmão!" |
| 10 | Antena | 📡 | Azul | "Tá ligado em tudo, patrão!" |
| 15 | Mão de obra | 🔨 | Laranja | "Tá trabalhando pesado, guerreiro!" |
| 20 | Vapor | 💨 | Rosa | "Tá voando alto, mano!" |
| 25 | Frente | 🎯 | Roxo | "Tá na frente da batalha, soldado!" |
| 30 | Soldado | ⚔️ | Vermelho | "Tá pronto pro combate, guerreiro!" |
| 35 | Gerente de Asfalto | 🛣️ | Índigo | "Tá mandando na rua, chefe!" |
| 40 | Gerente de Quebrada | 🏘️ | Teal | "Tá dominando a quebrada, patrão!" |
| 45 | Dono da quebrada | 👑 | Laranja | "Tá dono da quebrada, rei!" |
| 50 | Gerente do Complexo | 🏢 | Ciano | "Tá gerenciando o complexo, mestre!" |
| 55 | Chefe de Complexo | 🏛️ | Roxo | "Tá chefão do complexo, patrão!" |
| 60 | Líder do Complexo | 🎖️ | Amarelo | "Tá liderando o complexo, general!" |
| 65 | Gerente do comando | 📋 | Verde | "Tá gerenciando o comando, capitão!" |
| 70 | Chefe do comando | ⚡ | Rosa | "Tá chefão do comando, mestre!" |
| 75 | Líder do Comando | 🔱 | Ciano | "Tá liderando o comando, imperador!" |
| 80 | Conselheiro | 🧙 | Roxo | "Tá aconselhando os guerreiros, sábio!" |
| 85 | Rei do Complexo | 👑 | Amarelo | "Tá reinando no complexo, majestade!" |
| 90 | Vice-rei do comando | 🏆 | Rosa | "Tá vice-reinando o comando, nobre!" |
| 95 | Príncipe do Comando | 💎 | Ciano | "Tá príncipe do comando, alteza!" |
| 100 | Rei do Comando | 👑 | Amarelo | "Tá rei do comando, sua majestade!" |

## 📁 Arquivos Criados

### 1. `/src/utils/hierarchySystem.ts`
Arquivo utilitário com funções principais:
- `getPlayerRank(level)` - Obtém o cargo atual baseado no nível
- `checkRankPromotion(previousLevel, newLevel)` - Verifica se houve promoção
- `getUnlockedRanks(level)` - Retorna todos os cargos desbloqueados
- `getNextRank(level)` - Obtém o próximo cargo
- `getLevelsUntilNextRank(level)` - Calcula níveis até próxima promoção

### 2. `/src/components/RankPromotionNotification.tsx`
Componente de notificação com:
- Animação de promoção com glow effect
- Confetti animado
- Exibição do cargo e gíria
- Auto-fechamento após 5 segundos

### 3. `/src/components/HierarchyBadgesDisplay.tsx`
Componente de exibição de distintivos:
- Mostra cargo atual com destaque
- Grid de todos os 21 distintivos
- Indicador de desbloqueados vs bloqueados
- Barra de progresso hierárquico
- Mostra níveis faltantes para próximos cargos

### 4. Atualizações no PlayerStore
Novos campos adicionados:
- `currentRank?: string` - Cargo atual do jogador
- `unlockedRanks?: string[]` - Lista de cargos desbloqueados

Novas ações:
- `setCurrentRank(rank)` - Define o cargo atual
- `addUnlockedRank(rank)` - Adiciona cargo à lista de desbloqueados

### 5. Atualizações no GamePage
- Integração do sistema de promoção
- Monitoramento de mudanças de nível
- Exibição do cargo no nome flutuante do jogador
- Exibição do cargo nos nomes flutuantes de outros jogadores
- Notificação visual ao atingir novo cargo

### 6. Atualizações no ProfilePage
- Integração do componente `HierarchyBadgesDisplay`
- Exibição de todos os distintivos desbloqueados
- Visualização do cargo atual com destaque

## 🔄 Fluxo de Funcionamento

### Quando um jogador sobe de nível:

1. **Detecção** - GamePage monitora mudanças em `playerState.niveis.barracoLevel`
2. **Verificação** - `checkRankPromotion()` verifica se houve promoção
3. **Atualização** - Store atualiza `currentRank` e `unlockedRanks`
4. **Notificação** - `RankPromotionNotification` exibe animação
5. **Persistência** - Dados salvos no localStorage e sincronizados com backend

## 🎨 Componentes Visuais

### RankPromotionNotification
- **Glow Effect**: Aura animada ao redor do card
- **Confetti**: 20 partículas caindo com cores do cargo
- **Stars**: 6 estrelas orbitando o card
- **Card**: Exibe ícone, título, gíria e nível

### HierarchyBadgesDisplay
- **Current Rank**: Card destacado com cargo atual
- **Badges Grid**: 5 colunas responsivas com todos os cargos
- **Progress Bar**: Barra visual de progresso hierárquico
- **Unlock Info**: Mostra quantos níveis faltam para próximos cargos

## 💾 Persistência de Dados

Os dados são persistidos em 3 níveis:

1. **localStorage** - Cache local imediato
2. **playerStore** - Estado global da aplicação
3. **Backend** - Sincronização automática via `syncPlayerToBackend()`

## 🎮 Integração com GamePage

### Nome Flutuante com Cargo
```typescript
const playerRank = getPlayerRank(playerState?.niveis?.barracoLevel || 1);
const label = createTextLabel(displayName, playerRank.title);
```

Exibe: `NOME_JOGADOR (CARGO)`

### Monitoramento de Promoção
```typescript
useEffect(() => {
  const promotion = checkRankPromotion(previousLevel, currentLevel);
  if (promotion) {
    setPromotionRank(promotion);
    setShowPromotion(true);
    setCurrentRank(promotion.title);
    addUnlockedRank(promotion.title);
  }
}, [playerState?.niveis?.barracoLevel]);
```

## 📊 Integração com ProfilePage

A página de perfil exibe:
- Cargo atual com ícone e cor
- Grid de todos os 21 distintivos
- Indicador visual de desbloqueados
- Barra de progresso geral

## 🔮 Funcionalidades Futuras (Placeholders)

O código inclui placeholders para:
- **Comportamento de NPCs** - Ajustar diálogos baseado no cargo
- **Conquistas Globais** - Notificar quando primeiro jogador atinge cargo
- **Bônus de Cargo** - Aplicar bônus de skills baseado no cargo
- **Evolução Visual da Casa** - Sincronizar com níveis 10, 20, 30, 40, 50, 60, 70, 80, 90, 100

## 🚀 Como Usar

### Verificar Cargo Atual
```typescript
import { getPlayerRank } from '@/utils/hierarchySystem';

const rank = getPlayerRank(playerLevel);
console.log(rank.title); // "Rei do Comando"
console.log(rank.icon); // "👑"
console.log(rank.color); // "#fbbf24"
```

### Verificar Promoção
```typescript
import { checkRankPromotion } from '@/utils/hierarchySystem';

const promotion = checkRankPromotion(45, 50);
if (promotion) {
  console.log(`Parabéns! Você é agora ${promotion.title}!`);
}
```

### Obter Cargos Desbloqueados
```typescript
import { getUnlockedRanks } from '@/utils/hierarchySystem';

const unlocked = getUnlockedRanks(75);
console.log(unlocked.length); // 16 cargos desbloqueados
```

## 🎯 Regras Implementadas

✅ 21 cargos hierárquicos (1-100, a cada 5 níveis)
✅ Notificação com gíria da quebrada
✅ Animação de comemoração
✅ Efeito visual temporário (confetti + glow)
✅ Cargo exibido no perfil
✅ Cargo exibido no nome flutuante
✅ Persistência no playerStore
✅ Distintivos para cada nível
✅ Exibição de distintivos na ProfilePage
✅ Evolução visual da casa mantida (níveis 10, 20, 30, 40, 50, 60, 70, 80, 90, 100)

## 📝 Notas Importantes

1. **Sincronização**: Os dados são sincronizados automaticamente com o backend
2. **Responsividade**: Todos os componentes são totalmente responsivos
3. **Performance**: Animações otimizadas com Framer Motion
4. **Acessibilidade**: Cores contrastantes e textos descritivos
5. **Persistência**: Dados salvos mesmo após refresh da página

## 🐛 Troubleshooting

### Cargo não atualiza
- Verifique se `playerState.niveis.barracoLevel` está sendo atualizado
- Confirme que `previousLevelRef` está sendo inicializado corretamente

### Notificação não aparece
- Verifique se `RankPromotionNotification` está renderizado no GamePage
- Confirme que `showPromotion` está sendo setado como `true`

### Distintivos não aparecem
- Verifique se `HierarchyBadgesDisplay` está renderizado no ProfilePage
- Confirme que `playerState.unlockedRanks` está sendo populado

## 📞 Suporte

Para adicionar novas funcionalidades ou modificar o sistema, edite:
- `/src/utils/hierarchySystem.ts` - Lógica principal
- `/src/components/RankPromotionNotification.tsx` - Notificações
- `/src/components/HierarchyBadgesDisplay.tsx` - Exibição de distintivos
