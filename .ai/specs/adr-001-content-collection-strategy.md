### ADR-001: Content Collection Strategy

**Context**
Astro Content Collections are required for structured data (blog posts, services, team members) to enable:
- Scalable content management
- SEO-friendly static generation
- Consistent data modeling
- Zero-cost deployment on GitHub Pages

**Decision**
Use Astro 4.x Content Collections as the primary mechanism for structured data, with:
- `/src/content/services` for service cards
- `/src/content/blog` for markdown posts
- `/src/content/team` for team member profiles

**Status**
Approved

**Consequences**
- Enables rapid content iteration without backend
- Ensures alignment with SSG principles
- Provides a clear path for future CMS integration
- Avoids over-engineering with custom APIs

**Compliance**
- Follows ADR-000 (Language Policy)
- Aligns with SSG-first architecture
- Validates bundle size impact (Astro core + content collections < 500KB)
- Meets Core Web Vitals requirements via static rendering