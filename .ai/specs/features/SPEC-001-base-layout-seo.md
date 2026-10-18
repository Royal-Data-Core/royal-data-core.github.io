# SPEC-001 — Base Layout, SEO Técnico e JSON-LD

**ID:** SPEC-001 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `frontend-astro` · **Especificador:** `spec-engineer` · **Auditor:** `spec-auditor`
**Dependências:** ADR-000, ADR-001, ADR-002, ADR-004 · **Bloqueia:** SPEC-002…009

## Impacto em Core Web Vitals
| Métrica | Delta esperado | Justificativa |
|---|---|---|
| LCP | **neutro → positivo** | CSS único crítico, zero JS bloqueante, `<link rel="preload">` da fonte se houver |
| CLS | **0.00** | Nenhum elemento sem dimensão explícita; skip-link é `position: absolute` até `:focus` |
| INP | **0 ms** | Zero interatividade nesta camada |
| TBT | **≤ 10 ms** | Zero script no BaseLayout |

## Impacto em Bundle
| Asset | Budget | Nota |
|---|---|---|
| JS | **0 KB** | BaseLayout não emite script algum |
| CSS | **≤ 18 KB gzip** | Tailwind v4 purge automático |
| HTML | **≤ 4 KB** de overhead por página | head SEO |

## Escopo
`BaseLayout.astro` é o único ponto de injeção de: `<meta charset>`, viewport, CSP-meta (SPEC-008), referrer-meta, title template, description, canonical, Open Graph, Twitter Card, `<link rel="alternate">` RSS/hreflang, favicon, JSON-LD base (`Organization` + `WebSite`), skip-link, header, footer.

## Critérios de Aceite (Gherkin)

```gherkin
Feature: SPEC-001 — Base Layout, SEO e JSON-LD

  # ── Cenários positivos ─────────────────────────────────────────────
  Scenario: AC-001.1 — Todo documento HTML declara charset e viewport antes de qualquer conteúdo
    Given que uma rota do Critical Path foi buildada em "dist/"
    When o HTML é parseado
    Then o elemento "<meta charset=\"utf-8\">" aparece como primeiro filho de "<head>"
    And o elemento "<meta name=\"viewport\">" com "content" contendo "width=device-width" e "initial-scale=1" aparece nos primeiros 5 filhos de "<head>"

  Scenario: AC-001.2 — Title segue template determinístico
    Given a rota "/servicos" com título de página "Serviços"
    When o documento é renderizado
    Then o "<title>" é exatamente "Serviços · Royal Data Core"
    And o comprimento do "<title>" é >= 20 e <= 60 caracteres
    And a homepage tem "<title>" exatamente "Royal Data Core — Consultoria em Testes de Software"

  Scenario: AC-001.3 — Canonical absoluto e derivado de "site" + "base"
    Given que "astro.config.mjs" declara site "https://royaldatacore.github.io" e base "/"
    When a rota "/blog/flaky-tests-root-cause" é renderizada
    Then existe exatamente 1 elemento "link[rel=canonical]"
    And seu "href" é exatamente "https://royaldatacore.github.io/blog/flaky-tests-root-cause"
    And o "href" NÃO contém "//" após o protocolo
    And o "href" NÃO contém o literal "undefined" nem "null"

  Scenario: AC-001.4 — Open Graph e Twitter Card completos
    Given qualquer rota do Critical Path
    When o documento é renderizado
    Then existem meta tags "og:title", "og:description", "og:type", "og:url", "og:image", "og:locale"
    And "og:locale" é "pt_BR"
    And "og:image" aponta para arquivo existente em "dist/" com dimensões 1200x630
    And existem meta tags "twitter:card" com valor "summary_large_image", "twitter:title", "twitter:description", "twitter:image"

  Scenario: AC-001.5 — JSON-LD de Organization presente e válido
    Given a homepage renderizada
    When o bloco "script[type='application/ld+json']" é extraído
    Then o JSON faz parse sem exceção
    And "@type" é "Organization" ou "ProfessionalService"
    And "name" é "Royal Data Core"
    And "legalName" é "ROYAL DATA CORE LTDA"
    And "taxID" é "69527139000194"
    And "foundingDate" é "2026-10-06"
    And "address.addressLocality" é "Matão" e "address.addressRegion" é "SP" e "address.addressCountry" é "BR"
    And NÃO existe a chave "numberOfEmployees" com valor > 1

  Scenario: AC-001.6 — JSON-LD de WebSite com SearchAction condizente com SPEC-007
    Given a homepage renderizada
    When o segundo bloco JSON-LD é extraído
    Then "@type" é "WebSite"
    And "potentialAction.@type" é "SearchAction"
    And "potentialAction.target" contém "/busca?q={search_term_string}"

  Scenario: AC-001.7 — Skip-link é o primeiro elemento focável
    Given qualquer rota renderizada
    When o usuário pressiona "Tab" a partir do estado inicial do documento
    Then o elemento "[data-testid='skip-link']" recebe foco
    And seu texto visível é "Pular para o conteúdo principal"
    And seu "href" é "#conteudo-principal"
    And existe um elemento com "id='conteudo-principal'" e "tabindex='-1'"

  Scenario: AC-001.8 — Zero JavaScript emitido pelo BaseLayout
    Given qualquer rota do Critical Path renderizada
    When o HTML é escaneado
    Then NÃO existe elemento "<script>" com atributo "src" dentro do "<head>" gerado por BaseLayout
    And NÃO existe elemento "<script>" inline sem "type='application/ld+json'"
    And o total de bytes de "<script>" no documento é 0 fora de "script[type='application/ld+json']"

  Scenario: AC-001.9 — withBase() aplicado a toda URL interna
    Given o fonte em "src/**/*.astro" e "src/**/*.ts"
    When o lint de topologia é executado
    Then NÃO existe atributo "href" ou "src" com valor literal iniciando por "/" que não passe por "withBase()"
    And a exceção permitida é apenas "href=\"#…\"" (fragmentos) e "/favicon.svg", "/robots.txt" resolvidos por helper

  # ── CENÁRIO NEGATIVO (obrigatório) ────────────────────────────────
  Scenario: AC-001.N1 — Build falha quando "site" está ausente ou malformado
    Given que "astro.config.mjs" é modificado removendo a chave "site"
    When "npm run build" é executado
    Then o processo termina com exit code != 0
    And "stderr" contém a string "SPEC-001: 'site' é obrigatório e deve ser URL absoluta https://"
    And NENHUM artefato é gravado em "dist/"

  Scenario: AC-001.N2 — Build falha ao detectar URL interna absoluta hardcoded
    Given que "src/pages/index.astro" contém "<a href=\"/servicos\">" sem "withBase()"
    When "npm run lint:topology" é executado
    Then o exit code é != 0
    And a mensagem nomeia o arquivo e a linha
    And a mensagem cita "ADR-004: use withBase()"

  Scenario: AC-001.N3 — Teste falha ao detectar script inline não-JSON-LD
    Given que um componente emite "<script>console.log(1)</script>" inline
    When a suite Playwright roda sobre a rota afetada
    Then o teste "SPEC-001/AC-001.8" falha
    And a mensagem de falha cita "script inline viola script-src 'self' (SPEC-008)"

  Scenario: AC-001.N4 — Build falha se JSON-LD for inválido
    Given que "src/lib/jsonld.ts" produz objeto com vírgula trailing ou valor "undefined"
    When "npm run build" é executado
    Then o exit code é != 0
    And "stderr" contém "SPEC-001: JSON-LD inválido — serialização produziu 'undefined'"
```

## Hints de `data-testid`
`skip-link` · `site-header` · `site-footer` · `nav-primary` · `nav-link-home` · `nav-link-services` · `nav-link-blog` · `nav-link-contact` · `jsonld-organization` · `main-content`

## Rastreabilidade
`CONSTITUTION §C1 §C9 §C12` · `ADR-000` · `ADR-002 D1` · `ADR-004` · `SDD-CONTEXT §1 §4`

## Fontes
schema.org/Organization · schema.org/ProfessionalService · schema.org/WebSite+SearchAction · RFC 6596 (canonical) · Open Graph Protocol (ogp.me) · WCAG 2.1 SC 2.4.1 (Bypass Blocks) · Google Search Central — JSON-LD structured data.
