# ADR-004 — Topologia de Repositório e Base Path

**Status:** PROPOSED (aguarda resposta à **D-01**) · **Data:** 2026-10-16 · **Bloqueia:** Fase 1 Step 1.1

## Contexto — Achado Crítico F-08
O GitHub Pages define a URL e, consequentemente, o `base` do Astro, a partir do **nome do repositório**:

| Tipo de site | Nome do repo obrigatório | URL resultante | `base` Astro | Limite |
|---|---|---|---|---|
| **User/Org site** | `<owner>.github.io` | `https://<owner>.github.io/` | `/` | **1 por conta** |
| **Project site** | qualquer outro nome | `https://<owner>.github.io/<repo>/` | `/<repo>/` | 1 por repo |

A v2.0 assumiu `royaldatacore.github.io` sem verificar se o handle GitHub do cliente é `royaldatacore`. Se não for, o site cai em `/<repo>/` e **todos os links absolutos quebram** silenciosamente — classe de bug que só aparece em produção.

## Decisão — Três opções, com default

### Opção A ⭐ RECOMENDADA — Criar organização GitHub `royaldatacore`
Criar uma **Organization** gratuita no GitHub com o nome `royaldatacore`, e nela o repo `royaldatacore.github.io`.
- URL: `https://royaldatacore.github.io/` · `base: '/'`
- ✅ Identidade de marca consistente com a razão social.
- ✅ Migração futura para domínio próprio = trocar CNAME, sem refactor.
- ✅ Organization Free inclui GitHub Pages em repos públicos + 2.000 min Actions/mês + team access.
- ✅ Separa identidade pessoal da identidade da PJ (higiene de portfólio).
- ⚠️ Consome o handle `royaldatacore` globalmente (verificar disponibilidade **antes**).
- ⚠️ ⚠️ **ATENÇÃO:** GitHub Free **for organizations** lista Pages apenas para repos públicos — OK. Porém, "GitHub Pages em repositório **privado**" exige Organization + **Enterprise Cloud**. Como nosso repo é público, não se aplica.

### Opção B — Repo `<handle-pessoal>.github.io` na conta pessoal
Renomear/criar o user-site na conta pessoal existente.
- URL: `https://<handle>.github.io/` · `base: '/'`
- ✅ Zero fricção se o user-site ainda não estiver em uso.
- ❌ Consome o **único** user-site da conta. Se o cliente já tiver portfólio pessoal lá, esta opção morre.
- ❌ Mistura identidade pessoal e PJ.

### Opção C — Project site
Repo com qualquer nome (ex.: `royal-data-core-site`) sob a conta pessoal.
- URL: `https://<handle>.github.io/royal-data-core-site/` · `base: '/royal-data-core-site/'`
- ✅ Nenhuma restrição de nome.
- ❌ URL com sufixo de repositório: **prejudica autoridade B2B e SEO** (RRR-08 agravado).
- ❌ Exige `base` correto em toda URL absoluta; Pagefind, sitemap, RSS e JSON-LD precisam do prefixo.

### Regra de decisão
```
SE handle `royaldatacore` disponível  →  Opção A
SENÃO SE user-site da conta pessoal livre  →  Opção B
SENÃO  →  Opção C  +  antecipar compra de domínio próprio para a Fase 1 (não Fase 4)
```

## Implementação parametrizada (independente da opção)
`astro.config.mjs` lê a base de variável de ambiente, com default seguro:

```js
const SITE_BASE = process.env.SITE_BASE ?? '/';
export default defineConfig({
  site: 'https://royaldatacore.github.io',
  base: SITE_BASE,
  // …
});
```
No workflow, `SITE_BASE` é derivado deterministicamente (não hardcoded):
```yaml
- id: pages
  uses: actions/configure-pages@v5
# configure-pages expõe base_path como output
env:
  SITE_BASE: ${{ steps.pages.outputs.base_path }}
```
> `actions/configure-pages` retorna `base_path` = `/` para user-site e `/<repo>` para project-site. **Isto elimina a classe de bug F-08 por construção**, independentemente da opção escolhida. Todas as URLs internas devem usar `new URL(path, import.meta.env.BASE_URL)` ou o helper `withBase()`.

## Consequências
✅ `site` e `base` nunca divergem do ambiente real. ✅ Sitemap, RSS, canonical, JSON-LD e Pagefind herdam a base correta. ✅ Migração futura para domínio próprio exige mudar **apenas** `site`.
⚠️ Regra de ouro: **nenhuma** URL interna pode ser string absoluta hardcoded (`href="/servicos"`). Sempre helper. Enforçado por teste Playwright de link-integrity + `linkinator`.

## Alternativas Rejeitadas
- **Hardcode `base: '/'`** — quebra silenciosamente sob Opção C.
- **Deploy em Vercel/Netlify para preview e Pages para prod** — viola `§C2` (canal único). Preview obtido via artifact do CI + `actions/upload-artifact` servido em job de PR.

## Ação Requerida do Humano
Responder **D-01** em `SDD-CONTEXT §9`. Sem resposta, `nexus-prime` mantém status **BLOCKED** para a Fase 1.

## Referências
GitHub Docs — *What is GitHub Pages? / Types of GitHub Pages sites* (tabela user vs project) · GitHub Docs — *Configuring a publishing source* · GitHub Docs — *Troubleshooting 404 errors* (seção "Custom domain" e "Repository") · `actions/configure-pages` outputs (`base_path`).
