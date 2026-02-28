// app/api/ai/analyze/route.ts — Code analysis via Gemini with hardcoded fallback

import { NextRequest, NextResponse } from "next/server";
import { ANALYZE_SYSTEM_PROMPT, ANALYZE_FALLBACK } from "../../../../lib/constants";
import { chatWithAI } from "@/lib/ai";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const TIMEOUT_MS = 5000;

export async function POST(req: NextRequest) {
    try {
        const { messages = [], currentCode = "" } = await req.json();

        console.log("GEMINI_API_KEY",process.env.GEMINI_API_KEY)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log("api not founsd")
            return NextResponse.json(ANALYZE_FALLBACK);
        }
        // Build the user prompt from chat context + code
        const chatContext = messages
            .map((m: { author: string; content: string }) => `${m.author}: ${m.content}`)
            .join("\n");

        const userPrompt = `Chat context:\n${chatContext}\n\nCurrent code:\n\`\`\`js\n${currentCode}\n\`\`\`\n\nAnalyse this code and return the JSON as specified.`;

        // Abort after TIMEOUT_MS
        // const controller = new AbortController();
        // const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        // const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     signal: controller.signal,
        //     body: JSON.stringify({
        //         system_instruction: { parts: [{ text: ANALYZE_SYSTEM_PROMPT }] },
        //         contents: [{ parts: [{ text: userPrompt }] }],
        //         generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
        //     }),
        // });

        const geminiRes = await chatWithAI({systemMessage:ANALYZE_SYSTEM_PROMPT,userMessage:userPrompt});
        console.log(geminiRes)
        // clearTimeout(timer);

        if (!geminiRes) {
            console.warn("[analyze] Gemini error", "→ using fallback");
            return NextResponse.json(ANALYZE_FALLBACK);
        }

        // const geminiData = await geminiRes.json();
        // const raw = geminiData?.choices?.[0]?.message?.content ?? "";

        // Strip any accidental markdown fences
        const cleaned = geminiRes.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log(parsed)
        return NextResponse.json(parsed);
    } catch (err) {
        console.warn("[analyze] caught error → fallback:", err);
        return NextResponse.json(ANALYZE_FALLBACK);
    }
}
