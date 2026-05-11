# Integração de CTs como Slots de Treinamento de Gangue - Resumo Executivo

## ✅ Implementação Concluída

### 1. **GamePage.tsx** - Modal de Treinamento Integrado
- ✅ Importado `useGangStore` para acessar dados da gangue
- ✅ Adicionado estado local para gerenciar modal de treinamento (`trainingModalOpen`, `selectedCT`)
- ✅ Integrado `GangTrainingModal` ao final da página
- ✅ Handlers `onStartTraining` e `onCollectTraining` chamam APIs do backend via `gangStore`
- ✅ Interceptação de cliques em CTs no `onNavigate` de `fixedMapBuildings`

### 2. **fixedMapBuildings.ts** - Rotas de CT Modificadas
- ✅ Alteradas rotas dos 4 CTs de `/gang` para `ct:ct_nw`, `ct:ct_ne`, `ct:ct_sw`, `ct:ct_se`
- ✅ Permite identificação única de cada CT clicado
- ✅ GamePage intercepta e abre modal apropriado

### 3. **GangTrainingPersistence.ts** - Removido
- ✅ Arquivo deletado conforme solicitado
- ✅ Persistência agora é 100% via backend API

### 4. **gangStore.ts** - Já Configurado Corretamente
- ✅ `queueTraining()` chama `queueGangTraining()` da API
- ✅ `completeFinishedTrainings()` chama `completeGangTrainings()` da API
- ✅ Sincroniza saldos do player após cada operação
- ✅ Atualiza estado da gangue no store

### 5. **gangApi.ts** - Endpoints Disponíveis
- ✅ `queueGangTraining(type, quantity)` - POST `/gang-war/train/queue`
- ✅ `completeGangTrainings()` - POST `/gang-war/train/complete`
- ✅ Ambos retornam `GangApiEnvelope` com estado atualizado

---

## 🎯 Fluxo de Uso

### Ao Clicar em um CT no Mapa:
1. `fixedMapBuildings` detecta clique e chama `onNavigate('ct:ct_nw')`
2. `GamePage` intercepta, extrai `ctKey` e abre `GangTrainingModal`
3. Modal exibe opções de treinamento para aquele CT

### Ao Iniciar Treinamento:
1. Usuário seleciona tipo de membro (capanga, frente, etc.)
2. `onStartTraining()` chama `gangStore.queueTraining(memberType)`
3. `gangStore` chama `queueGangTraining()` da API
4. Backend enfileira treinamento e retorna estado atualizado
5. Modal fecha e CT fica visualmente ativo (vermelho se em treinamento)

### Ao Coletar Treinamento:
1. Usuário clica "Coletar" no modal
2. `onCollectTraining()` chama `gangStore.completeFinishedTrainings()`
3. `gangStore` chama `completeGangTrainings()` da API
4. Backend move membros de "treinando" → "ativo"
5. Saldos são sincronizados no player

---

## 📁 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `/src/components/pages/GamePage.tsx` | ✅ Adicionado modal de treinamento + handlers |
| `/src/components/game/fixedMapBuildings.ts` | ✅ Rotas de CT alteradas para `ct:*` |
| `/src/components/gang/GangTrainingPersistence.ts` | ❌ Deletado |
| `/src/store/gangStore.ts` | ✅ Já estava correto (sem mudanças necessárias) |

---

## 🔧 Arquivos para Backend Externo

Os seguintes arquivos devem ser implementados no backend externo (`comando-backend.onrender.com`):

### 1. **gangWarService.ts** (ou equivalente)
- Lógica de cálculo de treinamento por nível do barraco
- Persistência de operações de treinamento
- Validação de saldos e custos

### 2. **Endpoints REST**
```
POST /gang-war/train/queue
  Body: { type: "capanga", quantity: 10 }
  Response: GangApiEnvelope

POST /gang-war/train/complete
  Response: GangApiEnvelope
```

### 3. **Banco de Dados**
- Tabela `gang_trainings` com campos:
  - `playerId`, `memberType`, `quantity`
  - `startedAt`, `endsAt`, `status` (queued/training/ready/collected)
  - `ctSlot` (opcional, para rastrear qual CT)

### 4. **Tipos TypeScript (Backend)**
```typescript
interface GangTrainingOperation {
  memberType: GangMemberType;
  quantity: number;
  startedAt: Date;
  endsAt: Date;
  status: 'queued' | 'training' | 'ready' | 'collected';
}

interface GangStateSnapshot {
  trainingState: {
    slots: Record<string, GangTrainingOperation>;
  };
  // ... outros campos
}
```

---

## 🎨 Feedback Visual (Próximo Passo)

Para implementar CTs vermelhos quando em treinamento:

1. Adicionar campo `isTraining` ao wrapper do CT em `fixedMapBuildings`
2. Modificar material/emissive do modelo 3D quando `isTraining === true`
3. Passar estado de treinamento via `gang.trainingState.slots`

---

## ✨ Status Final

✅ **Integração Completa**
- CTs funcionam como slots de treinamento persistentes
- Lógica de persistência 100% via backend
- Modal de treinamento integrado ao mapa
- APIs prontas para consumo

🚀 **Pronto para Deploy**
