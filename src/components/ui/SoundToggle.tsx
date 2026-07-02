'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSound } from '@/lib/context/SoundContext';

interface SoundToggleProps {
    showLabel?: boolean;
    className?: string;
}

export default function SoundToggle({ showLabel = false, className }: SoundToggleProps) {
    const { soundEnabled, toggleSound, playClick } = useAppSound();
    const Icon = soundEnabled ? Volume2 : VolumeX;
    const label = soundEnabled ? 'Sound on' : 'Sound off';
    const nextLabel = soundEnabled ? 'Turn sound off' : 'Turn sound on';

    const handleClick = () => {
        if (soundEnabled) {
            playClick();
            toggleSound();
            return;
        }

        toggleSound();
        playClick({ force: true });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-bs-border bg-bs-card-fg px-2.5 text-xs font-medium text-bs-text-secondary transition-colors hover:text-bs-text-primary',
                !showLabel && 'w-9 px-0',
                className,
            )}
            aria-label={nextLabel}
            aria-pressed={soundEnabled}
            title={`${label}. ${nextLabel}`}
        >
            <Icon className="h-4 w-4 text-bs-text-tertiary" />
            {showLabel && <span>{soundEnabled ? 'Sound' : 'Muted'}</span>}
        </button>
    );
}
