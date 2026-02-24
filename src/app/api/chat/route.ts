import { NextResponse } from "next/server";
import { generateText } from "@/services/gemini";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const responseText = await generateText(prompt);

        return NextResponse.json({ text: responseText });
    } catch (error: any) {
        console.error("Gemini API Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate AI response" },
            { status: 500 }
        );
    }
}
