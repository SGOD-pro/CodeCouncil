// lib/constants.ts — Shared prompts and fallback data

// ── Gemini system prompts ──────────────────────────────────────────────────

export const ANALYZE_SYSTEM_PROMPT = `You are a senior software engineer specialising in code review and debugging.
You will be given a list of chat messages from a collaborative debugging session and the current code being debugged.
Your job is to identify bugs, memory leaks, or logic errors and suggest actionable fixes.

CRITICAL: Your entire response must be valid JSON — no markdown fences, no extra text.
Return exactly this shape:
{
  "analysis": "One paragraph description of the main issue found.",
  "fixes": [
    { "description": "What to fix", "filePath": "path/to/file.ts", "lineNumber": 42 }
  ],
  "confidence": 94
}
confidence is an integer 0-100.`;

export const DOCS_SYSTEM_PROMPT = `You are a technical writer who creates clear, concise README.md files.
You will be given a project name, chat messages from a debugging session, and code.
Write a professional README.md that covers: project overview, the bug that was found and fixed, setup instructions, and contributors.
Return ONLY the raw markdown — no explanation, no fences around the entire output.`;

// ── Fallback responses (used when Gemini fails or times out) ───────────────

export const ANALYZE_FALLBACK = {
    analysis:
        "Memory leak detected in fetchUser function. The uncleared setInterval on line 8 accumulates session references on every call, causing heap exhaustion under concurrent load.",
    fixes: [
        {
            description: "Remove the setInterval and replace with a single async supabase query",
            filePath: "src/auth/authController.js",
            lineNumber: 8,
        },
        {
            description: "Add null check before processData call",
            filePath: "src/auth/session.ts",
            lineNumber: 42,
        },
        {
            description: "Implement garbage collection / cleanup on logout",
            filePath: "src/utils/gc.ts",
            lineNumber: 1,
        },
    ],
    confidence: 94,
};

export const DOCS_FALLBACK = `# CodeCouncil

AI-powered collaborative debugging platform. Built for Konverge 2026.

## What it does

CodeCouncil lets teams debug code together in real-time. An AI timeline tracks every snapshot of your code, detects bugs automatically, and suggests fixes — all inside a shared Monaco editor.

## Bug resolved in this session

**Memory leak in \`fetchUser\`** — An uncleared \`setInterval\` was accumulating session references on every call. Fixed in snapshot v5 by replacing the interval with a single async Supabase query.

| Field | Details |
|---|---|
| Issue | Uncleared \`setInterval\` in \`fetchUser\` |
| Severity | Critical |
| Introduced | Snapshot v2 (10:43 AM) |
| Fixed | Snapshot v5 (11:15 AM) |

## Setup

\`\`\`bash
git clone https://github.com/your-org/codecouncil
cd frontend
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) and join room \`ALPHA-4291\` to see the demo.

## Contributors

- **Arjun** — Identified the loop issue
- **Priya** — Spotted the typo on line 42
- **CodeCouncil AI** — Detected memory leak, suggested refactor

## Tech stack

Next.js · TypeScript · Monaco Editor · Supabase · Gemini AI

---

*Generated automatically by CodeCouncil · Debug smarter, ship faster.*`;
