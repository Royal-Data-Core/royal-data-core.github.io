# ADR-015 — Docker homologado como ferramenta instrumental (CONSTITUTION §C11):
# determinístico, versionado, NUNCA integra o artefato publicado (§C1 — o site
# publicado continua sendo HTML/CSS/JS estático servido pelo GitHub Pages).
#
# Multi-stage single file:
#   deps → shared npm layer (npm ci --ignore-scripts — ADR-001 D4 invariant)
#   dev  → astro dev com bind-mount (hot reload) — ambiente de desenvolvimento
#   qa   → artefato construído + bateria canônica completa — ambiente de QA
#
# Bases glibc (node:24-slim / playwright-noble): esbuild não distribui binário
# musl, portanto alpine é inviável (ver ADR-015 · Alternativas Rejeitadas).
# syntax=docker/dockerfile:1

# ADR-005 — Active LTS (§C11 runtime policy)
ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

# ── dev: servidor Astro com hot reload (docker compose up dev) ──────────
FROM deps AS dev
# §C7 — zero telemetry phone-home
ENV ASTRO_TELEMETRY_DISABLED=1
COPY . .
# Container roda como uid 1000 (node): node_modules deve pertencer a ele,
# senão o cache do vite (node_modules/.vite) falha com EACCES.
RUN chown -R node:node /app/node_modules
EXPOSE 4321
CMD ["npx", "astro", "dev", "--host", "0.0.0.0"]

# ── qa: artefato + bateria completa (docker compose run --rm qa) ────────
# Tag travada na versão do lockfile (@playwright/test 1.64.1): drift de
# browser-revision falha determinístico, nunca silencioso.
FROM mcr.microsoft.com/playwright:v1.64.1-noble AS qa
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1 \
    CI=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
COPY . .
# D-03 — canais de contato PÚBLICOS por design (mesmos valores de ci.yml;
# SEC-1 intacto — nenhum secret em imagem/repo).
ENV PUBLIC_CONTACT_EMAIL=royaldatacore@gmail.com \
    PUBLIC_CONTACT_PHONE=5516997148778
# Container roda como uid 1000 (pwuser): /app inteiro precisa ser gravável
# (vite cache em node_modules/.vite, .astro/, dist/, espelho .linkinator/).
RUN chown -R pwuser:pwuser /app
# Ordem = semântica da bateria canônica (RFC-001 §2.2): guard (shift-left,
# falha antes do build) → build + audit do artefato → verify (unit/e2e/a11y/links).
# LHCI permanece gate canônico de CI (ADR-015 D5 — não duplicado aqui).
CMD ["sh", "-c", "npm run test:guard && npm run build && npm run lint:security && npm run test:all"]
