<!-- reviewer-gatekeeper: PR sem SPEC-ID é REJEITADO automaticamente (CONSTITUTION §C12.1) -->

## 🔗 Spec referenciada

Closes #SPEC-NNN

<!-- OBRIGATÓRIO: cite as linhas dos Critérios de Aceite atendidos -->

| Critério de Aceite   | Evidência (arquivo:linha)     | Teste que o cobre           |
| -------------------- | ----------------------------- | --------------------------- |
| AC-NNN.1             | `src/components/Foo.astro:42` | `tests/e2e/foo.spec.ts:18`  |
| AC-NNN.N1 (negativo) | `src/lib/bar.ts:11`           | `tests/unit/bar.test.ts:33` |

## ✅ Checklist SDD (CONSTITUTION §C12)

- [ ] Referencia ≥ 1 `SPEC-ID`
- [ ] 100 % dos Critérios de Aceite da spec atendidos
- [ ] ≥ 1 cenário **negativo** coberto por teste automatizado
- [ ] Identificadores em **EN**, copy em **PT-BR** (ADR-000)
- [ ] `data-testid` em todo elemento interativo
- [ ] Zero secret no diff (validado por `gitleaks` + `static-analysis-enforcer`)
- [ ] Todos os gates de CI verdes
- [ ] **Sem scope creep**: nenhuma funcionalidade fora da spec

## 📊 Impacto medido (SDD-CONTEXT §4)

| Métrica           | Antes | Depois | Δ   | Dentro do budget? |
| ----------------- | ----- | ------ | --- | ----------------- |
| JS inicial (gzip) | —     | —      | —   | ☐                 |
| CSS (gzip)        | —     | —      | —   | ☐                 |
| LCP (mobile)      | —     | —      | —   | ☐                 |
| CLS               | —     | —      | —   | ☐                 |
| Lighthouse A11y   | —     | —      | —   | ☐                 |

> Crescimento de bundle > 10 % exige ADR do `architect-sdd` (§C10).

## 🏛️ Mudança de topologia? (§C3)

- [ ] Não
- [ ] Sim → ADR anexado: `.ai/adr/ADR-NNN-____.md`

## 🔓 Bypass Protocol solicitado? (§C4)

- [ ] Não
- [ ] Sim → **os 3 pilares**:
  1. **Força maior:** ______
  2. **Rota FOSS equivalente:** ______
  3. **Prazo de remoção:** ______
  > Sem os 3 pilares ⇒ recusa automática.

## 🚨 Kill Switch (§C9)

- [ ] Confirmo: nenhum dark pattern, tracker, regressão de a11y ou alegação não-verificável.

## 📓 Journal (§C6)

- [ ] Entrada adicionada ao Changelog Arquitetural do `README.md` (se merge para `main`).
