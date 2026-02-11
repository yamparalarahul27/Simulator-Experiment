'use client';

import React from 'react';
import WelcomeHeader from './WelcomeHeader';

export default function WelcomeHeaderTest() {
    return (
        <div style={{ minHeight: '100vh', position: 'relative', background: '#000' }}>
            <WelcomeHeader />
            
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                textAlign: 'center',
                fontSize: '24px'
            }}>
                WelcomeHeader Test
                <br />
                <small style={{ fontSize: '14px', opacity: 0.6 }}>
                    Click "About" (left drawer) or "Help" (right drawer)
                </small>
            </div>
        </div>
    );
}
