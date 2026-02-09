/**
 * Fetch and map Deriverse on-chain trade history to dashboard Trade[].
 * Uses wallet tx history + @deriverse/kit Engine.logsDecode.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { Engine } from '@deriverse/kit';
import type { LogMessage } from '@deriverse/kit';
import type { Trade } from '../lib/types';

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
const VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION ?? '12', 10);
const RPC_HTTP = process.env.NEXT_PUBLIC_RPC_HTTP ?? 'https://devnet.helius-rpc.com/?api-key=REMOVED';

/** Devnet instrument id -> display symbol (e.g. SOL-USDC). Extend as more instruments are known. */
const INSTR_ID_TO_SYMBOL: Record<number, string> = {
    0: 'SOL-USDC',
};

/** Deriverse chain decimals: price uses 1e9, asset (e.g. SOL) 1e9, quote (e.g. USDC) 1e6 */
const PRICE_DEC = 1e9;
const ASSET_DEC = 1e9;
const QUOTE_DEC = 1e6;

let enginePromise: Promise<Engine> | null = null;

async function getEngine(): Promise<Engine> {
    if (enginePromise) return enginePromise;
    enginePromise = (async () => {
        const { createSolanaRpc, address } = await import('@solana/kit');
        const rpc = createSolanaRpc(RPC_HTTP);
        return new Engine(rpc, {
            programId: address(PROGRAM_ID),
            version: VERSION,
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
            const symbol = INSTR_ID_TO_SYMBOL[instrId] ?? `Instr-${instrId}`;
            const qty = Number(spot.qty) / ASSET_DEC;
            const price = Number(spot.price) / PRICE_DEC;
            const notional = qty * price;
            const fee = (-Number(spot.rebates) || 0) / QUOTE_DEC;
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
            const symbol = INSTR_ID_TO_SYMBOL[instrId] ?? `Instr-${instrId}`;
            const qty = Math.abs(Number(perp.perps)) / ASSET_DEC;
            const price = Number(perp.price) / PRICE_DEC;
            const notional = qty * price;
            const pnl = (Number(perp.crncy) || 0) / QUOTE_DEC;
            const fee = (-Number(perp.rebates) || 0) / QUOTE_DEC;
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
