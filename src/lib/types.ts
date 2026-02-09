/**
 * Shared type definitions for trading data
 */

export interface Trade {
    id: string;
    symbol: string;
    quoteCurrency: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    orderType: 'limit' | 'market';
    quantity: number;
    price: number;
    notional: number;
    pnl: number;
    fee: number;
    feeCurrency: string;
    openedAt: Date;
    closedAt: Date;
    durationSeconds: number;
    isWin: boolean;
    txSignature: string;
}
