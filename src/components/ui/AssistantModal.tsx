"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AssistantModal() {
    const router = useRouter();

    return (
        <div className="fixed bottom-12 left-6 z-50">
            <button
                onClick={() => router.push('/assistant')}
                className="group flex items-center justify-center w-14 h-14 rounded-none bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 text-white transition-all duration-300 hover:scale-110 active:scale-95"
            >
                <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
            </button>
        </div>
    );
}
