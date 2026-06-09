# Uso

Adicione os scripts dentro do `<head>` da página.

```html

<script>
(function(w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l !== 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-K56CC72V');
</script>
<script>
  document.head.appendChild(Object.assign(document.createElement("script"), {
    src: `https://cdn.jsdelivr.net/gh/Exame-Tracking/tracking@1/pageview.min.js?cb=${Math.floor(Date.now() / 600000)}`,
  }));
  document.head.appendChild(Object.assign(document.createElement("script"), {
    src: `https://cdn.jsdelivr.net/gh/Exame-Tracking/tracking@1/lead.min.js?cb=${Math.floor(Date.now() / 600000)}`,
  }));
</script>
```

Apenas nas páginas **vdl**, adicione também:

```html
<script>
  document.head.appendChild(Object.assign(document.createElement("script"), {
    src: `https://cdn.jsdelivr.net/gh/Exame-Tracking/tracking@1/qualified-lead.min.js?cb=${Math.floor(Date.now() / 600000)}`,
  }));
</script>
```

## Scripts

### `pageview.min.js`

Responsável pelo tracking automático de visualizações de página.

### `lead.min.js`

Responsável pelo tracking de leads e envios de formulário.

### `qualified-lead.min.js`

Adicionado apenas nas páginas **vdl**. Escuta o envio de qualquer formulário da página, calcula a faixa de qualificação do lead (`Quente`, `Morno`, `Frio`, `Desqualificado`, `Inelegível` ou `Sem_Score`) e dispara o evento `Qualified Lead` no Umami quando a faixa é `Quente`, `Morno` ou `Frio`.

## Versionamento

Os arquivos são carregados via jsDelivr usando o repositório GitHub:

```txt
https://cdn.jsdelivr.net/gh/Exame-Tracking/tracking@1/
```

O `@1` representa a versão principal (`major version`) do projeto.

Exemplos:

```txt
@1     -> sempre última versão da série 1.x.x
@1.2   -> sempre última versão da série 1.2.x
@1.2.0 -> versão fixa exata
```

Isso permite atualizar scripts sem alterar a URL principal, mantendo controle de compatibilidade.

## Cache Busting

O parâmetro `cb` é atualizado automaticamente a cada 10 minutos:

```js
Math.floor(Date.now() / 600000)
```

Isso força a atualização do cache da CDN periodicamente, evitando que navegadores utilizem versões antigas dos arquivos por muito tempo.

## Purge de Cache da CDN

O jsDelivr mantém cache distribuído globalmente. Após atualizar arquivos no GitHub, pode existir propagação de cache temporária.

Para forçar limpeza imediata do cache:

[jsDelivr Purge Cache Tool](https://www.jsdelivr.com/tools/purge?utm_source=chatgpt.com)

Exemplo de URL para purge:

```txt
https://cdn.jsdelivr.net/gh/Exame-Tracking/tracking@1/pageview.min.js
```

Isso força a CDN a buscar novamente o arquivo atualizado no repositório.