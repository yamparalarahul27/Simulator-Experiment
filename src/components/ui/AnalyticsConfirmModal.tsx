'use client';

/**
 * AnalyticsConfirmModal Component
 * 
 * A modal dialog that appears after a user successfully saves trades.
 * It asks the user if they want to view analytics for the saved trades,
 * facilitating the transition from "saving" to "viewing".
 */

interface AnalyticsConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    tradeCount: number;
}

export const AnalyticsConfirmModal = ({
    isOpen,
    onConfirm,
    onCancel,
    tradeCount
}: AnalyticsConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[var(--bs-bg)]/80 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className="relative bg-[var(--bs-bg)]/90 border border-[var(--bs-border)] rounded-lg p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center space-y-4">
                    {/* Success Icon */}
                    <div className="mx-auto w-12 h-12 rounded-lg bg-[var(--bs-brand-success)]/20 border border-[var(--bs-success)]/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[var(--bs-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Title & Description */}
                    <div>
                        <h3 className="text-xl font-bold text-[var(--bs-text-primary)] mb-2">Trades Saved Successfully!</h3>
                        <p className="text-[var(--bs-text-tertiary)]">
                            You've saved {tradeCount} trades to your database.
                        </p>
                        <p className="text-[var(--bs-text-secondary)] mt-2 font-medium">
                            Would you like to view analytics for these trades on your Dashboard?
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2.5 rounded-lg border border-[var(--bs-border)] bg-[var(--bs-card)] text-[var(--bs-text-tertiary)] hover:text-[var(--bs-text-primary)] hover:bg-[var(--bs-card-fg)] transition-colors font-mono text-sm"
                        >
                            No
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2.5 rounded-lg bg-[var(--bs-brand-tertiary)]/10 text-[var(--bs-text-primary)] hover:bg-[var(--bs-brand-tertiary)]/40 transition-colors font-mono text-sm shadow-lg shadow-[#00b3b3]/20 border border-[var(--bs-brand-tertiary)]/50"
                        >
                            Yes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsConfirmModal;
