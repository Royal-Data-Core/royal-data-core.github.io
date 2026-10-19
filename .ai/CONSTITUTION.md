# 🏛️ CONSTITUTION — ROYAL DATA CORE
**Versão:** 3.1.0 · **Ratificada:** 2026-10-19 · **Regime:** Fail-Closed · **Emendas:** somente por ADR + aprovação humana

---

## §0 · ORDEM DE PRECEDÊNCIA (resolve todo conflito)

Quando duas normas colidirem, aplica-se **estritamente** esta ordem. Nenhuma regra abaixo pode ser reinterpretada para inverter a hierarquia.

```
1. Kill Switch Ético (C9)                    ← irrevogável, não admite Bypass
2. Lei aplicável (LGPD, CDC, Marco Civil)    ← irrevogável
3. Restrições físicas da plataforma (§C1,C2) ← irrevogável (GitHub Pages não muda)
4. Contratos do ecossistema SDD v8.0.0-AFA   ← revogável só por emenda constitucional
5. Esta Constituição (C3–C8, C10–C12)        ← revogável por ADR + humano
6. ADRs (.ai/adr/)                           ← revogável por ADR sucessor
7. Specs (.ai/specs/)                        ← revogável por spec sucessora
8. Preferência individual de agente          ← NULA. Não existe.
```

**Corolário:** uma spec NUNCA pode contradizer um ADR; um ADR NUNCA pode contradizer a Constituição; a Constituição NUNCA pode contradizer a física da plataforma ou a lei.

**Resolução de tensões conhecidas (pré-julgadas para evitar litígio entre agentes):**

| Tensão aparente | Resolução vinculante |
|---|---|
| C4 (custo zero) vs. qualidade de segurança | Custo zero **não** autoriza enfraquecer segurança. Autoriza escolher a implementação FOSS mais barata que atinja o mesmo nível. |
| C6 (Journal público) vs. RRR-06 (exposição de código) | Journal é obrigatório. Segredos jamais entram no repo (gate `guard` + `gitleaks`). |
| C7 (LGPD default-on) vs. necessidade de métricas de negócio | Métricas de negócio são obtidas por **proxy determinístico** (stars, clones do repo, backlinks), não por rastreamento de visitante. |
| C11 (liberdade técnica de scripts) vs. C1 (estático) | Scripts podem usar qualquer runtime **localmente e no CI**. O **artefato publicado** é sempre estático. |

---

## §C1 — IMUTABILIDADE ESTÁTICA
O artefato publicado consiste **exclusivamente** de HTML, CSS, JavaScript, WASM, JSON, XML, SVG e mídia estática. É **vedado** qualquer runtime de servidor (PHP, Ruby, Python, Node.js server-side), banco de dados acoplado ao deploy, ou chamada síncrona a backend próprio em runtime.
Todo dado dinâmico deve ser **resolvido em build time** a partir de: (a) arquivos versionados no repo, (b) API pública sem autenticação, (c) variáveis de ambiente do CI não-secretas.
*Exceção:* nenhuma. Bypass indisponível — restrição física da plataforma.

## §C2 — CUSTO ZERO E CANAL ÚNICO DE DEPLOY
Hospedagem exclusiva em **GitHub Pages**, repositório **público**, plano **GitHub Free**. Deploy exclusivo via **GitHub Actions** (`actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`).
É vedado introduzir qualquer serviço com custo recorrente > R$ 0,00/mês sem Bypass Protocol completo.
*Único custo tolerado sem Bypass:* registro anual de domínio próprio (≤ R$ 50/ano), por ser substituição de dependência, não adição.

## §C3 — ARQUITETURA DOCUMENTADA (ADR-OBRIGATÓRIO)
Nenhuma alteração de topologia é admissível sem ADR correspondente em `.ai/adr/`. Entende-se por topologia: troca de SSG, troca de package manager, nova Content Collection, nova integração externa, nova rota de nível 1, mudança de CI/CD, mudança de host, mudança de domínio, introdução de qualquer ilha hidratada permanente.
O gate `guard-adr` no CI **bloqueia merge** se o diff tocar em `astro.config.mjs`, `package.json` (campo `dependencies`), `.github/workflows/**` ou `src/content.config.ts` **sem** adição/modificação simultânea em `.ai/adr/**`.
Formato ADR: MADR 4.0 reduzido (Contexto · Decisão · Consequências · Alternativas Rejeitadas · Status).

## §C4 — FOSS-FIRST
Toda dependência deve ser Open Source (OSI-approved: MIT, Apache-2.0, BSD, ISC, MPL-2.0). Licenças copyleft forte (GPL/AGPL) exigem ADR justificando que não há contaminação do artefato publicado.
SaaS é admitido **somente** com Bypass Protocol validado nos 3 pilares: (1) força maior, (2) rota FOSS equivalente documentada, (3) prazo de remoção. Sem os três, **recusa automática**.

## §C5 — LIMITES RÍGIDOS DA PLATAFORMA
O projeto opera com folga deliberada sobre os limites do GitHub Pages:

| Recurso | Limite plataforma | Limite constitucional | Gate |
|---|---|---|---|
| Repo | 1 GB | **500 MB** | `guard` |
| Site publicado | 1 GB | **100 MB** | `guard` |
| Deploy | 10 min | **6 min** | `timeout-minutes` |
| Banda mensal | 100 GB (soft) | **40 GB** (projeção) | revisão trimestral |
| Builds/hora | 10 (soft) | N/A (Actions) | — |

Violação de limite constitucional = falha de build. Violação de limite de plataforma = incidente P1.

## §C6 — TRANSPARÊNCIA RADICAL E JOURNAL
Repositório público. O `README.md` contém um **Changelog Arquitetural** em ordem reversa (mais recente no topo), com entrada obrigatória para cada merge em `main`. Formato da entrada: `[AAAA-MM-DD] · [SPEC-ID|ADR-ID] · descrição de 1 linha · link do PR`.
O Journal **não é decorativo**: é ativo comercial (prova de rigor de engenharia para clientes de QA).

## §C7 — LGPD DEFAULT-ON E ZERO RASTREAMENTO
**Não há coleta de dados pessoais pelo site.** Vedado: cookies próprios ou de terceiros, `localStorage`/`sessionStorage` com qualquer identificador, fingerprinting, pixels, web beacons, analytics de qualquer natureza (incluindo self-hosted), heatmaps, session replay, `sendBeacon`.
Vedado qualquer tracker de terceiros (GA4, Meta Pixel, LinkedIn Insight Tag, Hotjar, Clarity). **Kill Switch ativo — não admite Bypass.**
O log de IP efetuado pelo GitHub Pages é operação do **operador da infraestrutura**, divulgada em `/privacidade` com base no GitHub Privacy Statement. O controlador (Royal Data Core) não tem acesso a esses logs e não os processa.
Base legal do site: **inexistência de tratamento de dados pessoais**. Não há DPO, não há RIPD, não há registro na ANPD — porque não há dado.

## §C8 — ZERO TRUST EM ATIVOS DE TERCEIROS
Por padrão, **nenhum recurso externo**. Se um recurso externo for aprovado via Bypass, ele obrigatoriamente carrega: (a) `integrity="sha384-…"` (SRI), (b) `crossorigin="anonymous"`, (c) `referrerpolicy="no-referrer"`, (d) entrada correspondente na allowlist do CSP em `SPEC-008`, (e) ADR.
Gate `audit-bundle` falha o build se detectar `<script src="http…">` sem `integrity`, ou `<img src="http…">` apontando para fora do próprio domínio.

## §C9 — KILL SWITCH ÉTICO (irrevogável)
Recusa imediata, sem Bypass e sem negociação, para:
- Dark patterns (confirmação assimétrica, countdown falso, scarcity artificial, opt-out oculto, roach motel).
- Vigilância ou rastreamento de visitante.
- Exclusão de acessibilidade (qualquer regressão de WCAG 2.1 AA).
- Discriminação algorítmica ou de conteúdo.
- Alegação factual falsa ou não-verificável sobre a empresa, seus serviços ou resultados (**inclui a restrição de §1 do SDD-CONTEXT sobre tempo de existência da PJ**).
- Ocultação de CNPJ, razão social ou canal de contato.
- SEO enganoso, cloaking, texto oculto, doorway pages.

## §C10 — BUDGETS VINCULANTES
Os budgets de `SDD-CONTEXT §4` são **lei**. Regressão > 10 % em qualquer Core Web Vital versus baseline = falha de build. Crescimento de bundle > 10 % exige ADR do `architect-sdd`.

## §C11 — LIBERDADE TÉCNICA INSTRUMENTAL
Scripts de automação local e de CI podem usar qualquer runtime (Bash, Node, Deno, Bun, Python, Ruby, Go) desde que: (a) determinísticos, (b) versionados em `scripts/`, (c) documentados no `README.md §Scripts`, (d) **não** integrem o artefato publicado, (e) executáveis em Linux/macOS sem privilégios elevados.
Bun é permitido em dev local **apenas** se `package-lock.json` permanecer o SSOT e o CI continuar usando `npm ci`. Divergência de lockfile = incidente P2.
Runtime policy (ADR-005, ratificada 2026-10-19): o toolchain aceita Node.js **LTS** (Active ou Maintenance, par >= 22.0.0) e **Current**. O gate `build` roda com matriz `node-version: [22.x, 24.x, 26.x]`; `guard`, `verify`, `lighthouse` e o artefato canônico de produção usam Active LTS (24.x). `.node-version` = 24. Slugs de registro (`node_22/24/26_compatible`) ficam fora do vocabulário §9 até ratificação humana posterior; a política vigente é ADR-005.

## §C12 — CONTRATOS DE QUALIDADE
Todo código mergeado em `main` satisfaz, cumulativamente:
1. Referencia ≥ 1 `SPEC-ID` no corpo do PR.
2. Passa em 100 % dos Critérios de Aceite da spec referenciada.
3. Possui ≥ 1 cenário Gherkin de **falha** coberto por teste automatizado.
4. Identificadores em **EN** (ADR-000); copy comercial em **PT-BR**.
5. Zero secret no diff (validado por `gitleaks` e por `static-analysis-enforcer`).
6. `data-testid` em todo elemento interativo.
7. CI verde em todos os gates.

---

## 📜 PROCESSO DE EMENDA
1. Qualquer agente ou humano propõe emenda via ADR numerado sequencialmente.
2. `spec-auditor` valida não-contradição com C1–C12 e com a ordem de precedência §0.
3. `nexus-prime` emite veredito.
4. **Humano ratifica.** Sem ratificação humana, emenda é nula.
5. Versão minor incrementa para clarificação; major para revogação de regra.

## 🧾 VALIDAÇÃO DE CONSISTÊNCIA (executada em 2026-10-16)
- [x] Nenhuma regra contradiz outra (verificação par-a-par: 66 pares, 0 colisões).
- [x] Toda regra é testável por gate automatizado ou por revisão humana nomeada.
- [x] Toda regra cita base normativa ou restrição física.
- [x] Ordem de precedência cobre 100 % dos casos de colisão previsíveis.
- [x] Zero ambiguidade lexical: nenhum "deve ser rápido/bom/adequado". Todos os limites são numéricos.
