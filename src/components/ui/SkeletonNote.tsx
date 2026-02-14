import React from 'react';

export default function SkeletonNote() {
    return (
        <div className="mt-auto pt-3 border-t border-white/10 animate-pulse">
            <div className="flex gap-1 mb-2">
                <div className="h-3 w-10 bg-white/5 rounded-none"></div>
                <div className="h-3 w-12 bg-white/5 rounded-none"></div>
            </div>
            <div className="space-y-2">
                <div className="h-2 w-full bg-white/5 rounded-none"></div>
                <div className="h-2 w-4/5 bg-white/5 rounded-none"></div>
            </div>
        </div>
    );
}
