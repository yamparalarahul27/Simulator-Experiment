'use client';

import React, { useState } from 'react';
import DeriverseWalletAsk from './DeriverseWalletAsk';

export default function DeriverseWalletAskTest() {
    const [choice, setChoice] = useState<string>('');

    const handleChoice = (selectedChoice: 'wallet' | 'mock') => {
        setChoice(selectedChoice);
        console.log('User choice:', selectedChoice);
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            <DeriverseWalletAsk onChoice={handleChoice} />
            
            {choice && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    zIndex: 1000
                }}>
                    User chose: {choice}
                </div>
            )}
        </div>
    );
}
