# Wix Realtime API - Guia Completo

## 📚 Conceitos Fundamentais

### 1. **Channel (Canal)**
Um "tópico" ou "sala" onde múltiplos usuários se inscrevem para receber mensagens.

**Características:**
- Todos os inscritos recebem as mesmas mensagens
- Ideal para notificações gerais
- Exemplo: `lobby_jogos`, `chat_global`, `noticias`

**Exemplo:**
```javascript
// Backend publica para TODOS os inscritos
await Realtime.publish('lobby_jogos', {
  tipo: 'jogador_entrou',
  nome: 'João'
});

// Frontend recebe
Wix.Realtime.subscribe('lobby_jogos', (msg) => {
  console.log('Novo jogador:', msg.nome); // Todos veem
});
```

---

### 2. **Channel Resource (Recurso de Canal)**
Um canal específico para um recurso particular. Permite comunicação isolada.

**Características:**
- Apenas usuários associados ao recurso recebem mensagens
- Ideal para comunicação privada/específica
- Exemplo: `canalPartida_12345`, `conversa_user1_user2`

**Exemplo:**
```javascript
// Backend publica apenas para essa partida
await Realtime.publish('canalPartida_12345', {
  tipo: 'ataque',
  dano: 50
});

// Apenas jogadores dessa partida recebem
Wix.Realtime.subscribe('canalPartida_12345', (msg) => {
  console.log('Ataque recebido:', msg.dano); // Só essa partida vê
});
```

---

## 🔐 Frontend vs Backend - Diferenças Críticas

### **Frontend (site.js)**
```javascript
// ✅ O que o frontend PODE fazer:
- Se inscrever em canais: Wix.Realtime.subscribe()
- Ouvir mensagens
- Chamar backend para publicar

// ❌ O que o frontend NÃO PODE fazer:
- Publicar diretamente (segurança)
- Acessar Realtime backend
- Controlar lógica de negócio
```

### **Backend (lobby.jsw)**
```javascript
// ✅ O que o backend PODE fazer:
- Publicar em canais: Realtime.publish()
- Controlar lógica de negócio
- Validar dados
- Gerenciar recursos

// ❌ O que o backend NÃO PODE fazer:
- Se inscrever em canais (não há usuário)
- Receber mensagens (não há listener)
```

---

## 💡 Padrão de Comunicação

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (site.js)                       │
│                                                             │
│  1. Clica "Encontrar Jogo"                                 │
│  2. Se inscreve em 'lobby_jogos'                           │
│  3. Chama backend: inscreverNoLobby()                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (lobby.jsw)                      │
│                                                             │
│  1. Recebe chamada: inscreverNoLobby()                     │
│  2. Adiciona à fila                                        │
│  3. Publica em 'lobby_jogos': "jogador_entrou"           │
│  4. Se 2+ jogadores: cria partida                         │
│  5. Publica em 'canalPartida_ID': "jogador_encontrado"   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (site.js)                       │
│                                                             │
│  1. Recebe "jogador_encontrado" em 'lobby_jogos'          │
│  2. Se inscreve em 'canalPartida_ID'                      │
│  3. Exibe alerta: "Jogo encontrado!"                      │
│  4. Aguarda mensagens em 'canalPartida_ID'               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementação Prática

### **Backend: Publicar no Channel**
```javascript
import { Realtime } from 'wix-realtime-backend';

export async function inscreverNoLobby(jogadorData) {
  // Adicionar à fila
  filaJogadores.push(jogadorData);

  // ✅ PUBLICAR NO CHANNEL (todos recebem)
  await Realtime.publish('lobby_jogos', {
    tipo: 'jogador_entrou',
    jogador: jogadorData.nome,
    totalNaFila: filaJogadores.length
  });
}
```

### **Backend: Publicar no Channel Resource**
```javascript
export async function fazerMatchmaking() {
  const jogador1 = filaJogadores.shift();
  const jogador2 = filaJogadores.shift();
  const idPartida = `partida_${Date.now()}`;

  // ✅ PUBLICAR NO CHANNEL RESOURCE (isolado)
  const nomeCanal = `canalPartida_${idPartida}`;
  await Realtime.publish(nomeCanal, {
    tipo: 'jogador_encontrado',
    idPartida: idPartida,
    jogador1: jogador1.nome,
    jogador2: jogador2.nome
  });
}
```

### **Frontend: Se Inscrever e Ouvir**
```javascript
// Se inscrever no channel
const subscription = Wix.Realtime.subscribe('lobby_jogos', (mensagem) => {
  if (mensagem.tipo === 'jogador_encontrado') {
    alert(`Jogo encontrado! Seu oponente: ${mensagem.jogador2}`);
    
    // Se inscrever no channel resource da partida
    Wix.Realtime.subscribe(`canalPartida_${mensagem.idPartida}`, (msg) => {
      console.log('Mensagem da partida:', msg);
    });
  }
});

// Desinscrever quando necessário
subscription.unsubscribe();
```

### **Frontend: Chamar Backend para Publicar**
```javascript
// Frontend não publica diretamente, chama backend
const resultado = await Wix.invokeAPI('publicarNoCanal', {
  idPartida: 'partida_123',
  mensagem: 'Estou pronto!'
});
```

---

## 🎯 Casos de Uso

| Caso | Channel | Channel Resource |
|------|---------|------------------|
| Notificações globais | ✅ | ❌ |
| Chat geral | ✅ | ❌ |
| Conversa privada | ❌ | ✅ |
| Partida específica | ❌ | ✅ |
| Atualização de status | ✅ | ✅ |
| Eventos do jogo | ❌ | ✅ |

---

## ⚠️ Boas Práticas

### 1. **Sempre Validar no Backend**
```javascript
export async function inscreverNoLobby(jogadorData) {
  // ✅ Validar dados
  if (!jogadorData.jogadorId || !jogadorData.nome) {
    throw new Error('Dados inválidos');
  }
  // ... resto do código
}
```

### 2. **Usar Nomes Descritivos para Canais**
```javascript
// ✅ Bom
await Realtime.publish('canalPartida_12345', msg);
await Realtime.publish('lobby_jogos', msg);

// ❌ Ruim
await Realtime.publish('canal1', msg);
await Realtime.publish('msg', msg);
```

### 3. **Incluir Timestamps**
```javascript
await Realtime.publish('lobby_jogos', {
  tipo: 'jogador_entrou',
  timestamp: new Date().toISOString() // ✅
});
```

### 4. **Tratar Erros no Frontend**
```javascript
try {
  const resultado = await Wix.invokeAPI('inscreverNoLobby', dados);
} catch (erro) {
  console.error('Erro:', erro);
  // Mostrar mensagem ao usuário
}
```

### 5. **Limpar Subscrições**
```javascript
useEffect(() => {
  return () => {
    if (subscription) {
      subscription.unsubscribe(); // ✅ Cleanup
    }
  };
}, []);
```

---

## 📊 Fluxo Completo: Matchmaking

```
1. Frontend: Clica "Encontrar Jogo"
   ↓
2. Frontend: Se inscreve em 'lobby_jogos'
   ↓
3. Frontend: Chama backend inscreverNoLobby()
   ↓
4. Backend: Adiciona à fila
   ↓
5. Backend: Publica em 'lobby_jogos' → "jogador_entrou"
   ↓
6. Frontend: Recebe "jogador_entrou" (todos veem)
   ↓
7. Backend: Se 2+ jogadores, cria partida
   ↓
8. Backend: Publica em 'canalPartida_ID' → "jogador_encontrado"
   ↓
9. Frontend: Recebe "jogador_encontrado" em 'lobby_jogos'
   ↓
10. Frontend: Se inscreve em 'canalPartida_ID'
    ↓
11. Frontend: Exibe alerta "Jogo encontrado!"
    ↓
12. Frontend: Aguarda mensagens em 'canalPartida_ID'
    ↓
13. Backend: Publica atualizações em 'canalPartida_ID'
    ↓
14. Frontend: Recebe atualizações (isolado para essa partida)
```

---

## 🚀 Próximos Passos

1. **Implementar Persistência**: Usar banco de dados para filas
2. **Adicionar Autenticação**: Validar jogador antes de inscrever
3. **Gerenciar Timeouts**: Remover jogadores que saem sem avisar
4. **Escalar**: Usar Redis para filas em produção
5. **Monitorar**: Adicionar logs e métricas

---

## 📖 Referências

- [Wix Realtime Backend API](https://www.wix.com/velo/reference/wix-realtime-backend)
- [Wix Realtime Frontend API](https://www.wix.com/velo/reference/wix-realtime)
- [Wix Velo Best Practices](https://www.wix.com/velo/reference/best-practices)
