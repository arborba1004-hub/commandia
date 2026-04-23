# Diagnóstico e Correção do Framewire CDN e Error Overlay Plugin

## Status Atual
- **customErrorOverlayPlugin**: Ativo em `astro.config.mjs` (linha 44)
- **Framewire CDN URL**: `https://static.parastorage.com/services/framewire/{version}/index.mjs`
- **Framewire Local URL**: `https://localhost:3202/framewire/index.mjs`

## Problemas Identificados

### 1. **customErrorOverlayPlugin Potencialmente Problemático**
O plugin está injetando scripts de erro que podem estar interferindo com a comunicação entre frames.

**Localização**: `/user-code/astro.config.mjs` linha 44
```javascript
plugins: [customErrorOverlayPlugin()],
```

### 2. **Framewire CDN Acessibilidade**
A URL do CDN precisa ser verificada:
- **URL Primária**: `https://static.parastorage.com/services/framewire/dist/index.mjs`
- **Fallback**: `https://static.parastorage.com/services/framewire/latest/index.mjs`

### 3. **Comunicação Entre Frames**
O frame pai (editor Wix) precisa receber mensagens de erro da pré-visualização.

## Ações Necessárias (Executar Manualmente)

### Passo 1: Desativar customErrorOverlayPlugin
Edite `/user-code/astro.config.mjs`:

```javascript
// Linha 10 - Comente a importação:
// import customErrorOverlayPlugin from "./vite-error-overlay-plugin.js";

// Linha 44 - Deixe o array de plugins vazio:
plugins: [], // TEMPORARILY DISABLED: customErrorOverlayPlugin()
```

### Passo 2: Melhorar framewire.js com Logging Detalhado
Edite `/user-code/framewire.js` para adicionar:

```javascript
// Adicione logging detalhado
console.log("Attempting to load Framewire from:", url);

// Adicione tratamento de erro com fallback
try {
  const framewireModule = await import(/* @vite-ignore */ url);
  globalThis.framewire = framewireModule;
  console.log("✓ Framewire loaded successfully");
} catch (importError) {
  console.error("✗ Failed to import Framewire from URL:", url, importError);
  // Tente URL de fallback
  const fallbackUrl = `https://static.parastorage.com/services/framewire/dist/index.mjs`;
  const fallbackModule = await import(/* @vite-ignore */ fallbackUrl);
  globalThis.framewire = fallbackModule;
}

// Notifique o frame pai quando Framewire estiver pronto
if (window.parent && window.parent !== window) {
  window.parent.postMessage({
    type: 'framewire-ready',
    status: 'initialized',
    timestamp: new Date().toISOString()
  }, '*');
}
```

### Passo 3: Melhorar vite-error-overlay-plugin.js
Edite `/user-code/vite-error-overlay-plugin.js` para adicionar comunicação com frame pai:

```javascript
const customErrorOverlayPlugin = () => {
  return {
    name: "custom-error-overlay",
    apply: "serve",
    transformIndexHtml(html) {
      // Injete script de comunicação com frame pai
      const errorScript = `
        <script>
          window.addEventListener('error', (event) => {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({
                type: 'preview-error',
                error: event.error?.message || String(event.error),
                timestamp: new Date().toISOString()
              }, '*');
            }
          });
        </script>
      `;
      return html.replace("</head>", errorScript + "</head>");
    },
  };
};
```

## Verificação da CDN

### URLs a Testar no Console do Navegador:
```javascript
// Teste 1: Verificar acessibilidade da CDN
fetch('https://static.parastorage.com/services/framewire/dist/index.mjs')
  .then(r => console.log('✓ CDN acessível:', r.status))
  .catch(e => console.error('✗ CDN inacessível:', e));

// Teste 2: Verificar se o arquivo existe
fetch('https://static.parastorage.com/services/framewire/dist/index.mjs', { method: 'HEAD' })
  .then(r => console.log('✓ Arquivo existe:', r.status))
  .catch(e => console.error('✗ Arquivo não encontrado:', e));
```

## Configuração do Frame Pai

O frame pai (editor Wix) deve estar configurado para:

1. **Aceitar mensagens de erro** da pré-visualização:
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'preview-error') {
    console.error('Erro da pré-visualização:', event.data.error);
  }
  if (event.data.type === 'framewire-ready') {
    console.log('Framewire pronto na pré-visualização');
  }
});
```

2. **Permitir origem cruzada** (CORS):
   - Verificar `security.checkOrigin: false` em `astro.config.mjs` ✓ (já configurado)

3. **Permitir hosts** para desenvolvimento:
   - Verificar `server.allowedHosts: true` em `astro.config.mjs` ✓ (já configurado)

## Resumo das Mudanças Necessárias

| Arquivo | Ação | Prioridade |
|---------|------|-----------|
| `astro.config.mjs` | Desativar `customErrorOverlayPlugin()` | 🔴 Alta |
| `framewire.js` | Adicionar logging e fallback CDN | 🟡 Média |
| `vite-error-overlay-plugin.js` | Adicionar comunicação com frame pai | 🟡 Média |

## Próximos Passos

1. ✅ Desativar o plugin de erro customizado
2. ✅ Testar a acessibilidade da CDN do Framewire
3. ✅ Verificar logs no console da pré-visualização
4. ✅ Confirmar que mensagens chegam ao frame pai
5. ✅ Tentar publicar novamente

---

**Nota**: Estas mudanças devem ser feitas manualmente nos arquivos raiz do projeto, pois estão fora da pasta `/src`.
