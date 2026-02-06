'use client';

import CardWithCornerShine from '@/components/CardWithCornerShine';

export default function CardDemo() {
    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-heading-40 text-white mb-4">CardWithCornerShine Demo</h1>
                <p className="text-copy-16 text-white/70 mb-12">
                    Premium card component with glowing corner accents
                </p>

                {/* Demo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Example 1: Metric Card */}
                    <CardWithCornerShine>
                        <div className="text-center">
                            <h3 className="text-label-12 text-white/60 mb-2 tracking-wider">TOTAL TRADES</h3>
                            <p className="text-heading-48 text-accent font-mono">1,234</p>
                            <p className="text-label-13 text-white/40 mt-2">+12% from last month</p>
                        </div>
                    </CardWithCornerShine>

                    {/* Example 2: Small Padding */}
                    <CardWithCornerShine padding="sm">
                        <div className="text-center">
                            <h3 className="text-label-12 text-white/60 mb-2 tracking-wider">WIN RATE</h3>
                            <p className="text-heading-48 text-green-400 font-mono">68.5%</p>
                            <p className="text-label-13 text-white/40 mt-2">Above average</p>
                        </div>
                    </CardWithCornerShine>

                    {/* Example 3: Large Padding */}
                    <CardWithCornerShine padding="lg">
                        <div className="text-center">
                            <h3 className="text-label-12 text-white/60 mb-2 tracking-wider">PROFIT</h3>
                            <p className="text-heading-48 text-blue-400 font-mono">$45.2K</p>
                            <p className="text-label-13 text-white/40 mt-2">Year to date</p>
                        </div>
                    </CardWithCornerShine>

                    {/* Example 4: No Hover Shadow */}
                    <CardWithCornerShine showHoverShadow={false}>
                        <div>
                            <h3 className="text-label-14 text-white mb-3">Recent Activity</h3>
                            <ul className="space-y-2">
                                <li className="text-copy-13 text-white/60">Trade executed: BTC/USD</li>
                                <li className="text-copy-13 text-white/60">Stop loss triggered</li>
                                <li className="text-copy-13 text-white/60">Position closed: +$250</li>
                            </ul>
                        </div>
                    </CardWithCornerShine>

                    {/* Example 5: Clickable Card */}
                    <CardWithCornerShine
                        onClick={() => alert('Card clicked!')}
                        minHeight="min-h-[200px]"
                    >
                        <div className="flex flex-col items-center justify-center h-full">
                            <p className="text-button-14 text-white/80">Click me!</p>
                            <p className="text-label-12 text-white/40 mt-2">Interactive card</p>
                        </div>
                    </CardWithCornerShine>

                    {/* Example 6: Custom Opacity */}
                    <CardWithCornerShine bgOpacity={90}>
                        <div className="text-center">
                            <h3 className="text-label-12 text-white/60 mb-2 tracking-wider">VOLATILITY</h3>
                            <p className="text-heading-48 text-yellow-400 font-mono">3.2x</p>
                            <p className="text-label-13 text-white/40 mt-2">Higher opacity (90%)</p>
                        </div>
                    </CardWithCornerShine>
                </div>

                {/* Props Documentation */}
                <div className="mt-16">
                    <CardWithCornerShine padding="lg" className="max-w-4xl">
                        <h2 className="text-heading-24 text-white mb-4">Component Props</h2>
                        <div className="space-y-4 text-copy-14 text-white/70">
                            <div>
                                <code className="text-label-13-mono text-accent">children</code>
                                <span className="text-white/40"> - Content to render inside the card</span>
                            </div>
                            <div>
                                <code className="text-label-13-mono text-accent">className</code>
                                <span className="text-white/40"> - Additional CSS classes</span>
                            </div>
                            <div>
                                <code className="text-label-13-mono text-accent">minHeight</code>
                                <span className="text-white/40"> - Minimum height (default: "min-h-[320px] sm:min-h-[340px]")</span>
                            </div>
                            <div>
                                <code className="text-label-13-mono text-accent">showHoverShadow</code>
                                <span className="text-white/40"> - Show shadow on hover (default: true)</span>
                            </div>
                            <div>
                                <code className="text-label-13-mono text-accent">padding</code>
                                <span className="text-white/40"> - 'sm' | 'md' | 'lg' (default: 'md')</span>
                            </div>
                            <div>
                                <code className="text-label-13-mono text-accent">bgOpacity</code>
                                <span className="text-white/40"> - Background opacity 0-100 (default: 80)</span>
                            </div>
                            <div>
                                <code className="text-label-13-mono text-accent">onClick</code>
                                <span className="text-white/40"> - Click handler function</span>
                            </div>
                        </div>
                    </CardWithCornerShine>
                </div>
            </div>
        </div>
    );
}
