"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface Fix {
    id: number; label: string; path: string; checked: boolean;
}

interface AIMessage {
    id: number; text: string; confidence: number;
}

// ── Accelerated AI fallback rules (no API call needed) ─────────────────────
const FALLBACK_RULES: Record<string, { response: string; confidence: number }> = {
    "memory leak": {
        response: "🤖 Detected: uncleared `setInterval` in `fetchUser` (line 8). Fix: remove the interval and use a single async call. Patch ready in v5 snapshot.",
        confidence: 94,
    },
    "null check": {
        response: "🤖 Null check missing on `userId` param. Add: `if (!userId) throw new Error('userId required')` at the top of `fetchUser`.",
        confidence: 88,
    },
    "session": {
        response: "🤖 Session tokens are not being cleared on logout. Implement `supabase.auth.signOut()` with a cleanup callback in your `useEffect` return.",
        confidence: 82,
    },
    "fix": {
        response: "🤖 Suggested fix: replace `setInterval` with a one-shot `supabase.from('users').select(...).single()`. Already applied in snapshot v5.",
        confidence: 91,
    },
    "default": {
        response: "🤖 Analysing... Issue likely in the auth module. Check session cleanup on logout. See snapshot v3 for the debug trace.",
        confidence: 76,
    },
};

function matchFallback(text: string): { response: string; confidence: number } {
    const lower = text.toLowerCase();
    for (const [key, val] of Object.entries(FALLBACK_RULES)) {
        if (key !== "default" && lower.includes(key)) return val;
    }
    return FALLBACK_RULES["default"];
}

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(initialSeconds: number) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [running, setRunning] = useState(true);

    useEffect(() => {
        if (!running || seconds <= 0) return;
        const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(id);
    }, [running, seconds]);

    const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return { hh, mm, ss, running, setRunning, isExpired: seconds === 0 };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function HackathonBadge() {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", color: "#F59E0B", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", display: "inline-block", boxShadow: "0 0 6px #F59E0B", animation: "pulse 2s infinite" }} />
            Hackathon Mode Active
        </div>
    );
}

function TimerBlock({ value, label }: { value: string; label: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 80, fontWeight: 800, color: "#F59E0B", lineHeight: 1, textShadow: "0 0 40px rgba(245,158,11,0.45)", letterSpacing: "-0.04em" }}>{value}</span>
            <span style={{ marginTop: 6, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#4B5563", fontWeight: 500 }}>{label}</span>
        </div>
    );
}

function Separator() {
    return <span style={{ fontFamily: "monospace", fontSize: 80, fontWeight: 800, color: "rgba(245,158,11,0.4)", lineHeight: 1, marginBottom: 20, letterSpacing: 0 }}>:</span>;
}

function CountdownTimer({ hh, mm, ss, running, setRunning, isExpired }: ReturnType<typeof useCountdown>) {
    return (
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 20px", gap: 10 }}>
            <p style={{ margin: 0, color: "#4B5563", fontSize: 12, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" }}>T-Minus</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <TimerBlock value={hh} label="Hours" />
                <Separator />
                <TimerBlock value={mm} label="Minutes" />
                <Separator />
                <TimerBlock value={ss} label="Seconds" />
            </div>
            {isExpired ? (
                <p style={{ margin: 0, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>⏰ Time&apos;s up!</p>
            ) : (
                <button
                    onClick={() => setRunning((r) => !r)}
                    style={{ marginTop: 4, padding: "5px 16px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "transparent", color: "#F59E0B", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                >
                    {running ? "⏸ Pause" : "▶ Resume"}
                </button>
            )}
        </section>
    );
}

function CriticalIssueCard() {
    return (
        <div style={{ maxWidth: 672, width: "100%", borderRadius: 12, border: "1px solid #2D2D35", background: "#1A1A24", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex" }}>
                {/* Left decoration */}
                <div style={{ position: "relative", width: 140, background: "#0A0A0F", flexShrink: 0, overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, opacity: 0.18, fontFamily: "monospace", fontSize: 8, lineHeight: 1.5, color: "#3B82F6", padding: 8, overflow: "hidden", whiteSpace: "pre", userSelect: "none" }}>
                        {`const auth = async\n(req, res) => {\n  const session\n  = await getSession\n  (req);\n  if (!session) {\n    return null;\n  }\n  const leak =\n  session.data;\n  // TODO: fix\n  cleanup(leak);\n}`}
                    </div>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, #1A1A24)" }} />
                    <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
                        🔥 Critical
                    </div>
                </div>
                {/* Right content */}
                <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                    <div>
                        <p style={{ margin: "0 0 4px", color: "#3B82F6", fontSize: 12, fontWeight: 500 }}>● Issue #4092</p>
                        <h2 style={{ margin: "0 0 8px", color: "#E4E4E7", fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>Memory Leak in Auth Module</h2>
                        <p style={{ margin: 0, color: "#8892A4", fontSize: 13, lineHeight: 1.6 }}>
                            High priority memory consumption during concurrent logins. Assigned to{" "}
                            <span style={{ color: "#93C5FD", fontWeight: 500 }}>@alex_dev</span>.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                            {["AL", "SA"].map((i) => (
                                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#6366F1)", border: "2px solid #1A1A24", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700, marginLeft: -4 }}>
                                    {i}
                                </div>
                            ))}
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2D2D35", border: "2px solid #1A1A24", display: "flex", alignItems: "center", justifyContent: "center", color: "#8892A4", fontSize: 10, fontWeight: 700, marginLeft: -4 }}>
                                +2
                            </div>
                        </div>
                        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#3B82F6", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            View Stack Trace
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: checked ? "none" : "2px solid #2D2D35", background: checked ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
        >
            {checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
}

function AISuggestedFixes({ timerRunning }: { timerRunning: boolean }) {
    const [fixes, setFixes] = useState<Fix[]>([
        { id: 1, label: "Refactor user session storage logic", path: "src/auth/session.ts: line 42", checked: true },
        { id: 2, label: "Implement garbage collection on logout", path: "src/utils/gc.ts: new file", checked: false },
        { id: 3, label: "Verify token expiration headers", path: "src/api/middleware.ts: line 15", checked: false },
    ]);

    // @ai quick input state
    const [aiInput, setAiInput] = useState("");
    const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const sendAI = () => {
        if (!aiInput.trim()) return;
        const text = aiInput.trim();
        setAiInput("");
        setAiLoading(true);
        const delay = timerRunning ? 300 : 1500; // Accelerated AI when timer running
        setTimeout(() => {
            const { response, confidence } = matchFallback(text);
            setAiMessages((prev) => [...prev, { id: Date.now(), text: response, confidence }]);
            setAiLoading(false);
        }, delay);
    };

    return (
        <div style={{ maxWidth: 672, width: "100%", borderRadius: 12, border: "1px solid #2D2D35", background: "#1A1A24", padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🤖</div>
                    <div>
                        <p style={{ margin: 0, color: "#E4E4E7", fontWeight: 600, fontSize: 14 }}>AI Suggested Fixes</p>
                        {timerRunning && <p style={{ margin: 0, fontSize: 10, color: "#10B981", fontWeight: 500 }}>⚡ Accelerated AI — near-instant responses</p>}
                    </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                    Confidence: 94%
                </span>
            </div>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {fixes.map((fix) => (
                    <li key={fix.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <Checkbox checked={fix.checked} onChange={() => setFixes((prev) => prev.map((f) => f.id === fix.id ? { ...f, checked: !f.checked } : f))} />
                        <div>
                            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: fix.checked ? "#E4E4E7" : "#8892A4" }}>{fix.label}</p>
                            <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#4B5563" }}>{fix.path}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {/* AI messages from fallback */}
            {aiMessages.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {aiMessages.map((m) => (
                        <div key={m.id} style={{ background: "linear-gradient(135deg,#0D1B3E,#150D2A)", border: "1px solid #2A3A6A", borderRadius: 10, padding: "10px 14px" }}>
                            <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.6 }}>{m.text}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "#4B5563" }}>Confidence: {m.confidence}%</p>
                        </div>
                    ))}
                </div>
            )}

            {/* @ai quick input */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #2D2D35" }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#4B5563" }}>
                    Ask AI{timerRunning ? " (⚡ accelerated)" : ""} — type a question and press Enter
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                    <input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendAI(); } }}
                        placeholder="e.g. memory leak, fix, null check…"
                        style={{ flex: 1, background: "#0A0A0F", border: "1px solid #2D2D35", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#E4E4E7", outline: "none", caretColor: "#3B82F6" }}
                    />
                    <button
                        onClick={sendAI}
                        disabled={aiLoading || !aiInput.trim()}
                        style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: aiLoading ? "#1A1A24" : "linear-gradient(135deg,#3B82F6,#6366F1)", color: aiLoading ? "#4B5563" : "white", fontSize: 12, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                    >
                        {aiLoading ? "…" : "Ask"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "16px 24px", borderRadius: 12, border: "1px solid #2D2D35", background: "#1A1A24" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: positive ? "#10B981" : "#E4E4E7" }}>{value}</span>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HackathonPage() {
    const router = useRouter();
    const timer = useCountdown(2852);

    return (
        <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#E4E4E7", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 16px 48px" }}>
                {/* Badge */}
                <HackathonBadge />

                {/* Countdown */}
                <CountdownTimer {...timer} />

                {/* Critical issue */}
                <CriticalIssueCard />

                {/* AI Fixes + @ai input */}
                <AISuggestedFixes timerRunning={timer.running && !timer.isExpired} />

                {/* Stats */}
                <div style={{ maxWidth: 672, width: "100%", display: "flex", gap: 12 }}>
                    <StatCard label="Velocity" value="+12%" positive />
                    <StatCard label="Commits" value="24" />
                    <StatCard label="Active" value="8 Devs" />
                </div>

                {/* Generate Summary CTA */}
                <div style={{ maxWidth: 672, width: "100%", borderRadius: 12, border: "1px solid #2D2D35", background: "#1A1A24", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <p style={{ margin: "0 0 4px", color: "#E4E4E7", fontWeight: 600, fontSize: 14 }}>Session complete?</p>
                        <p style={{ margin: 0, color: "#4B5563", fontSize: 12 }}>Generate a full AI summary and export documentation for this session.</p>
                    </div>
                    <button
                        onClick={() => router.push("/doc?from=hackathon")}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9, border: "none", background: "#10B981", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#059669"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#10B981"; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Generate Summary
                    </button>
                </div>
            </main>

            <style>{`
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
            `}</style>
        </div>
    );
}
