// app/api/ai/docs/route.ts — README generation via Gemini with hardcoded fallback

import { NextRequest, NextResponse } from "next/server";
import { DOCS_SYSTEM_PROMPT, DOCS_FALLBACK } from "../../../../lib/constants";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const TIMEOUT_MS = 5000;

export async function POST(req: NextRequest) {
    try {
        const { projectName = "CodeCouncil", messages = [], code = "" } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ markdown: DOCS_FALLBACK });
        }

        const chatContext = messages
            .map((m: { author: string; content: string }) => `${m.author}: ${m.content}`)
            .join("\n");

        const userPrompt = `Project: ${projectName}\n\nDebug session chat:\n${chatContext}\n\nFinal code:\n\`\`\`js\n${code}\n\`\`\`\n\nWrite the README.md now.`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                system_instruction: { parts: [{ text: DOCS_SYSTEM_PROMPT }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: { temperature: 0.4 },
            }),
        });

        clearTimeout(timer);

        if (!geminiRes.ok) {
            console.warn("[docs] Gemini error", geminiRes.status, "→ using fallback");
            return NextResponse.json({ markdown: DOCS_FALLBACK });
        }

        const geminiData = await geminiRes.json();
        const markdown =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? DOCS_FALLBACK;

        return NextResponse.json({ markdown });
    } catch (err) {
        console.warn("[docs] caught error → fallback:", err);
        return NextResponse.json({ markdown: DOCS_FALLBACK });
    }
}
