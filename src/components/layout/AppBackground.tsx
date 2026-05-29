'use client';

import React from 'react';

/**
 * AppBackground — flat dark workspace surface.
 *
 * The app is dark-only. This paints a single solid surface using the
 * workspace palette (`--bs-bg` → `--color-surface-page`) behind all content.
 */
export default function AppBackground() {
    return (
        <div
            className="fixed inset-0 -z-30"
            style={{ backgroundColor: 'var(--bs-bg)' }}
        />
    );
}
