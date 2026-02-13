# Development Process

## Workflow
1.  **Task Management**: Follow the items in `task.md`.
2.  **Branching**:
    - `main`: Production-ready code.
    - Feature branches: Created for new tasks (e.g., `feature/analytics-dashboard`).
3.  **Commits**:
    - Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for every commit (e.g., `feat(auth): add MFA enrollment`, `fix(trades): handle null pnl`).
    - Required structure: `<type>(optional scope): <short description>`.
    - Accepted types include (but are not limited to): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
    - These rules are enforced via automated checks during `git commit` and on push; see repository root configuration for details.

## Agentic Workflow (The "Antigravity" Way)
1.  **Planning**: Always start with a plan (use `implementation_plan.md` for complex tasks).
2.  **Execution**: Use available skills (e.g., `react-patterns`, `typescript-expert`).
3.  **Verification**:
    - Manual: Run `npm run dev` and check the UI.
    - Automated: Run tests (see `Testing.md`).
    - Feedback: Use `Agentation` to annotate issues visually and feed them back into the task.

## Documentation
- Update `Backend.md` or `Frontend_UIUX.md` if architectural changes are made.
- Keep `task.md` updated as the source of truth for progress.

## Wallet Connectivity Track
- **Dependency baseline**: `@jup-ag/wallet-adapter` replaces the legacy `@solana/wallet-adapter-*` packages. Reinstalling dependencies will only pull the Jupiter bundle (~30 KB gzipped) to keep Lookup lightweight.
- **Provider shell**: `src/app/providers.tsx` lazy-loads `UnifiedWalletProvider` client-side to avoid SSR hydration issues while making wallet context available globally.
- **Cluster config**: `src/lib/constants.ts` now defines `SupportedCluster` (`devnet`, `mainnet-beta`) plus `WALLET_CLUSTER_CONFIG` and `DEFAULT_WALLET_CLUSTER` driven by env vars. This keeps wallet connections scoped to those two RPC endpoints until UI wiring is in place.
- **Next steps**: expose a hook to fetch `publicKey` and wire Lookup’s “Connect Wallet” button. Until then, user-facing behavior is unchanged.
