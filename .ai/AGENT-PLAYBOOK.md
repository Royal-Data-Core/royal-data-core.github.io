# AGENT-PLAYBOOK — Roteamento Operacional SDD

**Como usar este dossiê com o ecossistema v8.0.0-AFA (14 agentes).**
Regra de ouro: **toda** requisição entra por `nexus-prime`. Nenhum especialista é invocado diretamente (Half-Duplex).

---

## 1. PROMPT DE ABERTURA PADRÃO (colar no início de QUALQUER sessão)

```
Você está operando sob o ecossistema SDD v8.0.0-AFA.

Leia, nesta ordem, e trate como SSOT:
1. .ai/SDD-CONTEXT.md      → premissas factuais, restrições, budgets, narrowing de escopo (§7), riscos (§8)
2. .ai/CONSTITUTION.md     → regras normativas + ordem de precedência (§0)
3. .ai/BLUEPRINT.md        → topologia travada
4. .ai/adr/*.md            → decisões vigentes (ADR-000 … ADR-004)
5. .ai/specs/**/*.md       → contratos executáveis (SPEC-001 … 009, RFC-001/002)
6. .ai/ROADMAP.md          → fase e step atuais
7. .ai/COPY-BRIEF.md       → copy de produção PT-BR

Regras de operação:
- Fail-Closed: ambiguidade ⇒ BLOCKED + pergunta. Nunca presumir.
- §C9 Kill Switch é irrevogável. §C4 Bypass exige os 3 pilares simultâneos.
- Respeite SDD-CONTEXT §7 (narrowing): NUNCA proponha formulários, CMS, analytics,
  Cal.com, headers HTTP customizados, middleware Astro de headers, pnpm/bun no CI,
  SSR/hybrid output, ou recurso externo sem SRI.
- ADR-002 D7: GitHub Pages NÃO entrega headers HTTP. Não insista.
- Zero alucinação de versão: se não tiver certeza de uma versão de pacote, diga
  "verificar com `npm view <pkg> version`".
- Idioma: EN para identificadores/código, PT-BR para copy e análise (ADR-000).

Estado atual do projeto: <FASE N, STEP N.N>
Minha requisição: <...>
```

---

## 2. SEQUÊNCIA DE INVOCACÃO POR FASE

### FASE 0 — Pré-requisitos
```
🧑 Humano responde D-01…D-04
   └─▶ nexus-prime  → valida respostas, atualiza SDD-CONTEXT §9, ratifica ADR-004
```

### FASE 1 — Fundação
```
nexus-prime
 ├─▶ architect-sdd        → valida BLUEPRINT + astro.config.mjs + tsconfig (Steps 1.1–1.6)
 ├─▶ devops-platform      → package-lock, ESLint/Prettier/husky, .nojekyll (1.2, 1.5, 1.8)
 ├─▶ content-strategist   → src/content/site.json (1.9)
 └─▶ frontend-astro       → withBase() + global.css + tokens (1.4, 1.10)
      └─▶ nexus-prime → qa-shiftleft (testes de withBase) → reviewer-gatekeeper → 🧑 merge
```

### FASE 2 — CI/CD
```
nexus-prime
 ├─▶ devops-platform           → ci.yml, dependabot.yml, PR template, runbooks (2.5–2.7, 2.12–2.14)
 ├─▶ static-analysis-enforcer  → verify-no-postinstall, audit-bundle, lint-topology (2.1–2.3)
 ├─▶ content-strategist        → lint-copy (2.4)
 └─▶ qa-shiftleft              → Playwright + csp-guard, Vitest, lighthouserc (2.8–2.11)
      └─▶ nexus-prime → reviewer-gatekeeper → 🧑 merge
```

### FASE 3 — Conteúdo & UI (ciclo por spec)
```
nexus-prime
 ├─▶ spec-auditor       → audita a SPEC-NNN ANTES de implementar (obrigatório)
 ├─▶ content-strategist → copy final + JSON-LD da rota
 ├─▶ frontend-astro     → implementação .astro
 ├─▶ integrations-security → CSP-meta, SRI, obfuscação de email (SPEC-005/008)
 ├─▶ static-analysis-enforcer → audit-bundle sobre dist/
 ├─▶ qa-shiftleft       → testes E2E + a11y derivados dos cenários Gherkin
 └─▶ reviewer-gatekeeper → PR com SPEC-ID + checklist + evidência linha-a-linha
      └─▶ nexus-prime → 🧑 merge
```

**Ordem recomendada (dependências):**
`SPEC-001 → SPEC-008 → SPEC-009 → SPEC-005 → SPEC-002 → SPEC-003 → SPEC-004 → SPEC-006 → SPEC-007`
> `SPEC-008` vem logo após `001` porque o CSP é injetado pelo `BaseLayout`; tudo que vier depois já nasce conforme. `SPEC-007` vem por último porque depende do índice de conteúdo de `SPEC-004`.

### FASE 4 — Hardening & Lançamento
```
nexus-prime
 ├─▶ integrations-security → checklist pré-launch (SPEC-008) + validação ASVS L3
 ├─▶ qa-shiftleft          → pentest leve (XSS 404, open redirect, path traversal)
 ├─▶ devops-platform       → ativa deploy.yml, executa deploy, smoke test
 └─▶ reviewer-gatekeeper   → aprovação final do release PR
      └─▶ nexus-prime → 🧑 merge em main → DEPLOY
```

---

## 3. TABELA DE ROTEAMENTO POR TIPO DE REQUISIÇÃO

| Se eu quero… | Agente de entrada | Cadeia |
|---|---|---|
| Criar uma página nova | `nexus-prime` | → `spec-engineer` → `spec-auditor` → `content-strategist` → `frontend-astro` → `static-analysis-enforcer` → `qa-shiftleft` → `reviewer-gatekeeper` |
| Publicar um artigo | `nexus-prime` | → `content-strategist` → `frontend-astro` → `qa-shiftleft` |
| Mudar stack/topologia | `nexus-prime` | → `architect-sdd` (novo ADR) → `spec-engineer` → `spec-auditor` → implementação |
| Alterar um budget/regra | `nexus-prime` | → emenda constitucional → `spec-auditor` (não-contradição) → 🧑 ratifica |
| Configurar integração externa | `nexus-prime` | → **Bypass Protocol (3 pilares)** → `integrations-security` → `architect-sdd` (ADR) |
| Mexer em CI/CD ou incidente | `nexus-prime` | → `devops-platform` |
| Revisar PR | `nexus-prime` | → `reviewer-gatekeeper` |
| Auditar spec antes de codar | `nexus-prime` | → `spec-auditor` |
| Endurecer segurança | `nexus-prime` | → `integrations-security` → `static-analysis-enforcer` → `qa-shiftleft` |
| Criar agente novo | `agent-factory-architect` | → forja agente + Red Team |

---

## 4. VERIFICAÇÕES AUTOMÁTICAS QUE OS AGENTES DEVEM ESPERAR

| Gate | O que falha o build | Spec |
|---|---|---|
| `verify:deps` | dependência com `preinstall`/`install`/`postinstall` | ADR-001 D4 |
| `adr-gate` | mudança em `astro.config.mjs`/`package.json`/`content.config.ts`/`workflows` sem ADR no diff | §C3 |
| `static-output` | `output: 'server'` ou `'hybrid'` | §C1 |
| `audit:bundle` | script inline · handler `on*` · recurso externo · externo sem SRI · mixed content · tracker · storage write · secret · CSP divergente do cânone · diretiva impossível em meta · budget estourado | SPEC-008, §C7–C10 |
| `lint:topology` | URL interna hardcoded sem `withBase()` · `<form action=remote>` | ADR-004, ADR-003 D2 |
| `lint:copy` | termo da lista negra · alegação não-verificável · claim de tempo de mercado da PJ | §C9, SDD-CONTEXT §1 |
| `test:links` | qualquer link quebrado em `dist/` | SPEC-004 AC-004.N5 |
| `test:a11y` | qualquer violação axe-core WCAG 2.1 AA | §C9 |
| `test:e2e` | qualquer cenário Gherkin falhando + qualquer violação de CSP em runtime (csp-guard) | §C12, ADR-002 D5 |
| `lighthouse` | Perf < 95 · A11y < 100 · BP < 95 · SEO < 100 · LCP > 2500 · CLS > 0,1 | §C10 |
| `test:unit --coverage` | coverage < 80 % no critical path | §C12 |

---

## 5. PROTOCOLO DE ESCALONAMENTO

| Situação | Ação do agente |
|---|---|
| Requisição ambígua | **BLOCKED** + pergunta específica. Nunca presumir. |
| Requisição viola §C9 (Kill Switch) | **REJECTED** imediato, sem Bypass, citando a regra. |
| Requisição viola §C1/§C2 (física da plataforma / custo) | **REJECTED** + apontar `RFC-002` se aplicável. |
| Requisição viola §C3–§C12 | **REJECTED** ou exigir **Bypass com 3 pilares**. Sem os 3 ⇒ recusa. |
| Requisição exige header HTTP customizado | **REJECTED** + citar `ADR-002 D7` e fonte [[1]]. |
| Requisição exige formulário/CMS/analytics | **REJECTED** + citar `SDD-CONTEXT §7` e `ADR-003`. |
| Dois agentes produzem artefatos conflitantes | `nexus-prime` aplica `CONSTITUTION §0` (precedência) e decide. |
| Falha catastrófica (deploy quebra produção) | Escalonar para 🧑 Humano + executar `docs/runbooks/rollback.md`. |
| Versão de pacote incerta | Declarar incerteza. **Nunca inventar.** |

---

## 6. DEFINIÇÃO DE PRONTO (DoD) — GLOBAL

Um incremento está pronto quando, **cumulativamente**:
- [ ] Existe `SPEC-ID` aprovado por `spec-auditor` cobrindo 100 % do que foi implementado
- [ ] Todo Critério de Aceite tem teste automatizado correspondente
- [ ] Existe ≥ 1 cenário **negativo** testado
- [ ] Todos os gates do CI estão verdes
- [ ] `data-testid` em todo elemento interativo
- [ ] Zero secret, zero tracker, zero recurso externo sem SRI
- [ ] Bundle dentro dos budgets (`SDD-CONTEXT §4`)
- [ ] Lighthouse ≥ 95/100/95/100 e axe-core 0 violações
- [ ] Identificadores EN, copy PT-BR (`ADR-000`)
- [ ] Se topologia mudou: ADR presente (`§C3`)
- [ ] Se merge em `main`: entrada no Journal (`§C6`)
- [ ] `reviewer-gatekeeper` citou linhas específicas da spec na aprovação
