'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODES = ['light', 'dark', 'system'] as const;
type ThemeMode = (typeof MODES)[number];

const ICONS = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

const LABELS: Record<ThemeMode, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
};

interface ThemeToggleProps {
    showLabel?: boolean;
    className?: string;
}

export default function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const current = MODES.includes(theme as ThemeMode) ? theme as ThemeMode : 'system';
    const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
    const Icon = ICONS[current] ?? Moon;

    return (
        <button
            type="button"
            onClick={() => setTheme(next)}
            className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-bs-border bg-bs-card-fg px-2.5 text-xs font-medium text-bs-text-secondary transition-colors hover:text-bs-text-primary',
                !showLabel && 'w-9 px-0',
                className,
            )}
            aria-label={`Switch to ${next} theme`}
            title={`Current: ${LABELS[current]}. Click for ${LABELS[next]}`}
        >
            <Icon className="h-4 w-4 text-bs-text-tertiary" />
            {showLabel && <span>{LABELS[current]}</span>}
        </button>
    );
}
