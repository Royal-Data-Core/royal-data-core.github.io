# ADR-002 — Limites de Segurança do GitHub Pages e Estratégia Compensatória

**Status:** ACCEPTED · **Data:** 2026-10-16 · **Classificação:** restrição física de plataforma
**Enforcer:** `integrations-security` · **Auditor:** `spec-auditor`

## Contexto — Achado Crítico F-01/F-02
O contrato do agente `integrations-security` instrui "configurar headers de segurança: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`" e "implementar CSP estrita via Astro middleware".

**Ambas as instruções são inexequíveis no GitHub Pages.** O serviço não expõe nenhuma configuração de resposta HTTP: não há suporte a arquivo `_headers` (Netlify), `netlify.toml`, `_redirects`, `vercel.json`, nem a middleware — porque não há servidor sob nosso controle. Confirmação: *"You cannot set or override a Content-Security-Policy header on GitHub Pages"* [[1]].

Adicionalmente, a alternativa viável — `<meta http-equiv="Content-Security-Policy">` — é **estritamente menos capaz** que o header [[3]]:

| Diretiva | Funciona em `<meta>`? |
|---|---|
| `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `object-src`, `base-uri`, `form-action`, `media-src`, `worker-src`, `upgrade-insecure-requests` | ✅ Sim |
| `frame-ancestors` | ❌ **Ignorada** |
| `report-uri` / `report-to` | ❌ **Ignorada** |
| `sandbox` | ❌ **Ignorada** |
| `Content-Security-Policy-Report-Only` | ❌ **Proibida pela spec CSP3** [[4]] |

E `<meta http-equiv>` só é válido para `Content-Security-Policy`, `Content-Type` e poucos outros — **não** para `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`, `Strict-Transport-Security` ou `Referrer-Policy` (este último usa `<meta name="referrer">`, mecanismo distinto) [[7]][[8]].

Manter no contrato uma instrução fisicamente impossível produziria **falsa sensação de segurança** — o pior resultado possível em um projeto de consultoria de QA.

## Decisão

### D1 — CSP via `<meta http-equiv>`, única e exclusivamente
Implementada em `BaseLayout.astro` (`SPEC-008`). Diretivas `frame-ancestors`, `report-uri`, `report-to` e `sandbox` são **omitidas conscientemente** (não geram efeito; sua presença seria documentação enganosa).

### D2 — `Referrer-Policy` via mecanismo correto
`<meta name="referrer" content="strict-origin-when-cross-origin">`. É o único header-like realmente entregável além do CSP.

### D3 — HSTS e HTTPS: delegados à plataforma
`github.io` é servido com HTTPS e HSTS pela edge do GitHub, condicionada à ativação de **Settings → Pages → Enforce HTTPS**. A ativação é item obrigatório do checklist pré-launch (`SPEC-008 §Checklist`). Verificação: `curl -sI https://<site> | grep -i strict-transport-security`.

### D4 — `nosniff`, `X-Frame-Options`, `Permissions-Policy`: risco residual aceito
Movidos para `SDD-CONTEXT §8` como **RRR-01/02/03**. Justificativa de aceite: o site é **estático, sem autenticação, sem formulários, sem transações, sem dados sensíveis e sem estado mutável**. Não há ação privilegiada a ser sequestrada por clickjacking; não há tipo de conteúdo ambíguo a ser interpretado como script; não há API sensível de navegador em uso. O risco real é **baixo** e a mitigação compensatória é **arquitetural** (ausência de superfície atacável), não um header.

### D5 — Compensação por gate de teste, não por header
Como não há telemetria de violação de CSP (RRR-04), a violação é detectada **antes** do deploy: todo teste Playwright em toda rota do Critical Path falha se `console.error` ou `pageerror` contiver `Content Security Policy` ou `Refused to`. Implementado em `tests/helpers/csp-guard.ts` e importado por toda suite.

### D6 — Saída estruturada: `RFC-002` (DEFERIDO)
Colocar **Cloudflare Free** na frente do GitHub Pages resolve RRR-01/02/03/04 simultaneamente (Transform Rules injetam todos os headers) e adiciona DDoS protection + cache de borda, a custo R$ 0,00.
**Status: DEFERIDO.** Exige **Bypass Protocol** completo, pois viola `§C4` (lock-in de edge proprietário) e `§C2` (introduz dependência de terceiro).
Pilares pré-preenchidos para avaliação futura:
1. **Força maior:** aceitável apenas se RRR-01 escalar (ex.: site passar a ter área logada, formulário com PII, ou área de cliente).
2. **Rota FOSS:** inexistente para edge gerenciado gratuito. Alternativa FOSS = self-host de Caddy/Traefik com certificado ACME — mas isso viola `§C1`/`§C2` (infra própria paga).
3. **Prazo:** revisão em 2027-01-16 ou imediatamente após introdução de qualquer superfície autenticada.

### D7 — Correção contratual permanente
Fica registrado que o contrato de `integrations-security` deve ser lido, para este projeto, com a derrogação de `SDD-CONTEXT §7`. O agente **não** deve propor headers HTTP, middleware Astro, `_headers`, `netlify.toml` ou qualquer mecanismo de resposta. Deve propor: CSP-meta, referrer-meta, SRI, allowlist de connect-src, prevenção de vazamento de secret, checklist pré-launch.

## Consequências
✅ Elimina classe inteira de artefato inútil e de falsa segurança.
✅ Postura de segurança real e auditável, com riscos nomeados e aceitos conscientemente — o que é, em si, um diferencial de credibilidade para uma consultoria de QA.
⚠️ RRR-01..04 permanecem abertos até `RFC-002` ser aprovado. Aceito pela natureza não-transacional do site.

## Alternativas Rejeitadas
| Alternativa | Motivo |
|---|---|
| Manter a instrução de headers no contrato | Produz artefato inexecutável + falsa segurança. Viola Fail-Closed. |
| Cloudflare Free imediato | Viola `§C4` sem Bypass aprovado. Lock-in prematuro para site sem superfície sensível. |
| Trocar de host (Netlify/Cloudflare Pages) | Viola `§C2` (canal único de deploy) e a premissa explícita do cliente de aderência ao GitHub Pages. |
| Service Worker para interceptar respostas | Não controla headers de resposta do próprio documento; não resolve `frame-ancestors`. Complexidade alta, ganho nulo. |
| CSP Report-Only em meta | Proibido pela spec CSP3 [[4]]. |

## Referências
[1] GitHub Community Discussion #49832 — *"Content Security Policy setting"*: "You cannot set or override a Content-Security-Policy header on GitHub Pages" · [3] dev.to — *How to set CSP with a meta tag* (2026): "they are not equivalent" · [4] w3c/webappsec-csp#277 — *CSP 3 spec does not allow Report-Only in meta tags* · [7] MDN — `<meta http-equiv>` · [8] isaacsmith.us — *Adding a CSP to Your GitHub Pages Site* · [10] rviscomi.dev — *You probably don't need http-equiv meta tags* · W3C CSP Level 3 §2.1 (meta element) · OWASP ASVS v4.0.3 §V14 (Config).
