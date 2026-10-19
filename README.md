<div align="center">

# Royal Data Core

**Engenharia de qualidade para software crítico.**

[![CI](https://github.com/royaldatacore/royaldatacore.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/royaldatacore/royaldatacore.github.io/actions/workflows/ci.yml)
[![Deploy](https://github.com/royaldatacore/royaldatacore.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/royaldatacore/royaldatacore.github.io/actions/workflows/deploy.yml)
![Lighthouse Performance](https://img.shields.io/badge/Lighthouse_Perf-≥95-2ea44f)
![Lighthouse A11y](https://img.shields.io/badge/Lighthouse_A11y-100-2ea44f)
![JS inicial](https://img.shields.io/badge/JS_inicial-≤50KB-informational)
![Custo mensal](https://img.shields.io/badge/custo-R%240.00-success)

**🌐 https://royaldatacore.github.io** · Consultoria em testes de software · Matão/SP

</div>

---

## 🔍 Sobre este repositório

Este site é, deliberadamente, um **laboratório vivo de engenharia de qualidade**. Ele é o
próprio case: 100 % estático, custo recorrente zero, pipeline determinístico, specs
formais antes de código e auditoria de segurança em cada commit.

> Se você contrata QA, faz sentido exigir que o site do seu consultor passe pelos
> gates que ele propõe para o seu produto. **Todos os relatórios deste repositório
> são públicos.** Verifique você mesmo:
> [CI runs](https://github.com/royaldatacore/royaldatacore.github.io/actions) ·
> [Lighthouse](#-journal) · [specs](.ai/specs/) · [decisões arquiteturais](.ai/adr/)

### Metodologia

Desenvolvimento guiado por especificação (**SDD — Spec-Driven Development**) com um
ecossistema de 14 agentes especializados orquestrados em DAG estrito. Nenhum código é
escrito antes de existir spec aprovada; nenhum PR é mergeado sem cenário de falha testado.

| Documento                                        | Papel                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| [`.ai/SDD-CONTEXT.md`](.ai/SDD-CONTEXT.md)       | Dossiê factual — premissas, restrições, budgets    |
| [`.ai/CONSTITUTION.md`](.ai/CONSTITUTION.md)     | Regras normativas imutáveis + ordem de precedência |
| [`.ai/BLUEPRINT.md`](.ai/BLUEPRINT.md)           | Topologia de diretórios travada                    |
| [`.ai/adr/`](.ai/adr/)                           | Architecture Decision Records                      |
| [`.ai/specs/features/`](.ai/specs/features/)     | Contratos executáveis (Gherkin)                    |
| [`.ai/specs/rfc/`](.ai/specs/rfc/)               | RFCs de infraestrutura                             |
| [`.ai/ROADMAP.md`](.ai/ROADMAP.md)               | Roteiro sequencial de produção                     |
| [`.ai/AGENT-PLAYBOOK.md`](.ai/AGENT-PLAYBOOK.md) | Roteamento operacional dos agentes                 |

---

## 📓 Journal — Changelog Arquitetural

> Ordem reversa (§C6). Uma entrada por merge em `main`.
> Formato: `[AAAA-MM-DD] · [SPEC-ID|ADR-ID|RFC-ID] · descrição · PR`

| Data         | Ref | Mudança                                                                                    | PR  |
| ------------ | --- | ------------------------------------------------------------------------------------------ | --- |
| _2026-10-16_ | _—_ | _Ratificação da Constituição v3.0.0, 9 specs, 2 RFCs, 5 ADRs. Projeto ainda não buildado._ | _—_ |

<!-- TEMPLATE DE ENTRADA (copiar e preencher a cada merge em main):
| YYYY-MM-DD | SPEC-NNN | <descrição de 1 linha> | #NN |
-->

### Métricas DORA (RFC-001 §2.8) — atualização mensal

| Mês     | Deploys | Lead Time (mediana) | Change Failure Rate | MTTR | Actions min |
| ------- | ------- | ------------------- | ------------------- | ---- | ----------- |
| 2026-10 | —       | —                   | —                   | —    | —           |

### Registro de Risco Residual ativo

`RRR-01` clickjacking · `RRR-02` MIME sniffing · `RRR-03` Permissions-Policy ·
`RRR-04` sem CSP reporting · `RRR-05` log de IP pelo GitHub · `RRR-06` código público ·
`RRR-07` harvesting de email · `RRR-08` domínio `*.github.io` · `RRR-09` banda 100 GB
→ detalhes e mitigação em [`.ai/SDD-CONTEXT.md §8`](.ai/SDD-CONTEXT.md#8--registro-de-risco-residual-rrr)

---

## ⚙️ Stack

| Camada            | Tecnologia                                                                               | Licença              |
| ----------------- | ---------------------------------------------------------------------------------------- | -------------------- |
| SSG               | [Astro 5](https://astro.build)                                                           | MIT                  |
| CSS               | [Tailwind CSS 4](https://tailwindcss.com)                                                | MIT                  |
| Conteúdo          | Astro Content Collections (MDX) + Zod                                                    | MIT                  |
| Busca             | [Pagefind](https://pagefind.app)                                                         | MIT                  |
| Testes E2E / A11y | [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) | Apache-2.0 / MPL-2.0 |
| Unit + coverage   | [Vitest](https://vitest.dev)                                                             | MIT                  |
| Performance       | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)                           | Apache-2.0           |
| Link check        | [linkinator](https://github.com/JustinBeckwith/linkinator)                               | Apache-2.0           |
| CI/CD             | GitHub Actions                                                                           | —                    |
| Hosting           | GitHub Pages                                                                             | —                    |

**Custo mensal recorrente: R$ 0,00.** Justificativa e alternativas rejeitadas em [`ADR-001`](.ai/adr/ADR-001-static-stack.md).

---

## 🚀 Setup local

```bash
# Pré-requisitos: Node >= 22, npm >= 10
git clone https://github.com/royaldatacore/royaldatacore.github.io.git
cd royaldatacore.github.io
cp .env.example .env          # preencha PUBLIC_CONTACT_EMAIL e PUBLIC_CONTACT_PHONE
npm ci --ignore-scripts       # NUNCA `npm install` (ADR-001 D3)
npm run dev                   # http://localhost:4321
```

### Scripts

| Comando                     | Descrição                                               |
| --------------------------- | ------------------------------------------------------- |
| `npm run dev`               | Servidor de desenvolvimento com HMR                     |
| `npm run build`             | Build Astro + índice Pagefind + verificação do índice   |
| `npm run preview`           | Serve `dist/` localmente                                |
| `npm run check`             | `astro check` + `tsc --noEmit`                          |
| `npm run lint` / `lint:fix` | ESLint                                                  |
| `npm run lint:copy`         | Gate de copy (proíbe jargão e alegação não-verificável) |
| `npm run lint:security`     | Auditoria de `dist/`: CSP, SRI, trackers, budget        |
| `npm run lint:topology`     | Gate de URLs hardcoded e formulários remotos            |
| `npm run audit:bundle`      | Budget de JS/CSS gzip                                   |
| `npm run verify:deps`       | Garante que `--ignore-scripts` é seguro (ADR-001 D4)    |
| `npm run test:unit`         | Vitest + coverage (≥ 80 % no critical path)             |
| `npm run test:e2e`          | Playwright (cenários Gherkin das SPECs)                 |
| `npm run test:a11y`         | axe-core em 375×667 e 1280×800                          |
| `npm run test:links`        | linkinator recursivo                                    |
| `npm run test:lh`           | Lighthouse CI local                                     |
| `npm run new:post`          | Scaffolding de novo artigo                              |
| `npm run pin:actions`       | Converte tags de actions em SHA (INFRA-001)             |

---

## 🔒 Postura de segurança

| Controle                                             | Status                                                              | Referência                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CSP estrita via `<meta>`                             | ✅ `default-src 'none'`                                             | [`SPEC-008`](.ai/specs/features/SPEC-008-csp-hardening.md)                   |
| SRI em recursos externos                             | ✅ gate automático                                                  | `CONSTITUTION §C8`                                                           |
| Cookies / trackers / analytics                       | ❌ **nenhum**                                                       | `CONSTITUTION §C7` (Kill Switch)                                             |
| Coleta de dados pessoais                             | ❌ **nenhuma**                                                      | [`SPEC-009`](.ai/specs/features/SPEC-009-privacy-legal.md)                   |
| Secrets no repo                                      | ❌ zero (`gitleaks` em todo PR)                                     | `RFC-001 §3`                                                                 |
| HTTPS forçado                                        | ✅ Let's Encrypt via GitHub                                         | [`ADR-002 D3`](.ai/adr/ADR-002-pages-security-limits.md)                     |
| Headers HTTP customizados                            | ⚠️ **impossível no GitHub Pages**                                   | [`ADR-002`](.ai/adr/ADR-002-pages-security-limits.md)                        |
| `frame-ancestors` / `nosniff` / `Permissions-Policy` | ⚠️ risco residual aceito                                            | `RRR-01/02/03` · saída: [`RFC-002`](.ai/specs/rfc/RFC-002-edge-hardening.md) |
| Supply chain                                         | `npm ci --ignore-scripts` + verificação de invariantes + Dependabot | [`ADR-001 D4`](.ai/adr/ADR-001-static-stack.md)                              |

**Divulgação responsável:** `security@` (ver [`/contato`](https://royaldatacore.github.io/contato/)). Prazo de resposta alvo: 5 dias úteis.

---

## 📄 Licença

Código-fonte: **MIT** (`LICENSE`). Conteúdo textual (artigos, copy): **CC BY-NC-SA 4.0**.

---

<div align="center">

**ROYAL DATA CORE LTDA** · CNPJ 69.527.139/0001-94 · Matão/SP
[Contato](https://royaldatacore.github.io/contato/) · [Privacidade](https://royaldatacore.github.io/privacidade/)

</div>

---

## 🛠 Scripts — contrato CLI (CONSTITUTION §C11c)

Todo script é determinístico, versionado em `scripts/` e nunca integra o artefato publicado (§C11a–e).

| Script                                   | Contrato                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run new:post`                       | Scaffolding determinístico de novo artigo MDX com frontmatter validado pelo schema Zod (`src/content.config.ts`).                                      |
| `npm run lint:copy`                      | Gate de copy: proíbe jargão técnico e alegação comercial não-verificável (Kill Switch AFA de falso marketing).                                         |
| `npm run lint:topology`                  | Gate de topologia (SPEC-001 AC-001.9): URL root-absolute em `src/**` tem de passar por `withBase()` — imprime `file:line` + "ADR-004: use withBase()". |
| `npm run lint:md`                        | markdownlint-cli2 (`.markdownlint-cli2.jsonc`): varre `**/*.md` e `.ai/**`; MD013 off, artefatos gerados ignorados.                                    |
| `npm run lint:security` / `audit:bundle` | `scripts/audit-bundle.mjs` sobre `dist/`: budget JS/CSS gzip, script inline, `on*`, recurso externo, SRI e mixed content.                              |
| `npm run verify:deps`                    | Garante a invariante da cadeia de suprimentos (`npm ci --ignore-scripts`, zero script de instalação proibido — ADR-001 D4).                            |
| `npm run verify:pagefind`                | Falha rápido se o índice Pagefind não for gerado: `pagefind.js` + `pagefind-entry.json` + `wasm.*.pagefind` (SPEC-007).                                |
| `npm run pin:actions`                    | `scripts/pin-actions.sh`: converte `uses:` por tag em SHA resolvido pela API do GitHub (INFRA-001; `--check` só relata).                               |
| `scripts/generate-og.mjs`                | Gera `public/og-default.png` (1200×630, texto em SVG com system font stack — sem webfont externo); executar uma vez e commitar o PNG.                  |
| `npm run test:lh`                        | `lhci autorun` com `lighthouserc.json` (budgets LCP/CLS/INP/TBT hard-fail — SDD-CONTEXT §4).                                                           |
