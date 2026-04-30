import { NextResponse } from "next/server";
import { generateText } from "@/services/gemini";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024;     // 4 KB request cap
const MAX_PROMPT_CHARS = 2_000;      // hard cap on prompt length
const RATE_LIMIT_MAX = 10;           // 10 requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute, per IP

export async function POST(req: Request) {
    try {
        // 1. Rate-limit per IP (best-effort, per-instance).
        const ip = clientIp(req);
        const rl = checkRateLimit("chat", ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
        if (rl.limited) {
            return NextResponse.json(
                { error: "Too many requests" },
                {
                    status: 429,
                    headers: { "Retry-After": String(rl.retryAfterSeconds) },
                },
            );
        }

        // 2. Cap request body size before parsing.
        const contentLength = Number(req.headers.get("content-length") ?? 0);
        if (contentLength > MAX_BODY_BYTES) {
            return NextResponse.json(
                { error: "Request body too large" },
                { status: 413 },
            );
        }

        const raw = await req.text();
        if (raw.length > MAX_BODY_BYTES) {
            return NextResponse.json(
                { error: "Request body too large" },
                { status: 413 },
            );
        }

        let body: unknown;
        try {
            body = JSON.parse(raw);
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON" },
                { status: 400 },
            );
        }

        const prompt =
            body && typeof body === "object" && "prompt" in body
                ? (body as { prompt: unknown }).prompt
                : null;

        if (typeof prompt !== "string" || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 },
            );
        }

        if (prompt.length > MAX_PROMPT_CHARS) {
            return NextResponse.json(
                { error: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` },
                { status: 400 },
            );
        }

        const responseText = await generateText(prompt);
        return NextResponse.json({ text: responseText });
    } catch (error) {
        // Never echo upstream details to the client. Keep the full
        // error in server logs only.
        console.error("Gemini API Route Error:", error);
        return NextResponse.json(
            { error: "Failed to generate AI response" },
            { status: 500 },
        );
    }
}
