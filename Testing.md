# Testing Strategy

## Overview
Reliability is critical for a financial application. This project uses a mix of manual, automated, and visual testing.

## Testing Layers

### 1. Manual Verification
- **Visual Check**: Run `npm run dev`.
- **Agentation**: Use the on-screen overlay to flag UI glitches or logic errors immediately.

### 2. End-to-End (E2E) Testing
- **Tool**: Playwright.
- **Scope**: Critical user flows (Wallet connection, Trade history fetch).
- **Run**: `npx playwright test`.

### 3. Unit Testing
- **Tool**: Jest / React Testing Library (if configured).
- **Scope**: Complex utility functions (e.g., `DeriverseService` helper methods).

## Testing Skills
- Use `test-driven-development` skill when implementing complex logic.
- Use `e2e-testing-patterns` when writing new Playwright tests.
- Use `find-bugs` skill to proactively scan for issues.

## CI/CD Integration
- Tests should ideally pass before `Deployment` (see `Deployment.md`).
