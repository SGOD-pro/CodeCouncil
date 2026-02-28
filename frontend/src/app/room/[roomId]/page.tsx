"use client";

import React from "react";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { getOrDefaultUser } from "../../../lib/user";
import { useRoomData } from "../../../lib/useRoomData";
import type { Message } from "../../../lib/useRoomData";

import {
    Send, X, Bot, FileCode, Play, MoreHorizontal,
    Mic, Paperclip, Smile, Zap,
} from "lucide-react";
import type * as MonacoNS from "monaco-editor";

// Monaco loaded client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#0D1117" }}>
            <span style={{ fontSize: 13, color: "#4B5563" }}>Loading editor…</span>
        </div>
    ),
});

// ── Monaco decoration helpers ──────────────────────────────────────────────
// Lines in v2·Bug snapshot where the memory leak lives (1-indexed)
const BUG_LINES = [8, 9, 10]; // "memory leak here — session never cleared", setInterval lines

function applyBugDecorations(editor: MonacoNS.editor.IStandaloneCodeEditor, monaco: typeof MonacoNS) {
    const newDecorations: MonacoNS.editor.IModelDeltaDecoration[] = BUG_LINES.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
            isWholeLine: true,
            className: "bug-line-highlight",
            glyphMarginClassName: "bug-glyph",
            glyphMarginHoverMessage: { value: "🔴 Memory leak — uncleared setInterval" },
            overviewRuler: { color: "#EF444488", position: monaco.editor.OverviewRulerLane.Left },
        },
    }));
    return editor.deltaDecorations([], newDecorations);
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 32, online }: { initials: string; color: string; size?: number; online?: boolean }) {
    return (
        <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, color, letterSpacing: "0.02em" }}>
                {initials}
            </div>
            {online !== undefined && (
                <div style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: online ? "#22C55E" : "#6B7280", border: "1.5px solid #0A0A0F" }} />
            )}
        </div>
    );
}

// ── Refactor result types ──────────────────────────────────────────────────
interface Fix { description: string; filePath: string; lineNumber: number; }
interface RefactorResult { analysis: string; fixes: Fix[]; confidence: number; fixedCode?: string; }
type RefactorState = { status: "idle" } | { status: "loading" } | { status: "done"; result: RefactorResult };

function ChatMessage({
    msg, isOwn, refactorState, onRefactor,
}: {
    msg: Message;
    isOwn: boolean;
    refactorState?: RefactorState;
    onRefactor?: () => void;
}) {
    if (msg.isAI) {
        const rs = refactorState ?? { status: "idle" };
        return (
            <div style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#4F7EEB22,#A855F722)", border: "1.5px solid #4F7EEB55", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={14} color="#4F7EEB" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, background: "linear-gradient(90deg,#4F7EEB,#A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CodeCouncil AI</span>
                        <span style={{ fontSize: 10, color: "#4B5563" }}>{msg.time}</span>
                        {rs.status === "done" && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 100, background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}>
                                {rs.result.confidence}% confidence
                            </span>
                        )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,#13131E,#1A1A2E)", border: "1px solid #1E1E32", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.6 }}>
                        <p style={{ margin: "0 0 10px" }}>{msg.content}</p>

                        {/* Refactor result — fixes list */}
                        {rs.status === "done" && (
                            <div style={{ marginBottom: 10 }}>
                                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#4B5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Suggested fixes</p>
                                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                                    {rs.result.fixes.map((fix, i) => (
                                        <li key={i} style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 7, padding: "7px 10px" }}>
                                            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 500, color: "#C8D6F0" }}>{fix.description}</p>
                                            <p style={{ margin: 0, fontSize: 10.5, fontFamily: "monospace", color: "#4B5563" }}>{fix.filePath}:{fix.lineNumber}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action buttons / spinner */}
                        {rs.status !== "done" && (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={onRefactor}
                                    disabled={rs.status === "loading"}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: rs.status === "loading" ? "#1E1E2E" : "linear-gradient(135deg,#4F7EEB,#6B8FF0)", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 500, color: rs.status === "loading" ? "#4B5563" : "white", cursor: rs.status === "loading" ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                                >
                                    {rs.status === "loading" ? (
                                        <>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                            Analysing…
                                        </>
                                    ) : "Refactor"}
                                </button>
                                {rs.status === "idle" && (
                                    <button style={{ background: "transparent", border: "1px solid #1E1E32", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 500, color: "#8892A4", cursor: "pointer" }}>Ignore</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    if (isOwn) {
        return (
            <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: "#4B5563" }}>{msg.time}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#8892A4" }}>{msg.author}</span>
                    <Avatar initials={msg.avatar} color={msg.avatarColor} size={24} />
                </div>
                <div style={{ background: "linear-gradient(135deg,#1E2D52,#1E2040)", border: "1px solid #2E3A5C", borderRadius: "12px 4px 12px 12px", padding: "9px 13px", fontSize: 13, color: "#C8D6F0", lineHeight: 1.55, maxWidth: "85%" }}>
                    {msg.content}
                    {msg.codeSnippet && <div style={{ marginTop: 6, background: "#0D1117", borderRadius: 4, padding: "4px 8px", fontFamily: "monospace", fontSize: 11, color: "#86EFAC" }}>{msg.codeSnippet}</div>}
                </div>
            </div>
        );
    }
    return (
        <div style={{ padding: "8px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Avatar initials={msg.avatar} color={msg.avatarColor} size={32} online={true} />
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: msg.avatarColor }}>{msg.author}</span>
                    <span style={{ fontSize: 10, color: "#4B5563" }}>{msg.time}</span>
                </div>
                <div style={{ background: "#1A1A24", border: "1px solid #2D2D35", borderRadius: "4px 12px 12px 12px", padding: "9px 13px", fontSize: 13, color: "#E4E4E7", lineHeight: 1.55 }}>
                    {msg.content}
                    {msg.codeSnippet && <div style={{ marginTop: 6, background: "#0D1117", borderRadius: 4, padding: "4px 8px", fontFamily: "monospace", fontSize: 11, color: "#86EFAC" }}>{msg.codeSnippet}</div>}
                </div>
            </div>
        </div>
    );
}

function FileTabIcon({ type }: { type: string }) {
    const styles: Record<string, React.CSSProperties> = {
        js: { color: "#F0DB4F", background: "#2A2700", border: "1px solid #3D3800" },
        css: { color: "#4F9EEB", background: "#001529", border: "1px solid #002244" },
        html: { color: "#E44D26", background: "#2A0800", border: "1px solid #3D1200" },
    };
    const s = styles[type];
    if (!s) return <FileCode size={12} />;
    return <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 3px", lineHeight: 1, ...s }}>{type.toUpperCase().slice(0, 3)}</span>;
}

const FILE_TABS = [
    { name: "authController.js", icon: "js" },
    { name: "styles.css", icon: "css" },
    { name: "index.html", icon: "html" },
];

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = (params?.roomId as string) ?? "ALPHA-4291";

    // user state — hydrated from localStorage on mount
    const [user, setUserState] = useState(getOrDefaultUser());
    useEffect(() => { setUserState(getOrDefaultUser()); }, []);

    // room data — demo fallback messages, snapshots, timeline events
    const roomData = useRoomData(roomId, user.name, user.initials, user.color);

    // ── State ─────────────────────────────────────────────────────────────
    const [snapshots, setSnapshots] = useState(roomData.snapshots);
    const [snapshotIdx, setSnapshotIdx] = useState(4);
    const firedEvents = useRef<Set<number>>(new Set([4]));

    const [activeTab, setActiveTab] = useState("authController.js");
    const [tabs, setTabs] = useState([
        { name: "authController.js", icon: "js" },
        { name: "styles.css", icon: "css" },
        { name: "index.html", icon: "html" },
    ]);
    const [files, setFiles] = useState<Record<string, string>>({
        "authController.js": roomData.snapshots[4]?.code ?? "",
        "styles.css": "/* Global styles */\n\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  background: #0A0A0F;\n  color: #E4E4E7;\n}",
        "index.html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>CodeCouncil</title>\n</head>\n<body>\n  <div id=\"root\"></div>\n</body>\n</html>",
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const editorRef = useRef<MonacoNS.editor.IStandaloneCodeEditor | null>(null);
    const agentAlertsSent = useRef<Set<string>>(new Set());
    const monacoRef = useRef<typeof MonacoNS | null>(null);
    const decorationIds = useRef<string[]>([]);

    // ── WebSocket: single connection per roomId ────────────────────────────
    useEffect(() => {
        const storedUser: { name: string; color: string } = (() => {
            try { return JSON.parse(localStorage.getItem("codepulse_user") ?? "{}"); }
            catch { return {}; }
        })();
        const userName = storedUser.name || user.name || "Guest";
        const avatarColor = storedUser.color || user.color || "#3B82F6";

        const ws = new WebSocket("ws://localhost:5000");
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[CodeCouncil] WebSocket connected → ws://localhost:5000");
            ws.send(JSON.stringify({ type: "JOIN_ROOM", roomId, userName, avatarColor }));
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data as string);
                switch (data.type) {
                    case "ROOM_STATE":
                        if (data.messages?.length) setMessages(data.messages);
                        if (data.files && Object.keys(data.files).length) {
                            setFiles(data.files);
                            const newTabs = Object.keys(data.files).map((name) => {
                                const ext = name.split(".").pop() ?? "";
                                return { name, icon: ext === "css" ? "css" : ext === "html" ? "html" : "js" };
                            });
                            setTabs(newTabs);
                        }
                        setSnapshots(data.snapshots || []);
                        break;
                    case "NEW_MESSAGE":
                        if (data.message) setMessages((prev) => {
                            if (prev.some((m) => m.id === data.message.id)) return prev;
                            return [...prev, data.message];
                        });
                        break;
                    case "FILE_UPDATED":
                        if (data.fileName) setFiles((prev) => ({ ...prev, [data.fileName]: data.content ?? "" }));
                        break;
                    case "FILE_CREATED":
                        if (data.fileName) {
                            const ext = (data.fileName as string).split(".").pop() ?? "";
                            setTabs((prev) => [...prev, { name: data.fileName, icon: ext === "css" ? "css" : ext === "html" ? "html" : "js" }]);
                            setFiles((prev) => ({ ...prev, [data.fileName]: "" }));
                            setActiveTab(data.fileName);
                        }
                        break;
                    case "FILE_DELETED":
                        if (data.fileName) {
                            setFiles((prev) => {
                                const next = { ...prev };
                                delete next[data.fileName];
                                const firstKey = Object.keys(next)[0];
                                if (firstKey) setActiveTab(firstKey);
                                return next;
                            });
                            setTabs((prev) => {
                                if (prev.length <= 1) return prev;
                                return prev.filter((t) => t.name !== data.fileName);
                            });
                        }
                        break;
                    case "SNAPSHOT_SAVED":
                        if (data.snapshot) setSnapshots((prev) => [...prev, data.snapshot]);
                        break;
                    case "USER_JOINED":
                        console.log(`[CodeCouncil] ${data.userName} joined`);
                        break;
                }
            } catch { /* ignore malformed frames */ }
        };

        ws.onerror = (e) => console.error("[CodeCouncil] WS error:", e);
        ws.onclose = () => console.log("[CodeCouncil] WS closed");

        // Fallback: show demo messages if WS doesn't respond within 1.5s
        const fallbackTimer = setTimeout(() => {
            setMessages((prev) => (prev.length === 0 ? roomData.messages : prev));
        }, 1500);

        return () => {
            clearTimeout(fallbackTimer);
            if (editTimerRef.current) clearTimeout(editTimerRef.current);
            ws.close();
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // ── Sync editor content when timeline slider moves ────────────────────
    useEffect(() => {
        const snap = snapshots[snapshotIdx];
        if (!snap) return;
        // If snapshot has a fileName, switch to that tab; else default to authController.js
        const fileName = (snap as { fileName?: string; code: string }).fileName ?? "authController.js";
        setFiles((prev) => ({ ...prev, [fileName]: snap.code }));
        setActiveTab(fileName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [snapshotIdx]);

    // ── Monaco decorations on snapshot change ─────────────────────────────
    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;
        decorationIds.current = editor.deltaDecorations(decorationIds.current, []);
        if (snapshotIdx === 1) decorationIds.current = applyBugDecorations(editor, monaco);
    }, [snapshotIdx]);

    // ── Timeline AI chat bubble injection ─────────────────────────────────
    useEffect(() => {
        const event = roomData.timelineEvents.find((e) => e.snapshot === snapshotIdx);
        if (!event || firedEvents.current.has(snapshotIdx)) return;
        firedEvents.current.add(snapshotIdx);
        setMessages((prev) => [...prev, {
            id: Date.now(), type: "ai", author: "CodeCouncil AI",
            avatar: "AI", avatarColor: "#4F7EEB",
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            content: event.message, isAI: true,
        }]);
    }, [snapshotIdx, roomData.timelineEvents]);

    // ── Auto-scroll chat ───────────────────────────────────────────────────
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // ── Proactive background agent (runs every 30s) ────────────────────────
    useEffect(() => {
        const agentInterval = setInterval(() => {
            const code = files[activeTab] ?? "";
            const bugPatterns: { pattern: RegExp; issue: string }[] = [
                { pattern: /setInterval/g, issue: "Memory leak: setInterval without cleanup" },
                { pattern: /\.then\(.*\)(?!\.catch)/g, issue: "Unhandled promise rejection" },
                { pattern: /console\.log/g, issue: "Debug logs in production code" },
                { pattern: /var /g, issue: "Legacy var declaration detected" },
            ];
            bugPatterns.forEach(({ pattern, issue }) => {
                pattern.lastIndex = 0; // reset stateful regex
                if (pattern.test(code) && !agentAlertsSent.current.has(issue)) {
                    agentAlertsSent.current.add(issue);
                    setMessages((prev) => [...prev, {
                        id: Date.now(), type: "ai" as const, author: "CodeCouncil AI",
                        avatar: "AI", avatarColor: "#8B5CF6",
                        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                        content: `🤖 Agent detected: ${issue} in ${activeTab}. This was likely introduced in the current edit.`,
                        isAI: true,
                    }]);
                }
            });

            // Inactivity check — no messages in last 5 min
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (!lastMsg) return prev;
                const lastTime = new Date(`1970/01/01 ${lastMsg.time}`).getTime();
                const nowTime = new Date(`1970/01/01 ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`).getTime();
                const diff = Math.abs(nowTime - lastTime);
                if (diff > 300000 && !agentAlertsSent.current.has("inactivity")) {
                    agentAlertsSent.current.add("inactivity");
                    return [...prev, {
                        id: Date.now(), type: "ai" as const, author: "CodeCouncil AI",
                        avatar: "AI", avatarColor: "#8B5CF6",
                        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                        content: "⚡ Agent: Session inactive for 5 minutes. Last open issue: authController.js null check. Resume?",
                        isAI: true,
                    }];
                }
                return prev;
            });
        }, 30000);

        return () => clearInterval(agentInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files, activeTab]);

    // ── Editor onChange: update local files + debounced UPDATE_FILE ───────
    const handleEditorChange = useCallback((value: string | undefined) => {
        const content = value ?? "";
        setFiles((prev) => ({ ...prev, [activeTab]: content }));
        if (editTimerRef.current) clearTimeout(editTimerRef.current);
        editTimerRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "UPDATE_FILE", roomId, fileName: activeTab, content }));
            }
        }, 1500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, roomId]);

    // ── File operations ────────────────────────────────────────────────────
    const addFile = () => {
        const name = window.prompt("New filename (e.g. utils.js):")?.trim();
        if (!name) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "CREATE_FILE", roomId, fileName: name }));
        }
        // Optimistic local update
        const ext = name.split(".").pop() ?? "";
        const icon = ext === "css" ? "css" : ext === "html" ? "html" : "js";
        setTabs((prev) => [...prev, { name, icon }]);
        setFiles((prev) => ({ ...prev, [name]: "" }));
        setActiveTab(name);
    };

    const closeFile = (name: string) => {
        if (Object.keys(files).length <= 1) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "DELETE_FILE", roomId, fileName: name }));
        }
        const idx = tabs.findIndex((t) => t.name === name);
        const next = tabs[idx + 1]?.name ?? tabs[idx - 1]?.name;
        setTabs((prev) => prev.filter((t) => t.name !== name));
        setFiles((prev) => { const copy = { ...prev }; delete copy[name]; return copy; });
        if (activeTab === name) setActiveTab(next);
    };

    // ── Save Snapshot ──────────────────────────────────────────────────────
    const saveSnapshot = () => {
        const label = `v${snapshots.length + 1}·Edit`;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "SAVE_SNAPSHOT", roomId,
                fileName: activeTab,
                content: files[activeTab] ?? "",
                label,
            }));
        }
        // Optimistic local snapshot
        setSnapshots((prev) => [...prev, { label, color: "#3B82F6", code: files[activeTab] ?? "" }]);
        setSnapshotIdx((prev) => prev + 1);
    };

    // ── Send message ───────────────────────────────────────────────────────
    const sendMessage = useCallback(() => {
        if (!input.trim()) return;
        const content = input.trim();
        setInput("");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SEND_MESSAGE", roomId, userName: user.name, avatarColor: user.color, content }));
        }
    }, [input, user, roomId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const snapshot = snapshots[snapshotIdx] ?? snapshots[0];

    // ── Refactor + Ask AI ──────────────────────────────────────────────────
    const [refactorStates, setRefactorStates] = useState<Record<number, RefactorState>>({});
    const handleRefactor = useCallback(async (msgId: number) => {
        setRefactorStates((prev) => ({ ...prev, [msgId]: { status: "loading" } }));
        try {
            const currentCode = files[activeTab] ?? "";
            const res = await fetch("/api/ai/analyze", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: messages.slice(-10).map((m) => ({ author: m.author, content: m.content })), currentCode }),
            });
            const data: RefactorResult = await res.json();
            setRefactorStates((prev) => ({ ...prev, [msgId]: { status: "done", result: data } }));

            // Replace file content with AI-fixed version
            const fixedCode = data.fixedCode ||
                currentCode.replace("cont ", "const ") + "\n// Fixed: " + (data.fixes?.[0]?.description ?? "AI applied fix");

            setFiles((prev) => ({ ...prev, [activeTab]: fixedCode }));

            const label = "AI Fix · " + new Date().toLocaleTimeString();
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "UPDATE_FILE", roomId, fileName: activeTab, content: fixedCode, userName: "CodeCouncil AI" }));
                wsRef.current.send(JSON.stringify({ type: "SAVE_SNAPSHOT", roomId, fileName: activeTab, content: fixedCode, label }));
            }
            setSnapshots((prev) => [...prev, { label, color: "#8B5CF6", code: fixedCode }]);
            setSnapshotIdx((prev) => prev + 1);
        } catch {
            setRefactorStates((prev) => ({ ...prev, [msgId]: { status: "idle" } }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, files, activeTab, roomId]);

    const [aiThinking, setAiThinking] = useState(false);
    const handleAskAI = useCallback(async () => {
        const code = files[activeTab] ?? "";
        if (!code.trim()) return;
        setAiThinking(true);
        const thinkId = Date.now();
        setMessages((prev) => [...prev, {
            id: thinkId, type: "ai" as const, author: "CodeCouncil AI",
            avatar: "AI", avatarColor: "#4F7EEB",
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            content: `Analysing \`${activeTab}\`…`, isAI: false,
        }]);
        try {
            const res = await fetch("/api/ai/analyze", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: messages.map((m) => ({ author: m.author, content: m.content })), currentCode: code }),
            });
            const data: RefactorResult = await res.json();
            const summary = [data.analysis, ...(data.fixes ?? []).map((f) => `• ${f.description} (${f.filePath}:${f.lineNumber})`)].join("\n");
            setMessages((prev) => prev.map((m) => m.id === thinkId ? { ...m, content: summary, isAI: true } : m));
        } catch {
            setMessages((prev) => prev.map((m) => m.id === thinkId ? { ...m, content: "AI unavailable — check your API key." } : m));
        } finally { setAiThinking(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files, activeTab, messages]);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0A0A0F", overflow: "hidden" }}>
            <Navbar />

            {/* Sub-header: room info bar */}
            <div style={{ height: 44, background: "#0D0D18", borderBottom: "1px solid #2D2D35", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1A24", border: "1px solid #2D2D35", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600, color: "#E4E4E7" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 6px #22C55E" }} />
                    #{roomId}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1A24", border: "1px solid #2D2D35", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#8892A4" }}>
                    3 Online
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#0D1B3E,#150D2A)", border: "1px solid #2A3A6A", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 500, color: "#A8C4FF" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F7EEB", display: "inline-block" }} />
                    AI Active
                </div>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => router.push("/hackathon")}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#F59E0B", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.18)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
                >
                    <Zap size={13} />
                    Hackathon Mode
                </button>
            </div>

            {/* Main 2-column layout */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

                {/* ── Left: Chat ── */}
                <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #2D2D35", background: "#0C0C16" }}>
                    <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid #1A1A24" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#4B5563", textTransform: "uppercase" }}>Team Chat</span>
                        <span style={{ fontSize: 11, color: "#4B5563" }}>#{roomId}</span>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
                        {(() => {
                            const currentUserName = (() => {
                                try { return JSON.parse(localStorage.getItem("codepulse_user") ?? "{}").name ?? ""; }
                                catch { return ""; }
                            })();
                            return messages.map((msg, index) => {
                                const isOwn = msg.author === currentUserName;
                                return (
                                    <ChatMessage
                                        key={`${msg.id}-${index}`}
                                        msg={msg}
                                        isOwn={isOwn}
                                        refactorState={refactorStates[msg.id]}
                                        onRefactor={msg.isAI ? () => handleRefactor(msg.id) : undefined}
                                    />
                                );
                            });
                        })()}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: "10px 12px", borderTop: "1px solid #1A1A24", background: "#0C0C16" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1A1A24", border: "1px solid #2D2D35", borderRadius: 10, padding: "6px 8px 6px 12px" }}>
                            <input
                                type="text" value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message…"
                                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#E4E4E7", caretColor: "#4F7EEB" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, borderRadius: 5, display: "flex" }}><Mic size={14} /></button>
                                <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, borderRadius: 5, display: "flex" }}><Paperclip size={14} /></button>
                                <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, borderRadius: 5, display: "flex" }}><Smile size={14} /></button>
                                <button
                                    onClick={sendMessage}
                                    style={{ width: 28, height: 28, background: input.trim() ? "linear-gradient(135deg,#4F7EEB,#6B8FF0)" : "#1A1A2E", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                                >
                                    <Send size={13} color={input.trim() ? "white" : "#2E2E4A"} style={{ transform: "translateX(1px)" }} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Editor + Timeline ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0B0B14" }}>
                    {/* File tabs */}
                    <div style={{ height: 40, display: "flex", alignItems: "stretch", borderBottom: "1px solid #2D2D35", background: "#0D0D18", overflowX: "auto", flexShrink: 0 }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px 0 14px", background: "transparent", border: "none", borderBottom: activeTab === tab.name ? "2px solid #4F7EEB" : "2px solid transparent", color: activeTab === tab.name ? "#E4E4E7" : "#4B5563", fontSize: 12, fontWeight: activeTab === tab.name ? 500 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                                <FileTabIcon type={tab.icon} />
                                {tab.name}
                                <span
                                    onClick={(e) => { e.stopPropagation(); closeFile(tab.name); }}
                                    title="Close file"
                                    style={{ marginLeft: 4, display: "flex", alignItems: "center", opacity: 0.4, cursor: "pointer", borderRadius: 3, padding: "1px 2px" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
                                >
                                    <X size={10} />
                                </span>
                            </button>
                        ))}
                        <button
                            onClick={addFile}
                            title="New file"
                            style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "transparent", border: "none", color: "#4B5563", fontSize: 16, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                        >+</button>
                        <div style={{ flex: 1 }} />
                        {/* 💾 Save Snapshot button */}
                        <button
                            onClick={saveSnapshot}
                            title="Save snapshot to timeline"
                            style={{ display: "flex", alignItems: "center", gap: 4, margin: "0 4px", padding: "4px 10px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, color: "#60A5FA", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.22)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.12)")}
                        >
                            💾 Save
                        </button>
                        {/* Ask AI button */}
                        <button
                            onClick={handleAskAI}
                            disabled={aiThinking}
                            title="Ask AI to analyse current file"
                            style={{ display: "flex", alignItems: "center", gap: 5, margin: "0 8px", padding: "4px 10px", background: aiThinking ? "#1A1A2E" : "rgba(79,126,235,0.12)", border: "1px solid rgba(79,126,235,0.3)", borderRadius: 6, color: aiThinking ? "#4B5563" : "#7BA4F5", fontSize: 11, fontWeight: 600, cursor: aiThinking ? "default" : "pointer", flexShrink: 0, transition: "all 0.15s" }}
                            onMouseEnter={(e) => { if (!aiThinking) e.currentTarget.style.background = "rgba(79,126,235,0.2)"; }}
                            onMouseLeave={(e) => { if (!aiThinking) e.currentTarget.style.background = "rgba(79,126,235,0.12)"; }}
                        >
                            <Bot size={12} />
                            {aiThinking ? "Analysing…" : "Ask AI"}
                        </button>
                    </div>

                    {/* Monaco editor */}
                    <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                        {/* Bug annotation banner — visible only on snapshot 1 */}
                        {snapshots[snapshotIdx]?.label?.includes("Bug") && (
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, background: "linear-gradient(90deg,#2A0A0A,#1A0808)", borderBottom: "1px solid #EF444455", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#FCA5A5" }}>
                                <span style={{ fontSize: 14 }}>🔴</span>
                                <strong>Bug detected on lines 8–10:</strong> Uncleared <code style={{ background: "#3A0808", padding: "1px 4px", borderRadius: 3 }}>setInterval</code> — memory leak
                            </div>
                        )}
                        <MonacoEditor
                            height="100%"
                            path={activeTab}
                            language={activeTab.endsWith(".css") ? "css" : activeTab.endsWith(".html") ? "html" : "javascript"}
                            value={files[activeTab] ?? ""}
                            theme="vs-dark"
                            onChange={handleEditorChange}
                            options={{
                                fontSize: 13.5,
                                fontFamily: "'JetBrains Mono','Cascadia Code',monospace",
                                lineHeight: 22,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                                padding: { top: snapshotIdx === 1 && activeTab === "authController.js" ? 42 : 12, bottom: 12 },
                                readOnly: false,
                                contextmenu: false,
                                overviewRulerLanes: 1,
                                glyphMargin: true,
                                scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                            }}
                            beforeMount={(monaco) => {
                                monaco.editor.defineTheme("codepulse-dark", {
                                    base: "vs-dark", inherit: true,
                                    rules: [
                                        { token: "keyword", foreground: "C084FC" },
                                        { token: "string", foreground: "86EFAC" },
                                        { token: "comment", foreground: "4B5563", fontStyle: "italic" },
                                        { token: "number", foreground: "F59E0B" },
                                        { token: "identifier", foreground: "93C5FD" },
                                    ],
                                    colors: {
                                        "editor.background": "#0B0B14",
                                        "editor.foreground": "#E4E4E7",
                                        "editor.lineHighlightBackground": "#1A1A24",
                                        "editor.selectionBackground": "#2E3A5C",
                                        "editorLineNumber.foreground": "#2E3550",
                                        "editorLineNumber.activeForeground": "#4F7EEB",
                                        "editorCursor.foreground": "#4F7EEB",
                                        "editorGutter.background": "#0B0B14",
                                        // Bug highlight class colours
                                        "editor.wordHighlightBackground": "#EF444422",
                                    },
                                });
                            }}
                            onMount={(editor, monaco) => {
                                monaco.editor.setTheme("codepulse-dark");
                                editorRef.current = editor;
                                monacoRef.current = monaco;

                                // Add inline CSS for decoration classes
                                const style = document.createElement("style");
                                style.textContent = `
                                    .bug-line-highlight { background: rgba(239,68,68,0.08) !important; border-left: 2px solid #EF4444 !important; }
                                    .bug-glyph::before  { content: "🔴"; font-size: 11px; margin-left: 2px; }
                                `;
                                document.head.appendChild(style);

                                // Apply decorations if we're already on snapshot 1
                                if (snapshotIdx === 1) {
                                    decorationIds.current = applyBugDecorations(editor, monaco);
                                }
                            }}
                        />
                    </div>

                    {/* ── Timeline ── */}
                    <div style={{ background: "#0D0D18", borderTop: "1px solid #2D2D35", padding: "10px 16px 14px", flexShrink: 0 }}>
                        {/* Snapshot label buttons */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                            {snapshots.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSnapshotIdx(i)}
                                    style={{
                                        flex: 1, padding: "5px 4px", borderRadius: 6, border: "none", cursor: "pointer",
                                        fontSize: 10, fontWeight: 600, transition: "all 0.15s",
                                        background: snapshotIdx === i ? `${s.color}22` : "transparent",
                                        color: snapshotIdx === i ? s.color : "#4B5563",
                                        outline: snapshotIdx === i ? `1px solid ${s.color}55` : "1px solid transparent",
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        {/* Slider */}
                        <input
                            type="range" min={0} max={snapshots.length - 1} value={snapshotIdx}
                            onChange={(e) => setSnapshotIdx(Number(e.target.value))}
                            style={{ width: "100%", accentColor: snapshot.color, cursor: "pointer" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "monospace" }}>10:00 AM</span>
                            <span style={{ fontSize: 10, color: snapshot.color, fontFamily: "monospace", fontWeight: 600 }}>{snapshot.label}</span>
                            <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "monospace" }}>Now</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
