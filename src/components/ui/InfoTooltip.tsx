import React from 'react';
import { Info } from 'lucide-react';
import { COMPONENT_INFO, ComponentInfoKey } from '../../lib/componentInfo';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
    /** Key to look up tooltip content from componentInfo.ts */
    infoKey: ComponentInfoKey;
    /** Optional class name for the trigger button */
    className?: string;
}

/**
 * InfoTooltip Component
 * 
 * A specialized tooltip component that displays informational text from `componentInfo.ts`.
 * Wraps the shadcn/ui generic Tooltip component with pre-configured glassmorphism styling
 * and a standard info icon trigger.
 */
export default function InfoTooltip({ infoKey, className = '' }: InfoTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={`inline-flex items-center justify-center w-4 h-4 ml-2 text-white/40 hover:text-white/70 transition-colors duration-200 cursor-help ${className}`}
                        aria-label="More information"
                    >
                        <Info size={14} />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="w-64">
                    <p>{COMPONENT_INFO[infoKey]}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
