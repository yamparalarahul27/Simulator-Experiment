/**
 * Centralized tooltip content for all dashboard components
 * Edit this file to update info tooltip descriptions across the application
 */

export const COMPONENT_INFO = {
    // Main Cards
    pnlCard: "Displays your total profit/loss across all trades for the selected time period. The percentage shows the change compared to the previous period. The chart visualizes your daily PnL performance.",

    // Stats Row Cards
    winRate: "Percentage of winning trades versus total trades. Shows the number of wins and losses in the selected time period. A higher win rate indicates more profitable trading decisions.",

    avgWin: "Average profit per winning trade in the selected time period. This metric helps you understand the average size of your winners, which is key to maintaining a positive risk/reward ratio.",

    tradeStreak: "Shows your trading activity over the last 7 days. Fire emoji (🔥) represents active trading days, gray circle (⚫) represents inactive days. Displays the count of active days out of 7.",

    // Metrics Grid Cards
    feeDistribution: "Breakdown of your trading fees by category. Shows the distribution between Protocol fees (Maker/Taker) and Network fees. Helps you understand where your trading costs are allocated.",

    tradingVolume: "Total notional value of all your trades in the selected time period. This represents the sum of all position sizes (quantity × price) across all trades.",

    longShortRatio: "Distribution of long versus short positions from your perpetual trades. Green shows the percentage of long positions, red shows short positions. Helps you understand your directional bias.",

    // Table
    transactionTable: "Complete list of your recent trades with detailed information including pair, side, type, quantity, price, notional value, PnL, fees, and more. Click column headers to sort.",
} as const;

export type ComponentInfoKey = keyof typeof COMPONENT_INFO;
