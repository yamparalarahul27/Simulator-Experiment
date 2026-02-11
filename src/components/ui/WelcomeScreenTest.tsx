'use client';

import WelcomeScreen from './WelcomeScreen';

/**
 * Simple test component to verify WelcomeScreen functionality
 */
export default function WelcomeScreenTest() {
    const handleComplete = () => {
        console.log('Welcome screen completed');
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            <WelcomeScreen isVisible={true} onComplete={handleComplete} />
        </div>
    );
}
