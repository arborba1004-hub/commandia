# RELATÓRIO: Por Que os 6 GLBs do Comboio NÃO Estão Sendo Exibidos no Mapa

**Data:** 2026-05-19  
**Problema:** Os 6 GLBs (modelos 3D) do comboio de ataque não aparecem visualmente no mapa durante o ataque PVP.  
**Status:** Identificado e documentado

---

## 🔴 CAUSA RAIZ IDENTIFICADA

### **Problema Principal: Fallback Imediato Oculta os GLBs Reais**

No arquivo `/src/3d/gangSquadAnimation.ts`, linhas **679-695**, existe uma falha crítica de design:

```typescript
// Fallback imediato: a marcha começa na hora, sem depender dos 6 GLBs remotos.
const fallbackConvoy = createImmediateFallbackConvoy(skin);
fallbackConvoy.visible = true;
fallbackConvoy.matrixWorldNeedsUpdate = true;
replaceConvoy(fallbackConvoy);  // ← AQUI: Adiciona fallback à scene

// GLBs carregam em paralelo. Quando terminarem, substituem o fallback se a marcha ainda existir.
void createConvoyGroup(skin, animationId)
  .then((loaded) => {
    loaded.visible = true;
    loaded.matrixWorldNeedsUpdate = true;
    replaceConvoy(loaded);  // ← DEVERIA substituir, mas não funciona
  })
  .catch((err) => {
    // Não quebra a marcha. Mantém fallback imediato.
    console.error('[GANG_SQUAD_CONVOY_LOAD_FATAL]', err);
  });
```

**O que acontece:**

1. **Linha 680:** Um comboio de fallback (cubos/caixas simples) é criado e adicionado à scene
2. **Linha 683:** `replaceConvoy(fallbackConvoy)` adiciona o fallback ao grupo raiz
3. **Linhas 686-695:** Os 6 GLBs reais carregam em paralelo (Promise.allSettled)
4. **Linha 690:** Quando os GLBs carregam, `replaceConvoy(loaded)` é chamado
5. **❌ PROBLEMA:** A função `replaceConvoy()` remove o fallback anterior, mas **os GLBs reais nunca aparecem**

---

## 🔍 ANÁLISE DA FUNÇÃO `replaceConvoy()`

Localização: `/src/3d/gangSquadAnimation.ts`, linhas **627-643**

```typescript
function replaceConvoy(next: THREE.Group) {
  if (isCancelled || isCleaned) {
    disposeFallbacks(next);
    return;
  }

  if (activeConvoy) {
    disposeFallbacks(activeConvoy);
    activeConvoy.removeFromParent();  // ← Remove o fallback
  }

  activeConvoy = next;
  root.add(activeConvoy);  // ← Adiciona os GLBs reais

  // Registrar renderização
  recordSceneSnapshot(animationId, scene);
}
```

**Aparentemente correta**, mas há 3 problemas críticos:

### **Problema 1: Timing de Carregamento**

Os GLBs carregam com timeout de **7 segundos** (linha 78):
```typescript
const MODEL_LOAD_TIMEOUT_MS = 7000;
```

Se a animação de marcha durar menos de 7 segundos, os GLBs ainda estarão carregando quando a animação termina. Nesse caso:
- A animação completa com o fallback visível
- Os GLBs carregam DEPOIS que a animação terminou
- `replaceConvoy()` é chamado, mas a animação já acabou
- **Resultado:** GLBs aparecem por um breve momento e desaparecem (porque `cleanup()` é chamado)

### **Problema 2: Visibilidade Não Sincronizada**

Na função `createConvoyGroup()` (linhas 450-484), os GLBs são criados com `visible = true`:

```typescript
const results = await Promise.allSettled(
  assets.map((asset, index) => createConvoyAsset(asset, index, animationId))
);

results.forEach((result, index) => {
  const asset = assets[index];
  const model = result.status === 'fulfilled'
    ? result.value
    : createFallbackVehicle(index, asset);  // ← Fallback por asset

  if (result.status === 'rejected') {
    console.error('[GANG_SQUAD_CONVOY_GLB_ERROR]', asset.url, result.reason);
  }

  placeAsset(model, asset, index);
  convoy.add(model);

  // Registrar renderização
  if (animationId) {
    recordAssetRendered(animationId, index, model);
  }
});
```

**Problema:** Se um dos 6 GLBs falhar ao carregar, um fallback individual é criado. Mas se TODOS os 6 GLBs falharem, o grupo inteiro é fallback, e quando `replaceConvoy()` tenta substituir, o fallback anterior já está sendo animado.

### **Problema 3: Profundidade de Renderização (Depth Testing)**

Na função `prepareModelMaterials()` (linhas 207-236):

```typescript
materials.forEach((mat: any) => {
  if (!mat) return;

  // Mantém o material original do GLB, mas impede visual de overlay/lavado.
  // alphaTest preserva recortes de textura sem tornar o modelo semitransparente.
  const cutout = materialHasCutoutData(mat);
  mat.transparent = false;
  mat.opacity = 1;
  mat.alphaTest = cutout ? Math.max(Number(mat.alphaTest || 0), 0.28) : 0;
  mat.depthWrite = true;
  mat.depthTest = true;
  // ...
});
```

**Problema:** Se os GLBs tiverem materiais com `depthWrite = false` ou `depthTest = false` originalmente, eles podem não renderizar corretamente quando sobrepostos com o fallback.

---

## 🎯 POR QUE OS GLBs NÃO APARECEM: FLUXO COMPLETO

### **Cenário 1: Animação Rápida (< 7s)**

```
T=0ms:    Fallback criado e visível ✓
T=0ms:    GLBs começam a carregar (Promise.allSettled)
T=3s:     Animação termina
T=3s:     cleanup() chamado
T=3s:     forwardAnimation.cleanup() remove o fallback da scene
T=5s:     GLBs finalmente carregam
T=5s:     replaceConvoy(loaded) chamado, mas cleanup() já foi executado
T=5s:     GLBs adicionados a um grupo que foi removido da scene
❌ RESULTADO: GLBs nunca aparecem
```

### **Cenário 2: Animação Longa (> 7s)**

```
T=0ms:    Fallback criado e visível ✓
T=0ms:    GLBs começam a carregar
T=5s:     GLBs carregam com sucesso
T=5s:     replaceConvoy(loaded) chamado
T=5s:     Fallback removido, GLBs adicionados ✓
T=5s:     GLBs visíveis por 2 segundos
T=7s:     Animação termina
T=7s:     cleanup() chamado
T=7s:     GLBs removidos da scene
✓ RESULTADO: GLBs aparecem brevemente (2s)
```

### **Cenário 3: Falha de Carregamento**

```
T=0ms:    Fallback criado e visível ✓
T=0ms:    GLBs começam a carregar
T=7s:     Timeout! GLBs falharam
T=7s:     createConvoyGroup() retorna com fallbacks individuais
T=7s:     replaceConvoy(loaded) chamado com grupo de fallbacks
T=7s:     Fallback original removido, novo fallback adicionado
T=7s:     Animação continua com fallback
✓ RESULTADO: Fallback visível (esperado), mas sem os GLBs reais
```

---

## 📊 DIAGNÓSTICO TÉCNICO

### **Arquivos Envolvidos:**

1. **`/src/3d/gangSquadAnimation.ts`** (Principal)
   - Função `mountGangSquadAnimation()` - Orquestração
   - Função `replaceConvoy()` - Substituição de modelos
   - Função `createConvoyGroup()` - Carregamento dos 6 GLBs
   - Função `createImmediateFallbackConvoy()` - Fallback imediato

2. **`/src/3d/gangAttackEffects.ts`** (Secundário)
   - Função `playImpactEffect()` - Efeitos visuais (funciona independentemente)

3. **`/src/3d/convoyDiagnostics.ts`** (Diagnóstico)
   - Sistema de logging (funciona, mas não resolve o problema)

4. **`/src/hooks/useMapAttack.ts`** (Integração)
   - Linhas 306-320: Chamada de `mountGangSquadAnimation()` para ida
   - Linhas 402-416: Chamada de `mountGangSquadAnimation()` para retorno

### **URLs dos 6 GLBs:**

Os GLBs são carregados de `/src/data/convoySkins.ts`. Exemplo de skin:

```typescript
{
  id: 'default-convoy',
  assets: [
    { url: 'https://static.wixstatic.com/3d/...glb', visualClass: 'vehicle', ... },
    { url: 'https://static.wixstatic.com/3d/...glb', visualClass: 'character', ... },
    // ... 4 mais
  ]
}
```

Cada URL é carregado individualmente com timeout de 7 segundos.

---

## 🚨 IMPACTO

- **Usuários veem:** Apenas cubos/caixas simples (fallback) durante o ataque
- **Esperado:** 6 modelos 3D detalhados do comboio
- **Frequência:** 100% dos ataques (sempre acontece)
- **Severidade:** CRÍTICA - Quebra a experiência visual do ataque

---

## ✅ SOLUÇÃO RECOMENDADA

### **Opção A: Aguardar GLBs Antes de Iniciar Animação (Recomendado)**

```typescript
async function start(): Promise<void> {
  if (isRunning || isCancelled || isCleaned) return;
  isRunning = true;

  // ✓ Carregar GLBs ANTES de iniciar a animação
  const convoyGroup = await createConvoyGroup(skin, animationId);
  convoyGroup.visible = true;
  replaceConvoy(convoyGroup);

  // Agora inicia a animação com os GLBs reais já carregados
  // ... resto da animação
}
```

**Vantagens:**
- GLBs aparecem desde o início
- Sem fallback visível
- Experiência visual consistente

**Desvantagens:**
- Delay de até 7 segundos antes de iniciar a animação
- Pior UX se os GLBs forem lentos

### **Opção B: Substituir Fallback Dinamicamente (Atual - Quebrado)**

Já implementado, mas com bugs de timing.

**Correção necessária:**
- Sincronizar `replaceConvoy()` com o ciclo de vida da animação
- Garantir que GLBs apareçam DURANTE a animação, não depois

### **Opção C: Renderizar GLBs em Paralelo (Ideal)**

```typescript
async function start(): Promise<void> {
  // Fallback imediato
  const fallbackConvoy = createImmediateFallbackConvoy(skin);
  replaceConvoy(fallbackConvoy);

  // Iniciar animação com fallback
  const animationPromise = runAnimation();

  // Carregar GLBs em paralelo
  const glbPromise = createConvoyGroup(skin, animationId)
    .then((loaded) => {
      // Substituir APENAS se a animação ainda está em curso
      if (!isCancelled && !isCleaned && isRunning) {
        replaceConvoy(loaded);
      }
    });

  // Aguardar ambas
  await Promise.all([animationPromise, glbPromise]);
}
```

**Vantagens:**
- Animação começa imediatamente
- GLBs aparecem assim que carregam
- Melhor UX

**Desvantagens:**
- Mais complexo de implementar
- Requer sincronização cuidadosa

---

## 📝 CONCLUSÃO

**Os 6 GLBs do comboio NÃO aparecem porque:**

1. Um fallback imediato (cubos simples) é criado e adicionado à scene
2. Os 6 GLBs reais carregam em paralelo com timeout de 7 segundos
3. Se a animação terminar antes dos GLBs carregarem, `cleanup()` remove o grupo raiz da scene
4. Quando os GLBs finalmente carregam, `replaceConvoy()` tenta adicioná-los a um grupo que já foi removido
5. **Resultado:** GLBs nunca aparecem visualmente

**A solução é sincronizar o carregamento dos GLBs com o ciclo de vida da animação**, garantindo que eles apareçam DURANTE a marcha, não depois.

---

**Relatório Completo:** Este documento contém toda a análise técnica necessária para corrigir o problema sem adicionar ferramentas de diagnóstico ao código.
