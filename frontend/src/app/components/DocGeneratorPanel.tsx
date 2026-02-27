"use client";

import { useState, useEffect, useRef } from "react";

interface DocGeneratorPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const README_CONTENT = `# Project Overview

This project is designed to facilitate real-time collaboration among developers using advanced AI tools.

## Installation

\`\`\`bash
npm install @codepulse/core
\`\`\`

## Features

- **Real-time Sync**: Low latency updates across clients.
- **AI Suggestions**: Smart completion based on context.
- **Secure Access**: Enterprise grade authentication.

## Usage Example

\`\`\`javascript
import { CodeCouncil } from '@codepulse/core';

const council = new CodeCouncil({
  apiKey: 'your-api-key',
  workspace: 'my-project'
});

council.connect();
\`\`\`

## Contributing

Pull requests are welcome. For major changes, please open an issue first.`;

const API_DOCS_CONTENT = `# API Documentation

## Endpoints

### POST /api/generate

Generate documentation from source code.

**Request Body:**
\`\`\`json
{
  "code": "string",
  "type": "readme | api | inline",
  "language": "typescript"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "documentation": "string",
  "tokens_used": 1234
}
\`\`\`

### GET /api/health

Check API health status.

**Response:** \`200 OK\``;

const INLINE_CONTENT = `// DocGeneratorPanel.tsx
// Component for generating AI-powered documentation

/**
 * @component DocGeneratorPanel
 * @description Renders an overlay panel that slides in from the right.
 * Allows users to select documentation types (README, API Docs,
 * Inline Comments) and generates markdown output using AI.
 *
 * @param {boolean} isOpen - Controls panel visibility
 * @param {Function} onClose - Callback fired when panel is closed
 */

// useState manages checkbox selections and generation state
// useEffect drives the slide-in animation via CSS transitions
// The preview renders syntax-highlighted markdown in real time`;

const SCOPE_OPTIONS = [
    {
        id: "readme",
        label: "README",
        description: "Project overview & setup guide",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-400",
        content: README_CONTENT,
        filename: "README.md",
    },
    {
        id: "api",
        label: "API Docs",
        description: "Endpoints & detailed usage",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
        ),
        iconBg: "bg-purple-500/20",
        iconColor: "text-purple-400",
        content: API_DOCS_CONTENT,
        filename: "API_DOCS.md",
    },
    {
        id: "inline",
        label: "Inline Comments",
        description: "Explain complex logic",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-400",
        content: INLINE_CONTENT,
        filename: "inline_comments.ts",
    },
];

function renderMarkdownPreview(content: string) {
    const lines = content.split("\n");
    return lines.map((line, i) => {
        if (line.startsWith("```")) {
            return null; // handled below
        }
        if (line.startsWith("### ")) {
            return (
                <div key={i} className="text-yellow-400 font-mono text-sm mt-3 mb-1">
                    {line}
                </div>
            );
        }
        if (line.startsWith("## ")) {
            return (
                <div key={i} className="text-green-400 font-mono text-sm mt-3 mb-1">
                    {line}
                </div>
            );
        }
        if (line.startsWith("# ")) {
            return (
                <div key={i} className="text-green-400 font-mono text-sm font-bold mt-1 mb-1">
                    {line}
                </div>
            );
        }
        if (line.startsWith("- **") || line.startsWith("- ")) {
            const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong class="text-zinc-100">${m}</strong>`);
            return (
                <div
                    key={i}
                    className="font-mono text-sm text-zinc-300 ml-2"
                    dangerouslySetInnerHTML={{ __html: bold }}
                />
            );
        }
        if (line.trim() === "") {
            return <div key={i} className="h-2" />;
        }
        return (
            <div key={i} className="font-mono text-sm text-zinc-300">
                {line}
            </div>
        );
    });
}

function MarkdownBlock({ content, filename }: { content: string; filename: string }) {
    // Split on triple-backtick blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
        <div className="space-y-0.5">
            {parts.map((part, i) => {
                if (part.startsWith("```")) {
                    const inner = part.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
                    return (
                        <div key={i} className="bg-[#1a1f2e] border border-white/10 rounded-md px-3 py-2 my-2">
                            <code className="font-mono text-xs text-blue-300 whitespace-pre-wrap">{inner.trim()}</code>
                        </div>
                    );
                }
                return <div key={i}>{renderMarkdownPreview(part)}</div>;
            })}
        </div>
    );
}

export default function DocGeneratorPanel({ isOpen, onClose }: DocGeneratorPanelProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(["readme"]));
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            // Small delay to trigger the CSS transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        } else {
            setVisible(false);
            const t = setTimeout(() => setMounted(false), 400);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const toggleOption = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleGenerate = () => {
        if (selected.size === 0 || generating) return;
        setGenerating(true);
        setGenerated(false);
        setProgress(0);

        intervalRef.current = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) {
                    clearInterval(intervalRef.current!);
                    setGenerating(false);
                    setGenerated(true);
                    return 100;
                }
                return p + Math.random() * 12 + 3;
            });
        }, 120);
    };

    const getPreviewContent = () => {
        const activeScopes = SCOPE_OPTIONS.filter((o) => selected.has(o.id));
        if (activeScopes.length === 0) return { content: "", filename: "" };
        // Show first selected
        return { content: activeScopes[0].content, filename: activeScopes[0].filename };
    };

    const handleCopy = () => {
        const { content } = getPreviewContent();
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleExport = () => {
        const { content, filename } = getPreviewContent();
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!mounted) return null;

    const { content, filename } = getPreviewContent();

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-400"
                style={{ opacity: visible ? 1 : 0 }}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 z-50 h-full w-full max-w-[420px] flex flex-col
                   bg-[#12151c] border-l border-white/10 shadow-2xl
                   transition-transform duration-400 ease-in-out"
                style={{ transform: visible ? "translateX(0)" : "translateX(100%)" }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-semibold text-white leading-tight">Documentation</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">AI-Powered Generator</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500
                       hover:text-white hover:bg-white/10 transition-all duration-150"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-5 py-5 space-y-5">
                        {/* Scope Section */}
                        <div>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Scope</p>
                            <p className="text-[13px] text-zinc-400 mb-4">Select what you want to generate.</p>
                            <div className="space-y-2.5">
                                {SCOPE_OPTIONS.map((opt) => {
                                    const isChecked = selected.has(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleOption(opt.id)}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left
                        ${isChecked
                                                    ? "bg-[#1a1f2e] border-blue-500/40 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                                                    : "bg-[#181b24] border-white/8 hover:border-white/16 hover:bg-[#1c1f2a]"
                                                }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.iconBg} ${opt.iconColor}`}
                                            >
                                                {opt.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white">{opt.label}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">{opt.description}</p>
                                            </div>
                                            {/* Custom Checkbox */}
                                            <div
                                                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all duration-150
                          ${isChecked ? "bg-blue-500 border-blue-500" : "bg-transparent border-zinc-600"}`}
                                            >
                                                {isChecked && (
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                                                        <polyline points="2 6 5 9 10 3" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="space-y-2">
                            <button
                                onClick={handleGenerate}
                                disabled={selected.size === 0 || generating}
                                className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                  transition-all duration-200 relative overflow-hidden
                  ${selected.size === 0
                                        ? "bg-blue-500/30 text-blue-300/50 cursor-not-allowed"
                                        : generating
                                            ? "bg-blue-600 text-white cursor-wait"
                                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
                                    }`}
                            >
                                {generating ? (
                                    <>
                                        <svg
                                            className="animate-spin"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                        </svg>
                                        Generating… {Math.min(Math.round(progress), 100)}%
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                        Generate Documentation
                                    </>
                                )}
                                {/* Progress bar for generating */}
                                {generating && (
                                    <div
                                        className="absolute bottom-0 left-0 h-0.5 bg-blue-300/60 transition-all duration-150"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                )}
                            </button>
                            {generating && (
                                <p className="text-xs text-center text-zinc-500 animate-pulse">
                                    AI is analyzing your codebase…
                                </p>
                            )}
                        </div>

                        {/* Preview Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Preview</p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleCopy}
                                        disabled={!generated && content === ""}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                               text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-150
                               disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {copied ? (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        disabled={!generated && content === ""}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                               text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-150
                               disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Export
                                    </button>
                                </div>
                            </div>

                            {/* Preview Box */}
                            <div className="rounded-xl bg-[#0d1017] border border-white/10 overflow-hidden">
                                {/* Fake traffic lights + filename bar */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#111520]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs text-zinc-500 ml-2 font-mono">
                                        {filename || "output.md"}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4 min-h-[280px] max-h-[380px] overflow-y-auto custom-scrollbar">
                                    {!generated && !generating && (
                                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <p className="text-xs text-zinc-600 text-center">
                                                Select options above and click<br />
                                                <span className="text-zinc-500">Generate Documentation</span>
                                            </p>
                                        </div>
                                    )}

                                    {generating && (
                                        <div className="space-y-2 animate-pulse">
                                            {[70, 90, 55, 80, 65, 45, 75].map((w, i) => (
                                                <div
                                                    key={i}
                                                    className="h-3 rounded bg-white/10"
                                                    style={{ width: `${w}%` }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {generated && content && (
                                        <div className="animate-fadeIn">
                                            <MarkdownBlock content={content} filename={filename} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${generating ? "bg-yellow-400 animate-pulse" : generated ? "bg-green-400" : "bg-green-400"}`} />
                        <span className="text-xs text-zinc-500">
                            {generating ? "Generating…" : generated ? "Documentation ready" : "Ready to generate"}
                        </span>
                    </div>
                    <span className="text-xs text-zinc-600">v2.4.0</span>
                </div>
            </div>
        </>
    );
}
