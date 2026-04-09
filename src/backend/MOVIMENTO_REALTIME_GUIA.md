# 🎮 GUIA COMPLETO: MOVIMENTOS EM TEMPO REAL

Olá! Você é novo em programação? Sem problema! Este guia explica **exatamente** como o sistema de movimentos em tempo real funciona, **sem termos técnicos complicados**.

---

## 📚 O QUE FOI CRIADO?

Foram criados **3 arquivos** que trabalham juntos:

1. **`movementPublisher.jsw`** - Backend (servidor Wix)
2. **`movementApi.ts`** - Intermediário (conecta frontend ao backend)
3. **Modificação no `GamePage.tsx`** - Frontend (seu jogo)

---

## 🎯 COMO FUNCIONA (PASSO A PASSO)

### Passo 1: Você clica no mapa
```
Você clica em um local do mapa no seu jogo
↓
O GamePage.tsx detecta o clique
↓
Calcula a posição (tileX, tileY)
```

### Passo 2: Envia para o backend
```
GamePage.tsx chama: publishPlayerMovement({
  playerId: 'seu-id',
  playerName: 'seu-nome',
  tileX: 40,
  tileY: 20
})
↓
movementApi.ts recebe e envia para o servidor
↓
movementPublisher.jsw (backend) recebe
```

### Passo 3: Backend publica em tempo real
```
movementPublisher.jsw publica a mensagem em um "canal"
↓
Todos os outros jogadores recebem em tempo real
↓
Seus barracos se movem suavemente no mapa deles
```

---

## 📁 ONDE COLAR CADA PARTE

### 1️⃣ ARQUIVO BACKEND (movementPublisher.jsw)

**Localização:** `/src/backend/movementPublisher.jsw`

**O que faz:** Publica o movimento para todos os outros jogadores

**Já foi criado!** ✅

---

### 2️⃣ ARQUIVO INTERMEDIÁRIO (movementApi.ts)

**Localização:** `/src/api/movementApi.ts`

**O que faz:** Conecta seu jogo (frontend) ao servidor (backend)

**Já foi criado!** ✅

---

### 3️⃣ MODIFICAÇÃO NO GAMEPAGE.tsx

**Localização:** `/src/components/pages/GamePage.tsx`

**O que foi adicionado:**

Na linha 32, foi adicionado:
```typescript
import { publishPlayerMovement } from '@/api/movementApi';
```

Isso importa a função que publica movimentos.

---

Na função `handlePointerUp` (por volta da linha 700), foi adicionado:

```typescript
// 🚀 PUBLICAR MOVIMENTO EM TEMPO REAL
const currentPlayerId = playerState?._id || playerState?.googleId;
const currentPlayerName = playerState?.name || 'JOGADOR';

if (currentPlayerId) {
  publishPlayerMovement({
    playerId: currentPlayerId,
    playerName: currentPlayerName,
    tileX: tileX,
    tileY: tileZ,
  }).catch(err => console.warn('⚠️ Erro ao publicar movimento:', err));
}
```

Isso envia a posição quando você clica no mapa.

**Já foi feito!** ✅

---

## 🔄 FLUXO COMPLETO (VISUAL)

```
┌─────────────────────────────────────────────────────────────┐
│                      SEU COMPUTADOR                         │
│                                                             │
│  1. Você clica no mapa                                     │
│     ↓                                                       │
│  2. GamePage.tsx detecta o clique                          │
│     ↓                                                       │
│  3. Chama publishPlayerMovement()                          │
│     ↓                                                       │
│  4. movementApi.ts envia para o servidor                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Internet/Rede)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR WIX                             │
│                                                             │
│  5. movementPublisher.jsw recebe                           │
│     ↓                                                       │
│  6. Publica em um "canal" (como um grupo de chat)          │
│     ↓                                                       │
│  7. Todos os outros jogadores recebem a mensagem           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Internet/Rede)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              COMPUTADOR DO OUTRO JOGADOR                    │
│                                                             │
│  8. Recebe a mensagem em tempo real                        │
│     ↓                                                       │
│  9. GamePage.tsx vê o movimento (linha 744)               │
│     ↓                                                       │
│  10. Anima o barraco dele se movendo suavemente            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 COMO TESTAR

### Teste 1: Um jogador
1. Abra o jogo em seu navegador
2. Clique em um local do mapa
3. Veja seu barraco se mover
4. Abra o console (F12) e procure por: `✅ Movimento publicado`

### Teste 2: Dois jogadores
1. Abra o jogo em **dois navegadores diferentes** (ou em duas abas)
2. Faça login com contas diferentes
3. Clique no mapa em um navegador
4. **Veja o barraco se mover no outro navegador em tempo real!**

---

## 🔍 ENTENDENDO O CÓDIGO

### No GamePage.tsx (linha ~700)

```typescript
// Quando você clica no mapa, isto acontece:
if (intersects.length > 0) {
  const point = intersects[0].point;  // Onde você clicou
  const tileX = Math.floor(point.x + GRID_WIDTH / 2);  // Coluna
  const tileZ = Math.floor(point.z + GRID_HEIGHT / 2);  // Linha

  // 🚀 PUBLICAR MOVIMENTO EM TEMPO REAL
  const currentPlayerId = playerState?._id || playerState?.googleId;
  const currentPlayerName = playerState?.name || 'JOGADOR';
  
  if (currentPlayerId) {
    publishPlayerMovement({
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      tileX: tileX,
      tileY: tileZ,
    }).catch(err => console.warn('⚠️ Erro ao publicar movimento:', err));
  }
}
```

**O que significa:**
- `tileX` e `tileZ` = sua nova posição no mapa
- `publishPlayerMovement()` = envia para o backend
- `.catch()` = se der erro, não quebra o jogo

---

### No movementPublisher.jsw (backend)

```javascript
export async function publishPlayerMovement(data) {
  const { playerId, playerName, tileX, tileY } = data;

  // Nome do "canal" onde vamos publicar
  const movementChannel = `movement_${playerId}`;

  // Mensagem que será enviada
  const message = {
    type: 'movement_update',
    playerId: playerId,
    playerName: playerName,
    x: tileX,
    y: tileY,
    timestamp: Date.now(),
  };

  // 🚀 Publicar a mensagem
  await realtime.publish(movementChannel, message);
}
```

**O que significa:**
- `movement_${playerId}` = cria um "canal" único para cada jogador
- `realtime.publish()` = envia a mensagem em tempo real
- Todos os outros jogadores que estão "ouvindo" este canal recebem a mensagem

---

### No GamePage.tsx (linha ~739)

```typescript
// Você está "ouvindo" o canal de movimento de cada outro jogador
const subscription = realtime.subscribe(movementChannel, (message: any) => {
  if (type === 'movement_update') {
    // Atualizar posição do barraco inimigo
    const enemyModel = enemyBarracoMapRef.current[playerId];
    if (enemyModel) {
      const posX = (x - GRID_WIDTH / 2) * TILE_SIZE;
      const posZ = (y - GRID_HEIGHT / 2) * TILE_SIZE;

      // Animar movimento suave (500ms)
      // ... código de animação ...
    }
  }
});
```

**O que significa:**
- `realtime.subscribe()` = "ouve" o canal de movimento
- Quando uma mensagem chega, atualiza a posição do barraco
- A animação faz o barraco se mover suavemente em 500ms

---

## ⚠️ POSSÍVEIS PROBLEMAS

### Problema 1: "Movimento não aparece no outro jogador"
**Solução:**
1. Verifique se ambos os jogadores estão logados
2. Abra o console (F12) e procure por erros
3. Verifique se a função `publishPlayerMovement()` foi chamada

### Problema 2: "Erro: realtime não está definido"
**Solução:**
1. Certifique-se de que importou: `import { realtime } from 'wix-realtime-frontend';`
2. Verifique se o arquivo `/src/backend/movementPublisher.jsw` existe

### Problema 3: "Movimento é muito rápido/lento"
**Solução:**
1. Mude o valor `duration` na linha ~756 do GamePage.tsx
2. Atualmente é `500` (500 milissegundos = 0.5 segundos)
3. Aumente para `1000` para mais lento, ou diminua para `300` para mais rápido

---

## 🚀 PRÓXIMOS PASSOS

Agora que os movimentos funcionam em tempo real, você pode:

1. **Adicionar som** quando um jogador se move
2. **Mostrar um efeito visual** (partículas, luz) quando alguém se move
3. **Sincronizar ataques** em tempo real (já está parcialmente implementado)
4. **Adicionar chat** em tempo real entre jogadores

---

## 📞 RESUMO RÁPIDO

| O que | Onde | O que faz |
|------|------|----------|
| Backend | `/src/backend/movementPublisher.jsw` | Publica movimentos em tempo real |
| API | `/src/api/movementApi.ts` | Conecta frontend ao backend |
| Frontend | `/src/components/pages/GamePage.tsx` | Envia movimento quando você clica |
| Recepção | `/src/components/pages/GamePage.tsx` (linha ~739) | Recebe movimentos de outros jogadores |

---

## ✅ CHECKLIST

- [x] Arquivo backend criado (`movementPublisher.jsw`)
- [x] Arquivo API criado (`movementApi.ts`)
- [x] GamePage.tsx modificado para enviar movimentos
- [x] GamePage.tsx já recebe movimentos em tempo real
- [x] Animação suave implementada

**Tudo pronto! 🎉**

---

## 💡 DICA FINAL

Se você quer entender melhor como funciona:

1. Abra o console do navegador (F12)
2. Vá para a aba "Console"
3. Clique no mapa
4. Veja as mensagens de log:
   - `✅ Movimento publicado: ...`
   - `📍 Movimento recebido: ...`
   - `✅ Barraco de ... movido para ...`

Essas mensagens mostram exatamente o que está acontecendo em tempo real!

---

**Criado com ❤️ para iniciantes em programação**
