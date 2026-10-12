# ADR-000: Language Policy for the SDD Ecosystem

## Status
**ACCEPTED** — Foundational ADR. Supersedes any conflicting language convention.

## Context
The project is a greenfield B2B IT consultancy website built on Astro + Tailwind + GitHub Pages, orchestrated by a local SDD agent ecosystem (8 specialized agents). The team operates in Brazilian Portuguese for business context but consumes global technical documentation (Astro, Tailwind, GitHub, MDN, OWASP) written in English.

Three tensions had to be resolved:
1. **Token economy** — Local LLMs (Qwen 2.5/3, Llama 3.1+) consume ~30% fewer tokens when reasoning in English on technical tasks.
2. **Semantic precision** — Technical terms (`Content Security Policy`, `OIDC`, `View Transitions`, `Content Collections`) have canonical English forms; translations introduce ambiguity.
3. **Business nuance** — B2B copy for the Brazilian market (CTOs, IT Directors) requires Portuguese to preserve cultural and regulatory context (LGPD, "nota fiscal", local procurement language).

A binary choice (all-English or all-Portuguese) would either waste tokens and lose precision, or destroy business nuance and portability.

## Decision
Adopt a **stratified language policy** where the language is chosen per abstraction layer, not per file.

### Layer 1 — Agent Bodies (System Prompts in `.opencode/agents/`)
| Agent Type | Language | Rationale |
|---|---|---|
| Technical agents (`architect-sdd`, `frontend-astro`, `integrations-security`, `devops-platform`, `qa-shiftleft`, `reviewer-gatekeeper`) | **English** | Token efficiency, alignment with upstream docs, portability across LLM providers. |
| Business-oriented agents (`spec-engineer`, `content-strategist`) | **Portuguese (pt-br)** | Preserves B2B nuance for the Brazilian market. Output artifacts (specs, RFCs, frontmatter) still in English. |

### Layer 2 — Specification Artifacts (`.ai/specs/`)
| Artifact | Language |
|---|---|
| `adr-*.md`, `rfc-*.md`, `features/*.feature`, `handoffs/*.md` | **English** |
| `prd-*.md`, `copy-brief-*.md` | **Portuguese (pt-br)** |

### Layer 3 — Source Code (mandatory English, no exceptions)
- Variables, functions, components → `camelCase` in English
- File paths → `kebab-case` in English
- Commits → Conventional Commits in English (`feat:`, `fix:`, `docs:`, `refactor:`)
- PRs, issues, branch names → English
- JSDoc/TSDoc and inline comments → English

### Layer 4 — Public Content (site, blog, copy)
- Pages, blog posts, meta descriptions → **Portuguese (pt-br)** (target audience)
- Schema.org JSON-LD → English (technical standard)
- Future: Astro `i18n` routing if international demand materializes

### Layer 5 — Code Comments
- All comments, TODOs, and documentation strings → **English**

## Consequences

### Positive
- **~25% token savings** on technical agent interactions (critical for local LLMs with 32k context windows).
- **Zero translation drift** between agent reasoning and upstream documentation.
- **Portability** — agent prompts survive LLM migration (Qwen ↔ Llama ↔ Mistral) without rewrite.
- **Professional codebase** — aligns with international open-source conventions.
- **Business nuance preserved** where it economically matters (Brazilian B2B copy).

### Negative
- **Cognitive switching cost** for a solo Portuguese-speaking founder — mitigated by the clear layer boundaries.
- **Initial setup overhead** — one-time cost, already absorbed by this ADR.

### Risks
- **Risk:** Agent accidentally outputs code identifiers in Portuguese.
  - **Mitigation:** `reviewer-gatekeeper` rejects PRs violating Layer 3. CI regex scan for Portuguese characters in `src/` (future enhancement by `devops-platform`).
- **Risk:** Business requirements in Portuguese leak into technical specs.
  - **Mitigation:** `spec-engineer` is trained to translate business intent into English Gherkin; `reviewer-gatekeeper` enforces it.

## Compliance
Every agent MUST include a `## Language Policy` section in its guardrails referencing this ADR. The `reviewer-gatekeeper` agent is the enforcement point.

## References
- [Astro Documentation](https://docs.astro.build/) — English canonical source
- [Conventional Commits](https://www.conventionalcommits.org/) — v1.0.0
- [MDN Web Docs](https://developer.mozilla.org/) — English canonical source
- OWASP Cheat Sheet Series — English canonical source
