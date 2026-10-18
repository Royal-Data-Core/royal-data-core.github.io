# SPEC-007 — Busca Full-Text Client-Side (Pagefind)

**ID:** SPEC-007 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `frontend-astro` · **Auditor:** `spec-auditor`, `static-analysis-enforcer`
**Dependências:** SPEC-001, SPEC-004, **SPEC-008 (exige `'wasm-unsafe-eval'`)**

## Justificativa (F-13)
Site estático não tem busca. Pagefind: FOSS (MIT), binário Rust, gera índice fragmentado em `dist/_pagefind/`, carrega sob demanda. **Zero custo, zero terceiro, zero PII.** Nenhuma query sai do navegador do usuário — compatibilidade total com `CONSTITUTION §C7`.

## Impacto em CWV
| Métrica | Delta | Nota |
|---|---|---|
| LCP/CLS/INP nas rotas do Critical Path | **0** | Pagefind só carrega em `/busca` ou após interação com o dialog |
| JS em `/busca` | **≤ 20 KB gzip** inicial + WASM sob demanda (~150 KB, lazy) | dentro do budget de 50 KB porque é rota não-crítica de LCP |
| TBT em `/busca` | **≤ 150 ms** | parsing do índice |

**Regra vinculante:** Pagefind é a **única ilha** do site (`client:visible` no `SearchDialog`). Exige justificativa escrita no PR citando `SPEC-007` — satisfaz a restrição contratual de `frontend-astro`.

## Critérios de Aceite

```gherkin
Feature: SPEC-007 — Busca Pagefind

  Scenario: AC-007.1 — Índice gerado no build e servido de origem própria
    Given que "npm run build" foi executado
    When "dist/" é inspecionado
    Then "dist/_pagefind/pagefind.js" existe
    And "dist/_pagefind/pagefind.wasm" existe
    And "dist/_pagefind/pagefind-entry.json" existe e faz parse como JSON
    And o tamanho total de "dist/_pagefind/" é <= 5 MB
    And NÃO existe referência a "pagefind" em nenhum host externo

  Scenario: AC-007.2 — Busca retorna resultado relevante em <= 300 ms
    Given a rota "/busca" carregada e o índice hidratado
    When o usuário digita "flaky" em "[data-testid='search-input']"
    Then "[data-testid='search-results']" contém >= 1 "[data-testid='search-result-item']" em <= 300 ms
    And o primeiro resultado tem "[data-testid='search-result-title']" com texto não-vazio
    And cada resultado tem link com "href" resolvido por "withBase()" e apontando para arquivo existente em "dist/"
    And cada resultado exibe snippet com o termo em destaque via "<mark>"

  Scenario: AC-007.3 — Rascunhos e páginas legais excluídos do índice
    Given que o índice foi gerado
    When os documentos indexados são enumerados
    Then nenhum post com "draft: true" está presente
    And "/privacidade" NÃO está presente (data-pagefind-filter exclui)
    And "/404.html" NÃO está presente

  Scenario: AC-007.4 — Formulário não submete e não navega
    Given "[data-testid='search-form']" em "/busca"
    When o usuário pressiona "Enter" no input
    Then "window.location.pathname" permanece "/busca"
    And NENHUMA requisição de rede é feita a host externo
    And NÃO existe parâmetro de query na URL a menos que implementado via "history.replaceState" local

  Scenario: AC-007.5 — Acessibilidade de dialog de busca
    Given "[data-testid='search-input']"
    When o componente é inspecionado
    Then existe "<label for>" associado OU "aria-label" não-vazio
    And existe região "[role='status'][aria-live='polite']" anunciando a contagem de resultados
    And o foco é movido para o input automaticamente ao abrir o dialog em "/busca"
    And pressionar "Escape" fecha o dialog e devolve o foco ao elemento de origem
    And a navegação por teclado percorre resultados com "aria-activedescendant" ou "tabindex" gerenciado

  Scenario: AC-007.6 — Zero JS quando Pagefind não é necessário
    Given qualquer rota que NÃO seja "/busca" e sem dialog aberto
    When o HTML é inspecionado
    Then NÃO existe "<script src>" referenciando "/_pagefind/"
    And o JS total da rota permanece 0 KB (exceto SPEC-001 que já é 0)

  Scenario: AC-007.7 — Fallback sem JS
    Given um navegador com JavaScript desabilitado
    When "/busca" é carregada
    Then existe "[data-testid='search-noscript']" com mensagem legível
    And a mensagem oferece alternativas: link para "/blog" (listagem) e link "mailto:"
    And a página NÃO exibe input inerte sem explicação

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-007.N1 — Ausência de 'wasm-unsafe-eval' quebra a busca (detectado em CI)
    Given que "SPEC-008" é alterado removendo "'wasm-unsafe-eval'" de "script-src"
    When o teste Playwright "AC-007.2" é executado
    Then o helper "csp-guard" captura violação de CSP mencionando "wasm"
    And o teste falha com mensagem "SPEC-007 requer 'wasm-unsafe-eval' em script-src (ver SPEC-008 §D3)"

  Scenario: AC-007.N2 — Termo sem resultado exibe estado vazio, não silêncio
    Given a rota "/busca"
    When o usuário digita "xzqwkjh"
    Then "[data-testid='search-empty']" torna-se visível em <= 300 ms
    And seu texto é "Nenhum resultado para «xzqwkjh»."
    And NÃO existe resultado renderizado
    And a região "aria-live" anuncia "0 resultados"

  Scenario: AC-007.N3 — Índice ausente falha o build
    Given que o postbuild "pagefind --site dist" é removido do "package.json"
    When "npm run build" é executado
    Then o passo "verify:pagefind" detecta ausência de "dist/_pagefind/pagefind.js"
    And exit code != 0
    And "stderr" contém "SPEC-007: índice Pagefind não gerado"

  Scenario: AC-007.N4 — Budget de JS violado na ilha
    Given que "SearchDialog.astro" importa "@pagefind/default-ui" sem lazy-loading
    When "node scripts/audit-bundle.mjs" é executado
    Then o budget de 50 KB gzip da rota "/busca" é excedido
    And exit code != 0
    And o relatório lista o componente ofensor e seu tamanho

  Scenario: AC-007.N5 — Fuga de query para terceiro
    Given que alguém adiciona telemetria de busca via "fetch('https://analytics.x/q=…')"
    When o teste "AC-007.4" roda com interceptação de rede
    Then uma requisição a host externo é detectada
    And o teste falha citando "CONSTITUTION §C7: zero rastreamento"
```

## Hints de `data-testid`
`search-trigger` · `search-form` · `search-input` · `search-results` · `search-result-item` · `search-result-title` · `search-result-snippet` · `search-empty` · `search-status` · `search-noscript` · `search-close`

## Rastreabilidade
`SDD-CONTEXT §5` · `CONSTITUTION §C1 §C7 §C10` · `ADR-001 D5` · `SPEC-004` · `SPEC-008 D3`

## Fontes
Pagefind Docs (multilingual, filters, WASM loading) · CSP Level 3 §2.1 (`'wasm-unsafe-eval'`) · WCAG 2.1 SC 4.1.3 (Status Messages), 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order) · Astro Docs — `client:visible`.
