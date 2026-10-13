## Project Structure Analysis & Immediate Actions

### Current Structure Gaps
- Missing Astro Content Collections setup
- No CI/CD pipeline defined
- No form/analytics integration
- No ADRs for critical decisions
- No performance optimization baseline

### Immediate Actions for Beta Launch

1. **CI/CD Pipeline (GitHub Actions)**
   - Create `.github/workflows/deploy.yml`
   - Add build + deploy to GitHub Pages
   - Include Lighthouse audit step

2. **Astro Content Collections**
   - Create `/src/content/services` for service cards
   - Set up `/src/content/blog` with markdown files
   - Add `/src/content/team` for team members

3. **Performance Baseline**
   - Add `lighthouse-ci` for performance monitoring
   - Set Core Web Vitals thresholds
   - Include bundle size validation

4. **Form & Analytics**
   - Integrate Formspree for contact form
   - Add GoatCounter for analytics
   - Configure 404 page with form

5. **Critical ADRs**
   - ADR-001: Content Collection Strategy
   - ADR-002: CI/CD Pipeline Design
   - ADR-003: Form & Analytics Integration
   - ADR-004: Performance Optimization

### Missing Components
- [ ] DecapCMS configuration for content management
- [ ] Accessibility audit checklist
- [ ] SEO metadata templates
- [ ] Error handling patterns
- [ ] Feature flagging mechanism

### MCP Resource Requirements
- [ ] Content collections as MCP resources
- [ ] Formspree API endpoint
- [ ] GoatCounter tracking code
- [ ] GitHub Pages deployment config