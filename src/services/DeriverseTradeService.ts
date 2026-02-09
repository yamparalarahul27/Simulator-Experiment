/**
 * Deriverse Trade Service
 * 
 * Fetch and map Deriverse on-chain trade history to dashboard Trade[].
 * Uses wallet transaction history + @deriverse/kit Engine.logsDecode to parse
 * spot and perpetual fills with PnL, fees, and prices.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { Engine } from '@deriverse/kit';
import type { LogMessage } from '@deriverse/kit';
import type { Trade } from '../lib/types';
import {
    PROGRAM_ID,
    DERIVERSE_VERSION,
    RPC_HTTP,
    PRICE_DECIMALS,
    ASSET_DECIMALS,
    QUOTE_DECIMALS,
    INSTRUMENT_ID_TO_SYMBOL
} from '../lib/constants';

let enginePromise: Promise<Engine> | null = null;

async function getEngine(): Promise<Engine> {
    if (enginePromise) return enginePromise;
    enginePromise = (async () => {
        const { createSolanaRpc, address } = await import('@solana/kit');
        const rpc = createSolanaRpc(RPC_HTTP);
        return new Engine(rpc, {
            programId: address(PROGRAM_ID),
            version: DERIVERSE_VERSION,
            uiNumbers: false,
        });
    })();
    return enginePromise;
}

function isProgramLog(line: string): boolean {
    return line.startsWith('Program data: ');
}

function parseTradesFromLogs(
    decoded: LogMessage[],
    txSignature: string,
    blockTime: number | null
): Trade[] {
    if (decoded.length === 0) return [];

    const orderIdToInstrId = new Map<number, number>();
    for (const msg of decoded) {
        const m = msg as { orderId?: number; instrId?: number };
        if (m.orderId != null && m.instrId != null) {
            orderIdToInstrId.set(m.orderId, m.instrId);
        }
    }

    const closedAt = blockTime ? new Date(blockTime * 1000) : new Date();
    const trades: Trade[] = [];

    for (const msg of decoded) {
        if ('orderId' in msg && 'qty' in msg && 'price' in msg && 'crncy' in msg && 'rebates' in msg && 'side' in msg) {
            const spot = msg as { orderId: number; side: number; qty: number; crncy: number; price: number; rebates: number };
            const instrId = orderIdToInstrId.get(spot.orderId) ?? 0;
            const symbol = INSTRUMENT_ID_TO_SYMBOL[instrId] ?? `Instr-${instrId}`;
            const qty = Number(spot.qty) / ASSET_DECIMALS;
            const price = Number(spot.price) / PRICE_DECIMALS;
            const notional = qty * price;
            const fee = (-Number(spot.rebates) || 0) / QUOTE_DECIMALS;
            trades.push({
                id: `${txSignature}-${spot.orderId}-spot`,
                symbol,
                quoteCurrency: 'USDC',
                side: spot.side === 0 ? 'buy' : 'sell',
                orderType: 'limit',
                quantity: qty,
                price,
                notional,
                pnl: 0,
                fee,
                feeCurrency: 'quote',
                openedAt: closedAt,
                closedAt,
                durationSeconds: 0,
                isWin: false,
                txSignature,
            });
        }
        if ('orderId' in msg && 'perps' in msg && 'price' in msg && 'crncy' in msg && 'rebates' in msg && 'side' in msg) {
            const perp = msg as { orderId: number; side: number; perps: number; crncy: number; price: number; rebates: number };
            const instrId = orderIdToInstrId.get(perp.orderId) ?? 0;
            const symbol = INSTRUMENT_ID_TO_SYMBOL[instrId] ?? `Instr-${instrId}`;
            const qty = Math.abs(Number(perp.perps)) / ASSET_DECIMALS;
            const price = Number(perp.price) / PRICE_DECIMALS;
            const notional = qty * price;
            const pnl = (Number(perp.crncy) || 0) / QUOTE_DECIMALS;
            const fee = (-Number(perp.rebates) || 0) / QUOTE_DECIMALS;
            trades.push({
                id: `${txSignature}-${perp.orderId}-perp`,
                symbol,
                quoteCurrency: 'USDC',
                side: perp.side === 0 ? 'long' : 'short',
                orderType: 'limit',
                quantity: qty,
                price,
                notional,
                pnl,
                fee,
                feeCurrency: 'quote',
                openedAt: closedAt,
                closedAt,
                durationSeconds: 0,
                isWin: pnl > 0,
                txSignature,
            });
        }
    }

    return trades;
}

export class DeriverseTradeService {
    async fetchTradesForWallet(
        connection: Connection,
        walletAddress: string
    ): Promise<Trade[]> {
        const engine = await getEngine();
        const allTrades: Trade[] = [];
        const limit = 1000;
        const batchSize = 5;
        const maxTxs = 100;
        const delayMs = 600;

        const pk = new PublicKey(walletAddress);
        console.log(`[Deriverse] Fetching tx history for ${walletAddress}...`);
        const result = await connection.getSignaturesForAddress(pk, { limit });
        console.log(`[Deriverse] Found ${result.length} transactions`);
        const signatures = result.map((s) => ({ signature: s.signature }));

        for (let i = 0; i < Math.min(signatures.length, maxTxs); i += batchSize) {
            if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
            const batch = signatures.slice(i, i + batchSize);
            const txs = await Promise.all(
                batch.map(({ signature }) =>
                    connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 })
                )
            );

            for (let j = 0; j < batch.length; j++) {
                const tx = txs[j];
                if (!tx?.meta?.logMessages?.some(isProgramLog)) continue;
                const programDataLogs = tx.meta.logMessages.filter(isProgramLog);
                console.log(`[Deriverse] Found ${programDataLogs.length} program logs in tx ${batch[j].signature.slice(0, 8)}...`);
                let decoded: LogMessage[];
                try {
                    decoded = engine.logsDecode(programDataLogs);
                    console.log(`[Deriverse] Decoded ${decoded.length} log messages`);
                } catch (err) {
                    console.warn(`[Deriverse] Failed to decode logs:`, err);
                    continue;
                }
                const blockTime = tx.blockTime ?? null;
                const parsed = parseTradesFromLogs(decoded, batch[j].signature, blockTime);
                if (parsed.length > 0) {
                    console.log(`[Deriverse] Parsed ${parsed.length} trades from tx ${batch[j].signature.slice(0, 8)}...`);
                    allTrades.push(...parsed);
                }
            }
        }

        allTrades.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
        console.log(`[Deriverse] Total trades found: ${allTrades.length}`);
        return allTrades;
    }
}
