# SPEC-008 — CSP via Meta Tag e Hardening de Client-Side

**ID:** SPEC-008 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `integrations-security` + `frontend-astro` · **Auditor:** `spec-auditor`
**Dependências:** **ADR-002 (normativo)**, SPEC-001, SPEC-007

## Premissa física inegociável (F-01/F-02)
GitHub Pages não entrega headers HTTP customizados [[1]]. `<meta>` ignora `frame-ancestors`, `report-uri`, `sandbox` e não suporta Report-Only [[3]][[4]]. Esta spec implementa **o máximo fisicamente possível** e nomeia o resto como risco residual.

## Política CSP Canônica (SSOT — nenhuma derivação é aceita)

```
default-src 'none';
base-uri 'self';
object-src 'none';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
media-src 'self';
worker-src 'self';
manifest-src 'self';
upgrade-insecure-requests
```

### Justificativa diretiva a diretiva
| Diretiva | Valor | Justificativa normativa |
|---|---|---|
| `default-src` | `'none'` | Fail-closed. Tudo que não é explicitamente permitido é bloqueado. |
| `script-src` | `'self' 'wasm-unsafe-eval'` | `'self'`: Astro emite scripts como arquivos externos em `/_astro/`. **Nenhum inline é permitido.** `'wasm-unsafe-eval'`: exigido pelo WASM do Pagefind (SPEC-007). `'unsafe-eval'` e `'unsafe-inline'` são **proibidos**. |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind v4 gera CSS externo (`'self'`). `'unsafe-inline'` é necessário porque Pagefind UI e Shiki aplicam `style=""` pontual. **Risco aceito:** injeção de CSS é severidade baixa (não executa código) e não há vetor de entrada de usuário (site sem formulário, sem query string refletida). |
| `img-src` | `'self' data:` | Zero imagem externa. `data:` cobre placeholders SVG inline. Enforçado por `audit-bundle`. |
| `font-src` | `'self'` | Fontes self-hosted ou system stack. **Decisão ótima: system font stack** (`ui-sans-serif, system-ui, …`) ⇒ zero request, zero FOIT, zero custo de licença. |
| `connect-src` | `'self'` | Nenhum `fetch`/XHR/WebSocket a terceiro. Pagefind busca em `/_pagefind/`. |
| `object-src` | `'none'` | Bloqueia `<object>`, `<embed>`, `<applet>`. |
| `base-uri` | `'self'` | Impede hijack de `<base>`. |
| `worker-src` | `'self'` | Pagefind pode usar worker. |
| `upgrade-insecure-requests` | presente | Elimina mixed content (GitHub Docs: *Resolving problems with mixed content*). |
| `frame-ancestors` | **OMITIDA** | Ignorada em `<meta>` (CSP3). Presente seria **documentação enganosa**. → RRR-01. |
| `report-uri`/`report-to` | **OMITIDAS** | Ignoradas em `<meta>`. → RRR-04. Compensado por `csp-guard.ts` em CI (ADR-002 D5). |
| `sandbox` | **OMITIDA** | Ignorada em `<meta>`. |

## Critérios de Aceite

```gherkin
Feature: SPEC-008 — CSP e Hardening

  Scenario: AC-008.1 — Meta CSP presente, primeira posição útil e idêntica ao cânone
    Given que qualquer rota do Critical Path foi buildada
    When o "<head>" é parseado
    Then existe exatamente 1 elemento "meta[http-equiv='Content-Security-Policy']"
    And seu "content", normalizado (espaços colapsados, ponto-e-vírgula como separador), é byte-a-byte igual à política canônica desta spec
    And o elemento aparece ANTES de qualquer "<link rel='stylesheet'>" e de qualquer "<script>"

  Scenario: AC-008.2 — Diretivas impossíveis em meta NÃO estão presentes
    Given o "content" da meta CSP
    When o texto é inspecionado
    Then NÃO contém "frame-ancestors"
    And NÃO contém "report-uri" nem "report-to"
    And NÃO contém "sandbox"
    And existe comentário HTML adjacente "[ADR-002] frame-ancestors/report-uri são ignorados em meta-tag; ver RRR-01/RRR-04"

  Scenario: AC-008.3 — Referrer Policy pelo mecanismo correto
    Given o "<head>" de qualquer rota
    When inspecionado
    Then existe "<meta name='referrer' content='strict-origin-when-cross-origin'>"
    And NÃO existe "<meta http-equiv='Referrer-Policy'>" (mecanismo inválido)

  Scenario: AC-008.4 — Proibição de valores perigosos
    Given a meta CSP de qualquer rota
    When o "content" é inspecionado
    Then NÃO contém "'unsafe-eval'"
    And NÃO contém "'unsafe-inline'" dentro de "script-src"
    And NÃO contém "*" como source isolado
    And NÃO contém "https:" como source isolado em "script-src", "connect-src" ou "default-src"

  Scenario: AC-008.5 — Zero script inline no artefato
    Given todo arquivo "dist/**/*.html"
    Quando são escaneados
    Then NÃO existe "<script>" sem atributo "src", exceto "<script type='application/ld+json'>"
    And todo "<script src>" aponta para caminho relativo ao próprio origin
    And NÃO existe atributo "onclick", "onerror", "onload", "onmouseover" ou qualquer "on*" em qualquer elemento

  Scenario: AC-008.6 — Zero recurso externo
    Given todo arquivo "dist/**/*.html" e "dist/**/*.css" e "dist/**/*.js"
    Quando são escaneados por "audit-bundle.mjs"
    Then NÃO existe "src" nem "href" nem "url(" apontando para host externo
    And NÃO existe "@import" de URL externa no CSS
    And NÃO existe "fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com", "unpkg.com", "jsdelivr.net"
    And o relatório lista 0 violações

  Scenario: AC-008.7 — SRI obrigatório em qualquer exceção aprovada
    Given que um Bypass Protocol aprovado introduziu recurso externo
    When o HTML é escaneado
    Then o "<script src='https://…'>" possui "integrity" iniciando em "sha384-" ou "sha512-"
    And possui "crossorigin='anonymous'"
    And possui "referrerpolicy='no-referrer'"
    And o host está listado na allowlist de "script-src" desta spec
    E existe ADR correspondente em ".ai/adr/"

  Scenario: AC-008.8 — Zero violação de CSP em runtime (ADR-002 D5)
    Given que toda rota do Critical Path é carregada em Playwright com "csp-guard.ts"
    When a navegação e interação padrão são executadas
    Then nenhum evento "console" de tipo "error" contém "Content Security Policy" nem "Refused to"
    And nenhum evento "pageerror" é emitido
    And nenhum evento "securitypolicyviolation" é emitido

  Scenario: AC-008.9 — Mixed content eliminado
    Given todo arquivo em "dist/"
    Quando escaneado
    Then NÃO existe "http://" em "src", "href", "action" ou "url()"
    And a exceção permitida é apenas "http://www.w3.org/" em namespaces XML/SVG e "http://schema.org" em JSON-LD (que não são fetch)

  Scenario: AC-008.10 — Enforce HTTPS ativado (item de checklist pré-launch)
    Given o repositório no GitHub
    When "Settings → Pages" é verificado
    Then a opção "Enforce HTTPS" está marcada e habilitada (não acinzentada)
    And "curl -sI https://<site>" retorna "strict-transport-security"
    And "http://<site>" redireciona 301 para "https://"

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-008.N1 — Recurso externo sem SRI bloqueia o build
    Given que "<script src='https://cdn.exemplo.com/lib.js'>" é adicionado sem "integrity"
    When "node scripts/audit-bundle.mjs" é executado
    Then exit code != 0
    And stdout contém "SPEC-008/AC-008.7: script externo sem SRI"
    And stdout contém o caminho do arquivo e o número da linha
    And stdout contém "CONSTITUTION §C8"

  Scenario: AC-008.N2 — Script inline sem hash bloqueia o build
    Given que um componente emite "<script>document.title='x'</script>"
    When "node scripts/audit-bundle.mjs" é executado
    Then exit code != 0
    And a mensagem cita "SPEC-008/AC-008.5: script inline viola script-src 'self'"

  Scenario: AC-008.N3 — Fonte do Google Fonts bloqueia o build
    Given que "global.css" adiciona "@import url('https://fonts.googleapis.com/css2?family=Inter')"
    When "node scripts/audit-bundle.mjs" é executado
    Then exit code != 0
    And a mensagem cita "ADR-001: system font stack; fonte externa requer Bypass Protocol"

  Scenario: AC-008.N4 — CSP enfraquecida é detectada por diff textual
    Given que alguém adiciona "'unsafe-inline'" a "script-src"
    When o teste "SPEC-008/AC-008.4" é executado
    Then o teste falha
    And a mensagem lista a diretiva ofensora
    And a mensagem cita "CONSTITUTION §C9 Kill Switch"

  Scenario: AC-008.N5 — Handler inline "onclick" bloqueia o build
    Given que um botão recebe "onclick='toggle()'"
    When "npm run lint:security" é executado
    Then exit code != 0
    And a mensagem cita "SPEC-008/AC-008.5: attribute handler proibido"

  Scenario: AC-008.N6 — Proposta de header HTTP é rejeitada em revisão
    Given que um PR adiciona "public/_headers" ou "netlify.toml" ou middleware Astro de headers
    When "reviewer-gatekeeper" avalia o PR
    Then o PR é REJEITADO
    And o comentário de rejeição cita "ADR-002 D7: GitHub Pages não entrega headers customizados [1]"
    And o comentário aponta para "RFC-002" como caminho correto
```

## Checklist Pré-Launch (obrigatório, executado por `integrations-security`)
- [ ] `curl -sI https://<site>` → confirmar `strict-transport-security` presente (fornecido pela edge do GitHub)
- [ ] Confirmar **ausência** de `content-security-policy` no header (esperado — ADR-002) e **presença** no `<meta>`
- [ ] "Enforce HTTPS" marcado em Settings → Pages
- [ ] `dist/404.html` existe na raiz
- [ ] `.nojekyll` presente em `dist/`
- [ ] `robots.txt` permite crawlers e aponta o sitemap
- [ ] Sitemap XML válido e com URLs absolutas corretas
- [ ] Zero ocorrência de `http://` em `dist/` (exceto namespaces)
- [ ] `gitleaks` limpo no histórico completo
- [ ] Lighthouse A11y = 100 em todas as rotas do Critical Path
- [ ] `linkinator` 0 erros
- [ ] CNPJ e razão social visíveis no rodapé (SPEC-009)
- [ ] `/privacidade` publicada e linkada no rodapé

## Rastreabilidade
`ADR-002 D1 D2 D3 D4 D5 D6 D7` · `CONSTITUTION §C7 §C8 §C9` · `SDD-CONTEXT §3 §7 §8` · `SPEC-007`

## Fontes
[1] GitHub Community Discussion #49832 · [3] dev.to *How to set CSP with a meta tag* (2026) · [4] w3c/webappsec-csp#277 · [7] MDN `<meta http-equiv>` · [8] isaacsmith.us *Adding a CSP to Your GitHub Pages Site* · [10] rviscomi.dev · W3C CSP Level 3 §2.1, §6.6.2.5 (`'wasm-unsafe-eval'`) · OWASP ASVS v4.0.3 §V5.3, §V14.4 · OWASP Content Security Policy Cheat Sheet · GitHub Docs *Securing your GitHub Pages site with HTTPS* · RFC 9110.
