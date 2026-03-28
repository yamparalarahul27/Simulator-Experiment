"use client";

import React, { useState, useRef, useEffect } from "react";
import { Telescope, User, Send, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from '@/i18n/navigation';

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export default function AssistantPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I am your AI assistant powered by Gemini. How can I help you regarding trades or the markets today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMessage.content }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch response");
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.text,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: unknown) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if GEMINI_API_KEY is configured correctly.`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E14] flex flex-col pt-14 md:pt-20">
            <header className="fixed top-0 left-0 right-0 h-14 md:h-20 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/10 z-40 px-4 md:px-6 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="p-3 md:p-2 rounded-none bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0 z-10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <h1 className="text-base md:text-lg font-semibold text-white">YDEX AI Assistant</h1>
                    <p className="text-[10px] md:text-xs text-zinc-400">Powered by Gemini 2.5 Flash</p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="p-3 md:p-2 rounded-none bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0 z-10"
                >
                    <X className="w-5 h-5" />
                </button>
            </header>

            {/* Chat Container */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 pb-40 md:pb-32 flex flex-col gap-4 md:gap-6 overflow-y-auto">
                {messages.map((message) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1 ${message.role === "user"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                }`}>
                                {message.role === "user" ? <User className="w-5 h-5" /> : <Telescope className="w-5 h-5" />}
                            </div>

                            <div
                                className={`px-5 py-4 rounded-none text-[15px] ${message.role === "user"
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-white/5 border border-white/10 text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-xl shadow-black/50"
                                    }`}
                            >
                                {message.content}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-none flex items-center justify-center mt-1 bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                <Telescope className="w-5 h-5" />
                            </div>
                            <div className="px-6 py-5 border border-white/10 rounded-none bg-white/5 flex items-center gap-2">
                                <motion.div className="w-2 h-2 rounded-none bg-purple-400" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                <motion.div className="w-2 h-2 rounded-none bg-blue-400" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                <motion.div className="w-2 h-2 rounded-none bg-purple-400" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* Input Fixed at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14] to-transparent pt-6 md:pt-10 pb-4 md:pb-6 px-4 z-40 pointer-events-none">
                <div className="max-w-4xl mx-auto pointer-events-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="relative flex items-center shadow-2xl shadow-black"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about trades or markets..."
                            disabled={isLoading}
                            className="w-full bg-[#1A1E26]/90 backdrop-blur-md border border-white/10 rounded-none py-4 pl-6 pr-14 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all shadow-inner shadow-black/20"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-3 rounded-none bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-90 transition-all duration-300"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                    <p className="text-center text-[11px] text-zinc-500 mt-3">
                        AI can make mistakes. Consider verifying critical financial information.
                    </p>
                </div>
            </div>
        </div>
    );
}
