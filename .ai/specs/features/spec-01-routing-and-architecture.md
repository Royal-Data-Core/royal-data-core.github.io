@SPEC-001
Feature: Routing and Architecture
  As a DevOps engineer
  I want strict routing rules and directory structure
  To ensure maintainable, performant Astro project

  Scenario: Valid directory structure is enforced
    Given the project follows ADR-001 directory blueprint
    When checking for required directories
    Then src/, public/, .ai/ must exist with proper content

  Scenario: Invalid directory structure triggers build failure
    Given a missing required directory
    When running npm run build
    Then the build fails with clear error

  Scenario: Route restrictions are enforced
    Given a disallowed route pattern
    When accessing the route
    Then 404 error is returned

  Scenario: SEO metadata is injected
    Given a page with meta tags
    When rendered
    Then <head> contains Open Graph and JSON-LD