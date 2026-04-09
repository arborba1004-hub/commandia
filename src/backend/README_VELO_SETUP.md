# Guia de Configuração - Backend Velo para Wix

Este diretório contém código Velo (.jsw) pronto para ser usado no seu site Wix. Siga as instruções abaixo para implementar.

## 📋 Arquivos Inclusos

### 1. **playerAuth.jsw**
Autenticação e gerenciamento de sessão de jogadores.

**Funções principais:**
- `checkIfLoggedIn()` - Verifica se o usuário está logado
- `getCurrentMemberInfo()` - Obtém informações do membro atual
- `getPlayerPublicInfo(memberId)` - Obtém informações públicas de um jogador
- `memberHasRole(memberId, role)` - Verifica se tem um papel específico
- `getCurrentMemberId()` - Obtém ID do membro atual
- `isCurrentUserAdmin()` - Verifica se é admin
- `validateUserAuthentication()` - Valida autenticação

### 2. **playerProfiles.jsw**
Gerenciamento de perfis de jogadores.

**Funções principais:**
- `createPlayerProfile(profileData)` - Cria novo perfil
- `getCurrentPlayerProfile()` - Obtém perfil do jogador atual
- `getPlayerPublicProfile(playerId)` - Obtém perfil público
- `updateCurrentPlayerProfile(updateData)` - Atualiza perfil
- `updatePlayerMoney(playerId, cleanMoneyDelta, dirtyMoneyDelta)` - Atualiza moedas
- `updatePlayerExperience(playerId, experienceDelta)` - Atualiza experiência
- `updatePlayerStats(playerId, statsDelta)` - Atualiza estatísticas
- `getTopPlayersByLevel(limit)` - Lista top jogadores
- `searchPlayers(searchTerm, limit)` - Busca jogadores

### 3. **gameOperations.jsw**
Operações de jogo (roubo, heist, bounty, etc).

**Funções principais:**
- `recordGameTransaction(...)` - Registra transação
- `executeRobbery(playerId, targetPlayerId, amount)` - Executa roubo
- `executeHeist(playerId, heistType, difficulty)` - Executa heist
- `placeBounty(playerId, targetPlayerId, amount)` - Coloca recompensa
- `getPlayerTransactionHistory(playerId, limit)` - Histórico de transações
- `getPlayerCombatStats(playerId)` - Estatísticas de combate
- `addItemToInventory(...)` - Adiciona item ao inventário
- `getPlayerInventory(playerId)` - Obtém inventário

### 4. **collectionPermissions.jsw**
Configuração de permissões de coleções.

**Contém:**
- Guia de permissões para cada coleção
- Schema das coleções necessárias
- Funções auxiliares de validação

## 🚀 Como Implementar

### Passo 1: Copiar Arquivos para o Wix

1. Acesse seu site Wix em modo de edição
2. Vá para **Code** → **Backend** (ou **Velo Backend**)
3. Crie novos arquivos `.jsw`:
   - `playerAuth.jsw`
   - `playerProfiles.jsw`
   - `gameOperations.jsw`
   - `collectionPermissions.jsw`
4. Cole o conteúdo de cada arquivo correspondente

### Passo 2: Criar Coleções no Banco de Dados

1. Vá para **Database** (Banco de Dados) no Wix Dashboard
2. Crie as seguintes coleções com os campos especificados:

#### Coleção: **Players**
```
- memberId (Text) - ID do membro Wix
- playerName (Text) - Nome do jogador
- level (Number) - Nível atual
- experience (Number) - Experiência total
- cleanMoney (Number) - Dinheiro limpo
- dirtyMoney (Number) - Dinheiro sujo
- faction (Text) - Facção do jogador
- bio (Text) - Biografia
- avatar (Text) - URL da imagem
- isActive (Boolean) - Se está ativo
- createdDate (Date) - Data de criação
- lastActivityDate (Date) - Última atividade
- stats (Object) - Estatísticas
```

**Permissões:**
- Read: ANYONE
- Create: ANYONE
- Update: OWNER
- Delete: ADMIN

#### Coleção: **GameTransactions**
```
- memberId (Text)
- playerId (Text)
- transactionType (Text)
- amount (Number)
- currency (Text)
- description (Text)
- timestamp (Date)
- status (Text)
```

**Permissões:**
- Read: OWNER
- Create: BACKEND_ONLY
- Update: BACKEND_ONLY
- Delete: ADMIN

#### Coleção: **PlayerInventory**
```
- memberId (Text)
- playerId (Text)
- itemId (Text)
- itemName (Text)
- quantity (Number)
- itemType (Text)
- acquiredDate (Date)
```

**Permissões:**
- Read: OWNER
- Create: BACKEND_ONLY
- Update: BACKEND_ONLY
- Delete: BACKEND_ONLY

#### Coleção: **Bounties** (Opcional)
```
- memberId (Text)
- playerId (Text)
- targetPlayerId (Text)
- targetName (Text)
- amount (Number)
- createdDate (Date)
- status (Text)
```

### Passo 3: Configurar Permissões

Para cada coleção, configure as permissões conforme indicado acima:

1. Clique na coleção
2. Vá para **Permissions**
3. Configure Read, Create, Update, Delete conforme especificado

### Passo 4: Usar as Funções no Frontend

#### Exemplo 1: Verificar se está logado
```javascript
import { checkIfLoggedIn } from 'backend/playerAuth';

const authStatus = await checkIfLoggedIn();
if (authStatus.isLoggedIn) {
  console.log('Bem-vindo, ' + authStatus.email);
}
```

#### Exemplo 2: Criar perfil de jogador
```javascript
import { createPlayerProfile } from 'backend/playerProfiles';

const profile = await createPlayerProfile({
  playerName: 'Meu Jogador',
  level: 1,
  cleanMoney: 1000,
  dirtyMoney: 0,
  faction: 'Neutro'
});
```

#### Exemplo 3: Executar um roubo
```javascript
import { executeRobbery } from 'backend/gameOperations';

const result = await executeRobbery(
  'meu-perfil-id',
  'perfil-alvo-id',
  500
);

if (result.success) {
  console.log('Roubo bem-sucedido! Você ganhou $' + result.amountStolen);
}
```

#### Exemplo 4: Obter perfil público
```javascript
import { getPlayerPublicProfile } from 'backend/playerProfiles';

const publicProfile = await getPlayerPublicProfile('player-id');
console.log(publicProfile.profile.playerName);
```

## 🔐 Segurança

### Boas Práticas Implementadas

1. **Validação de Autenticação**: Todas as funções verificam se o usuário está logado
2. **Validação de Propriedade**: Operações sensíveis verificam se o usuário é o dono
3. **Permissões de Coleção**: Dados sensíveis têm permissões OWNER ou BACKEND_ONLY
4. **Tratamento de Erros**: Todas as funções retornam erros estruturados

### Recomendações Adicionais

1. **Validar Entrada**: Sempre validar dados do frontend antes de usar
2. **Rate Limiting**: Implementar limite de requisições para operações críticas
3. **Logging**: Registrar operações importantes para auditoria
4. **Backup**: Fazer backup regular do banco de dados

## 📊 Estrutura de Dados

### Objeto Player
```javascript
{
  _id: "player-id",
  memberId: "wix-member-id",
  playerName: "Nome do Jogador",
  level: 5,
  experience: 2500,
  cleanMoney: 5000,
  dirtyMoney: 10000,
  faction: "Neutro",
  bio: "Descrição do jogador",
  avatar: "url-da-imagem",
  isActive: true,
  createdDate: Date,
  lastActivityDate: Date,
  stats: {
    totalKills: 10,
    totalDeaths: 5,
    totalRobberies: 20,
    totalHeists: 3,
    totalBounties: 2
  }
}
```

### Objeto Transaction
```javascript
{
  _id: "transaction-id",
  memberId: "wix-member-id",
  playerId: "player-id",
  transactionType: "robbery_success",
  amount: 500,
  currency: "dirty",
  description: "Roubo bem-sucedido",
  timestamp: Date,
  status: "completed"
}
```

## 🐛 Troubleshooting

### Erro: "Coleção não encontrada"
- Verifique se a coleção foi criada no Database
- Verifique o nome exato da coleção (case-sensitive)

### Erro: "Permissão negada"
- Verifique as permissões da coleção
- Certifique-se de que o usuário está autenticado
- Verifique se é o dono do item (para operações OWNER)

### Erro: "Usuário não autenticado"
- Verifique se o usuário está logado no site
- Verifique se o Wix Members está configurado

### Função retorna undefined
- Verifique se a função foi exportada corretamente
- Verifique se o arquivo .jsw está no diretório correto
- Aguarde o Wix compilar o código (pode levar alguns segundos)

## 📚 Recursos Adicionais

- [Documentação Wix Velo](https://www.wix.com/velo/reference)
- [wix-data API](https://www.wix.com/velo/reference/wix-data)
- [wix-members-backend API](https://www.wix.com/velo/reference/wix-members-backend)
- [Permissões de Coleção](https://www.wix.com/velo/reference/wix-data/permissions)

## 💡 Próximos Passos

1. Implementar validação adicional de entrada
2. Adicionar logging e auditoria
3. Criar funções de admin para gerenciar jogadores
4. Implementar sistema de achievements
5. Adicionar notificações em tempo real com webhooks

## 📝 Notas

- Este código foi gerado para ser usado em um site Wix com Velo
- Todas as funções retornam objetos com `success`, `error`, ou dados específicos
- Sempre verificar o status de erro antes de usar os dados
- As datas são armazenadas como objetos Date do JavaScript

---

**Última atualização:** 2026-04-07
**Versão:** 1.0
