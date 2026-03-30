"use client";

const palette = {
    backgrounds: [
        { name: "Background", token: "--color-background", value: "#0b0e14" },
        { name: "Card", token: "--color-background-card", value: "#11141a" },
        { name: "Card Foreground", token: "--color-background-card-foreground", value: "#171a20" },
        { name: "Border", token: "--color-border", value: "#1a1e26" },
        { name: "Border Active", token: "--color-border-active", value: "rgba(173, 185, 210, 0.2)" },
        { name: "Background Primary", token: "--color-background-primary", value: "rgba(0, 153, 153, 0.08)" },
    ],
    text: [
        { name: "Primary", token: "--color-primary", value: "#eff1f6" },
        { name: "Secondary", token: "--color-secondary", value: "#ced5e4" },
        { name: "Tertiary", token: "--color-tertiary", value: "#adb9d2" },
        { name: "Mute", token: "--color-mute", value: "#585e6c" },
    ],
    brand: [
        { name: "Brand Primary", token: "--color-brand-primary", value: "#00ffff" },
        { name: "Brand Secondary", token: "--color-brand-secondary", value: "#00e6e6" },
        { name: "Brand Tertiary", token: "--color-brand-tertiary", value: "#00b3b3" },
        { name: "Brand Anchor", token: "--color-brand-anchor", value: "#ddeae0" },
        { name: "Brand Rust", token: "--color-brand-rust", value: "#ffad66" },
        { name: "Brand TypeScript", token: "--color-brand-typescript", value: "#69a2f1" },
    ],
    status: [
        { name: "Success", token: "--color-success", value: "#00e66b" },
        { name: "Error", token: "--color-error", value: "#ff285a" },
    ],
};

function ColorSwatch({ name, token, value }: { name: string; token: string; value: string }) {
    return (
        <div className="flex items-center gap-4 p-3 border border-bs-border bg-bs-card hover:bg-bs-card-fg transition-colors">
            <div
                className="w-12 h-12 shrink-0 border border-bs-border"
                style={{ backgroundColor: value }}
            />
            <div className="min-w-0 flex-1">
                <p className="text-bs-text-primary text-sm font-semibold">{name}</p>
                <p className="text-bs-text-tertiary text-xs font-mono">{token}</p>
                <p className="text-bs-text-mute text-xs font-mono">{value}</p>
            </div>
        </div>
    );
}

function Section({ title, colors }: { title: string; colors: typeof palette.backgrounds }) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-bs-brand mb-3 font-mono">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {colors.map((c) => (
                    <ColorSwatch key={c.token} {...c} />
                ))}
            </div>
        </div>
    );
}

export default function Learn2Page() {
    return (
        <div className="min-h-screen bg-bs-bg text-bs-text-primary">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-bs-text-primary font-mono">
                        Blueshift Dark Palette
                    </h1>
                    <p className="text-bs-text-tertiary text-sm mt-2">
                        Extracted from{" "}
                        <span className="text-bs-brand">learn.blueshift.gg</span>
                        {" "}— dark theme color tokens
                    </p>
                </div>

                <Section title="Backgrounds" colors={palette.backgrounds} />
                <Section title="Text" colors={palette.text} />
                <Section title="Brand" colors={palette.brand} />
                <Section title="Status" colors={palette.status} />

                {/* Full preview strip */}
                <div>
                    <h2 className="text-lg font-semibold text-bs-brand mb-3 font-mono">Preview</h2>
                    <div className="border border-bs-border bg-bs-card p-4 md:p-6 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {[...palette.backgrounds, ...palette.text, ...palette.brand, ...palette.status].map((c) => (
                                <div
                                    key={c.token}
                                    className="w-10 h-10 md:w-14 md:h-14 border border-white/5"
                                    style={{ backgroundColor: c.value }}
                                    title={`${c.name}: ${c.value}`}
                                />
                            ))}
                        </div>

                        <div className="space-y-2 pt-4 border-t border-bs-border">
                            <p className="text-sm" style={{ color: "#eff1f6" }}>Primary text — #eff1f6</p>
                            <p className="text-sm" style={{ color: "#ced5e4" }}>Secondary text — #ced5e4</p>
                            <p className="text-sm" style={{ color: "#adb9d2" }}>Tertiary text — #adb9d2</p>
                            <p className="text-sm" style={{ color: "#585e6c" }}>Mute text — #585e6c</p>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-bs-border">
                            <button className="px-4 py-2 text-sm font-mono" style={{ backgroundColor: "#00ffff", color: "#0b0e14" }}>
                                Brand Primary
                            </button>
                            <button className="px-4 py-2 text-sm font-mono" style={{ backgroundColor: "#00e66b", color: "#0b0e14" }}>
                                Success
                            </button>
                            <button className="px-4 py-2 text-sm font-mono" style={{ backgroundColor: "#ff285a", color: "#0b0e14" }}>
                                Error
                            </button>
                            <button className="px-4 py-2 text-sm font-mono" style={{ backgroundColor: "#ffad66", color: "#0b0e14" }}>
                                Rust
                            </button>
                            <button className="px-4 py-2 text-sm font-mono" style={{ backgroundColor: "#69a2f1", color: "#0b0e14" }}>
                                TypeScript
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
