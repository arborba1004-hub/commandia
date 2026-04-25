# Debug: Barracos Não Visíveis no Mapa

## Problema
Apenas o barraco do usuário é visível no mapa, apesar de haver vários jogadores cadastrados.

## Fluxo de Dados Esperado

```
1. GamePage.tsx monta
   ↓
2. Socket se conecta
   ↓
3. playerInit recebido (define myId)
   ↓
4. requestMapSnapshot emitido
   ↓
5. mapSnapshot recebido com array de jogadores
   ↓
6. Filtra jogadores (exclui self usando isMe())
   ↓
7. Para cada jogador: realtimePlayersLayer.upsertPlayer()
   ↓
8. Barracos 3D renderizados na cena
```

## Logs de Debug Adicionados

### No Socket (socket.ts)
- `📌 Listener registrado para evento: [eventName]` - Quando listener é registrado
- `📨 Socket recebeu evento: [eventName]` - Quando evento é recebido
- `🔔 Emitindo requestMapSnapshot` - Quando snapshot é solicitado
- `🔌 isConnected() chamado: [true/false]` - Status da conexão

### No GamePage (GamePage.tsx)
- `✅ playerInit recebido - myId definido: [id]` - myId foi definido
- `📍 mapSnapshot recebido com [N] jogadores. myId: [id]` - Snapshot recebido
- `📍 Dados brutos: [array]` - Array completo de jogadores
- `📍 Após filtro (excluindo self): [N] jogadores` - Quantos após filtro
- `🎮 Adicionando jogador ao mapa: [id] em [tileX, tileY]` - Cada jogador sendo adicionado
- `✅ mapSnapshot processado com sucesso` - Conclusão
- `🚀 playerMoved recebido: [id] em [tileX, tileY]` - Movimento de jogador
- `⏭️ playerMoved ignorado: é o próprio jogador` - Filtro de self
- `🎮 Atualizando posição do jogador: [id]` - Atualização de posição
- `🔌 Socket já conectado - solicitando mapSnapshot` - Snapshot solicitado
- `⏳ Socket ainda não conectado - aguardando conexão` - Aguardando conexão

### No realtimeMapPlayersLayer (realtimeMapPlayersLayer.ts)
- `🎮 upsertPlayer chamado para: [id] em [tileX, tileY]` - Função chamada
- `✨ Criando nova entrada visual para: [id]` - Novo jogador
- `✅ upsertPlayer concluído para: [id] | Total de jogadores: [N]` - Conclusão

## Checklist de Diagnóstico

Abra o Console do Navegador (F12) e verifique:

### 1. Socket Conectado?
```
Procure por: "🟢 Socket conectado"
Se não aparecer: Socket não conectou
```

### 2. playerInit Recebido?
```
Procure por: "✅ playerInit recebido - myId definido:"
Se não aparecer: Backend não enviou playerInit
```

### 3. requestMapSnapshot Emitido?
```
Procure por: "🔔 Emitindo requestMapSnapshot"
Se não aparecer: Snapshot não foi solicitado
```

### 4. mapSnapshot Recebido?
```
Procure por: "📍 mapSnapshot recebido com"
Se não aparecer: Backend não enviou mapSnapshot
Se aparecer com 0 jogadores: Nenhum jogador no banco
Se aparecer com N jogadores: Verificar próximos passos
```

### 5. Filtro Funcionando?
```
Procure por: "📍 Após filtro (excluindo self):"
Se mostrar 0: Todos foram filtrados (problema com isMe())
Se mostrar N: Filtro funcionou
```

### 6. Jogadores Sendo Adicionados?
```
Procure por: "🎮 Adicionando jogador ao mapa:"
Deve aparecer uma linha para cada jogador
Se não aparecer: Nenhum jogador foi adicionado
```

### 7. Modelos 3D Carregados?
```
Procure por: "✅ upsertPlayer concluído"
Deve mostrar "Total de jogadores: N"
Se mostrar 0: Modelos não foram criados
```

## Possíveis Causas

### 1. Socket não conecta
- **Sintoma**: Nenhum log de conexão
- **Causa**: Token inválido, backend offline
- **Solução**: Verificar token em localStorage, status do backend

### 2. playerInit não chega
- **Sintoma**: "playerInit recebido" não aparece
- **Causa**: Backend não envia playerInit ao conectar
- **Solução**: Verificar backend - deve emitir playerInit imediatamente

### 3. mapSnapshot não chega
- **Sintoma**: "mapSnapshot recebido" não aparece
- **Causa**: Backend não responde a requestMapSnapshot
- **Solução**: Verificar backend - deve responder com array de jogadores

### 4. myId não definido
- **Sintoma**: "myId definido: null" ou não aparece
- **Causa**: playerInit não contém _id ou id
- **Solução**: Verificar estrutura de playerInit no backend

### 5. Filtro remove todos
- **Sintoma**: "Após filtro: 0 jogadores"
- **Causa**: isMe() retorna true para todos
- **Solução**: Verificar se myId está correto

### 6. Modelos não carregam
- **Sintoma**: "upsertPlayer concluído" mas "Total de jogadores: 0"
- **Causa**: Erro ao carregar modelo 3D
- **Solução**: Verificar console para erros de carregamento de GLB

## Como Usar Este Debug

1. Abra o jogo
2. Abra Console (F12)
3. Procure pelos logs acima
4. Identifique onde o fluxo quebra
5. Reporte o ponto de falha

## Exemplo de Saída Esperada

```
📌 Listener registrado para evento: playerInit
📌 Listener registrado para evento: mapSnapshot
📌 Listener registrado para evento: playerMoved
🟢 Socket conectado
🔌 isConnected() chamado: true
🔔 Emitindo requestMapSnapshot
📨 Socket recebeu evento: playerInit
✅ playerInit recebido - myId definido: player-123
📨 Socket recebeu evento: mapSnapshot
📍 mapSnapshot recebido com 5 jogadores. myId: player-123
📍 Dados brutos: [...]
📍 Após filtro (excluindo self): 4 jogadores
🎮 Adicionando jogador ao mapa: player-456 em 50, 60
🎮 Adicionando jogador ao mapa: player-789 em 30, 40
🎮 Adicionando jogador ao mapa: player-101 em 70, 80
🎮 Adicionando jogador ao mapa: player-202 em 20, 30
✅ mapSnapshot processado com sucesso
🎮 upsertPlayer chamado para: player-456 em 50, 60
✨ Criando nova entrada visual para: player-456
✅ upsertPlayer concluído para: player-456 | Total de jogadores: 1
[... repetir para outros jogadores ...]
```

## Próximos Passos

Se o fluxo quebra em algum ponto:
1. Anote exatamente onde quebra
2. Verifique o backend naquele ponto
3. Verifique se os dados estão no formato correto
4. Teste com curl/Postman se necessário
