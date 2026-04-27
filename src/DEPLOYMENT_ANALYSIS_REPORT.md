# 🔴 RELATÓRIO DE ANÁLISE DE DEPLOY - WIX VIBE

**Data:** 27 de Abril de 2026  
**Status:** ⚠️ CRÍTICO - Múltiplos problemas impedem deploy

---

## 📋 RESUMO EXECUTIVO

O site **NÃO está fazendo deploy** devido a **problemas estruturais graves** na arquitetura do projeto. Foram identificados **5 problemas críticos** que impedem o build e deploy no Wix:

1. ❌ **Arquivos Backend Node.js no diretório `/src`** (Express, Mongoose, etc)
2. ❌ **Importações de pacotes não-instalados** (`@wix/codegen-framework-packages`)
3. ❌ **Arquivos .jsw (Wix Backend) misturados com código frontend**
4. ❌ **Código legado/inativo não removido**
5. ❌ **Estrutura de projeto confusa** (backend em `/src/backend`, não em `/backend`)

---

## 🔍 PROBLEMAS DETALHADOS

### 1. ❌ ARQUIVOS BACKEND NODE.JS NO `/src` (CRÍTICO)

**Localização:** `/src/backend/`

**Arquivos problemáticos:**
- `modeloserver.js` - Servidor Express completo com MongoDB
- `serverclone.js` - Clone do servidor com dependências Node
- `gangRoutes.js` - Rotas Express com `require('express')`

**Dependências não-instaladas:**
```javascript
// ❌ ESTES IMPORTS CAUSAM ERRO DE BUILD
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const WebSocket = require('ws');
```

**Por que é problema:**
- Wix Vibe é um **frontend-only framework** baseado em React + Astro
- Estes pacotes **não estão instalados** no `package.json`
- O build tenta processar estes arquivos e **falha**
- Wix não suporta backend Node.js nativo (usa `.jsw` files)

**Impacto:** 🔴 **BLOQUEIA DEPLOY**

---

### 2. ❌ IMPORTAÇÕES DE PACOTES NÃO-INSTALADOS

**Localização:** `/src/integrations/cms/service.ts` e outros

**Código problemático:**
```typescript
// ❌ ERRO: Pacote não existe no package.json
export { BaseCrudService } from '@wix/codegen-framework-packages';
export { useCart, useCartStore } from '@wix/codegen-framework-packages';
export { useCurrency, formatPrice, DEFAULT_CURRENCY } from '@wix/codegen-framework-packages';
export { buyNow } from '@wix/codegen-framework-packages';
```

**Por que é problema:**
- `@wix/codegen-framework-packages` **não está instalado**
- Estes são placeholders que deveriam ser re-exportados do Wix
- O build falha ao tentar resolver estas importações

**Impacto:** 🔴 **BLOQUEIA DEPLOY**

---

### 3. ❌ ARQUIVOS .JSW (WIX BACKEND) MISTURADOS COM FRONTEND

**Localização:** `/src/backend/*.jsw`

**Arquivos:**
- `attackPublisher.jsw`
- `chatRealtime.jsw`
- `collectionPermissions.jsw`
- `gameOperations.jsw`
- `matchApi.jsw`
- `matchService.jsw`
- `movementPublisher.jsw`
- `playerAuth.jsw`
- `playerProfiles.jsw`
- `realtime.jsw`
- `realtimeMatchmaking.jsw`

**Por que é problema:**
- Arquivos `.jsw` devem estar em `/backend` (raiz do projeto), **não em `/src`**
- O build do Wix não processa `.jsw` dentro de `/src`
- Estes arquivos são ignorados durante o build

**Impacto:** 🟡 **NÃO BLOQUEIA, mas funcionalidade backend não funciona**

---

### 4. ❌ CÓDIGO LEGADO/INATIVO NÃO REMOVIDO

**Localização:** `/src/backend/` e `/src/integrations/members/`

**Arquivos marcados como LEGACY:**
- `playerAuth.jsw` - "⚠️ LEGACY/INACTIVE - Wix Members Authentication Backend"
- `gameOperations.jsw` - "⚠️ LEGACY/INACTIVE - Wix Members Game Operations Backend"
- `playerProfiles.jsw` - "⚠️ LEGACY/INACTIVE - Wix Members Player Profiles Backend"

**Código legado em integrations:**
```typescript
// /src/integrations/members/providers/MemberContext.tsx
// LEGACY - INACTIVE - DO NOT USE
export const useMember = () => {
  throw new Error('Wix Members authentication flow is deactivated...');
};
```

**Por que é problema:**
- Código morto polui o projeto
- Confunde desenvolvedores
- Pode causar erros se importado acidentalmente
- Aumenta tamanho do bundle

**Impacto:** 🟡 **Não bloqueia, mas prejudica manutenção**

---

### 5. ❌ ESTRUTURA DE PROJETO CONFUSA

**Problema:** Arquivos backend em local errado

```
❌ ERRADO (atual):
/src/backend/
  ├── modeloserver.js
  ├── serverclone.js
  ├── gangRoutes.js
  └── *.jsw

✅ CORRETO (deveria ser):
/backend/
  ├── *.jsw (apenas Wix backend)
  └── (sem Node.js puro)
```

**Por que é problema:**
- Wix espera backend em `/backend`, não `/src/backend`
- Arquivos Node.js puro não devem estar no projeto Wix
- Causa confusão sobre o que é frontend vs backend

**Impacto:** 🔴 **BLOQUEIA DEPLOY**

---

## 📊 ANÁLISE DE IMPORTS

### ✅ Imports CORRETOS encontrados:

```typescript
// Estes estão OK:
import { BaseCrudService } from '@/integrations';
import { useCart, useCurrency, formatPrice } from '@/integrations';
import { buyNow } from '@/integrations';
import { usePlayerStore } from '@/store/playerStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Shield, Flame } from 'lucide-react';
import * as THREE from 'three';
```

### ❌ Imports PROBLEMÁTICOS encontrados:

```javascript
// /src/backend/modeloserver.js
const express = require('express');           // ❌ Não instalado
const mongoose = require('mongoose');         // ❌ Não instalado
const bcrypt = require('bcryptjs');          // ❌ Não instalado
const cors = require('cors');                // ❌ Não instalado
const dotenv = require('dotenv');            // ❌ Não instalado
const WebSocket = require('ws');             // ❌ Não instalado

// /src/backend/gangRoutes.js
const express = require('express');          // ❌ Não instalado
const authMiddleware = require('./authMiddleware');  // ❌ Arquivo não existe

// /src/backend/serverclone.js
const authToken = require('crypto').randomBytes(32).toString('hex');  // ❌ Node.js puro
```

---

## 🎯 SOLUÇÃO RECOMENDADA

### PASSO 1: Remover arquivos backend Node.js

```bash
# Deletar estes arquivos:
rm -rf /src/backend/modeloserver.js
rm -rf /src/backend/serverclone.js
rm -rf /src/backend/gangRoutes.js
rm -rf /src/backend/attackController.js
rm -rf /src/backend/gangWarService.js
```

### PASSO 2: Mover arquivos .jsw para local correto

```bash
# Mover para /backend (raiz do projeto)
mv /src/backend/*.jsw /backend/
```

### PASSO 3: Remover código legado

```bash
# Deletar arquivos legacy:
rm -rf /src/integrations/members/providers/MemberContext.tsx
rm -rf /src/backend/playerAuth.jsw
rm -rf /src/backend/gameOperations.jsw
rm -rf /src/backend/playerProfiles.jsw
```

### PASSO 4: Verificar imports de integrations

Garantir que `/src/integrations/index.ts` exporta apenas o que existe:

```typescript
// ✅ CORRETO - apenas re-exportar o que Wix fornece
export { BaseCrudService } from '@wix/codegen-framework-packages';
export { useCart, useCartStore } from '@wix/codegen-framework-packages';
export { useCurrency, formatPrice, DEFAULT_CURRENCY } from '@wix/codegen-framework-packages';
export { buyNow } from '@wix/codegen-framework-packages';
```

### PASSO 5: Limpar tsconfig.json

Remover paths que causam confusão:

```json
{
  "paths": {
    "@/*": ["src/*"],
    "@/components/*": ["src/components/*"],
    "@/integrations": ["integrations"]  // ✅ Correto
  }
}
```

---

## 📋 CHECKLIST DE CORREÇÃO

- [ ] Deletar `/src/backend/modeloserver.js`
- [ ] Deletar `/src/backend/serverclone.js`
- [ ] Deletar `/src/backend/gangRoutes.js`
- [ ] Deletar `/src/backend/attackController.js`
- [ ] Deletar `/src/backend/gangWarService.js`
- [ ] Mover `.jsw` files para `/backend/` (raiz)
- [ ] Remover código legado (MemberContext, playerAuth.jsw, etc)
- [ ] Verificar que `package.json` tem todas as dependências necessárias
- [ ] Testar build local: `npm run build`
- [ ] Fazer deploy no Wix

---

## 🔧 ARQUITETURA CORRETA

```
projeto-wix/
├── /src/                          ← Frontend React/Astro
│   ├── /components/               ← Componentes React
│   ├── /pages/                    ← Páginas Astro
│   ├── /integrations/             ← Re-exports do Wix
│   ├── /store/                    ← Zustand stores
│   ├── /hooks/                    ← React hooks
│   └── /services/                 ← Lógica frontend
│
├── /backend/                      ← Backend Wix (.jsw only)
│   ├── attackPublisher.jsw
│   ├── chatRealtime.jsw
│   ├── matchApi.jsw
│   └── ...
│
├── /public/                       ← Assets estáticos
├── package.json                   ← Dependências (sem Node.js backend)
├── tsconfig.json
├── astro.config.mjs
└── wix.config.json
```

---

## ⚠️ AVISOS IMPORTANTES

1. **Não use Node.js puro em Wix Vibe** - Use `.jsw` files para backend
2. **Não coloque backend em `/src`** - Deve estar em `/backend` (raiz)
3. **Não instale pacotes Node.js** - Use apenas os permitidos pelo Wix
4. **Remova código legado** - Limpe arquivos marcados como LEGACY

---

## 📞 PRÓXIMOS PASSOS

1. **Aplicar as correções acima**
2. **Testar build local:** `npm run build`
3. **Fazer deploy:** `npm run deploy` ou via Wix Dashboard
4. **Monitorar logs** de build no Wix

---

**Relatório gerado:** 27 de Abril de 2026  
**Status:** 🔴 CRÍTICO - Ação imediata necessária
