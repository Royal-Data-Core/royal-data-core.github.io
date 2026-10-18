# ADR-000 — Política de Idioma

**Status:** ACCEPTED · **Data:** 2026-10-16 · **Decisores:** Human + nexus-prime
**Enforcer:** `reviewer-gatekeeper` (rejeição automática)

## Contexto
O projeto mistura dois públicos: (a) máquina/ecossistema técnico global, (b) mercado B2B brasileiro. Sem política explícita, agentes produzem identificadores em português e copy em inglês, degradando manutenibilidade e conversão simultaneamente.

## Decisão
| Artefato | Idioma | Exemplo |
|---|---|---|
| Nomes de arquivo e diretório | **EN**, kebab-case | `services-b2b.astro` |
| Identificadores de código (var, fn, type, prop, const) | **EN**, camelCase/PascalCase | `formatPublishDate()` |
| `data-testid` | **EN**, kebab-case, prefixo por domínio | `contact-email-link` |
| Slugs de rota e de conteúdo | **EN** | `/blog/flaky-tests-root-cause` |
| Chaves de Content Collections e schemas Zod | **EN** | `publishDate`, `readingTime` |
| Commits (conventional commits) | **EN** | `feat(blog): add rss feed` |
| Branches | **EN** | `feature/spec-004-blog` |
| Nomes de CI jobs e steps | **EN** | `bundle-audit` |
| ADRs (títulos e corpo) | **EN** títulos / corpo **PT-BR** permitido | — |
| **Copy comercial visível ao usuário** | **PT-BR** | "Engenharia de qualidade para software crítico" |
| **Artigos de blog** | **PT-BR** (padrão) · EN admitido por post | — |
| `alt`, `aria-label`, `title` | **PT-BR** (idioma da página) | `alt="Foto de perfil"` |
| JSON-LD: **chaves** | **EN** (schema.org) | `@type`, `areaServed` |
| JSON-LD: **valores textuais** | **PT-BR** | `"description": "Consultoria em QA…"` |
| Comentários de código | **EN** | — |
| Logs de erro de build | **EN** | — |

## Consequências
✅ Ferramentas de lint/AST funcionam sem customização. ✅ SEO híbrido (URL EN indexa globalmente; conteúdo PT-BR ranqueia no Brasil). ✅ Contratação futura de dev internacional não exige refactor.
⚠️ Custo cognitivo de tradução para o autor. Mitigado por glossário em `SDD-CONTEXT §6`.

## Alternativas Rejeitadas
- **Tudo em PT-BR:** quebra `astro check`, ESLint naming conventions, e reduz alcance técnico do blog.
- **Tudo em EN:** destrói conversão B2B no mercado brasileiro (objetivo primário S1).
- **Detecção automática por agente:** não-determinístico. Viola Fail-Closed.
