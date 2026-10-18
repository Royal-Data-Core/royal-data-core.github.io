# SPEC-009 — Aviso de Privacidade, Rodapé Legal e Transparência LGPD

**ID:** SPEC-009 · **Versão:** 1.0.0 · **Agente executor:** `frontend-astro` + `content-strategist`
**Auditor:** `spec-auditor` · **Dependências:** SPEC-001, SPEC-005
**Base legal:** LGPD (Lei 13.709/2018) Art. 6º I/II/VI, Art. 9º, Art. 18 · CDC Art. 6º III · Marco Civil (Lei 12.965/2014)

## Racional
O site **não realiza tratamento de dados pessoais** (`CONSTITUTION §C7`). Isso não isenta de transparência: o GitHub **registra o IP do visitante** independentemente de login, por razões de segurança — *"the visitor's IP address is logged and stored for security purposes, regardless of whether the visitor has signed into GitHub or not"* (GitHub Pages Docs, §Data collection). Publicar isso é (a) obrigação de transparência, (b) diferencial competitivo de uma consultoria de QA, (c) custo zero.

## Critérios de Aceite

```gherkin
Feature: SPEC-009 — Privacidade e Rodapé Legal

  Scenario: AC-009.1 — Rodapé legal completo em todas as rotas
    Given qualquer rota renderizada
    When "[data-testid='site-footer']" é inspecionado
    Then contém razão social exata "ROYAL DATA CORE LTDA"
    And contém CNPJ formatado "69.527.139/0001-94"
    And contém município e UF "Matão/SP"
    And contém link "[data-testid='footer-privacy-link']" para "/privacidade"
    And contém ao menos 1 canal de contato (SPEC-005)
    And contém ano corrente gerado em build time (não em runtime)
    And o contraste de todo texto do rodapé é >= 4.5:1

  Scenario: AC-009.2 — Página /privacidade com conteúdo mínimo obrigatório
    Given a rota "/privacidade" renderizada
    When o texto é extraído
    Then existe seção nomeada "Dados que este site coleta" declarando explicitamente: nenhum
    And existe seção nomeada "O que o GitHub registra" informando o log de IP pelo operador da infraestrutura, com link para o GitHub Privacy Statement
    And existe seção nomeada "Cookies" declarando: nenhum cookie é definido por este site
    And existe seção nomeada "Rastreamento" declarando: nenhum analytics, pixel ou tracker
    And existe seção nomeada "Seus direitos (LGPD Art. 18)" enumerando >= 6 direitos
    And existe seção nomeada "Como exercer" com canal "mailto:" (via ObfuscatedMailto)
    And existe seção nomeada "Autoridade nacional" citando a ANPD
    And a data de última atualização está presente e é <= data do build

  Scenario: AC-009.3 — Ausência de cookie banner é intencional e justificada
    Given qualquer rota
    When o DOM é inspecionado
    Then NÃO existe elemento "[data-testid='cookie-banner']" nem dialog de consentimento
    And NÃO existe "document.cookie" sendo escrito em nenhum script
    And NÃO existe chamada a "localStorage.setItem" nem "sessionStorage.setItem"
    And "/privacidade" explica que nenhum banner é necessário porque nenhum dado é coletado

  Scenario: AC-009.4 — Link de privacidade alcançável em <= 2 cliques de qualquer rota
    Given qualquer rota do site
    When o rodapé é alcançado sem navegação
    Then "[data-testid='footer-privacy-link']" está presente e visível
    E o rodapé é alcançável por teclado a partir do skip-link ou por scroll

  Scenario: AC-009.5 — Nenhum claim jurídico falso
    Given o texto de "/privacidade"
    When escaneado
    Then NÃO existe "certificado ISO 27001", "SOC 2", "conformidade GDPR total" ou qualquer certificação não possuída
    And NÃO existe promessa de "anonimato total" ou "100% privado"
    And a linguagem distingue corretamente "controlador" (Royal Data Core) de "operador de infraestrutura" (GitHub Inc.)

  Scenario: AC-009.6 — robots.txt e sitemap coerentes
    Given "dist/robots.txt"
    When lido
    Then contém "User-agent: *" seguido de "Allow: /"
    And contém linha "Sitemap:" com URL absoluta válida
    And NÃO contém "Disallow: /privacidade" (página legal deve ser indexável)

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-009.N1 — Introdução de analytics bloqueia o merge
    Given que um snippet "gtag('config', …)" ou "plausible" ou "umami" é adicionado
    When "npm run lint:security" é executado
    Then exit code != 0
    And a mensagem cita "CONSTITUTION §C7 + §C9 Kill Switch: zero rastreamento"
    And a mensagem afirma que não há Bypass disponível para esta regra

  Scenario: AC-009.N2 — Escrita em storage bloqueia o build
    Given que um script chama "localStorage.setItem('uid', …)"
    Quando "static-analysis-enforcer" analisa o AST do bundle
    Then a análise reporta violação
    And exit code != 0
    And a mensagem cita "SPEC-009/AC-009.3 e CONSTITUTION §C7"

  Scenario: AC-009.N3 — CNPJ ausente ou divergente bloqueia o build
    Given que "src/content/site.json" tem "cnpj" divergente de "69527139000194"
    Quando "npm run build" é executado
    Then exit code != 0
    And "stderr" contém "SPEC-009: CNPJ divergente da fonte oficial (SDD-CONTEXT §1)"

  Scenario: AC-009.N4 — Claim de certificação inexistente bloqueia o merge
    Given que "/privacidade" passa a conter "Somos certificados ISO 27001"
    When "npm run lint:copy" é executado
    Then exit code != 0
    And a mensagem cita "CONSTITUTION §C9: alegação não-verificável"

  Scenario: AC-009.N5 — Data de atualização futura é rejeitada
    Given que "lastUpdated" em "/privacidade" é posterior à data do CI
    Quando "npm run build" é executado
    Then exit code != 0
    And "stderr" contém "SPEC-009.N5: lastUpdated não pode estar no futuro"
```

## Hints de `data-testid`
`site-footer` · `footer-legal-name` · `footer-cnpj` · `footer-privacy-link` · `footer-contact-block` · `privacy-no-collection` · `privacy-github-logging` · `privacy-cookies` · `privacy-tracking` · `privacy-rights` · `privacy-contact` · `privacy-anpd` · `privacy-last-updated`

## Rastreabilidade
`CONSTITUTION §C7 §C9` · `SDD-CONTEXT §1 §8 RRR-05` · `SPEC-001` · `SPEC-005`

## Fontes
GitHub Pages Docs §Data collection · GitHub General Privacy Statement · LGPD Lei 13.709/2018 Art. 6º, 9º, 18 · CDC Lei 8.078/1990 Art. 6º III · Marco Civil da Internet Lei 12.965/2014 · ANPD — Guia de cookies e proteção de dados pessoais.
