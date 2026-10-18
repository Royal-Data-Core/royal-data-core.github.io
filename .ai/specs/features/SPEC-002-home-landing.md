# SPEC-002 — Homepage / Landing (Superfície S1)

**ID:** SPEC-002 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `frontend-astro` (estrutura) + `content-strategist` (copy) · **Auditor:** `spec-auditor`
**Dependências:** SPEC-001 · **Bloqueia:** SPEC-003, SPEC-005

## Impacto em Core Web Vitals
| Métrica | Alvo | Racional |
|---|---|---|
| LCP | **≤ 2000 ms** em Moto G4 simulado (3G lento) | LCP é o `<h1>` (texto), não imagem ⇒ imbatível |
| CLS | **0.00** | Nenhuma imagem sem `width`/`height`; nenhum webfont swap sem `font-display: optional` |
| INP | **0 ms** | Zero ilha na home |
| TBT | **≤ 20 ms** | Zero JS na home |
| Tamanho HTML | **≤ 25 KB** bruto | — |

## Impacto em Bundle
**JS: 0 KB. CSS: ≤ 18 KB gzip (compartilhado). Imagens: ≤ 120 KB total (AVIF).**

## Estrutura (padrão PAS — `content-strategist`)
1. **Hero** — Problema. `<h1>` + subtítulo + 2 CTAs.
2. **Prova** — Agitação com evidência: badges determinísticos (build status, Lighthouse score, testes passando) lidos do próprio CI em build time.
3. **Serviços** — Solução: 3 cards (`ServiceCard.astro`) com link para `/servicos`.
4. **Conteúdo recente** — 3 posts do blog (prova de atividade técnica).
5. **CTA final** — contato (SPEC-005).

## Critérios de Aceite

```gherkin
Feature: SPEC-002 — Homepage

  Scenario: AC-002.1 — Hierarquia de headings estrita e única
    Given que a homepage foi renderizada
    When a árvore de headings é percorrida
    Then existe exatamente 1 elemento "h1"
    And o texto do "h1" é "Engenharia de qualidade para software crítico"
    And todo "h2" tem um "h1" ancestral
    And NÃO existe salto de nível (h1 -> h3 sem h2 intermediário)
    And a contagem total de headings é <= 12

  Scenario: AC-002.2 — Dois CTAs primários visíveis sem scroll em 375x667
    Given o viewport 375x667
    When a homepage é carregada
    Then "[data-testid='cta-primary-services']" está inteiramente dentro do viewport inicial
    And "[data-testid='cta-primary-contact']" está inteiramente dentro do viewport inicial
    And ambos têm área clicável >= 44x44 CSS pixels
    And o contraste de texto de ambos é >= 4.5:1

  Scenario: AC-002.3 — Badges de prova são resolvidos em build time, nunca em runtime
    Given que a homepage foi buildada
    When o HTML é inspecionado
    Then "[data-testid='proof-build-status']" contém texto estático "build: passing" ou "build: failing"
    And NÃO existe elemento "<img src='https://img.shields.io/…'>" (badge de terceiro em runtime)
    And NÃO existe chamada "fetch()" a qualquer host externo no bundle da homepage

  Scenario: AC-002.4 — Três posts recentes renderizados a partir da Content Collection
    Given que existem >= 3 entradas publicadas em "src/content/blog/"
    When a homepage é renderizada
    Then "[data-testid='recent-posts']" contém exatamente 3 elementos "[data-testid='post-card']"
    And os cards estão ordenados por "publishDate" decrescente
    E cada card exibe data em formato "DD de mês de AAAA" em pt-BR
    And cada card tem link com "href" resolvido por "withBase()"

  Scenario: AC-002.5 — Zero claim de tempo de mercado da PJ
    Given o texto integral da homepage renderizada
    When o conteúdo é escaneado
    Then NÃO existe substring que case o regex "/\b(\d+)\s*(anos?|years?)\b/i" associada à empresa
    And NÃO existe "desde" seguido de ano anterior a 2026 referindo-se à Royal Data Core LTDA
    And NÃO existe "líder", "maior", "melhor do mercado", "referência nacional"
    And NÃO existe "apaixonado", "inovador", "soluções disruptivas", "transformação digital"

  Scenario: AC-002.6 — LCP <= 2000ms em perfil mobile 3G
    Given o Lighthouse CI com preset "mobile" e throttling "slow4G"
    When a homepage é auditada
    Then a métrica "largest-contentful-paint" é <= 2000 ms
    And o elemento LCP é um nó de texto, não uma imagem
    And "total-blocking-time" é <= 20 ms

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-002.N1 — Homepage falha o build sem nenhum post publicado
    Given que "src/content/blog/" contém 0 entradas com "draft: false"
    When "npm run build" é executado
    Then o exit code é != 0
    And "stderr" contém "SPEC-002: homepage requer >= 1 post publicado; encontrei 0"

  Scenario: AC-002.N2 — Lighthouse falha se hero for convertido em imagem
    Given que o "h1" é substituído por "<img src='/hero-text.png' alt='…'>"
    When o LHCI é executado
    Then a assertion "largest-contentful-paint" falha com valor > 2000 ms
    And o job "lighthouse" termina com exit code != 0
    And o relatório nomeia o elemento LCP como imagem

  Scenario: AC-002.N3 — Gate de copy rejeita jargão de marketing
    Given que a homepage contém a string "soluções inovadoras de ponta"
    When "npm run lint:copy" é executado
    Then o exit code é != 0
    And a saída lista o termo proibido e a linha
    And a saída cita "CONSTITUTION §C9 — alegação não-verificável"

  Scenario: AC-002.N4 — CLS regressão bloqueia merge
    Given que um banner de newsletter sem "height" explícito é inserido acima do hero
    When o LHCI é executado
    Then a assertion "cumulative-layout-shift" falha com valor > 0.1
    And o job falha com exit code != 0
```

## Hints de `data-testid`
`hero-headline` · `hero-subheadline` · `cta-primary-services` · `cta-primary-contact` · `proof-build-status` · `proof-lighthouse-score` · `proof-tests-passing` · `services-grid` · `service-card-<slug>` · `recent-posts` · `post-card` · `final-cta`

## Rastreabilidade
`SDD-CONTEXT §1 §2 §4` · `CONSTITUTION §C9 §C10` · `SPEC-001`

## Fontes
WCAG 2.1 SC 1.3.1, 1.4.3, 1.4.11, 2.5.5 · Google Web Vitals (LCP/CLS/INP thresholds) · CDC Art. 37 · AFA Kill Switch (alegação falsa).
