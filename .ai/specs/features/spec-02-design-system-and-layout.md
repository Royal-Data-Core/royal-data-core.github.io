@SPEC-002
Feature: Design System and Layout
  As a frontend developer
  I want consistent design tokens and layout
  To maintain brand consistency and accessibility

  Scenario: Tailwind design tokens are configured
    Given the brand color palette
    When checking tailwind.config.ts
    Then colors, spacing, and typography match brand guidelines

  Scenario: BaseLayout implements SEO requirements
    Given a page with frontmatter
    When rendered
    Then <head> contains title, description, og:image, and JSON-LD

  Scenario: Layout slots are available
    Given a page using BaseLayout
    When checking template
    Then slots for title, description, and og:image exist

  Scenario: Accessibility standards are met
    Given the layout components
    When checked with axe-core
    Then no critical a11y violations exist