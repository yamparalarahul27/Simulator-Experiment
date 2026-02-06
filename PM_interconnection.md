# PM Interconnection

## Role of Product Management
In this project, PM functions are often handled by the **User (Founder)** interacting with the **AI Agent**. This document bridges the gap between requirements and technical execution.

## Communication Protocol
1.  **Requirement Gathering**:
    - Requests come via chat or `task.md` updates.
    - AI must clarify ambiguities *before* implementation (using `brainstorming` skill if needed).
    - See `Founder_Features.md` for the "North Star" vision.
2.  **Tracking**:
    - `task.md` is the single source of truth for "What is being worked on?".
    - Progress updates should be frequent and granular.

## Domain Logic & Terminology
- **Spot**: Instant trade settlement.
- **Perp (Perpetual Futures)**: Derivative contracts without expiry.
- **Client ID**: Unique identifier for a trading account/sub-account.
- **Instrument**: The asset pair being traded (e.g., SOL-PERP).

## Decision Making
- **Technical Decisions**: Document in `Architecture Decision Records` (if complex) or simply in `Backend.md`/`Frontend_UIUX.md`.
- **Product Decisions**: Confirm with User before major UI changes (unless instructed to be "Proactive").
