'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import WelcomeCard from './WelcomeCard';
import WelcomeHeader from './WelcomeHeader';
import WelcomeFooter from './WelcomeFooter';

interface TradeImportProps {
    onComplete: () => void;
}

export default function TradeImport({ onComplete }: TradeImportProps) {
    const { publicKey } = useWallet();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    const handleImport = async () => {
        if (!publicKey) {
            setStatus('error');
            setMessage('No wallet connected.');
            return;
        }
        setStatus('loading');
        setMessage('');
        // TODO: integrate HeliusService + DeriverseTradeService and Supabase persistence
        // Placeholder success for flow wiring
        setTimeout(() => {
            setStatus('success');
            setMessage('Imported trades (placeholder).');
            onComplete();
        }, 800);
    };

    return (
        <motion.div
            className="welcome-screen fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
        >
            <WelcomeHeader />
            <div className="flex flex-col items-center gap-8">
                <WelcomeCard>
                    <motion.div
                        className="text-center space-y-6 flex-1 flex flex-col justify-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <h1 className="text-xl font-mono uppercase tracking-wider text-white/80 mb-2">
                            Import trades
                        </h1>
                        <p className="text-sm leading-relaxed text-white/60 max-w-md mx-auto">
                            We’ll fetch your latest trades from your connected wallet.
                        </p>
                        {publicKey && (
                            <p className="text-xs text-white/50 font-mono break-all">
                                Connected: {publicKey.toBase58()}
                            </p>
                        )}
                        {status === 'loading' && (
                            <p className="text-sm text-white/60">Fetching trades…</p>
                        )}
                        {status === 'error' && (
                            <p className="text-sm text-red-400">{message}</p>
                        )}
                        {status === 'success' && (
                            <p className="text-sm text-emerald-400">{message}</p>
                        )}
                    </motion.div>

                    <div className="flex flex-col items-center gap-4 mt-8">
                        <button
                            className="px-4 py-2 bg-white/10 text-white text-sm font-mono rounded-sm hover:bg-white/20 transition-colors"
                            onClick={handleImport}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Importing…' : 'Import latest trades'}
                        </button>
                    </div>
                </WelcomeCard>
            </div>
            <WelcomeFooter />
        </motion.div>
    );
}
