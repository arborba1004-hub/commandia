# FASE 5 — Remoção de Realtime Wix das Notificações de Ataque

## Resumo das Mudanças

Esta fase remove completamente as dependências `wix-realtime` e `wix-realtime-frontend` do sistema de notificações de ataque, migrando para um modelo baseado em **polling do backend externo**.

---

## Arquivos Modificados

### 1. **src/components/game/AttackNotification.tsx**
- ❌ **Removido**: `import { realtime } from 'wix-realtime-frontend';`
- ✅ **Adicionado**: Polling com `fetchAttackNotifications()` do backend
- ✅ **Adicionado**: Integração com `markNotificationAsRead()` para sincronizar leitura
- **Comportamento**: 
  - Faz polling a cada 3 segundos
  - Busca notificações não lidas do backend
  - Marca como lida após exibição
  - Mantém visual idêntico (notificação toast no canto superior direito)

### 2. **src/api/notificationApi.ts** (NOVO)
- Criado novo arquivo com funções de API para notificações
- **Funções**:
  - `fetchAttackNotifications()`: GET `/notifications/attacks` - busca notificações não lidas
  - `markNotificationAsRead(id)`: PATCH `/notifications/:id/read` - marca como lida
- **Recursos**:
  - Autenticação via Bearer token
  - Timeout de 10 segundos
  - Tratamento robusto de erros
  - Normalização de respostas do backend

### 3. **src/components/game/AttackNotificationOverlay.tsx**
- ✅ **Sem mudanças necessárias** - componente já é agnóstico a realtime
- Continua recebendo props do componente pai
- Visual preservado completamente

### 4. **src/stores/notificationStore.ts**
- ✅ **Sem mudanças necessárias** - store genérico não usa realtime
- Continua funcionando para notificações gerais

### 5. **src/store/playerStore.ts**
- ✅ **Sem mudanças necessárias** - já possui métodos de notificação
- Métodos utilizados:
  - `markNotificationAsRead(id)` - marca notificação como lida
  - `addNotification(notification)` - adiciona nova notificação
  - `setNotifications(notifications)` - sincroniza lista completa

---

## Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────┐
│ AttackNotification Component (Montagem)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Inicia Polling (3s)        │
        │ + Executa imediatamente    │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ fetchAttackNotifications() │
        │ (GET /notifications/attacks)
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Procura notificação não    │
        │ lida de tipo attack_received
        └────────────┬───────────────┘
                     │
              ┌──────┴──────┐
              │             │
         Encontrou?    Não encontrou
              │             │
              ▼             ▼
        ┌─────────┐   Aguarda próximo
        │ Exibe   │   polling (3s)
        │ Toast   │
        └────┬────┘
             │
             ▼
        ┌──────────────────────────┐
        │ markNotificationAsRead()  │
        │ (PATCH /notifications/:id/read)
        └──────────────────────────┘
             │
             ▼
        ┌──────────────────────────┐
        │ playerStore.mark...()    │
        │ (sincroniza localmente)  │
        └──────────────────────────┘
             │
             ▼
        ┌──────────────────────────┐
        │ Auto-hide após 3s        │
        └──────────────────────────┘
```

---

## Notificação Store Oficial

**Identificação**: Existem dois stores de notificação:

1. **`src/stores/notificationStore.ts`** (OFICIAL para UI genérica)
   - Usado por: `NotificationBell.tsx`, `NotificationPanel.tsx`
   - Tipo: Notificações genéricas (info, success, warning, error)
   - Persistência: Sim (localStorage)

2. **`src/store/playerStore.ts`** (OFICIAL para notificações de ataque)
   - Usado por: `AttackNotification.tsx` (agora)
   - Tipo: Notificações de ataque específicas
   - Persistência: Sim (localStorage)
   - Sincronização: Backend externo via polling

**Decisão**: Mantém ambos, cada um com seu propósito:
- `notificationStore` = notificações gerais da UI
- `playerStore.notifications` = notificações de ataque do jogo

---

## Remoção de Dependências Wix Realtime

### Antes
```typescript
import { realtime } from 'wix-realtime-frontend';
realtime.subscribe(`attack_${playerId}`, (msg: any) => { ... });
```

### Depois
```typescript
import { fetchAttackNotifications, markNotificationAsRead } from '@/api/notificationApi';
const notifications = await fetchAttackNotifications();
```

---

## Testes Recomendados

1. **Polling Funciona**
   - Abrir DevTools → Network
   - Verificar requisições GET `/notifications/attacks` a cada 3s

2. **Notificação Exibida**
   - Simular ataque no backend
   - Verificar se toast aparece em 3-6s (próximo polling + exibição)

3. **Marca Como Lida**
   - Verificar PATCH `/notifications/:id/read` após exibição
   - Confirmar que `read: true` no backend

4. **Visual Preservado**
   - Toast continua no canto superior direito
   - Cores e animações idênticas
   - Auto-hide após 3s funciona

5. **GamePage Inalterado**
   - Nenhuma mudança em `GamePage.tsx`
   - Componente continua renderizado normalmente

---

## Notas de Implementação

- ✅ Sem debug UI adicionada
- ✅ Sem mudanças em GamePage
- ✅ Visual das notificações preservado
- ✅ Polling com intervalo de 3 segundos (balanceado)
- ✅ Tratamento robusto de erros
- ✅ Autenticação via Bearer token
- ✅ Timeout de requisição: 10 segundos
- ✅ Sincronização local com playerStore

---

## Próximos Passos (Opcional)

1. Implementar WebSocket no backend para notificações em tempo real (futuro)
2. Adicionar cache local para reduzir requisições
3. Implementar exponential backoff em caso de falhas
4. Adicionar métricas de performance do polling
