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
        <div className="mb- p-2 bg-[var(--bs-card)] rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-yellow-500 mb-1">
                        Mock Data Mode Active
                    </h3>
                    <p className="text-sm text-[var(--bs-text-secondary)]">
                        {message}
                    </p>
                </div>

                {/* CTA Button */}
                {onFetchTrades && (
                    <button
                        onClick={onFetchTrades}
                        className="px-4 py-2 bg-[var(--bs-bg)]/50 rounded-lg border border-[var(--bs-border)] text-sm font-semibold text-[var(--bs-text-primary)] md:self-center md:ml-auto"
                    >
                        Go to Wallet's
                    </button>
                )}
            </div>
        </div>
    );
};

export default MockDataBanner;
