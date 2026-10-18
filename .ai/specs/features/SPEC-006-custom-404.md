# SPEC-006 — Página 404 Customizada

**ID:** SPEC-006 · **Versão:** 1.0.0 · **Agente:** `frontend-astro` · **Depende de:** SPEC-001

## Impacto em CWV
Irrelevante (rota de erro). Ainda assim: JS 0 KB, CLS 0.00.

## Restrição de plataforma
O GitHub Pages serve `404.html` da **raiz do artefato publicado**. O Astro gera `dist/404.html` a partir de `src/pages/404.astro` sem configuração adicional. A página **não** herda `base` em project-site para URLs relativas — por isso `withBase()` é crítico aqui.

## Critérios de Aceite

```gherkin
Feature: SPEC-006 — 404 Custom

  Scenario: AC-006.1 — Arquivo posicionado na raiz do artefato
    Given que o build foi executado
    When "dist/" é listado
    Then "dist/404.html" existe no nível raiz
    And "dist/404/index.html" NÃO existe

  Scenario: AC-006.2 — Conteúdo útil, sem vazamento de informação
    Given que "dist/404.html" é renderizado em navegador
    When o conteúdo é inspecionado
    Then existe "<h1>" com texto "Página não encontrada"
    And NÃO existe string "Astro", "Vite", "stack trace", "node_modules", "Error:" ou nome de framework
    And NÃO existe listagem de diretórios
    And existem >= 3 links de navegação: "[data-testid='404-link-home']", "[data-testid='404-link-blog']", "[data-testid='404-link-services']"
    And todos os "href" passam por "withBase()" e apontam para rotas que existem em "dist/"

  Scenario: AC-006.3 — Meta robots noindex
    Given "dist/404.html"
    When o "<head>" é inspecionado
    Then existe "<meta name='robots' content='noindex, follow'>"
    And NÃO existe "<link rel='canonical'>"

  Scenario: AC-006.4 — Auxílio à recuperação
    Given a página 404 carregada
    When o conteúdo é inspecionado
    Then existe "[data-testid='404-search-hint']" com link para "/busca"
    And existe "[data-testid='404-contact-hint']" com link "mailto:" (via ObfuscatedMailto)
    And a página exibe a URL solicitada de forma segura (sem refletir input como HTML)

  Scenario: AC-006.5 — Herda BaseLayout completo
    Given "dist/404.html"
    When inspecionado
    Then contém o "<meta http-equiv='Content-Security-Policy'>" de SPEC-008
    And contém o skip-link de SPEC-001
    And contém o rodapé com CNPJ de SPEC-009

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-006.N1 — XSS refletido é bloqueado
    Given que o template insere a URL solicitada via "set:html={url}"
    When o teste Playwright navega para "/<img src=x onerror=alert(1)>"
    Then o helper "csp-guard" registra violação de CSP OU o elemento "img[onerror]" não é criado
    And o teste falha com mensagem "SPEC-006.N1: reflexão de URL sem escape — use texto puro"

  Scenario: AC-006.N2 — Vazamento de stack detectado
    Given que o template inclui "{JSON.stringify(error)}"
    When "npm run lint:security" é executado sobre "dist/"
    Then exit code != 0
    And a mensagem cita "SPEC-006.2: página de erro não pode expor internals"

  Scenario: AC-006.N3 — Link quebrado na 404
    Given que "[data-testid='404-link-blog']" aponta para "/artigos" (rota inexistente)
    When "linkinator" roda sobre "dist/404.html"
    Then o link é reportado como quebrado
    E o job "verify" falha com exit code != 0
```

## Hints de `data-testid`
`404-link-home` · `404-link-blog` · `404-link-services` · `404-search-hint` · `404-contact-hint` · `404-requested-path`

## Fontes
GitHub Docs — *Creating a custom 404 page for your GitHub Pages site* · GitHub Docs — *Troubleshooting 404 errors* · OWASP ASVS §V7 (Error Handling) · OWASP Logging Cheat Sheet · WCAG 2.1 SC 3.3.3 (Error Suggestion).
