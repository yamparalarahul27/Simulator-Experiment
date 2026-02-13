'use client';

import React, { useState } from 'react';
import type { TabType } from '../layout/TabNavigation';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_TAB: TabType = 'dashboard';

export default function ProfileSettings() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            if (supabase) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error('Supabase sign-out failed:', error);
        }

        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('deriverse.activeTab');
                window.dispatchEvent(
                    new CustomEvent<TabType>('deriverse:set-active-tab', {
                        detail: DEFAULT_TAB,
                    })
                );
                window.dispatchEvent(new Event('deriverse:show-welcome'));
            }

            setIsLoggingOut(false);
        }, 800);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <div>
                <h1 className="text-4xl font-bold text-white mb-4">Profile &amp; Settings</h1>
                <p className="text-white/60">Configure your profile details and preferences here.</p>
            </div>

            <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-8 py-3 border-2 rounded-none font-semibold text-base transition-all duration-300 ${isLoggingOut
                    ? 'bg-white/10 border-white/20 text-white/40 cursor-not-allowed'
                    : 'bg-red-900/40 border-red-500/10 text-white hover:bg-red-900/60 hover:border-red-500/10'
                    }`}
            >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
        </div>
    );
}
