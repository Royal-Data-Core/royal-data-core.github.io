# ADR-006 · Desvio documentado: 5 HIGH dev-only remanescentes no audit (cadeia braces)

**Status:** Accept (Bypass Protocol — 3 pilares validados) · **Data:** 2026-10-19 · **Ratificação:** operador humano (instrução direta, negativo-de-reinício 2026-10-19)

## Contexto
Após a cadeia de upgrades da ADR-005, o `npm audit` completo reporta **5 HIGH**: `braces` (GHSA-vfj7-8cjw-p6jp, range ≤3.0.3) e seus proxies `micromatch`, `fast-glob`, `globby`, `markdownlint-cli2`. Fatos verificados 3× contra o registry: (a) `braces` mais recente = **3.0.3** — não existe release corrigida; (b) `markdownlint-cli2@0.23.3` resolve rigidamente `globby 16.2.4 → fast-glob 3.3.3 → micromatch 4.0.8 → braces ^3.0.3`; (c) o próprio `npm audit fix --force` sugere `markdownlint-cli2@0.0.4` (downgrade destrutivo — proibido). **`npm audit --omit=dev` = 0 vulnerabilidades.** Todas as 5 ocorrências são exclusivamente dev-tooling (lint); não há caminho de runtime, não há exposição no artefato publicado, não há entrada de dado de visitante.

## Decisão
- **D1** — Desvio aceito e formalizado: `npm_audit_clean` é medido pelo gate vinculado `npm audit --omit=dev` (deve ser SEMPRE 0) + audit completo mensal com hipótese de residual dev-only documentada nesta ADR.
- **D2** — Resolução preferencial: quando `markdownlint-cli2` publicar linha que resolva `fast-glob ≥ fix`/`braces ≥ fix` (ou quando `braces` publicar release corrigida), atualizar sem nova ADR (dependabot já ativo).
- **D3** — Sem Bypass: nenhum tracker, nenhum serviço pago, nenhum downgrade de versão é admitido para "limpar" o contador.

## Bypass Protocol — 3 pilares
1. **Força maior:** nenhuma versão limpa de `braces` existe no registry (≤3.0.3 = latest); cadeia é proxy puro do `markdownlint-cli2`; downgrade fatal ao toolchain de lint.
2. **Estratégia de saída FOSS:** `markdownlint-cli2` é dev-only e integralmente substituível por FOSS (ex.: `markdownlint` API + runner próprio, ou migração para plugin eslint-markdownlint); custo zero, zero SaaS, caminho documentado.
3. **Prazo de detox:** revisão em CADA dependabot PR tocando `fast-glob`/`micromatch`/`braces`/`markdownlint-cli2`; revisão dura fixada em **2027-01-15** (ciclo trimestral §C5). Não resolvido até lá, executar D3-estratégia de saída acima.

## Consequências
- `npm audit` completo permanece com contagem ≠ 0 (5 HIGH) até: (a) release registry que resolva, ou (b) troca por alternativa FOSS equivalente.
- Nenhum impacto em LCP/CLS/INP/bundle: cadeia não integra o artefato (§C1 estático).
- Incidente se `npm audit --omit=dev` > 0.

## Alternativas Rejeitadas
- `npm audit fix --force`: downgrade `markdownlint-cli2@0.23.3 → 0.0.4` (destrói lint, não resolve braces).
- `overrides: {braces}` para versão inexistente: impossível (sem release).
- Remover `markdownlint-cli2` do repo: rompe gate §C12/`lint:md` exigido para `.ai/**`.

## Relacionados
ADR-005 · CONSTITUTION §C4/§C11 · `.github/dependabot.yml` · SPEC-008
