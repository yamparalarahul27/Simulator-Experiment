'use client';

/**
 * MockDataBanner Component
 * 
 * Displays an informational banner on Dashboard and Journal screens to inform users
 * that they are viewing mock/sample data. Includes a call-to-action to fetch real trades.
 * 
 * USAGE:
 * - Place at the top of Dashboard and Journal screens
 * - Shows when network is set to "On Mock Data"
 * - Guides users to Wallet lookup to fetch real trades
 */

interface MockDataBannerProps {
    /** Callback when user clicks "Fetch Real Trades" button */
    onFetchTrades?: () => void;
    /** Optional custom message */
    message?: string;
}

export const MockDataBanner = ({
    onFetchTrades,
    message = "You are viewing sample data. To see your real trading analytics, fetch your trades from the blockchain."
}: MockDataBannerProps) => {
    return (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-none backdrop-blur-sm">
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    <svg
                        className="w-5 h-5 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-500 mb-1">
                        📊 Mock Data Mode
                    </h3>
                    <p className="text-sm text-white/70 mb-3">
                        {message}
                    </p>

                    {/* CTA Button */}
                    {onFetchTrades && (
                        <button
                            onClick={onFetchTrades}
                            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-none text-sm font-medium text-yellow-500 transition-all duration-300"
                        >
                            → Go to Wallet Lookup
                        </button>
                    )}
                </div>

                {/* Network Indicator */}
                <div className="flex-shrink-0">
                    <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                        <span className="text-xs font-mono text-yellow-500 uppercase">
                            Mock Data
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockDataBanner;
