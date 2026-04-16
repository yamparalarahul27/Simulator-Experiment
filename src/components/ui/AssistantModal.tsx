"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Telescope, User, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isDesktop;
}

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export default function AssistantModal() {
    const isDesktop = useIsDesktop();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content:
                "Hello! I am your AI assistant powered by Gemini. How can I help you regarding trades or the markets today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

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
                content: `Error: ${error instanceof Error ? error.message : "Unknown error"}. Please check if GEMINI_API_KEY is configured correctly.`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating AI Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-24 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full border border-bs-border bg-bs-card shadow-lg text-bs-text-primary transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? "hidden" : ""}`}
            >
                <Telescope className="w-6 h-6" />
            </button>

            {/* Backdrop — mobile only */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-bs-bg/60 z-[60] md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Panel: bottom sheet on mobile, side panel on desktop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed z-[70]
                            inset-x-0 bottom-0 max-h-[85vh] max-w-[100vw] overflow-x-hidden rounded-t-2xl
                            md:inset-x-auto md:bottom-auto md:top-0 md:right-0 md:max-h-none md:max-w-none md:h-full md:w-[420px] md:rounded-none
                            bg-bs-card/95 backdrop-blur-xl border-t border-bs-border md:border-t-0 md:border-l
                            flex flex-col shadow-2xl shadow-black/50"
                        initial={isDesktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 }}
                        animate={{ x: 0, y: 0 }}
                        exit={isDesktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {/* Drag handle — mobile only */}
                        <div className="flex justify-center pt-2 pb-1 md:hidden">
                            <div className="w-10 h-1 rounded-full bg-bs-border" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-bs-border shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-bs-brand-tertiary/20 border border-bs-brand-tertiary/30 flex items-center justify-center">
                                    <Telescope className="w-4 h-4 text-bs-brand" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-bs-text-primary">YDEX AI Assistant</h2>
                                    <p className="text-[10px] text-bs-text-mute font-mono">Powered by Gemini 2.5 Flash</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-bs-card hover:bg-bs-card-fg text-bs-text-mute hover:text-bs-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`flex gap-2.5 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        <div
                                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 ${
                                                message.role === "user"
                                                    ? "bg-bs-info/20 text-bs-brand-ts border border-bs-info/30"
                                                    : "bg-bs-brand-tertiary/20 text-bs-brand border border-bs-brand-tertiary/30"
                                            }`}
                                        >
                                            {message.role === "user" ? (
                                                <User className="w-3.5 h-3.5" />
                                            ) : (
                                                <Telescope className="w-3.5 h-3.5" />
                                            )}
                                        </div>

                                        <div
                                            className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                                                message.role === "user"
                                                    ? "bg-bs-info text-bs-text-primary"
                                                    : "bg-bs-card border border-bs-border text-bs-text-secondary whitespace-pre-wrap"
                                            }`}
                                        >
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2.5">
                                        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 bg-bs-brand-tertiary/20 text-bs-brand border border-bs-brand-tertiary/30">
                                            <Telescope className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="px-4 py-3 border border-bs-border bg-bs-card flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-bs-accent-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-bs-info animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-bs-accent-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-1" />
                        </div>

                        {/* Input */}
                        <div className="shrink-0 px-3 py-3 border-t border-bs-border overflow-hidden">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about trades or markets..."
                                    disabled={isLoading}
                                    className="min-w-0 flex-1 bg-bs-card border border-bs-border py-2.5 px-3 text-base text-bs-text-primary placeholder:text-bs-text-mute focus:outline-none focus:border-bs-brand-tertiary/50 disabled:opacity-50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="shrink-0 p-3 bg-bs-accent-cyan text-white hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all duration-200"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-center text-[10px] text-bs-text-mute mt-2 font-mono">
                                AI can make mistakes. Verify critical information.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
