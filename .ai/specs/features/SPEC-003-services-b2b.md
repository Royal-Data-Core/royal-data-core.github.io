# SPEC-003 — Serviços B2B / CLT e Página "Sobre"

**ID:** SPEC-003 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `frontend-astro` + `content-strategist` · **Auditor:** `spec-auditor`
**Dependências:** SPEC-001, SPEC-005

## Impacto em CWV
LCP ≤ 2200 ms · CLS 0.00 · INP 0 ms · JS **0 KB** (nenhuma ilha).

## Impacto em Bundle
CSS incremental ≤ 2 KB gzip. Nenhum asset novo além de ≤ 3 imagens AVIF ≤ 40 KB cada.

## Escopo
`/servicos` — vitrine de ofertas, derivada da Content Collection `services`. `/sobre` — trajetória do profissional (pessoa física), não da PJ.
Dois públicos distintos, sinalizados visualmente: **B2B (contrato PJ)** e **CLT (alocação/contratação)**.

## Content Collection `services` (schema Zod vinculante)
```ts
z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(8).max(70),
  audience: z.enum(['b2b', 'clt']),
  summary: z.string().min(60).max(180),
  deliverables: z.array(z.string().min(10)).min(3).max(7),
  engagementModels: z.array(z.enum(['projeto', 'retainer', 'alocacao', 'mentoria'])).min(1),
  stack: z.array(z.string()).min(1).max(12),
  emailSubject: z.string().min(10).max(80),   // ADR-003 D4
  order: z.number().int().min(1).max(20),
  draft: z.boolean().default(false),
})
```

## Critérios de Aceite

```gherkin
Feature: SPEC-003 — Serviços

  Scenario: AC-003.1 — Cards derivados exclusivamente da Content Collection
    Given que "src/content/services/" contém 4 documentos não-draft
    When "/servicos" é renderizada
    Then "[data-testid='services-grid']" contém exatamente 4 elementos "[data-testid^='service-card-']"
    And a ordem visual segue o campo "order" crescente
    And NÃO existe card hardcoded no template

  Scenario: AC-003.2 — Segmentação B2B/CLT explícita e acessível
    Given a página "/servicos" renderizada
    When a estrutura é inspecionada
    Then existem 2 seções com "<h2>" distintos: "Para empresas (B2B)" e "Para times (CLT / alocação)"
    And cada "[data-testid='service-card-<slug>']" carrega "data-audience" com valor "b2b" ou "clt"
    And a segmentação NÃO depende de cor como único canal (há rótulo textual)

  Scenario: AC-003.3 — Cada card expõe entregáveis, modelos e CTA qualificado
    Given um card de serviço renderizado
    When seu conteúdo é inspecionado
    Then existe lista "<ul>" com >= 3 e <= 7 itens de entregáveis
    And existe badge de modelo de contratação com texto de uma lista fechada: "Por projeto", "Retainer mensal", "Alocação", "Mentoria"
    And "[data-testid='service-cta-<slug>']" é um "<a>" cujo "href" inicia com "mailto:"
    And o parâmetro "subject" do "href" é exatamente o valor de "emailSubject" do frontmatter, URL-encoded

  Scenario: AC-003.4 — JSON-LD de serviço com oferta
    Given a página "/servicos" renderizada
    When o bloco "script[type='application/ld+json']" é extraído e parseado
    Then "@type" é "ItemList" ou array de "Service"
    And cada item tem "name", "description", "serviceType", "provider" referenciando a Organization de SPEC-001
    And NÃO existe campo "price" nem "priceSpecification" (nenhum preço é publicado)
    And NÃO existe campo "aggregateRating" (sem reviews coletados — alegação falsa)

  Scenario: AC-003.5 — Página "Sobre" separa pessoa física de pessoa jurídica
    Given "/sobre" renderizada
    When o texto é inspecionado
    Then alegações de experiência referem-se ao profissional, nunca à "Royal Data Core LTDA"
    And NÃO existe a expressão "empresa com X anos"
    And existe menção à razão social e ao CNPJ apenas no rodapé (SPEC-009)
    And existe "[data-testid='about-contact-cta']" com "href" iniciando em "mailto:"

  Scenario: AC-003.6 — Tabela responsiva sem overflow horizontal
    Given o viewport 375x667
    When "/servicos" é carregada
    Then "document.documentElement.scrollWidth" é <= 375
    And nenhum elemento tem "overflow" horizontal visível

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-003.N1 — Schema Zod rejeita frontmatter inválido no build
    Given que "src/content/services/qa-consulting.mdx" declara "audience: 'empresas'"
    When "npm run build" é executado
    Then o exit code é != 0
    And "stderr" contém "services/qa-qa-consulting" e "audience" e "Invalid enum value"
    And NENHUM arquivo é gravado em "dist/"

  Scenario: AC-003.N2 — Build falha com menos de 3 entregáveis
    Given um documento de serviço com "deliverables" de 2 itens
    When "npm run build" é executado
    Then o exit code é != 0
    And "stderr" contém "SPEC-003: deliverables requer mínimo 3 itens"

  Scenario: AC-003.N3 — Slug duplicado é rejeitado
    Given que dois documentos em "src/content/services/" declaram o mesmo "slug"
    When "npm run build" é executado
    Then o exit code é != 0
    And "stderr" contém "SPEC-003: slug duplicado"

  Scenario: AC-003.N4 — Preço publicado bloqueia o merge
    Given que um documento de serviço adiciona campo "price: 5000"
    When "npm run build" é executado
    Then o schema Zod rejeita por chave desconhecida ("unrecognized_keys")
    And a mensagem cita "SPEC-003: publicação de preço não é permitida no v1.0"

  Scenario: AC-003.N5 — CTA com formulário é rejeitado
    Given que um card de serviço é alterado para "<form action='https://formspree.io/…'>"
    When "npm run lint:topology" e "npm run build" são executados
    Then o lint falha citando "ADR-003 D2: formulários remotos são proibidos"
    And o gate "guard" bloqueia o merge
```

## Hints de `data-testid`
`services-grid` · `service-card-<slug>` · `service-audience-<b2b|clt>` · `service-deliverables-<slug>` · `service-engagement-<slug>` · `service-cta-<slug>` · `about-professional-bio` · `about-contact-cta`

## Rastreabilidade
`ADR-000` · `ADR-003 D1 D4` · `SDD-CONTEXT §1 §2 §7` · `CONSTITUTION §C9 §C12` · `SPEC-001` · `SPEC-005`

## Fontes
schema.org/Service · schema.org/ItemList · WCAG 2.1 SC 1.4.1 (Use of Color), 1.4.10 (Reflow) · CDC Art. 30/31 (informação de oferta) · CDC Art. 37 (publicidade enganosa).
