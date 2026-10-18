# ADR-003 — Canais de Contato: Zero SaaS, Zero Formulário

**Status:** ACCEPTED · **Data:** 2026-10-16 · **Enforcer:** `integrations-security`, `content-strategist`

## Contexto
Diretiva explícita do cliente: *"Os meios de comunicação/contato devem ser aderentes à estrutura limitante estática do site (email e links de redirecionamento — telefone, WhatsApp, redes sociais, etc.)"*.

O ecossistema SDD traz, nos contratos de `integrations-security`, capacidades para Formspree/Getform (com honeypot + Zod) e DecapCMS (com OAuth). Estas capacidades entram em **conflito direto** com a diretiva. Precisam ser formalmente desabilitadas, não apenas ignoradas — caso contrário um agente as reintroduz por默认 contratual.

Análise de custo/benefício de um formulário em site estático:

| Dimensão | Formulário (Formspree/Getform) | `mailto:` + `wa.me` |
|---|---|---|
| Custo | R$ 0 (free tier: 50 submissões/mês) | R$ 0 |
| Superfície de spam | **Alta** (honeypot é mitigação parcial, nunca completa) | **Nula** (não há endpoint) |
| Superfície LGPD | **Alta** (coleta e transmite PII a terceiro; exige base legal, RIPD, DPA com o provedor) | **Nula** (nenhum dado processado pelo site) |
| Dependência externa | Sim (disponibilidade, alteração de preço, encerramento) | Não |
| Atrito para o usuário | Baixo | Médio (troca de contexto para o cliente de email) |
| Rastreabilidade de lead | Boa (dashboard) | Média (inbox) |
| Bypass necessário? | **Sim** (3 pilares) | Não |

**O Bypass não se sustenta:** não há *força maior* (o requisito é atendido sem formulário), há *rota FOSS pura* (mailto é protocolo RFC 6068, wa.me é deep-link) e não há *prazo* aplicável. Sem os três pilares ⇒ **recusa obrigatória** pelo `nexus-prime`.

## Decisão

### D1 — Canais permitidos (lista exaustiva e fechada)
| Canal | Mecanismo | Norma |
|---|---|---|
| Email | `<a href="mailto:…?subject=…&body=…">` com assunto pré-preenchido por origem | RFC 6068 |
| WhatsApp | `<a href="https://wa.me/55<DDD><NUM>?text=…">` com mensagem pré-preenchida, `rel="noopener noreferrer"` | deep-link oficial |
| Telefone | `<a href="tel:+55…">` | RFC 3966 |
| LinkedIn | `<a href="https://linkedin.com/in/…">` `rel="noopener noreferrer"` | — |
| GitHub | `<a href="https://github.com/…">` `rel="noopener noreferrer"` | — |
| RSS | `<link rel="alternate" type="application/rss+xml">` | RFC 4287 |
| vCard | `/contato.vcf` estático download | RFC 6350 |

**Lista fechada.** Adicionar canal ⇒ novo ADR.

### D2 — Proibições absolutas
Vedado: `<form>` com `action` remoto, endpoint de submissão, iframe de agendador, widget de chat, SDK de mensageria, Cal.com/Calendly (ver D5), qualquer script third-party na página de contato.
`form-action 'self'` no CSP (`SPEC-008`) permite apenas o `<form>` local de busca do Pagefind, que **não submete** (interceptado por `preventDefault`).

### D3 — Anti-harvesting de email sem JavaScript
Abordagens avaliadas:

| Técnica | Zero-JS? | CSP-clean? | Acessível? | Derrota scraper? | Veredicto |
|---|---|---|---|---|---|
| JS inline de decodificação | ❌ | ❌ (viola `script-src 'self'`) | ⚠️ | ✅ | **REJEITADA** |
| CSS `direction: rtl` + `bidi-override` | ✅ | ✅ | ❌ (leitores de tela corrompem) | ⚠️ | REJEITADA (viola `§C9` a11y) |
| Email como imagem/SVG | ✅ | ✅ | ⚠️ (requer `alt`) | ✅ | Rejeitada (não selecionável, não clicável em mobile) |
| **Codificação de entidades HTML em build time** | ✅ | ✅ | ✅ (DOM decodifica; leitor de tela lê o valor correto) | ✅ contra regex ingênuo | **ADOTADA** |

Componente `ObfuscatedMailto.astro`: recebe `address` como prop, emite cada caractere como entidade decimal (`c` → `&#99;`) tanto no `href` quanto no texto visível. O navegador decodifica; scrapers que aplicam `/[\w.+-]+@[\w-]+\./` sobre o HTML bruto não encontram correspondência.
**Honestidade de engenharia:** isto é **ofuscação, não criptografia**. Reduz volume de spam automatizado ingênuo; não detém scraper que execute headless browser. Registrado como **RRR-07** com mitigação adicional = endereço dedicado + filtragem no provedor. Nenhuma alegação de "proteção total" é feita ao usuário.

### D4 — Assunto pré-preenchido como qualificador de lead
Cada CTA carrega `subject` distinto e rastreável sem analytics:
| Origem | `subject` |
|---|---|
| Hero da Home | `Contato via site — Hero` |
| Página de Serviços (B2B) | `Consultoria QA B2B — <serviço>` |
| Página de Serviços (CLT) | `Oportunidade CLT QA — via site` |
| Fim de artigo de blog | `Sobre o artigo: <slug>` |
| Página de Contato | `Contato geral — Royal Data Core` |

Isto provê atribuição de origem **sem nenhum processamento de dado pessoal** — compatível com `§C7`.

### D5 — Cal.com: deferido, não rejeitado
Agendamento assíncrono é genuinamente valioso para B2B. Fica deferido para **`ADR-006`** (futuro), condicionado a Bypass Protocol com os 3 pilares e à preferência por instância **self-hosted** (Cal.com é AGPL-3.0, auto-hospedável). Gatilho de reavaliação: ≥ 5 trocas de email que culminem em necessidade de agendamento, ou contratação do primeiro cliente B2B.
`§C4` admite copyleft forte (AGPL) **apenas** quando o software não é linked ao artefato publicado — instância self-hosted separada satisfaz. Ainda assim exige ADR.

### D6 — Narrowing contratual permanente
Registrado em `SDD-CONTEXT §7`: as capacidades Formspree/Getform/DecapCMS do agente `integrations-security` estão **DESABILITADAS**. Artefato que as contenha é rejeitável por `reviewer-gatekeeper` sem análise de mérito.

## Consequências
✅ Superfície de ataque da página de contato = zero endpoint. ✅ Superfície LGPD = zero dado. ✅ Custo = zero. ✅ Dependências externas = zero.
⚠️ Atrito de conversão maior que um formulário. Mitigação: `mailto:` com assunto+corpo pré-preenchidos reduz o atrito a ~1 clique; `wa.me` é o caminho de menor fricção no mercado brasileiro.
⚠️ Sem dashboard de leads. Mitigação: `subject` qualificado + labels no inbox.

## Alternativas Rejeitadas
Formspree (Bypass insustentável) · Getform (idem) · Web3Forms (idem) · DecapCMS + Netlify Identity (viola `§C2`) · Formsubmit.co (SaaS sem DPA, risco LGPD) · Cloudflare Workers endpoint (viola `§C1`) · Google Forms embed (Kill Switch: tracker).

## Referências
RFC 6068 (`mailto` URI) · RFC 3966 (`tel` URI) · RFC 6350 (vCard) · RFC 4287 (Atom) · LGPD Lei 13.709/2018 Art. 7º e Art. 38 · OWASP ASVS v4.0.3 §V5 (Validation) · AFA Bypass Protocol (3 pilares).
