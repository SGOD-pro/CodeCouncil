"use client";

import { useState, useEffect } from "react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface Fix {
    id: number;
    label: string;
    path: string;
    checked: boolean;
}

// ──────────────────────────────────────────────
// Countdown Timer hook
// ──────────────────────────────────────────────
function useCountdown(initialSeconds: number) {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) return;
        const interval = setInterval(() => {
            setSeconds((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);

    const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    return { hh, mm, ss };
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function Navbar() {
    return (
        <header className="flex items-center justify-between px-6 py-3 border-b border-[#1e2a3a] bg-[#0d1117]">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4h10M3 8h10M3 12h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </div>
                <span className="text-white font-semibold text-lg tracking-tight">CodePulse</span>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-3">
                <button className="relative p-2 rounded-full hover:bg-[#1e2a3a] transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">AD</div>
            </div>
        </header>
    );
}

function HackathonBadge() {
    return (
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Hackathon Mode Active
        </div>
    );
}

function TimerBlock({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="font-mono text-7xl sm:text-8xl font-bold text-amber-400 leading-none tabular-nums" style={{ textShadow: "0 0 40px rgba(251,191,36,0.45)" }}>
                {value}
            </span>
            <span className="mt-2 text-[10px] tracking-[0.25em] uppercase text-slate-500 font-medium">{label}</span>
        </div>
    );
}

function Separator() {
    return (
        <span className="font-mono text-7xl sm:text-8xl font-bold text-amber-400/50 leading-none select-none mb-5">:</span>
    );
}

function CountdownTimer() {
    // Start at 00:47:32 (2852 seconds) as shown in design
    const { hh, mm, ss } = useCountdown(2852);

    return (
        <section className="flex flex-col items-center py-10 gap-3">
            <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">T-Minus</p>
            <div className="flex items-end gap-3">
                <TimerBlock value={hh} label="Hours" />
                <Separator />
                <TimerBlock value={mm} label="Minutes" />
                <Separator />
                <TimerBlock value={ss} label="Seconds" />
            </div>
        </section>
    );
}

function CriticalIssueCard() {
    return (
        <div className="mx-4 sm:mx-auto sm:max-w-2xl rounded-xl border border-[#1e2a3a] bg-[#0d1520] overflow-hidden shadow-xl shadow-black/40">
            <div className="flex flex-col sm:flex-row">
                {/* Left decorative panel */}
                <div className="relative w-full sm:w-40 h-32 sm:h-auto bg-[#08101a] flex-shrink-0 overflow-hidden">
                    {/* Code pattern background */}
                    <div className="absolute inset-0 opacity-20 text-[8px] leading-4 font-mono text-blue-400 p-2 overflow-hidden select-none whitespace-pre">
                        {`const auth = async\n(req, res) => {\n  const session\n  = await getSession\n  (req);\n  if (!session) {\n    return null;\n  }\n  const leak =\n  session.data;\n  // TODO: fix\n  cleanup(leak);\n}`}
                    </div>
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d1520]" />
                    {/* Critical badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-950/80 border border-red-700/50 text-red-400 text-xs font-bold uppercase tracking-wider">
                        🔥 Critical
                    </div>
                </div>

                {/* Right content */}
                <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                    <div>
                        <p className="text-blue-400 text-xs font-medium mb-1">● Issue #4092</p>
                        <h2 className="text-white text-lg font-bold mb-2 leading-snug">Memory Leak in Auth Module</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            High priority memory consumption detected during concurrent user login sessions. Assigned to{" "}
                            <span className="text-blue-300 font-medium">@alex_dev</span>.
                        </p>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
                        {/* Avatars */}
                        <div className="flex items-center gap-1">
                            {["AL", "SA"].map((initials, i) => (
                                <div
                                    key={i}
                                    className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-[#0d1520] flex items-center justify-center text-white text-[10px] font-bold -ml-1 first:ml-0"
                                >
                                    {initials}
                                </div>
                            ))}
                            <div className="w-7 h-7 rounded-full bg-[#1e2a3a] border-2 border-[#0d1520] flex items-center justify-center text-slate-400 text-[10px] font-bold -ml-1">
                                +2
                            </div>
                        </div>

                        {/* Stack Trace button */}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-sm font-semibold shadow-lg shadow-blue-900/30">
                            View Stack Trace
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
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
            className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all duration-150 ${checked
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-600 bg-transparent hover:border-slate-400"
                }`}
        >
            {checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
}

function AISuggestedFixes() {
    const [fixes, setFixes] = useState<Fix[]>([
        { id: 1, label: "Refactor user session storage logic", path: "src/auth/session.ts: line 42", checked: true },
        { id: 2, label: "Implement garbage collection on logout", path: "src/utils/gc.ts: new file", checked: false },
        { id: 3, label: "Verify token expiration headers", path: "src/api/middleware.ts: line 15", checked: false },
    ]);

    const toggle = (id: number) => {
        setFixes((prev) => prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f)));
    };

    return (
        <div className="mx-4 sm:mx-auto sm:max-w-2xl rounded-xl border border-[#1e2a3a] bg-[#0d1520] p-5 shadow-xl shadow-black/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-base">🤖</div>
                    <span className="text-white font-semibold text-base">AI Suggested Fixes</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confidence: 94%
                </span>
            </div>

            {/* Fix items */}
            <ul className="space-y-4">
                {fixes.map((fix) => (
                    <li key={fix.id} className="flex items-start gap-3 group">
                        <Checkbox checked={fix.checked} onChange={() => toggle(fix.id)} />
                        <div className="flex flex-col gap-0.5">
                            <span className={`text-sm font-medium transition-colors ${fix.checked ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                                {fix.label}
                            </span>
                            <span className="text-xs font-mono text-slate-500">{fix.path}</span>
                        </div>
                    </li>
                ))}
            </ul>

            {/* View all */}
            <div className="mt-5 pt-4 border-t border-[#1e2a3a]">
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors float-right">
                    View all 12 suggestions
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    positive?: boolean;
}

function StatCard({ label, value, positive }: StatCardProps) {
    return (
        <div className="flex-1 flex flex-col items-center gap-1 px-6 py-4 rounded-xl border border-[#1e2a3a] bg-[#0d1520]">
            <span className="text-xs tracking-widest uppercase text-slate-500 font-medium">{label}</span>
            <span className={`text-2xl font-bold ${positive ? "text-emerald-400" : "text-white"}`}>{value}</span>
        </div>
    );
}

function BottomStats() {
    return (
        <div className="mx-4 sm:mx-auto sm:max-w-2xl flex gap-3">
            <StatCard label="Velocity" value="+12%" positive />
            <StatCard label="Commits" value="24" />
            <StatCard label="Active" value="8 Devs" />
        </div>
    );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export default function HackathonPage() {
    return (
        <div className="min-h-screen bg-[#080e18] text-white flex flex-col">
            <Navbar />

            <main className="flex flex-col gap-6 py-8">
                {/* Badge */}
                <div className="flex justify-center">
                    <HackathonBadge />
                </div>

                {/* Countdown */}
                <CountdownTimer />

                {/* Critical Issue */}
                <CriticalIssueCard />

                {/* AI Fixes */}
                <AISuggestedFixes />

                {/* Stats */}
                <BottomStats />
            </main>
        </div>
    );
}
