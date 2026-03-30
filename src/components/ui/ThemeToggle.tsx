'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const MODES = ['light', 'dark', 'system'] as const;

const ICONS = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="w-8 h-8" />;
    }

    const current = (theme ?? 'dark') as (typeof MODES)[number];
    const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
    const Icon = ICONS[current] ?? Moon;

    return (
        <button
            onClick={() => setTheme(next)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-bs-card border border-bs-border hover:bg-bs-card-fg transition-colors cursor-pointer"
            aria-label={`Switch to ${next} theme`}
            title={`Current: ${current}. Click for ${next}`}
        >
            <Icon className="w-4 h-4 text-bs-text-tertiary" />
        </button>
    );
}
