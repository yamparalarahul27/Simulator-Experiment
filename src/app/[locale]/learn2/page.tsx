'use client';

const palette = {
    backgrounds: [
        { name: 'Background', token: '--color-background', value: '#0b0e14' },
        { name: 'Card', token: '--color-background-card', value: '#11141a' },
        { name: 'Card Foreground', token: '--color-background-card-foreground', value: '#171a20' },
        { name: 'Border', token: '--color-border', value: '#1a1e26' },
        { name: 'Border Active', token: '--color-border-active', value: 'rgba(173, 185, 210, 0.2)' },
        { name: 'Background Primary', token: '--color-background-primary', value: 'rgba(0, 153, 153, 0.08)' },
    ],
    text: [
        { name: 'Primary', token: '--color-primary', value: '#eff1f6' },
        { name: 'Secondary', token: '--color-secondary', value: '#ced5e4' },
        { name: 'Tertiary', token: '--color-tertiary', value: '#adb9d2' },
        { name: 'Mute', token: '--color-mute', value: '#585e6c' },
    ],
    brand: [
        { name: 'Brand Primary', token: '--color-brand-primary', value: '#00ffff' },
        { name: 'Brand Secondary', token: '--color-brand-secondary', value: '#00e6e6' },
        { name: 'Brand Tertiary', token: '--color-brand-tertiary', value: '#00b3b3' },
        { name: 'Brand Anchor', token: '--color-brand-anchor', value: '#ddeae0' },
        { name: 'Brand Rust', token: '--color-brand-rust', value: '#ffad66' },
        { name: 'Brand TypeScript', token: '--color-brand-typescript', value: '#69a2f1' },
    ],
    status: [
        { name: 'Success', token: '--color-success', value: '#00e66b' },
        { name: 'Error', token: '--color-error', value: '#ff285a' },
    ],
};

function ColorSwatch({ name, token, value }: { name: string; token: string; value: string }) {
    return (
        <article className="flex items-center gap-4 rounded-xl border border-bs-border bg-bs-card px-4 py-3">
            <div className="size-12 shrink-0 rounded-md border border-bs-border" style={{ backgroundColor: value }} />
            <div className="min-w-0">
                <p className="text-sm font-semibold text-bs-text-primary text-balance">{name}</p>
                <p className="truncate text-xs font-mono text-bs-text-tertiary">{token}</p>
                <p className="truncate text-xs font-mono text-bs-text-mute">{value}</p>
            </div>
        </article>
    );
}

function Section({ title, colors }: { title: string; colors: typeof palette.backgrounds }) {
    return (
        <section className="space-y-3">
            <h2 className="text-xl font-semibold text-bs-text-primary text-balance">{title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {colors.map((color) => (
                    <ColorSwatch key={color.token} {...color} />
                ))}
            </div>
        </section>
    );
}

export default function Learn2Page() {
    const allColors = [...palette.backgrounds, ...palette.text, ...palette.brand, ...palette.status];

    return (
        <div className="space-y-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">Design Tokens</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Blueshift color reference
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Canonical swatches and token mapping used across YDEX pages.
                </p>
            </header>

            <Section title="Backgrounds" colors={palette.backgrounds} />
            <Section title="Text" colors={palette.text} />
            <Section title="Brand" colors={palette.brand} />
            <Section title="Status" colors={palette.status} />

            <section className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                <h2 className="text-xl font-semibold text-bs-text-primary text-balance">Preview</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                    {allColors.map((color) => (
                        <div
                            key={color.token}
                            className="h-10 w-10 rounded-md border border-bs-border md:h-12 md:w-12"
                            style={{ backgroundColor: color.value }}
                            title={`${color.name}: ${color.value}`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
