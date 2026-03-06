# Re-branding Deriverse to YDEX (UI Text Only)

## Goal
Replace all user-facing instances of "Deriverse" with "YDEX" across the application, ensuring **zero impact** on codebase functionality.

**Strictly Preserving:**
- Component names (e.g., `DeriverseTradesTable.tsx`, `DeriverseWalletAsk.tsx`)
- Service class names (e.g., `DeriverseTradeService`)
- Constants and environment variables (`DERIVERSE_VERSION`)
- LocalStorage keys (`deriverse.userMode`, etc.)
- Custom events (`deriverse:set-active-tab`)

---

## Areas Identified for Safe Text Updates

Below is the definitive list of UI text strings that will be updated. Code logic boundaries are explicitly noted.

### 1. `src/components/features/TradeHistory.tsx`
This screen handles both "All Solana" trades and the specific platform trades. The tab label and empty states need updating.

- **Line 310:** `Deriverse Trades` → `YDEX Trades` (Tab label)
- **Line 350:** `Parsing Deriverse trades...` → `Parsing YDEX trades...` (Loading text)
- **Line 418:** `tx.type.includes('Deriverse')` → `tx.type.includes('YDEX')` (UI Tag label matching)
- **Line 473:** `🎯 Deriverse Trades: Parsed on-chain...` → `🎯 YDEX Trades: Parsed on-chain...` (Help text)

*Note: The internal state `activeTab === 'deriverse'` will remain unchanged to prevent breaking the tab state machine.*

### 2. `src/components/features/DeriverseTradesTable.tsx`
The table component that renders the specific platform trades.

- **Line 32:** `No Deriverse trades found for this address` → `No YDEX trades found for this address` (Empty state)
- **Line 100:** `Deriverse Trades` → `YDEX Trades` (Table Header)

### 3. `src/components/ui/DeriverseWalletAsk.tsx`
The onboarding modal shown on first load.

- **Line 125:** `'Login successful! Welcome back to Deriverse Journal.'` → `'Login successful! Welcome back to YDEX.'` (Toast message)
- **Line 157:** `'Welcome to Deriverse Journal! Your wallet...'` → `'Welcome to YDEX! Your wallet...'` (Toast message)

### 4. `src/components/features/RoadmapScreen.tsx`
The roadmap feature list.

- **Line 9:** `'Wallet lookup via Helius RPC + Deriverse on-chain parsing'` → `'Wallet lookup via Helius RPC + YDEX on-chain parsing'`

### 5. `src/components/features/AboutScreen.tsx`
The about page / info screen.

- **Line 92:** `...fetch trades via Helius RPC + Deriverse on-chain parsing.` → `...fetch trades via Helius RPC + YDEX on-chain parsing.`

### 6. `src/services/HeliusService.ts`
The service that parses Solana transactions. It assigns a UI "type" label to transactions based on the program ID.

- **Line 91:** `if (logs.includes(PROGRAM_ID)) return 'Deriverse';` → `if (logs.includes(PROGRAM_ID)) return 'YDEX';` (This ensures the UI badge in TradeHistory shows "YDEX").

### 7. `src/app/navbar-demo/page.tsx`
The internal UI demo page.

- **Line 30:** `logo={<span className="text-heading-20 text-white font-bold">Deriverse</span>}` → `logo={<span className="text-heading-20 text-white font-bold">YDEX</span>}`

---

## Action Plan
I will use targeted `sed` commands (or `replace_file_content` block-by-block replacements) to surgically update exactly these strings and nothing else. No broad `replace-all` command will be used, guaranteeing code stability.
