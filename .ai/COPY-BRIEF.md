# COPY DE PRODUÇÃO — PT-BR

## Tom de voz
Direto, técnico, sem superlativo. Escreve como engenheiro que já quebrou produção e
aprendeu com isso. **Prova antes de promessa.** Zero jargão de marketing
(`CONSTITUTION §C9`, gate `lint:copy`).

**Lista negra de termos** (falha o build):
`inovador` · `disruptivo` · `soluções de ponta` · `apaixonado por` · `líder de mercado` ·
`referência nacional` · `transformação digital` · `sinergia` · `estado da arte` ·
`melhor do mercado` · `paradigma` · `holístico` · `robusto` (sem número) ·
`escalável` (sem número) · `ágil` (como adjetivo vazio)

---

## 1. HOMEPAGE (`/`)

### Hero
**H1:** Engenharia de qualidade para software crítico

**Subtítulo:**
Consultoria especializada em testes de software para times que não podem entregar
defeito em produção. Estratégia de testes, automação e pipelines de QA — do diagnóstico
à operação.

**CTA primário:** `Ver serviços` → `/servicos` · `data-testid="cta-primary-services"`
**CTA secundário:** `Falar comigo` → `mailto:` (subject `Contato via site — Hero`) · `data-testid="cta-primary-contact"`

**Microcopy sob os CTAs:**
Resposta em até 1 dia útil. Sem formulário, sem cadastro, sem rastreamento.

---

### Faixa de prova (S3 — laboratório vivo)
**H2:** Este site é o meu próprio caso de teste

**Corpo:**
Toda página que você visita aqui passou pelos mesmos gates que eu aplico em projetos de
cliente: Lighthouse ≥ 95 em mobile, acessibilidade WCAG 2.1 AA nota 100, zero
JavaScript desnecessário, CSP estrita, pipeline com testes automatizados antes de cada
deploy. Os relatórios são públicos. Pode auditar.

**Badges (resolvidos em build time, `SPEC-002 AC-002.3`):**
`build: passing` · `lighthouse perf: 95+` · `a11y: 100` · `custo mensal: R$ 0,00`

**Link:** `Ver pipeline no GitHub` → repositório (rel `noopener noreferrer`)

---

### Serviços (3 cards)
**H2:** Como posso ajudar

**Card 1 — Diagnóstico de QA** `data-testid="service-card-qa-diagnostic"`
> **Eyebrow:** B2B · por projeto
> **Título:** Diagnóstico de qualidade
> **Corpo:** Mapeamento da situação atual de testes do seu produto: cobertura real,
> gaps de risco, débito técnico de QA e o que automatizar primeiro para ter retorno
> mais rápido.
> **Entregáveis:** relatório de gaps priorizado por risco · matriz de cobertura de testes ·
> plano de automação em 3 horizontes · estimativa de esforço por iniciativa
> **CTA:** `Solicitar diagnóstico` (subject: `Consultoria QA B2B — Diagnóstico de qualidade`)

**Card 2 — Automação de testes** `data-testid="service-card-test-automation"`
> **Eyebrow:** B2B · projeto ou retainer
> **Título:** Automação que sobrevive ao tempo
> **Corpo:** Implementação de suítes de teste automatizadas que não viram fonte de
> flakes. Pirâmide de testes aplicada de verdade: unitários rápidos, integração
> confiável, E2E cirúrgico — cada camada no lugar certo.
> **Entregáveis:** suíte automatizada em CI · configuração de pipeline com gates de
> qualidade · seleção e instrumentação de ferramentas · documentação de manutenção ·
> transferência de conhecimento para o time
> **CTA:** `Discutir automação` (subject: `Consultoria QA B2B — Automação de testes`)

**Card 3 — QA embutido no time** `data-testid="service-card-embedded-qa"`
> **Eyebrow:** CLT / alocação · mentoria
> **Título:** QA dentro do seu time
> **Corpo:** Atuação como engenheiro de testes dedicado, ou mentoria para formar
> capacidade de QA dentro do time que você já tem. Cultura de qualidade não se
> terceiriza para sempre — se constrói.
> **Entregáveis:** atuação embarcada no squad · revisão de estratégia de testes ·
> mentoria individual e em grupo · critérios de aceite e definição de pronto ·
> acompanhamento de métricas de qualidade
> **CTA:** `Conversar sobre alocação` (subject: `Oportunidade CLT QA — via site`)

**Link de rodapé da seção:** `Ver todos os serviços e modelos de contratação` → `/servicos`

---

### Blog (3 posts recentes)
**H2:** Do caderno de engenharia
**Subtítulo:** O que eu testo, quebro e aprendo. Artigos técnicos sem rodeio.
**Link:** `Ver todos os artigos` → `/blog`
**Empty state (se < 3 posts):** `Ainda publicando os primeiros artigos. Volte em breve — ou assine o RSS.`

---

### CTA final
**H2:** Seu produto merece mais que "testamos e funcionou"
**Corpo:** Se você tem uma release crítica chegando, uma suíte de testes que ninguém
confia, ou um time sem estratégia de QA clara — vale uma conversa.
**CTA:** `Enviar email` (mailto, subject `Contato geral — Royal Data Core`)
**CTA alternativo:** `WhatsApp` (`wa.me`)
**Microcopy:** Sem formulário, sem CRM, sem sequência de emails automática. Você fala
comigo.

---

## 2. SERVIÇOS (`/servicos`)

**H1:** Serviços

**Intro:**
Três formas de trabalhar juntos, conforme o momento do seu produto. Nenhuma exige
contrato de longo prazo para começar. Preço sob consulta — cada escopo é diferente e
não faz sentido publicar tabela.

### Seção B2B — `Para empresas`
`data-testid="service-audience-b2b"`
> Contratos PJ, escopo definido, entregáveis mensuráveis. Ideal para times que precisam
> de capacidade de QA pontual ou de um diagnóstico externo independente antes de uma
> decisão de investimento em qualidade.

### Seção CLT / Alocação — `Para times`
`data-testid="service-audience-clt"`
> Contratação CLT, alocação dedicada ou mentoria recorrente. Ideal para empresas
> construindo a primeira função de QA ou fortalecendo um time de testes já existente.

### Modelos de contratação (lista fechada, `SPEC-003 AC-003.3`)
| Badge | Significado |
|---|---|
| **Por projeto** | Escopo e prazo definidos, entregável único, valor fechado |
| **Retainer mensal** | Horas reservadas por mês, prioridade na agenda |
| **Alocação** | Dedicação integral ao seu time (CLT ou PJ) |
| **Mentoria** | Encontros recorrentes de orientação técnica |

### FAQ (com JSON-LD `FAQPage`)
**P: Vocês publicam preços?**
R: Não. Escopo de QA varia demais com stack, cobertura atual e criticidade do produto
para uma tabela fazer sentido. A primeira conversa serve exatamente para dimensionar.

**P: Trabalha com quais stacks?**
R: Playwright, Cypress, Selenium, Jest, Vitest, Pytest, JUnit. Em CI: GitHub Actions,
GitLab CI, Jenkins. A ferramenta segue o problema, não o contrário.

**P: Atende remotamente?**
R: Sim. Base em Matão/SP, atendimento remoto para todo o Brasil. Presencial sob
combinação para região de Araraquara/São Carlos/Ribeirão Preto.

**P: Emite nota fiscal?**
R: Sim. Royal Data Core LTDA, CNPJ 69.527.139/0001-94.

**P: Assina NDA?**
R: Sim, antes de qualquer discussão técnica detalhada.

---

## 3. SOBRE (`/sobre`)

**H1:** Sobre

> ⚠️ **Diretiva vinculante:** todo o texto abaixo refere-se ao **profissional**.
> A menção à PJ aparece apenas no rodapé. Nenhum "desde 20XX" associado à empresa.

**Lead:**
Sou engenheiro de testes. Trabalho com qualidade de software porque já vi o custo de
não trabalhar com ela — release revertida de madrugada, cliente perdido por bug que um
teste de integração pegaria, time inteiro desacreditando da própria suíte de testes.

**Corpo (3 blocos):**

**O que faço.**
Estratégia de testes, automação e processos de QA. Do diagnóstico ("onde estamos
quebrando e por quê") à operação ("o que roda em cada commit e o que isso nos diz").
Foco quase exclusivo em testes porque é onde profundidade vale mais que amplitude.

**Como trabalho.**
Específico antes de implementar. Meço antes de afirmar. Deixo o pipeline e a
documentação em condição de outra pessoa manter. Se um teste é flaky, ele é corrigido
ou removido — nunca silenciado.

**Por que este site parece um repositório.**
Porque é. Ele roda sobre as mesmas práticas que eu aplico em cliente: especificação
formal antes de código, gates automáticos de qualidade, decisões arquiteturais
documentadas, custo controlado. É a forma mais honesta de demonstrar competência:
deixar você auditar.

**CTA:** `Enviar email` / `Ver currículo no LinkedIn` / `Ver código no GitHub`

---

## 4. CONTATO (`/contato`)

**H1:** Contato

**Lead:**
Sem formulário. Sem CRM. Sem sequência automática de emails. Você escolhe o canal e
fala direto comigo.

**Canais (`ADR-003 D1` — lista fechada):**

| Canal | Rótulo | Observação |
|---|---|---|
| **Email** | `contato@[dominio]` | Ofuscado no HTML (`ADR-003 D3`). Resposta em até 1 dia útil. |
| **WhatsApp** | `+55 [DDD] [número]` | Melhor canal para primeira conversa. Seg–sex, 9h–18h (BRT). |
| **Telefone** | `+55 [DDD] [número]` | — |
| **LinkedIn** | `/in/[handle]` | Trajetória profissional e referências. |
| **GitHub** | `royaldatacore` | Código, issues e o pipeline deste site. |
| **vCard** | `Baixar contato (.vcf)` | Importa direto no seu cliente de email. |

**Bloco de assunto qualificado (`ADR-003 D4`):**
> 💡 Ao clicar em um botão de contato deste site, o assunto do email já vem preenchido
> com a origem da sua navegação. Isso me ajuda a responder mais rápido — e não coleta
> nenhum dado seu.

**Seção B2B:**
**H2:** Para empresas
Precisa de diagnóstico, automação ou QA embarcado? Envie contexto: stack, tamanho do
time, o que está doendo. Respondo com uma leitura inicial honesta — mesmo que a
recomendação seja não me contratar agora.

**Seção CLT:**
**H2:** Oportunidades CLT
Se você recruta para posição de QA/QE, inclua: modelo de trabalho, faixa salarial,
stack de testes e se a vaga é para construir ou manter. Isso evita ida e volta
desnecessária para os dois lados.

**Rodapé da página:**
Royal Data Core LTDA · CNPJ 69.527.139/0001-94 · Matão/SP, Brasil

---

## 5. PRIVACIDADE (`/privacidade`)

**H1:** Privacidade

**Última atualização:** `[data-testid="privacy-last-updated"]` — gerado em build time.

**TL;DR:** este site não coleta, não processa, não armazena e não compartilha nenhum
dado pessoal seu. Não há cookies, não há analytics, não há pixel de rastreamento, não
há formulário.

### Dados que este site coleta
`data-testid="privacy-no-collection"`
Nenhum. O site é composto exclusivamente de arquivos estáticos (HTML, CSS, JavaScript,
imagens). Não existe servidor de aplicação, não existe banco de dados, não existe
formulário de contato e não existe endpoint que receba informação sua.

Não definimos cookies. Não escrevemos em `localStorage` nem `sessionStorage`. Não
executamos fingerprinting. Não usamos `navigator.sendBeacon`.

### O que o GitHub registra
`data-testid="privacy-github-logging"`
Este site é hospedado no **GitHub Pages**, serviço operado por GitHub, Inc. Conforme a
documentação oficial do serviço:

> "When a GitHub Pages site is visited, the visitor's IP address is logged and stored
> for security purposes, regardless of whether the visitor has signed into GitHub
> or not."

Ou seja: seu endereço IP é registrado pelo GitHub no momento da visita, por razão de
segurança da infraestrutura deles. **A Royal Data Core não tem acesso a esses logs,
não os processa e não pode exportá-los.** Nessa operação, a Royal Data Core não atua
como controladora desses dados; o registro é efetuado pelo operador da infraestrutura.

Para detalhes: [GitHub General Privacy Statement](https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement).

### Cookies
`data-testid="privacy-cookies"`
Nenhum cookie é definido por este site. Por isso **não exibimos banner de consentimento**:
não há o que consentir. A ausência do banner é consequência direta da arquitetura, não
uma omissão.

### Rastreamento
`data-testid="privacy-tracking"`
Não utilizamos Google Analytics, Meta Pixel, LinkedIn Insight Tag, Hotjar, Microsoft
Clarity, Mixpanel, Segment ou qualquer outra ferramenta de analytics, heatmap ou session
replay — nem em versão self-hosted. Esta é uma regra imutável do projeto
(`CONSTITUTION §C7`, sujeita a Kill Switch sem possibilidade de exceção).

A única exceção técnica é a busca do site (Pagefind), que roda **inteiramente no seu
navegador**: os termos que você digita nunca são enviados a nenhum servidor, nem ao
nosso, nem a terceiros.

### Links para sites de terceiros
Os links de contato (WhatsApp, LinkedIn, GitHub) levam a serviços de terceiros com
políticas de privacidade próprias. Ao clicar, você sai deste site e passa a interagir
com a política do destino. Não recebemos nenhuma informação dessa interação.

### Seus direitos (LGPD, Art. 18)
`data-testid="privacy-rights"`
Como este site não realiza tratamento de dados pessoais, não há dados nossos sobre você
a serem exercidos. Ainda assim, a LGPD garante a todo titular:

1. Confirmação da existência de tratamento
2. Acesso aos dados
3. Correção de dados incompletos, inexatos ou desatualizados
4. Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos
5. Portabilidade dos dados a outro fornecedor
6. Eliminação dos dados tratados com consentimento
7. Informação sobre as entidades com as quais os dados foram compartilhados
8. Informação sobre a possibilidade de não fornecer consentimento e suas consequências
9. Revogação do consentimento a qualquer momento

### Como exercer
`data-testid="privacy-contact"`
Se você acredita que qualquer dado seu foi tratado por nós — por exemplo em uma
troca de email iniciada por você — escreva para `contato@[dominio]` com o assunto
`LGPD — solicitação do titular`. Resposta em até 15 dias, conforme Art. 18 §4º.

**Sobre o log de IP do GitHub:** como não temos acesso a esses registros, solicitações
relativas a eles devem ser dirigidas diretamente ao GitHub, Inc.

### Autoridade nacional
`data-testid="privacy-anpd"`
Você pode apresentar reclamação à **Autoridade Nacional de Proteção de Dados (ANPD)**:
[gov.br/anpd](https://www.gov.br/anpd).

### Encarregado (DPO)
Não há encarregado nomeado porque **não há tratamento de dados pessoais** nesta
operação. O canal de contato acima cumpre essa função para qualquer dúvida.

### Alterações
Esta página é versionada em Git. O histórico completo de alterações é público e
auditável em [`.ai/`](https://github.com/royaldatacore/royaldatacore.github.io/tree/main/.ai).

---

## 6. PÁGINA 404 (`/404.html`)

**H1:** Página não encontrada

**Corpo:**
O endereço `[[caminho solicitado — exibido como texto puro, nunca como HTML]]` não
existe neste site. Pode ter sido movido, renomeado, ou nunca existiu.

**Ações (`SPEC-006 AC-006.2`):**
- `Voltar para o início` → `/` · `data-testid="404-link-home"`
- `Ver artigos do blog` → `/blog` · `data-testid="404-link-blog"`
- `Ver serviços` → `/servicos` · `data-testid="404-link-services"`
- `Buscar no site` → `/busca` · `data-testid="404-search-hint"`
- `Avisar sobre o link quebrado` → `mailto:` (subject `Link quebrado — <caminho>`) · `data-testid="404-contact-hint"`

**Microcopy final:** Links quebrados são bugs. Se você chegou aqui por um link do
próprio site, avise — corrijo e registro no Journal.

---

## 7. BUSCA (`/busca`)

**H1:** Buscar
**Placeholder do input:** `Buscar artigos, serviços, tags…`
**Status inicial:** `Digite para buscar. Nenhum termo sai do seu navegador.`
**Com N resultados:** `<N> resultado(s) para «<termo>»`
**Estado vazio:** `Nenhum resultado para «<termo>».` + sugestões: `Verifique a grafia · Tente um termo mais curto · Navegue pelas tags em /blog · Veja todos os artigos`
**Sem JavaScript (`SPEC-007 AC-007.7`):**
> A busca precisa de JavaScript e roda inteiramente no seu navegador — nenhum termo é
> enviado a servidor. Se você desabilitou JS, use: `todos os artigos` · `tags` ·
> `enviar email`.

---

## 8. QUALIDADE (`/qualidade`) — Superfície S3

**H1:** Como este site é testado

**Lead:** Transparência radical não é discurso. Aqui estão os gates que todo commit
deste repositório precisa atravessar — os mesmos que eu proponho para projetos de cliente.

| Gate | O que verifica | Budget | Status |
|---|---|---|---|
| `guard` | Types, lint, formato, ADR obrigatório, output estático, secrets, lifecycle scripts | 0 violações | badge CI |
| `build` | Build Astro, índice Pagefind, bundle audit, tamanho de repo e artefato, `.nojekyll` | JS ≤ 50 KB · CSS ≤ 30 KB · repo ≤ 500 MB | badge |
| `verify` | E2E Playwright, axe-core WCAG 2.1 AA, linkinator, Vitest coverage | 0 falhas · A11y 100 · 0 links quebrados · ≥ 80 % coverage | badge |
| `lighthouse` | Lighthouse CI mobile em todas as rotas do critical path | Perf ≥ 95 · A11y = 100 · BP ≥ 95 · SEO = 100 · LCP ≤ 2500 ms · CLS ≤ 0,1 | badge |

**Links de auditoria pública:**
`Histórico de CI` · `Relatórios de Lighthouse (artifacts)` · `Specs` · `ADRs` · `Constituição`

**Encerramento:**
Se você contrata QA, deveria poder auditar o QA de quem contrata. Por isso nada aqui é
privado.

---

## 9. METADATA POR ROTA (SEO)

| Rota | `<title>` (≤ 60) | `description` (120–160) |
|---|---|---|
| `/` | `Royal Data Core — Consultoria em Testes de Software` | `Estratégia de testes, automação e QA para times que não podem entregar defeito em produção. Matão/SP, atendimento remoto em todo o Brasil.` |
| `/servicos` | `Serviços de QA e Testes de Software · Royal Data Core` | `Diagnóstico de qualidade, automação de testes e QA embarcado. Modelos por projeto, retainer, alocação ou mentoria. B2B e CLT.` |
| `/sobre` | `Sobre · Royal Data Core` | `Engenheiro de testes focado em estratégia, automação e cultura de qualidade. Conheça o método de trabalho.` |
| `/blog` | `Artigos sobre Testes de Software · Royal Data Core` | `Conteúdo técnico sobre automação, testes flaky, pipelines de QA, Playwright e engenharia de qualidade. Sem rodeio.` |
| `/contato` | `Contato · Royal Data Core` | `Email, WhatsApp, telefone e LinkedIn. Sem formulário, sem CRM, sem rastreamento. Resposta em até 1 dia útil.` |
| `/qualidade` | `Como este site é testado · Royal Data Core` | `Gates de CI, budgets de performance, acessibilidade WCAG 2.1 AA e relatórios públicos. Auditoria aberta.` |
| `/privacidade` | `Privacidade · Royal Data Core` | `Este site não coleta dados pessoais. Sem cookies, sem analytics, sem trackers. O que o GitHub registra e quais são seus direitos.` |
| `/busca` | `Buscar · Royal Data Core` | `Busca full-text executada no seu navegador. Nenhum termo é enviado a servidor.` |
| `/blog/[slug]` | `<title do post> · Royal Data Core` | `description` do frontmatter (80–200) |

---

## 10. SEED DE ARTIGOS (Fase 3 — 3 posts mínimos exigidos por `SPEC-002 AC-002.N1`)

| # | Slug | Título | Tags | Ângulo |
|---|---|---|---|---|
| 1 | `por-que-testes-flaky-sao-piores-que-sem-testes` | Por que testes flaky são piores que ausência de testes | `testes-flaky`, `ci-cd`, `cultura-de-qualidade` | Diagnóstico + protocolo de quarentena com prazo |
| 2 | `site-estatico-com-lighthouse-100-sem-framework-js` | Site estático com Lighthouse 100 sem entregar um byte de framework | `performance`, `astro`, `core-web-vitals` | Case deste próprio site, com números reais do CI |
| 3 | `piramide-de-testes-na-pratica-onde-cada-camada-falha` | Pirâmide de testes na prática: onde cada camada falha | `estrategia-de-testes`, `automacao`, `piramide` | Crítica honesta + critérios de alocação por risco |

**Estrutura obrigatória por artigo (`SPEC-004 AC-004.8`):**
Contexto → Problema (com evidência) → Análise → Solução (com código) → **Limitações da solução** → Resultado medido → Referências.
A seção **Limitações** é obrigatória: é o que separa conteúdo técnico de conteúdo de marketing.

---

## 11. `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /_pagefind/

Sitemap: https://royaldatacore.github.io/sitemap-index.xml
```

## 12. JSON-LD — `ProfessionalService` (`SPEC-001 AC-001.5`)
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://royaldatacore.github.io/#organization",
  "name": "Royal Data Core",
  "legalName": "ROYAL DATA CORE LTDA",
  "taxID": "69527139000194",
  "foundingDate": "2026-10-06",
  "description": "Consultoria especializada em testes de software: estratégia de QA, automação de testes e pipelines de qualidade.",
  "url": "https://royaldatacore.github.io/",
  "image": "https://royaldatacore.github.io/og-default.png",
  "priceRange": "sob consulta",
  "currenciesAccepted": "BRL",
  "paymentAccepted": "Transferência, Boleto, PIX",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Matão",
    "addressRegion": "SP",
    "addressCountry": "BR"
  },
  "areaServed": { "@type": "Country", "name": "Brasil" },
  "serviceArea": { "@type": "GeoCircle", "geoMidpoint": { "@type": "GeoCoordinates", "latitude": -21.6030, "longitude": -48.3678 } },
  "knowsAbout": [
    "Software Testing", "Test Automation", "Quality Assurance", "Playwright",
    "CI/CD", "Test Strategy", "Shift-Left Testing", "Core Web Vitals"
  ],
  "sameAs": [
    "https://github.com/royaldatacore",
    "https://www.linkedin.com/in/[handle]"
  ]
}
```
> ⚠️ **Proibido** (`SPEC-003 AC-003.4`): `aggregateRating`, `review`, `numberOfEmployees > 1`, `award`, `alumniOf` sem verificação, `price` numérico.
> ⚠️ `address.streetAddress` omitido deliberadamente — endereço residencial/comercial completo não precisa ser público. Reavaliar se houver escritório físico.
> ⚠️ Coordenadas: **verificar** latitude/longitude reais de Matão/SP antes do deploy (D-02).
