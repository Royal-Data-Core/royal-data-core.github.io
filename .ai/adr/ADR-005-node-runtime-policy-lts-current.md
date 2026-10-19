# ADR-005 · Runtime Node.js: LTS + Current

**Status:** Accept · **Data:** 2026-10-19 · **Ratificação:** instrução direta do humano (2026-10-19) · **Supersede:** n/a

## Contexto
Pipeline fixava exclusivamente Node 22.x (`ci.yml` → `NODE_VERSION: '22'`; `.node-version` → `22.0.0`; `engines` → `>=22.0.0`), enquanto em 2026-10: Node 22 = **Maintenance LTS** (EOL 2027-04), Node 24 = **Active LTS** (desde 2026-10), Node 26 = **Current**. Os 40 achados de `npm audit` exigem atualizações da toolchain (vite/esbuild/sharp/vitest/lighthouse) cujas linhas suportam LTS e Current. O operador humano solicitou explicitamente a matriz `node-version: [22.x, 24.x, 26.x]` e a política "LTS + Current" na Constituição.

## Decisão
- **D1** — O pipeline aceita Node.js **LTS** (Active ou Maintenance, par ≥ 22.0.0) e **Current**.
- **D2** — Gate `build` valida compatibilidade com matriz `node-version: [22.x, 24.x, 26.x]`.
- **D3** — Gates `guard`, `verify`, `lighthouse` e o artefato canônico de produção usam **Active LTS (24.x)**, mantendo um único encadeamento articulado e respeitando `§C5` (builds/h e timeouts).
- **D4** — `.node-version` = `24`; `engines.node` = `>=22.0.0`; `package-lock.json` via `npm` permanece SSOT (§C11) — `npm ci`, nunca `npm install` no CI.

## Consequências
- Achados de vulnerabilidades em cadeias dev são resolvidos com atualização controlada (`fixAvailable`); downgrade destrutivo é proibido (`npm audit fix --force` bruto instala `@lhci/cli@0.1.0` — viola §C10).
- Falha isolada em 26.x não bloqueia o deploy: artefato canônico é construído/testado em 24.x; matriz isola o risco no gate `build`.
- Custos de Actions aumentam no `build` (3 runners pares).
- `runs-on: ubuntu-latest` assume a imagem estável mais recente (26.04) sem pins inválidos (`ubuntu-26` não é label válido).

## Alternativas Rejeitadas
- Matriz `[22,24,26]` nos 4 gates — multiplica Playwright/LHCI por 3; estoura orçamento de Actions/h e `§C5`.
- Pin permanente em 22 exclusivo — congela a cadeia de segurança e contradiz `npm_audit_clean`.
- `npm audit fix --force` bruto — downgrade destrutivo (`@lhci/cli@0.14.0 → 0.1.0`), viola `§C10` (budgets LHCI).

## Relacionados
RFC-001 §2.2 · CONSTITUTION §C11 (emenda 3.1.0) · ADR-001 · dependabot (SEC-4)
