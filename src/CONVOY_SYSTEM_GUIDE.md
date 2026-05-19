# Sistema de Comboio - Guia Completo

## Visão Geral

O sistema de comboio gerencia a movimentação de tropas após um ataque, desde o centro do barraco do atacante até o centro do barraco do atacado. O deslocamento ocorre através de tiles no menor caminho possível, com movimento permitido na diagonal, vertical e horizontal.

## Componentes Principais

### 1. **ConvoyPathfinding** (`convoyPathfinding.ts`)
Responsável pelo cálculo do caminho mais curto entre dois barracos.

**Características:**
- Algoritmo A* para pathfinding
- Suporta 8 direções (diagonal, horizontal, vertical)
- Calcula o menor número de tiles entre dois pontos
- Conversão entre coordenadas de mundo e tiles

**Uso:**
```typescript
import { ConvoyPathfinder } from '@/services/convoyPathfinding';

// Encontrar caminho entre dois pontos
const path = ConvoyPathfinder.findPath(
  { x: 0, y: 0 },      // Tile inicial
  { x: 10, y: 10 },    // Tile final
  { width: 100, height: 100 } // Limites do mapa em tiles
);

// Converter coordenadas
const tileCoord = ConvoyPathfinder.worldToTile({ x: 500, y: 500 }, 50);
const worldCoord = ConvoyPathfinder.tileToWorld({ x: 10, y: 10 }, 50);
```

### 2. **ConvoyMovementService** (`convoyMovementService.ts`)
Calcula a velocidade e tempo de deslocamento baseado no nível do barraco.

**Fórmula de Velocidade:**
- Nível 1: 1x (2 segundos por tile)
- Nível 50: 5x (0.4 segundos por tile)
- Progressão linear entre os níveis

**Uso:**
```typescript
import { ConvoyMovementService } from '@/services/convoyMovementService';

// Calcular multiplicador de velocidade
const speedMultiplier = ConvoyMovementService.calculateSpeedMultiplier(25); // 3x

// Calcular tempo por tile
const timePerTile = ConvoyMovementService.calculateTimePerTile(25); // 666ms

// Calcular duração total
const totalDuration = ConvoyMovementService.calculateTotalDuration(25, 15); // 10 tiles

// Obter configuração completa
const timing = ConvoyMovementService.getMovementTiming({
  barracLevel: 25,
  tileCount: 15
});
```

### 3. **ConvoyStore** (`convoyStore.ts`)
Gerencia o estado de todos os comboios ativos.

**Estado:**
```typescript
interface ConvoyMovement {
  id: string;
  attackerId: string;
  defenderId: string;
  startBarracLevel: number;
  path: TileCoord[];
  startTime: number;
  totalDuration: number;
  timePerTile: number;
  status: 'moving' | 'arrived' | 'cancelled';
  currentProgress: number; // 0 a 1
  currentTileIndex: number;
}
```

**Uso:**
```typescript
import { useConvoyStore } from '@/store/convoyStore';

const { 
  addConvoy, 
  updateConvoy, 
  removeConvoy,
  getConvoysByDefender,
  getConvoysByAttacker 
} = useConvoyStore();

// Adicionar novo comboio
addConvoy(convoyData);

// Atualizar progresso
updateConvoy(convoyId, { currentProgress: 0.5 });

// Obter comboios chegando em um barraco
const incomingConvoys = getConvoysByDefender(barracId);
```

### 4. **ConvoyAttackService** (`convoyAttackService.ts`)
Serviço de alto nível para criar e gerenciar comboios após ataques.

**Uso:**
```typescript
import { ConvoyAttackService } from '@/services/convoyAttackService';

// Criar novo comboio
const convoy = ConvoyAttackService.createConvoy({
  attackerId: 'player-1',
  defenderId: 'player-2',
  attackerBarrac: { x: 100, y: 100, level: 25 },
  defenderBarrac: { x: 500, y: 500, level: 15 },
  mapBounds: { width: 1000, height: 1000 },
  tileSize: 50
});

// Iniciar movimento
ConvoyAttackService.startConvoy(convoy);

// Obter informações
const arrivalTime = ConvoyAttackService.getEstimatedArrivalTime(convoy);
const remainingTime = ConvoyAttackService.getRemainingTime(convoy);
const progress = ConvoyAttackService.getProgressPercentage(convoy);
const position = ConvoyAttackService.getCurrentWorldPosition(convoy, 50);
```

### 5. **useConvoyMovement Hook** (`useConvoyMovement.ts`)
Hook para gerenciar animação e estado de um comboio específico.

**Uso:**
```typescript
import { useConvoyMovement } from '@/hooks/useConvoyMovement';

function ConvoyTracker({ convoyId }) {
  const { convoy, cancelConvoy } = useConvoyMovement({
    convoyId,
    onArrived: (convoy) => {
      console.log('Comboio chegou!', convoy);
    },
    onCancelled: (convoy) => {
      console.log('Comboio cancelado', convoy);
    }
  });

  if (!convoy) return null;

  return (
    <div>
      <p>Progresso: {(convoy.currentProgress * 100).toFixed(1)}%</p>
      <button onClick={cancelConvoy}>Cancelar</button>
    </div>
  );
}
```

### 6. **ConvoyMovementLayer** (`ConvoyMovementLayer.tsx`)
Componente React que renderiza todos os comboios no mapa.

**Uso:**
```typescript
import ConvoyMovementLayer from '@/components/game/ConvoyMovementLayer';

function GameMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      <canvas ref={canvasRef} width={1000} height={1000} />
      <ConvoyMovementLayer
        mapWidth={1000}
        mapHeight={1000}
        tileSize={50}
        canvasRef={canvasRef}
      />
    </>
  );
}
```

## Fluxo de Integração

### Passo 1: Após um Ataque Bem-Sucedido
```typescript
// No seu serviço de ataque
const convoy = ConvoyAttackService.createConvoy({
  attackerId: currentPlayer.id,
  defenderId: targetPlayer.id,
  attackerBarrac: {
    x: currentPlayer.barracX,
    y: currentPlayer.barracY,
    level: currentPlayer.barracLevel
  },
  defenderBarrac: {
    x: targetPlayer.barracX,
    y: targetPlayer.barracY,
    level: targetPlayer.barracLevel
  },
  mapBounds: { width: 1000, height: 1000 },
  tileSize: 50
});

ConvoyAttackService.startConvoy(convoy);
```

### Passo 2: Renderizar Comboios no Mapa
```typescript
// No seu componente de mapa
<ConvoyMovementLayer
  mapWidth={mapWidth}
  mapHeight={mapHeight}
  tileSize={tileSize}
  canvasRef={mapCanvasRef}
/>
```

### Passo 3: Gerenciar Chegada de Comboios
```typescript
// Monitorar comboios chegando
const incomingConvoys = useConvoyStore((state) => 
  state.getConvoysByDefender(myBarracId)
);

useEffect(() => {
  for (const convoy of incomingConvoys) {
    if (convoy.status === 'arrived') {
      // Processar chegada do comboio
      handleConvoyArrival(convoy);
    }
  }
}, [incomingConvoys]);
```

## Configuração de Velocidade

### Parâmetros Ajustáveis

Edite em `convoyMovementService.ts`:

```typescript
// Tempo base por tile em milissegundos (nível 1)
private static readonly BASE_TIME_PER_TILE = 2000; // 2 segundos

// Multiplicador máximo de velocidade (nível máximo)
private static readonly MAX_SPEED_MULTIPLIER = 5; // 5x mais rápido

// Nível máximo do barraco
private static readonly MAX_BARRACK_LEVEL = 50;
```

### Exemplos de Velocidade

| Nível | Multiplicador | Tempo/Tile | 10 Tiles |
|-------|---------------|-----------|----------|
| 1     | 1.0x          | 2000ms    | 20s      |
| 10    | 1.5x          | 1333ms    | 13.3s    |
| 25    | 3.0x          | 667ms     | 6.7s     |
| 40    | 4.5x          | 444ms     | 4.4s     |
| 50    | 5.0x          | 400ms     | 4.0s     |

## Animação Visual

O comboio é renderizado como:
- Círculo principal (#FF007F - cor primária)
- Brilho externo (semi-transparente)
- Destaque interno (branco)
- Borda branca

Em modo desenvolvimento, o caminho é exibido com linha tracejada.

## Eventos e Callbacks

### Chegada de Comboio
```typescript
useConvoyMovement({
  convoyId,
  onArrived: (convoy) => {
    // Disparar ataque
    // Atualizar defesa
    // Mostrar notificação
  }
});
```

### Cancelamento de Comboio
```typescript
useConvoyMovement({
  convoyId,
  onCancelled: (convoy) => {
    // Reembolsar recursos
    // Notificar jogador
  }
});
```

## Performance

- **Pathfinding**: O(n log n) com A*
- **Renderização**: Canvas 2D otimizado
- **Atualizações**: RequestAnimationFrame para suavidade
- **Memória**: Convoys removidos após chegada/cancelamento

## Próximas Etapas

1. **Integração com Loja**: Conectar compra de itens de comboio
2. **Efeitos Visuais**: Adicionar trilhas, partículas
3. **Notificações**: Alertas de chegada de comboio
4. **Defesa**: Sistema de interceptação de comboios
5. **Persistência**: Salvar comboios em progresso
