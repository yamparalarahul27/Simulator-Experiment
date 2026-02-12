'use client';

import { useEffect } from 'react';

interface TradeImportProps {
    onComplete: () => void;
}

export default function TradeImport({ onComplete }: TradeImportProps) {
    useEffect(() => {
        onComplete();
    }, [onComplete]);

    return null;
}
