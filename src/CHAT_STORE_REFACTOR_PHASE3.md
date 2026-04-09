# FASE 3 — Refatoração do chatStore para Backend Externo

## Resumo das Mudanças

O `chatStore.ts` foi refatorado para remover completamente as dependências do Wix Realtime (`wix-realtime` e `wix-realtime-frontend`), migrando para um modelo baseado em **polling de backend externo**.

---

## Alterações Realizadas

### 1. **Remoção de Dependências Wix Realtime**

**Antes:**
```typescript
import { subscribe } from 'wix-realtime';
let realtimeUnsubscribers: Map<string, () => void> = new Map();
```

**Depois:**
```typescript
// Nenhuma importação de wix-realtime
// Nenhuma variável de realtime unsubscribers
```

---

### 2. **Remoção de Métodos Realtime**

Os seguintes métodos foram **completamente removidos** da interface `ChatStore`:
- `subscribeToRealtimeChannels: () => Promise<void>`
- `unsubscribeFromRealtimeChannels: () => void`

**Impacto:** Qualquer código que chamava esses métodos precisa ser atualizado (não há chamadas em Header ou GamePage nesta fase).

---

### 3. **Implementação de Polling**

#### Configuração de Polling
```typescript
const POLLING_INTERVAL = 3000;  // 3 segundos
let chatPollingInterval: ReturnType<typeof setInterval> | null = null;
```

#### Método `startChatPolling()`
```typescript
startChatPolling: () => {
  const token = getAuthToken();
  const { currentFactionId, currentUserId } = get();

  if (!token) return;

  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
  }

  chatPollingInterval = setInterval(() => {
    void get().fetchMessages('complexo');

    if (currentFactionId) {
      void get().fetchMessages('faccao');
    }

    if (currentUserId) {
      void get().fetchMessages('mail');
    }
  }, POLLING_INTERVAL);
}
```

**Como funciona:**
- A cada 3 segundos, o polling faz requisições HTTP para `/chat/messages?channel=<channel>`
- Apenas canais relevantes são consultados (complexo sempre, faccao se houver factionId, mail se houver userId)
- As mensagens são mescladas com as existentes usando `mergeUniqueMessages()` para evitar duplicatas

#### Método `stopChatPolling()`
```typescript
stopChatPolling: () => {
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}
```

---

### 4. **Fluxo de Carregamento Atualizado**

#### Método `loadChat()`
**Antes:**
```typescript
await get().subscribeToRealtimeChannels();  // ❌ Removido
get().startChatPolling();
```

**Depois:**
```typescript
// Start polling for message updates
get().startChatPolling();  // ✅ Apenas polling
```

---

### 5. **Limpeza de Estado**

#### Método `resetChatState()`
**Antes:**
```typescript
get().stopChatPolling();
get().unsubscribeFromRealtimeChannels();  // ❌ Removido
```

**Depois:**
```typescript
get().stopChatPolling();  // ✅ Apenas stop polling
```

---

## Preservação do Estado

✅ **Shape do estado preservado:**
```typescript
type ChatStore = {
  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];
  activeChannel: ChatChannelType;
  isLoading: boolean;
  syncError: string | null;
  currentUserId: string | null;
  currentFactionId: string | null;
  // ... métodos
}
```

✅ **Métodos públicos preservados:**
- `setActiveChannel()`
- `setComplexoMessages()`, `setFaccaoMessages()`, `setMailMessages()`
- `setCurrentUser()`
- `fetchMessages()`
- `loadChat()`
- `startChatPolling()`, `stopChatPolling()`
- `sendComplexoMessage()`, `sendFaccaoMessage()`, `sendMailMessage()`
- `markMailAsRead()`
- `clearChannel()`
- `resetChatState()`

---

## Fluxo de Dados (Polling)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. loadChat() é chamado                                     │
│    - Faz requisição inicial para todos os canais            │
│    - Normaliza e armazena mensagens                         │
│    - Inicia polling                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. startChatPolling() inicia intervalo de 3 segundos        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. A cada 3 segundos:                                       │
│    - fetchMessages('complexo')                              │
│    - fetchMessages('faccao') [se factionId]                 │
│    - fetchMessages('mail') [se userId]                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. fetchMessages() faz GET para backend                     │
│    - Recebe array de mensagens                              │
│    - Normaliza com normalizeMessages()                      │
│    - Mescla com estado existente (mergeUniqueMessages)      │
│    - Atualiza estado do Zustand                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. UI re-renderiza com novas mensagens                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Endpoints Backend Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/chat/messages?channel=complexo` | Busca mensagens do complexo |
| GET | `/chat/messages?channel=faccao` | Busca mensagens da facção |
| GET | `/chat/messages?channel=mail` | Busca mensagens de correio |
| POST | `/chat/send` | Envia mensagem (complexo, faccao ou mail) |

**Autenticação:** Bearer token via header `Authorization`

---

## Tratamento de Erros

- **Timeout:** 15 segundos por requisição (REQUEST_TIMEOUT_MS)
- **Falha de conexão:** Erro capturado e armazenado em `syncError`
- **Sem token:** Polling não inicia
- **Requisição falhada:** Erro logado no console, estado não é alterado

---

## Performance

| Aspecto | Valor |
|--------|-------|
| Intervalo de polling | 3 segundos |
| Timeout de requisição | 15 segundos |
| Máximo de requisições/minuto | 20 (3s × 3 canais) |
| Deduplicação | Sim (mergeUniqueMessages) |

---

## Testes Recomendados

1. ✅ Verificar se mensagens aparecem a cada 3 segundos
2. ✅ Verificar se não há duplicatas de mensagens
3. ✅ Verificar se polling para quando `stopChatPolling()` é chamado
4. ✅ Verificar se polling reinicia quando `startChatPolling()` é chamado
5. ✅ Verificar se apenas canais relevantes são consultados
6. ✅ Verificar se erros de conexão são capturados em `syncError`

---

## Arquivos Modificados

- ✅ `/src/store/chatStore.ts` — Refatorado

## Arquivos NÃO Modificados

- ⏭️ `/src/components/Header.tsx` — Sem mudanças nesta fase
- ⏭️ `/src/components/pages/GamePage.tsx` — Sem mudanças nesta fase
- ⏭️ UI em geral — Sem mudanças

---

## Próximas Fases (Sugestões)

- **FASE 4:** Refatorar outros stores (playerStore, gangStore, etc.) para remover wix-realtime
- **FASE 5:** Otimizar polling (ex: usar WebSocket se backend suportar)
- **FASE 6:** Implementar sincronização offline-first com cache local
