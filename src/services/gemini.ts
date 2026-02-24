import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

// Initialize the Gemini client
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Helper to get the default model (Gemini 2.5 Flash is recommended for general text tasks)
 */
export function getGeminiModel(modelName = "gemini-2.5-flash") {
    if (!genAI) {
        throw new Error("Gemini client is not initialized because the API key is missing.");
    }
    return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate a response for a single prompt.
 */
export async function generateText(prompt: string): Promise<string> {
    try {
        const model = getGeminiModel();
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating text with Gemini:", error);
        throw error;
    }
}

/**
 * Generate a market insight summary based on provided data.
 */
export async function generateMarketInsight(tickerData: string): Promise<string> {
    const prompt = `
    You are an expert cryptocurrency analyst. 
    Analyze the following market data and provide a concise, insightful summary of the current trends.
    Highlight any significant movements or potential signals. Keep it under 3 paragraphs.
    
    Data:
    ${tickerData}
  `;
    return generateText(prompt);
}
