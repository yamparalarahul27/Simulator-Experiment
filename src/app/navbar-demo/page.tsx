'use client';

import { useState } from 'react';
import { LivePulseIndicator, LivePulseIndicatorWithLabel } from '@/components/LivePulseIndicator';
import { HamburgerButton } from '@/components/HamburgerButton';
import { GlassmorphismNavbar } from '@/components/GlassmorphismNavbar';
import CardWithCornerShine from '@/components/CardWithCornerShine';

export default function NavbarDemo() {
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const [network, setNetwork] = useState<'devnet' | 'mainnet'>('devnet');

    const navItems = [
        { title: 'Dashboard', href: '/', category: 'main' as const },
        { title: 'Trade', href: '/trade', category: 'main' as const },
        { title: 'Portfolio', href: '/portfolio', category: 'main' as const },
        { title: 'Analytics', href: '/analytics', category: 'dropdown' as const },
        { title: 'History', href: '/history', category: 'dropdown' as const },
        { title: 'Settings', href: '/settings', category: 'dropdown' as const },
        { title: 'Docs', href: '/docs', category: 'info' as const },
        { title: 'Support', href: '/support', category: 'info' as const },
    ];

    return (
        <div className="min-h-screen">
            {/* Demo Navbar */}
            <GlassmorphismNavbar
                logo={<span className="text-heading-20 text-white font-bold">Deriverse</span>}
                logoHref="/"
                navItems={navItems}
                activePath="/navbar-demo"
                networkStatus={{
                    name: network === 'devnet' ? 'Devnet' : 'Mainnet',
                    variant: network,
                    isActive: true,
                }}
                onNetworkChange={(newNetwork) => setNetwork(newNetwork)}
            />

            {/* Demo Content */}
            <div className="pt-20 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-heading-40 text-white mb-4">Navigation Components Demo</h1>
                    <p className="text-copy-16 text-white/70 mb-12">
                        Showcase of glassmorphism navigation components with various configurations
                    </p>

                    {/* LivePulseIndicator Demo */}
                    <section className="mb-12">
                        <h2 className="text-heading-24 text-white mb-6">1. LivePulseIndicator</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* All Variants */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">All Color Variants</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="devnet" />
                                        <span className="text-copy-14 text-white/70">Devnet (Emerald)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="mainnet" />
                                        <span className="text-copy-14 text-white/70">Mainnet (Blue)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="success" />
                                        <span className="text-copy-14 text-white/70">Success (Green)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="warning" />
                                        <span className="text-copy-14 text-white/70">Warning (Yellow)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="danger" />
                                        <span className="text-copy-14 text-white/70">Danger (Red)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="info" />
                                        <span className="text-copy-14 text-white/70">Info (Cyan)</span>
                                    </div>
                                </div>
                            </CardWithCornerShine>

                            {/* All Sizes */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">Size Presets</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <LivePulseIndicator variant="devnet" size="sm" />
                                        <span className="text-copy-14 text-white/70">Small (sm)</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <LivePulseIndicator variant="devnet" size="md" />
                                        <span className="text-copy-14 text-white/70">Medium (md) - Default</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <LivePulseIndicator variant="devnet" size="lg" />
                                        <span className="text-copy-14 text-white/70">Large (lg)</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <LivePulseIndicator variant="devnet" size="xl" />
                                        <span className="text-copy-14 text-white/70">Extra Large (xl)</span>
                                    </div>
                                </div>
                            </CardWithCornerShine>

                            {/* With Labels */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">With Labels</h3>
                                <div className="space-y-3">
                                    <div>
                                        <LivePulseIndicatorWithLabel
                                            variant="devnet"
                                            label={<span className="text-copy-14 text-white/70">Devnet Active</span>}
                                        />
                                    </div>
                                    <div>
                                        <LivePulseIndicatorWithLabel
                                            variant="mainnet"
                                            label={<span className="text-copy-14 text-white/70">Mainnet Connected</span>}
                                        />
                                    </div>
                                    <div>
                                        <LivePulseIndicatorWithLabel
                                            variant="success"
                                            label={<span className="text-copy-14 text-white/70">All Systems Operational</span>}
                                        />
                                    </div>
                                </div>
                            </CardWithCornerShine>

                            {/* No Ping Animation */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">Without Ping Animation</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="devnet" noPing />
                                        <span className="text-copy-14 text-white/70">Static indicator</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="warning" noPing />
                                        <span className="text-copy-14 text-white/70">No pulse effect</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LivePulseIndicator variant="danger" size="lg" noPing />
                                        <span className="text-copy-14 text-white/70">Large static</span>
                                    </div>
                                </div>
                            </CardWithCornerShine>
                        </div>
                    </section>

                    {/* HamburgerButton Demo */}
                    <section className="mb-12">
                        <h2 className="text-heading-24 text-white mb-6">2. HamburgerButton</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Interactive Demo */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">Interactive Demo</h3>
                                <div className="flex flex-col items-center gap-4 py-6">
                                    <HamburgerButton
                                        isOpen={hamburgerOpen}
                                        onClick={() => setHamburgerOpen(!hamburgerOpen)}
                                        size="md"
                                    />
                                    <p className="text-copy-13 text-white/60">
                                        {hamburgerOpen ? 'Open (X)' : 'Closed (≡)'}
                                    </p>
                                    <button
                                        onClick={() => setHamburgerOpen(!hamburgerOpen)}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-copy-13 text-white/80 transition-colors"
                                    >
                                        Toggle
                                    </button>
                                </div>
                            </CardWithCornerShine>

                            {/* Different Sizes */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">Size Variations</h3>
                                <div className="space-y-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <HamburgerButton isOpen={false} onClick={() => { }} size="sm" />
                                        <span className="text-copy-14 text-white/70">Small</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <HamburgerButton isOpen={false} onClick={() => { }} size="md" />
                                        <span className="text-copy-14 text-white/70">Medium</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <HamburgerButton isOpen={false} onClick={() => { }} size="lg" />
                                        <span className="text-copy-14 text-white/70">Large</span>
                                    </div>
                                </div>
                            </CardWithCornerShine>

                            {/* Open State */}
                            <CardWithCornerShine padding="md">
                                <h3 className="text-label-14 text-white mb-4">Open State (X)</h3>
                                <div className="space-y-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <HamburgerButton isOpen={true} onClick={() => { }} size="sm" />
                                        <span className="text-copy-14 text-white/70">Small X</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <HamburgerButton isOpen={true} onClick={() => { }} size="md" />
                                        <span className="text-copy-14 text-white/70">Medium X</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <HamburgerButton isOpen={true} onClick={() => { }} size="lg" />
                                        <span className="text-copy-14 text-white/70">Large X</span>
                                    </div>
                                </div>
                            </CardWithCornerShine>
                        </div>
                    </section>

                    {/* GlassmorphismNavbar Info */}
                    <section>
                        <h2 className="text-heading-24 text-white mb-6">3. GlassmorphismNavbar</h2>

                        <CardWithCornerShine padding="lg">
                            <h3 className="text-label-16 text-white mb-4">Active Demo (Top of Page)</h3>
                            <p className="text-copy-14 text-white/70 mb-6">
                                The navigation bar at the top of this page is a live example of the GlassmorphismNavbar component.
                            </p>

                            <div className="space-y-4 text-copy-14 text-white/70">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-label-14 text-white mb-2">Desktop Features:</h4>
                                        <ul className="space-y-1 text-copy-13 text-white/60">
                                            <li>• Horizontal navigation layout</li>
                                            <li>• Hover dropdown for "More" items</li>
                                            <li>• Network selector in top right</li>
                                            <li>• Glassmorphism backdrop blur effect</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-label-14 text-white mb-2">Mobile Features:</h4>
                                        <ul className="space-y-1 text-copy-13 text-white/60">
                                            <li>• Hamburger menu button</li>
                                            <li>• Full-screen overlay menu</li>
                                            <li>• Categorized sections</li>
                                            <li>• Network selector at top</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="text-label-14 text-white mb-3">Try it out:</h4>
                                    <ul className="space-y-2 text-copy-13 text-white/60">
                                        <li>• Hover over "More" to see dropdown (desktop)</li>
                                        <li>• Click network selector to switch Devnet/Mainnet</li>
                                        <li>• Resize window to see mobile menu</li>
                                        <li>• Current network: <span className="text-white font-medium">{network === 'devnet' ? 'Devnet' : 'Mainnet'}</span></li>
                                    </ul>
                                </div>
                            </div>
                        </CardWithCornerShine>
                    </section>
                </div>
            </div>
        </div>
    );
}
