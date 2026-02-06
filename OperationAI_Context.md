# Operation AI Context

## Purpose
This document serves as the **meta-instruction manual** for any AI agent (Antigravity, Claude, Cursor, etc.) operating on this codebase.

## Critical Instructions
1.  **Read Context First**: Before writing any code, ALWAYS read `Backend.md`, `Frontend_UIUX.md`, and `task.md`.
2.  **Use Skills**:
    - You have a library of installed skills in `~/.agent/skills/`.
    - **Prefer** using a skill over writing raw code from scratch if a proven pattern exists (e.g., use `api-security-best-practices` when modifying API routes).
3.  **Task Management**:
    - Update `task.md` whenever you start or finish a subtask.
    - Do not leave the task list stale.
4.  **Visual Feedback**:
    - If the user provides an `Agentation` markdown snippet (visual feedback), prioritize it above other tasks.
    - It contains precise DOM selectors that you should use to locate components.

## Knowledge Base
- **Solana**: Use `@deriverse/kit` patterns described in `Backend.md`.
- **UI**: Adhere strictly to the "Premium/Vibrant" aesthetic defined in `Frontend_UIUX.md`.
