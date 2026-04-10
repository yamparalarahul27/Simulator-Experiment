import type { OrderTypeDetail, OrderBookDetail } from '@/lib/types';

export const FALLBACK_ORDER_TYPE_DETAILS: Record<string, OrderTypeDetail> = {
    overview: {
        emoji: '📋',
        whenToUse: '',
        risk: '',
        example: '',
    },
    market: {
        emoji: '⚡',
        whenToUse: 'When you need immediate execution and price certainty is less important than speed.',
        risk: 'Slippage — you may get a worse price than expected in volatile markets.',
        example: 'SOL is crashing and you want to exit immediately. A market sell guarantees execution.',
    },
    limit: {
        emoji: '🎯',
        whenToUse: 'When you want to buy/sell at a specific price or better. You\'re willing to wait.',
        risk: 'Your order may never fill if the price doesn\'t reach your limit.',
        example: 'SOL is at $150. You set a limit buy at $140. If price drops to $140, your order fills.',
    },
    'stop-market': {
        emoji: '🛑',
        whenToUse: 'To protect against losses. Triggers a market order when price hits your stop.',
        risk: 'Slippage after trigger — fast-moving markets may fill at a worse price.',
        example: 'You\'re long SOL at $150. Set a stop-market at $140 to limit downside.',
    },
    'stop-limit': {
        emoji: '🔒',
        whenToUse: 'Like stop-market but with price control. Triggers a limit order instead.',
        risk: 'Order may not fill if price blows past your limit after triggering.',
        example: 'Stop at $140, limit at $139. Triggers at $140 but only fills at $139 or better.',
    },
    iceberg: {
        emoji: '🧊',
        whenToUse: 'For large orders — hides total size behind smaller visible portions.',
        risk: 'Slower execution. Other traders may detect the pattern.',
        example: 'Want to buy 1000 SOL but show only 100 at a time to avoid moving the market.',
    },
    twap: {
        emoji: '⏱️',
        whenToUse: 'To execute large orders over time, reducing market impact.',
        risk: 'Price may move against you during the execution window.',
        example: 'Split a 1000 SOL buy into 10 orders over 10 minutes — 100 SOL each.',
    },
    'trailing-stop': {
        emoji: '📈',
        whenToUse: 'To lock in profits as price moves in your favor. Stop follows the price.',
        risk: 'Whipsaws — a brief pullback can trigger your stop before the trend continues.',
        example: 'SOL at $150, trailing offset $10. Price rises to $170, stop moves to $160.',
    },
    oco: {
        emoji: '⚖️',
        whenToUse: 'To set both a take-profit and stop-loss simultaneously. One cancels the other.',
        risk: 'Complexity — misunderstanding the mechanics can lead to unexpected fills.',
        example: 'Long SOL at $150. TP limit at $170, SL stop at $140. Whichever hits first, the other cancels.',
    },
};

export const FALLBACK_ORDER_BOOK_DETAILS: Record<string, OrderBookDetail> = {
    overview: {
        emoji: '📋',
        sections: [],
    },
    'limit-vs-market': {
        emoji: '⚔️',
        sections: [
            {
                heading: 'The Battle',
                body: 'The Order Book is essentially a battle between Limit Orders and Market Orders. Limit Orders are passive — they wait on the board, establishing the liquidity and depth (the "walls" you see). Market Orders are aggressive — they immediately cross the spread and consume the waiting Limit Orders, causing the price to move.',
            },
            {
                heading: 'How Price Moves',
                body: 'A large market order will "eat through" multiple layers of passive limit liquidity. The more limit orders stacked at a price, the harder it is for a market order to push through it.',
            },
            {
                heading: 'Supply & Demand',
                body: 'Order books provide valuable insight into where real supply and demand are positioned. While most traders rely on technical analysis to mark support and resistance, the order book helps confirm whether actual orders are sitting at those levels. In some cases, major levels can be identified directly from the order book itself.',
            },
            {
                heading: 'Best Sources',
                body: 'For best results, focus on Binance Spot and Coinbase order books, as they hold the deepest and most reliable liquidity.',
            },
        ],
    },
    heatmap: {
        emoji: '🗺️',
        sections: [
            {
                heading: 'What is a Heatmap?',
                body: 'A heatmap visualizes the order book on the chart over time. Red lines represent large resting sell orders (sell walls), and green lines represent large resting buy orders (buy walls). It shows where big players might be trying to buy, sell, or trap price.',
            },
            {
                heading: 'How to Read It',
                body: 'Asks are always above price, bids are always below price — regardless of color scheme. Most platforms allow you to filter liquidity using a slider, helping you hide smaller market maker orders and focus only on large, meaningful levels. You can hover on lines to see exact order sizes.',
            },
            {
                heading: 'Real-World Example',
                body: 'On a heatmap you might see a massive bid at a key level on Binance Spot. Price repeatedly tests this zone but doesn\'t touch the wall — it bounces off wicks. This tells you the liquidity is strong: buyers are defending aggressively, absorbing selling pressure before price can reach the wall. Eventually, the pressure becomes too much for shorts. They start closing positions and price moves up.',
            },
            {
                heading: 'Spotting Reversals & Fakeouts',
                body: 'Heatmaps help spot potential reversals, fakeouts, or areas of high interest on the chart. When large limit orders suddenly appear very close to the current price — almost chasing it — this can be your signal to trade accordingly.',
            },
        ],
    },
    depth: {
        emoji: '📉',
        sections: [
            {
                heading: 'What is Depth?',
                body: 'Depth equals the liquidity visible in the order book. It shows you how many resting buy/sell orders are stacked at various price levels. Thick book = many orders = high liquidity = harder to move price. Thin book = fewer orders = low liquidity = easier to move price.',
            },
            {
                heading: 'Depth Delta Calculation',
                body: 'Depth shows how much passive supply (asks) and passive demand (bids) exists within a percentage range from the current price. For example: if within 0–10% range there are 550 bids and 350 asks, the depth delta is 550 − 350 = 200. This means 200 more bids than asks within the selected range.',
            },
            {
                heading: 'The Indicator',
                body: 'The Order Book Depth indicator compares passive demand (bids) vs passive supply (asks) and displays the difference as delta bars. Green bars = more bids than asks (positive delta). Red bars = more asks than bids (negative delta). You can choose the depth range in settings.',
            },
            {
                heading: 'Recommended Settings',
                body: 'Use 2.5% and 5% depth for smaller ranges (intraday), 10% for larger ranges (intra-week), and 25% depth as a strong signal for spotting major reversals in the BTC market. Keep in mind that order book depth is a lagging indicator — the market often needs time to react.',
            },
            {
                heading: 'Important Caveat',
                body: 'Order book depth delta doesn\'t predict direction — it shows liquidity imbalance. When analyzing wider ranges (e.g. 25% depth), price may consolidate for weeks or even a month while large positive or negative depth delta develops.',
            },
        ],
    },
    'depth-overlay': {
        emoji: '🎨',
        sections: [
            {
                heading: 'What is Depth Overlay?',
                body: 'The Order Book Depth Overlay is a chart indicator that takes the total volume of waiting limit orders (liquidity) and displays it directly around the current price candles. It measures the imbalance (Delta) between buy orders (Bids) and sell orders (Asks) within a specified percentage range.',
            },
            {
                heading: 'How to Read It',
                body: 'The result is plotted as dynamic colored bands. Green bands show heavy buy liquidity (potential support). Red bands show heavy sell liquidity (potential resistance). It gives you a real-time, visual confirmation of where the big liquidity walls are.',
            },
            {
                heading: 'Pairing with Depth Delta',
                body: 'You can pair the depth overlay with the order book depth delta indicator to spot reversals. When both indicators align — for example, green bands forming below price while depth delta turns positive — it provides stronger confirmation of a potential bottom.',
            },
        ],
    },
    'pro-tips': {
        emoji: '💡',
        sections: [
            {
                heading: 'Use Spot Order Books',
                body: 'Focus on Spot order books. They reflect real money and offer a cleaner view of genuine supply and demand. Binance Spot and Coinbase hold the deepest and most reliable liquidity.',
            },
            {
                heading: 'Avoid Perps for Heatmaps',
                body: 'The Binance Perpetuals (Perps) order book heatmap is often a mess. Massive orders with quantity above 1000 BTC are frequently placed and immediately canceled (spoofing) to manipulate the price. Do not rely on them.',
            },
            {
                heading: 'Spotting Chasing Orders',
                body: 'When actively monitoring an order book heatmap, you\'ll often spot tight consolidation followed by large limit orders suddenly appearing very close to the current price — almost as if they\'re chasing it. This can be your signal. For example, aggressive ask orders stacking up on Coinbase right above price can suppress upward movement, pressuring algos and retail traders to sell or short, pushing price lower.',
            },
            {
                heading: 'The 3D View',
                body: 'By combining the three tools — Depth, Heatmap, and Overlay — you gain a 3D view of the market. The order book is the purest form of supply and demand.',
            },
            {
                heading: 'Useful Tools',
                body: 'Recommended platforms for order book analysis: TRDR (trdr.io), Market Monkey Terminal (marketmonkeyterminal.com), Kiyotaka (kiyotaka.ai), TapeSurf (tapesurf.com).',
            },
        ],
    },
};
