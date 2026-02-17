# Project Documentation Setup

How to create and maintain project docs for Deriverse. Use kebab-case filenames in `Documents/`.

## Core docs to include
- **ai-working-context.md**: Meta-instructions for AI/agents; must-read before coding.
- **process.md**: Workflow, Conventional Commits, agent skills, verification steps.
- **task.md**: Active task tracker; update on start/finish of subtasks.
- **architecture.md**: System overview (Next.js + Supabase + Solana), folder layout, data modes.
- **backend.md**: Backend/on-chain data flow notes; cross-check with actual services (Supabase/Helius/Deriverse).
- **frontend-uiux.md** / **design-uiux.md**: UI aesthetic, tokens, typography scale, component guidelines.
- **api-structure.md**: Service patterns (mock data, annotation storage, planned external services).
- **database.md**: Supabase schemas, caching rules, persistence strategy.
- **multi-wallet-discussion.md**: Wallet-centric vs user-centric tradeoffs.
- **product-prd.md**: Vision, core features, roadmap seeds.
- **deployment.md**: Vercel/Node setup, env vars.
- **testing.md**: Testing strategy (manual dev check, Agentation, unit tests).

## Naming & organization
- Use **kebab-case** filenames (e.g., `design-uiux.md`).
- Keep docs in `Documents/`; group subfolders only if scope grows.
- Add new docs to `document-index.md` with purpose + importance.

## What each doc should contain
- **Purpose**: Why this doc exists; when to read it.
- **Scope & owners**: Areas covered; who maintains (if applicable).
- **How-to**: Steps, commands, or patterns to follow.
- **Dependencies/links**: Pointers to related files (code paths, other docs).
- **Update rules**: When to refresh (e.g., after schema change, UI refresh).

## Reusable sections (copy/paste templates)
- **Conventional Commits** (from `process.md`): `<type>(optional scope): <short description>`; enforced.
- **Agent skills** (from `process.md`): `react-patterns`, `typescript-expert`, `api-security-best-practices`, `test-driven-development`, `find-bugs`, `vercel-deployment`.
- **UI tokens/typography** (from `design-uiux.md`): Geist Mono, heading/copy/label scales, premium vibrant dark theme.
- **Persistence schemas** (from `database.md`): `user_wallets`, planned `trades`, `trade_annotations`.
- **Architecture map** (from `architecture.md` / `ascii-app-structure.md`): Next.js App Router, TabNavigation, services, Supabase.

## Impact on development
- Accurate docs reduce rework and ensure features follow the intended architecture, UI, and data model.
- Indexed docs speed onboarding and keep agents aligned with skills/workflow rules.
- Schema/UI updates must be mirrored in docs to prevent stale guidance.

## Checklist when adding a new doc
- [ ] Use kebab-case filename in `Documents/`.
- [ ] State purpose/scope and when to read it.
- [ ] Link to related code/docs.
- [ ] Add to `document-index.md` with purpose + importance.
- [ ] Note triggers for future updates (e.g., after API or schema change).
