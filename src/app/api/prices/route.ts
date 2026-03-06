import { NextResponse } from 'next/server';

const COINGECKO_IDS = 'solana,bitcoin,ethereum,jupiter-exchange-solana,bonk,ripple,pyth-network,jito-governance-token,dogwifhat,raydium';

const CG_TO_TOKEN: Record<string, string> = {
    'solana':                   'SOL',
    'bitcoin':                  'BTC',
    'ethereum':                 'ETH',
    'jupiter-exchange-solana':  'JUP',
    'bonk':                     'BONK',
    'ripple':                   'XRP',
    'pyth-network':             'PYTH',
    'jito-governance-token':    'JTO',
    'dogwifhat':                'WIF',
    'raydium':                  'RAY',
};

export async function GET() {
    try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd&include_24hr_change=true`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json({ error: 'upstream failed', status: res.status }, { status: 502 });
        }
        const data = await res.json();

        const prices: Record<string, { price: number; change: number }> = {};
        for (const [cgId, token] of Object.entries(CG_TO_TOKEN)) {
            if (data[cgId]) {
                prices[token] = {
                    price:  data[cgId].usd            ?? 0,
                    change: data[cgId].usd_24h_change ?? 0,
                };
            }
        }
        return NextResponse.json(prices);
    } catch (err) {
        return NextResponse.json({ error: 'fetch failed', detail: String(err) }, { status: 500 });
    }
}
