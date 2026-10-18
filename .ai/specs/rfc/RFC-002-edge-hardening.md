# RFC-002 — Edge Hardening via CDN (DEFERIDO)

**ID:** RFC-002 · **Status:** 🟡 **DEFERRED** — exige Bypass Protocol aprovado · **Aberto:** 2026-10-16
**Reavaliação:** 2027-01-16 OU imediatamente após introdução de qualquer superfície autenticada/formulário/PII

## 1. Motivation
`ADR-002` documenta que o GitHub Pages não entrega headers HTTP customizados. Consequentemente RRR-01 (`frame-ancestors`), RRR-02 (`nosniff`), RRR-03 (`Permissions-Policy`) e RRR-04 (CSP reporting) permanecem **abertos e sem mitigação técnica direta**. Uma CDN em frente ao Pages resolve os quatro simultaneamente e adiciona cache de borda (mitiga RRR-09, banda).

## 2. Technical Design (proposto, não aprovado)
Cloudflare Free → CNAME do domínio próprio → origin = GitHub Pages (restrito por IP/header) → Transform Rules injetam:
```
Content-Security-Policy: <política de SPEC-008 + frame-ancestors 'none'>
Content-Security-Policy-Report-Only: <shadow policy> ; report-to csp-endpoint
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
Requer domínio próprio (RRR-08 resolvido no mesmo movimento).

## 3. Security
Ganho real e mensurável. Risco: o edge passa a ver 100 % do tráfego (novo processador de dados sob LGPD ⇒ exige DPA e atualização de `/privacidade`). Risco de lock-in de DNS.

## 4. Failure Modes
| # | Falha | Impacto | Mitigação |
|---|---|---|---|
| FM-01 | Cloudflare fora do ar | site indisponível (origin direto também funciona se DNS permitir) | health check + runbook de fallback DNS |
| FM-02 | Transform Rule mal escrita | CSP quebra o site inteiro | Report-Only por 7 dias antes de enforce |
| FM-03 | Cache de borda serve versão stale | deploy "não aparece" | purge automático via API no fim do `deploy.yml` (requer secret ⇒ viola estado atual de zero-secret) |
| FM-04 | IP do origin exposto | bypass da CDN | restrição por header secreto + firewall do Pages (não disponível) ⇒ risco residual |
| FM-05 | Novo processador LGPD sem DPA | não-conformidade | DPA assinado ANTES do cutover; atualização de `/privacidade` |

## 5. Bypass Protocol — Pilares
1. **Força maior:** ❌ **NÃO SATISFEITO HOJE.** O site é estático, sem autenticação, sem formulário, sem PII, sem estado. O risco real de clickjacking/MIME-sniffing é baixo (`ADR-002 D4`). → **Bypass recusado por `nexus-prime` nesta data.**
2. **Rota FOSS:** ⚠️ Parcial. Não existe edge gerenciado FOSS gratuito. Alternativa FOSS = self-host Caddy/Traefik com ACME (Let's Encrypt) em VPS — custo ~US$ 5/mês ⇒ viola `§C2`. Segunda alternativa FOSS pura: aceitar RRR-01..04 (estado atual).
3. **Prazo:** ✅ Reavaliação 2027-01-16.

**Veredito atual: 🔴 RECUSADO — pilar 1 não satisfeito.** Reabrir se qualquer gatilho da seção "Reavaliação" ocorrer.

## 6. FOSS Exit
Se aprovado: saída = remover CNAME, restaurar DNS para `*.github.io`, remover Transform Rules. Custo de saída: ~1 h. Aceitável.

## 7. Alternativas Rejeitadas
| Alternativa | Motivo |
|---|---|
| Manter RRR abertos indefinidamente sem revisão | Viola governança; esta RFC existe para forçar reavaliação datada |
| Vercel/Netlify como host primário | Viola `§C2` (canal único) e premissa explícita do cliente |
| `_headers` no repo | Silenciosamente ignorado pelo GitHub Pages ⇒ falsa segurança |
| Service Worker para sintetizar headers | Não controla headers do documento-raiz; não resolve `frame-ancestors` |
