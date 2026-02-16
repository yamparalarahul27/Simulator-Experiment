# Calculation Logic

Summary of how trading metrics are derived across the app. For each metric: inputs (from Trade data), where used, how calculated, and interpretation / scoring notes.

## Inputs from Trade transactions (`Trade` type)
- `side` (`buy`/`sell`/`long`/`short`) — used for directional ratios.
- `quantity`, `price`, `notional` — sizing / volume.
- `pnl` — profit/loss per trade.
- `fee`, `feeBreakdown`, `isMaker` — fee totals and maker/taker split.
- `openedAt`, `closedAt` — date filtering, streaks.
- `isWin` — win/loss classification.
- `leverage` (optional) — risk appetite signals.

## Metrics & Calculations
- **Win Rate / Wins / Losses** (`calculateWinRate` @src/lib/tradeFilters.ts):
  - Inputs: `isWin` per trade.
  - Calculation: `wins = count(isWin)`, `losses = total - wins`, `winRate = wins / total * 100 (1 decimal)`; empty set returns 0.
  - Used in: StatsRow, Home cards.
  - Interpretation: Higher win rate indicates consistency; low win rate suggests strategy review.

- **Average Win / Average Loss** (`calculateAvgWin`, `calculateAvgLoss` @tradeFilters.ts):
  - Inputs: `pnl`, filtered by `isWin` or `pnl < 0`.
  - Calculation: mean PnL of winning trades; mean PnL of losing trades (returns 0 if none).
  - Used in: StatsRow, Home cards.
  - Interpretation: Balance between avg win and avg loss shows risk/reward; large avg loss vs win implies poor risk control.

- **Trading Volume** (`calculateTradingVolume` @tradeFilters.ts):
  - Inputs: `notional`.
  - Calculation: sum of `notional` across trades.
  - Used in: Home (fee/volume analytics).
  - Interpretation: Measures capital throughput; spikes may imply overtrading.

- **Long/Short Ratio** (`calculateLongShortRatio` @tradeFilters.ts):
  - Inputs: `side` (only `long`/`short`).
  - Calculation: counts longs vs shorts; outputs percentages; defaults to 50/50 when none.
  - Used in: Home charts.
  - Interpretation: Heavy bias (>70% one side) can mean directional risk concentration.

- **Fee Breakdown & Composition** (`calculateFeeBreakdown` @src/lib/mockData.ts):
  - Inputs: `feeBreakdown` array and `isMaker` flag per trade.
  - Calculation: sums protocol maker, protocol taker, network fees; percent of total per bucket.
  - Used in: Home fee distribution.
  - Interpretation: High taker/network share indicates costly execution; track to reduce slippage/fees.

- **Average Leverage** (`calculateAverageLeverage` @mockData.ts):
  - Inputs: `leverage` (perp trades only).
  - Calculation: average leverage over trades with leverage; returns 1 if none.
  - Interpretation: Higher average leverage signals elevated risk appetite.

- **Leverage vs Win Rate** (`calculateLeverageVsWinRate` @mockData.ts):
  - Inputs: `leverage`, `isWin`.
  - Calculation: buckets by leverage; per-bucket win rate and trade count.
  - Interpretation: Detects whether performance degrades at higher leverage.

- **Percent Change** (`calculatePercentChange` @tradeFilters.ts):
  - Inputs: current value, previous value.
  - Calculation: `(current - previous) / |previous| * 100` with sign; handles previous=0 with ±100%.
  - Interpretation: Generic delta for KPIs.

- **Journal Streak (21-day)** (`calculateJournalStreak` @tradeFilters.ts):
  - Inputs: `closedAt`, annotations map.
  - Calculation: For last 21 days, marks a day true if any trade that day has an annotation.
  - Interpretation: Measures journaling consistency.

- **Date & Pair Filtering** (`filterTradesByDate` and selections in Home.tsx):
  - Inputs: `closedAt`, selected pairs, preset ranges.
  - Effect: All above metrics computed on the filtered subset.

## Scoring / Behavior Signals (examples)
- **Leverage concentration (greed signal)**: If >80% of leveraged trades use ≥10x, flag as “greed-prone” — indicates excessive risk concentration.
- **Directional bias**: Long or short >70% suggests overexposure to one market regime.
- **Win/loss balance**: Avg loss magnitude materially larger than avg win with low win rate implies poor R:R discipline.
- **Fee mix**: High taker/network % signals inefficient routing/execution.
- **Streak gaps**: Sparse journal streak indicates inconsistent review habits.

## Where displayed
- **Home**: Win rate, avg win/loss, long/short ratio, fee composition, volume, leverage analytics; respects date/pair filters.
- **StatsRow**: Win rate, wins/losses, avg win, avg loss (using active filter or supplied trades).
- **Journal**: Streak card uses annotation streak; empty-state messaging uses trade presence.
