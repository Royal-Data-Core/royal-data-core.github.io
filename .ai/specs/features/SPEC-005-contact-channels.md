# SPEC-005 — Canais de Contato Zero-SaaS

**ID:** SPEC-005 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `frontend-astro` · **Auditor:** `spec-auditor`, `integrations-security`
**Dependências:** ADR-003 (normativo), SPEC-001, SPEC-008

## Impacto em CWV
LCP ≤ 2000 ms · CLS 0.00 · INP 0 ms · **JS 0 KB** · **requests externos: 0**

## Impacto em Bundle
CSS incremental ≤ 1 KB. SVGs de ícones sociais inline ≤ 1 KB cada (sem biblioteca).

## Escopo
Rotas `/contato` + bloco de contato no rodapé global + CTAs `mailto:` distribuídos. Implementa a lista **fechada** de canais de `ADR-003 D1`.

## Critérios de Aceite

```gherkin
Feature: SPEC-005 — Contato Zero-SaaS

  Scenario: AC-005.1 — Lista exaustiva de canais, nenhum a mais
    Given que "/contato" foi renderizada
    When todos os elementos "<a>" são enumerados
    Then o conjunto de esquemas de "href" é subconjunto de {"mailto:", "tel:", "https://wa.me", "https://linkedin.com", "https://github.com", "/"}
    And NÃO existe "href" com esquema "javascript:", "data:" nem "blob:"
    And NÃO existe elemento "<form>" na página
    And NÃO existe "<iframe>" na página

  Scenario: AC-005.2 — mailto com subject e body qualificados por origem
    Given o CTA "[data-testid='contact-cta-services-b2b']" na página "/servicos"
    When seu "href" é decodificado
    Then o esquema é "mailto:"
    And o parâmetro "subject" decodificado é "Consultoria QA B2B — <nome do serviço>"
    And o parâmetro "body" decodificado contém razão social e a URL de origem
    And o "subject" difere do "subject" do CTA da homepage

  Scenario: AC-005.3 — Email ofuscado por entidades HTML em build time (ADR-003 D3)
    Given o HTML bruto de "/contato" gravado em "dist/contato/index.html"
    When o arquivo é lido como texto
    Then a expressão regular "/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/" NÃO encontra correspondência
    E o endereço aparece como sequência de entidades decimais (ex. "&#99;&#111;&#110;")
    When a página é carregada em navegador e o DOM é consultado
    Then "[data-testid='contact-email-link']" tem "href" decodificado iniciando em "mailto:"
    And o texto visível do link é o endereço legível completo
    And um leitor de tela anuncia o endereço legível (aria-label igual ao texto decodificado)

  Scenario: AC-005.4 — WhatsApp com mensagem pré-preenchida e rel seguro
    Given "[data-testid='contact-whatsapp-link']"
    When seus atributos são inspecionados
    Then "href" casa com "/^https:\/\/wa\.me\/55\d{10,11}\?text=/"
    And o parâmetro "text" é URL-encoded e não-vazio
    And "rel" contém "noopener" e "noreferrer"
    And "target" é "_blank"
    And existe texto visível adjacente (não apenas ícone)

  Scenario: AC-005.5 — Links externos seguros
    Given qualquer "<a target='_blank'>" no site
    When seus atributos são inspecionados
    Then "rel" contém "noopener" E "noreferrer"
    And NÃO existe "<a target='_blank'>" sem "rel"
    And NÃO existe atributo "referrerpolicy='unsafe-url'"

  Scenario: AC-005.6 — Alvos clicáveis e contraste
    Given o viewport 375x667
    When "/contato" é carregada
    Then todo canal de contato tem área clicável >= 44x44 CSS px
    And o espaçamento entre alvos adjacentes é >= 8 px
    And o contraste de texto de cada link é >= 4.5:1
    And o contraste de ícone/elemento não-textual é >= 3:1

  Scenario: AC-005.7 — vCard estático disponível
    Given o build concluído
    When "dist/contato.vcf" é lido
    Then o arquivo inicia com "BEGIN:VCARD" e termina com "END:VCARD"
    And contém "VERSION:4.0", "FN:", "ORG:ROYAL DATA CORE LTDA", "EMAIL;" e "URL;"
    And existe link "[data-testid='contact-vcard-link']" com "href" terminando em "/contato.vcf" e "download" presente

  Scenario: AC-005.8 — Zero request a terceiro em runtime
    Given a página "/contato" carregada em Playwright com interceptação de rede
    When todas as requisições são registradas
    Then o conjunto de hosts requisitados tem cardinalidade 1
    E o único host é o host do próprio site

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-005.N1 — Introdução de formulário bloqueia o build
    Given que "<form action='https://formspree.io/f/xxxx'>" é adicionado a "/contato"
    When "npm run lint:topology" é executado
    Then exit code != 0
    And a mensagem cita "ADR-003 D2 e SDD-CONTEXT §7: formulários remotos desabilitados"
    And o gate "guard" impede o merge

  Scenario: AC-005.N2 — Email em texto plano no HTML falha o teste de ofuscação
    Given que "ObfuscatedMailto.astro" é substituído por "<a href='mailto:contato@dominio.com'>" literal
    When o teste "SPEC-005/AC-005.3" roda sobre "dist/contato/index.html"
    Then o teste falha
    E a mensagem reporta o match encontrado pela regex de harvesting

  Scenario: AC-005.N3 — Link externo sem "noopener" falha
    Given um "<a target='_blank' href='https://linkedin.com/in/x'>" sem "rel"
    When o teste "SPEC-005/AC-005.5" é executado
    Then o teste falha citando "reverse tabnabbing — OWASP ASVS V8.3"

  Scenario: AC-005.N4 — Script third-party na página de contato viola CSP
    Given que um widget de chat é injetado via "<script src='https://chat.vendor.com/x.js'>"
    When a página é carregada em Playwright com "csp-guard.ts" ativo
    Then o navegador registra violação de CSP no console
    And o helper "csp-guard" falha o teste
    And a mensagem cita "SPEC-008: connect-src/script-src 'self'"

  Scenario: AC-005.N5 — Placeholder não substituído falha o build
    Given que ".env" não define "PUBLIC_CONTACT_EMAIL" e o componente recebe string vazia
    When "npm run build" é executado
    Then exit code != 0
    And "stderr" contém "SPEC-005: PUBLIC_CONTACT_EMAIL ausente — copie .env.example para .env"
    And "dist/" não contém o literal "[[EMAIL]]" nem "undefined@"
```

## Hints de `data-testid`
`contact-email-link` · `contact-whatsapp-link` · `contact-phone-link` · `contact-linkedin-link` · `contact-github-link` · `contact-vcard-link` · `contact-cta-home` · `contact-cta-services-b2b` · `contact-cta-services-clt` · `contact-cta-post-footer` · `footer-contact-block`

## Rastreabilidade
`ADR-003 D1 D2 D3 D4` · `CONSTITUTION §C7 §C8 §C9` · `SDD-CONTEXT §7 §8 RRR-07` · `SPEC-001` · `SPEC-008`

## Fontes
RFC 6068 (`mailto`) · RFC 3966 (`tel`) · RFC 6350 (vCard 4.0) · OWASP ASVS v4.0.3 §V8.3 (Other HTML Security) · WCAG 2.1 SC 2.5.5 (Target Size), 1.4.3, 1.4.11 · LGPD Art. 7º (nenhuma base legal necessária: não há tratamento).
