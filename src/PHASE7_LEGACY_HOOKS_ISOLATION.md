# FASE 7 — Isolação de Hooks Legados do Wix

**Data:** 2026-04-09  
**Status:** ✅ Concluído

## Objetivo
Remover `useWixAuth` e `useMatchSync` do fluxo principal da aplicação, classificando-os como legado/experimental.

## Tarefas Executadas

### 1. ✅ Classificação de Hooks como Legado

#### `src/hooks/useWixAuth.ts`
- Adicionado header com aviso `⚠️ DEPRECATED`
- Documentação clara: "Este hook não é mais usado no fluxo principal"
- Referência para alternativa: `useMember()` de `@/integrations`
- Função marcada com `@deprecated`
- **Status:** Preservado como referência histórica

#### `src/hooks/useMatchSync.ts`
- Adicionado header com aviso `⚠️ DEPRECATED`
- Documentação clara: "Não está mais ativo no fluxo principal"
- Nota: "Nenhuma nova implementação de matchmaking deve usar este hook"
- Função marcada com `@deprecated`
- **Status:** Preservado como referência histórica

### 2. ✅ Remoção de Imports do Fluxo Principal

#### `src/components/pages/MatchPage.tsx`
- ❌ Removido: `import { useMatchSync } from '@/hooks/useMatchSync'`
- ✅ Adicionado comentário: `// LEGACY: Removed from main flow`
- ✅ Página simplificada para mostrar mensagem de página legada
- ✅ Mantém estrutura de Header/Footer (sem alterações UI)
- **Status:** Não mais ativa no router (preservada em arquivo)

#### `src/components/pages/HomePageNew.tsx`
- ❌ Removido: `import { useWixAuth } from '@/hooks/useWixAuth'`
- ✅ Adicionado comentário: `// LEGACY: Removed from main flow`
- ✅ Substituídos valores do hook por placeholders
- ✅ Adicionado header com aviso de página legada
- ✅ Mantém estrutura visual (sem alterações UI)
- **Status:** Não mais ativa no router (preservada em arquivo)

### 3. ✅ Verificação de Dependências

**Arquivos que ainda mencionam os hooks:**
- `src/MATCH_SYSTEM_GUIDE.md` - Documentação (não afeta código)
- `src/MIGRATION_IMPLEMENTATION_GUIDE.md` - Documentação (não afeta código)
- `src/AUDIT_SUMMARY.md` - Documentação (não afeta código)

**Nenhuma importação ativa encontrada no código executável.**

## Estrutura Final

### Hooks Legados (Preservados)
```
src/hooks/
├── useWixAuth.ts ⚠️ DEPRECATED
├── useMatchSync.ts ⚠️ DEPRECATED
└── ... (outros hooks ativos)
```

### Páginas Legadas (Não no Router)
```
src/components/pages/
├── MatchPage.tsx ⚠️ LEGACY (não em Router.tsx)
├── HomePageNew.tsx ⚠️ LEGACY (não em Router.tsx)
└── ... (páginas ativas)
```

### Router Ativo
```
src/components/Router.tsx
- HomePage (ativo)
- GamePage (ativo)
- GangPage (ativo)
- ... (sem MatchPage, sem HomePageNew)
```

## Impacto

✅ **Fluxo Principal:** Limpo de dependências legadas  
✅ **Código Executável:** Sem imports de hooks descontinuados  
✅ **Documentação:** Hooks marcados como deprecated  
✅ **Preservação:** Arquivos mantidos para referência histórica  
✅ **UI:** Nenhuma alteração visual  
✅ **Funcionalidade:** Nenhuma quebra de funcionalidade ativa  

## Próximos Passos (Opcional)

Se necessário no futuro:
1. Implementar novo sistema de matchmaking (não usar `useMatchSync`)
2. Usar `useMember()` de `@/integrations` para autenticação
3. Considerar arquivamento ou remoção completa dos hooks legados

## Referências

- **Autenticação Atual:** `@/integrations/members` → `useMember()`
- **Hooks Legados:** Documentados com `@deprecated`
- **Páginas Legadas:** Comentadas no Router.tsx
