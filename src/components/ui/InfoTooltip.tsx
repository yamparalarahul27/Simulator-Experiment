'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { COMPONENT_INFO, ComponentInfoKey } from '../../lib/componentInfo';

interface InfoTooltipProps {
    infoKey: ComponentInfoKey;
    className?: string;
}

export default function InfoTooltip({ infoKey, className = '' }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Info Icon */}
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="inline-flex items-center justify-center w-4 h-4 ml-2 text-white/40 hover:text-white/70 transition-colors duration-200 cursor-help"
                aria-label="More information"
            >
                <Info size={14} />
            </button>

            {/* Tooltip */}
            {isVisible && (
                <div className="absolute z-50 w-64 p-3 mt-2 -translate-x-1/2 left-1/2">
                    <div className="relative">
                        {/* Glassmorphism background */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-none border border-white/10" />

                        {/* Content */}
                        <div className="relative z-10 text-xs text-white/80 leading-relaxed font-sans">
                            {COMPONENT_INFO[infoKey]}
                        </div>

                        {/* Arrow */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/5 border-l border-t border-white/10 rotate-45" />
                    </div>
                </div>
            )}
        </div>
    );
}
