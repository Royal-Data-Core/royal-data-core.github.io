## Test Plan: Feature X

### Objectives
1. Validate core user flows via E2E tests
2. Enforce performance budgets with Lighthouse
3. Ensure accessibility compliance
4. Cover critical logic with unit tests

### Test Scope
- Critical routes: /, /contact, /dashboard
- Key interactions: form submissions, navigation, data loading
- Performance metrics: LCP ≤2500ms, CLS ≤0.1
- Accessibility: 100% score

### Test Structure
- E2E: tests/e2e/feature.spec.ts
- A11Y: tests/a11y/feature.spec.ts
- Unit: src/utils/validator.test.ts
- Coverage: 80% threshold

### CI Integration
- Block deployment on test failures
- Run on PRs and main branch
- Monitor performance regression
- Generate accessibility reports