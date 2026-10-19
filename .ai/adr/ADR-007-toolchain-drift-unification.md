# ADR-007 · Unificação de deriva de toolchain: Pagefind v1.5, ecosystem-gate, links pré-publicação

**Status:** Accept · **Data:** 2026-10-19 · **Ratificação:** instruções operacionais do humano (sanity + correções estruturais no mesmo ciclo)

## Contexto
O ciclo de saneamento estrutural (sanity 2026-10-19) revelou deriva composta acumulada: (a) `pagefind@^1.3.0` resolves v1.5.2, que renomeia `pagefind.wasm` → `wasm.<lang>.pagefind` e cujo default de output mudou de `_pagefind` para `pagefind`; (b) `.github/workflows/validate-ecosystem.yml` pressionava inexistente `.ai/constitution.md` (case-sensitive em Linux) e o agente-fantoche `nexus-prime.system` (manifest de tracked agents = `nexus-prime.md`); (c) `scripts/audit-bundle.mjs` (gate CI) com 3 defeitos internos; (d) `lint:md` sem config; (e) sweep estrutural deletou indevidamente `scripts/*.py` do dispatcher SDD, quebrando o job de ecossistema; (f) `test:links` sondava host não-publicado (RRR-08).

## Decisão
- **D1 (Pagefind):** `build:pagefind` fixa `--output-subdir _pagefind` (path público `/_pagefind/` imutável per SPEC-007); `verify:pagefind` passa a exigir `pagefind.js` + `pagefind-entry.json` + artefato wasm version-agnóstico (`wasm.*.pagefind` ou legado `pagefind.wasm`); gate em `ci.yml` idem. SPEC-007 emendada in-place para v1.1.0 (sucessora na escala §0-7).
- **D2 (Ecosystem gate):** `validate-ecosystem.yml` valida `.ai/CONSTITUTION.md` (SSOT normativa real, SDD-CONTEXT §pre) e o manifest real `nexus-prime`; `scripts/test_nexus_parser.py`, `nexus_dispatcher.py`, `test_project_analyst_integration.py`, `validate_nexus_yaml.py` restaurados do histórico (`6fb103b`) por serem infraestrutura citada pelo job. Os 5 `tests/*-tests.js` restam removidos: stubs alucinados (funções referenciadas inexistentes, sem import, não referenciados por nenhum script/CI) — §C5.
- **D3 (test:links):** `--skip https://royaldatacore.github.io/*` pré-publicação (RRR-08: host inexistente ⇒ 404 falsos). Skips de third-party (linkedin/wa.me/github) mantidos por política de rasteabilidade; integridade de links relativos internos segue enforced recursivamente em `./dist`.
- **D4 (audit-bundle.mjs):** scanner reescrito: (1) parse de CSP tolerante a valores com aspas simples embutidas; (2) dead-code `&& false` em `isCanonical` eliminado — canonical e links absolutos internos deixam de ser tratados como "recurso externo"; (3) varredura de trackers escopada a atributos de recurso (`<script src>`, `connect-src`, hosts de script/img/iframe), não ao corpo textual — elimina o falso-positivo de Kill Switch sobre `/privacidade`, que lista nomes de trackers por exigência do `COPY-BRIEF.md`.
- **D5 (lint:md):** `.markdownlint-cli2.jsonc` com `MD013: false` e `ignores` incluindo `.opencode/**`.
- **D6 (formatação):** `.prettierignore` veta docs normativos (`.ai/**`, `.opencode/**`, lockfile, artefatos) — `prettier --write .` normaliza o corpus código (src/tests/workflows/configs) sem remarcação de doutrina. `format:check` volta a gate verde.
- **D7 (a11y sintática):** `shikiConfig.light = github-light-high-contrast` — `github-light` emite `#E36209` a 3.48:1 no branco (WCAG 1.4.3 < 4.5:1 = violação legal §C9); paleta high-contrast é AA-tuned mesma família GitHub. Dark mantém `github-dark`.

## Consequências
- Gate de ecossistema volta a executar tooling real; qualquer commit futuro em `scripts/**` reassegura parser do dispatcher.
- Pagefind 1.5.x é integrado sem regressão de path público; SPEC-007 v1.1.0 substitui a 1.0.0.
- `audit-bundle` volta a ser gate honesto (falsos positivos instruídos a zero).

## Alternativas Rejeitadas
- Pin `pagefind ~1.3.0`: congela upstream de segurança, contradiz `npm_audit_clean`-policy (ADR-006).
- Restaurar `tests/*-tests.js`: stubs não-executáveis e sem contrato; reintrodução seria lugar Freud do gate.
- Trocar de SSG por Jekyll: viola `CONSTITUTION §C1`/ADR-001.

## Relacionados
ADR-005 · ADR-006 · SPEC-007 v1.1.0 · RFC-001 §2.2 · CONSTITUTION §C3 §C5 §C12
