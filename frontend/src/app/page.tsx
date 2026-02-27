"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import {
  Settings,
  Send,
  ChevronRight,
  X,
  Bot,
  Users,
  Zap,
  Hash,
  FileCode,
  Play,
  MoreHorizontal,
  Mic,
  Paperclip,
  Smile,
} from "lucide-react";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ background: "#0D1117" }}
    >
      <div className="text-sm" style={{ color: "#4B5563" }}>
        Loading editor…
      </div>
    </div>
  ),
});

// ─── Types ───────────────────────────────────────────────────────────────────
type MessageType = "user" | "other" | "ai";

interface Message {
  id: number;
  type: MessageType;
  author: string;
  avatar: string;
  avatarColor: string;
  time: string;
  content: string;
  codeSnippet?: string;
  isAI?: boolean;
  aiActions?: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    type: "other",
    author: "Arjun",
    avatar: "AR",
    avatarColor: "#4F7EEB",
    time: "10:42 AM",
    content:
      "Hey, checking the new function now. I think we need to optimize the loop.",
  },
  {
    id: 2,
    type: "other",
    author: "Priya",
    avatar: "PR",
    avatarColor: "#22C55E",
    time: "10:45 AM",
    content: "I think line 42 has a typo. Should look like this:",
    codeSnippet: "const result = processData(input);",
  },
  {
    id: 3,
    type: "user",
    author: "You",
    avatar: "YO",
    avatarColor: "#A855F7",
    time: "10:48 AM",
    content: "Good catch, fixing it. Pushing the patch to the staging branch.",
  },
  {
    id: 4,
    type: "ai",
    author: "CodePulse AI",
    avatar: "AI",
    avatarColor: "#4F7EEB",
    time: "Just now",
    content:
      "I've detected a potential memory leak in the `fetchUser` function. Would you like me to refactor it?",
    isAI: true,
    aiActions: ["Refactor", "Ignore"],
  },
];

const FILE_TABS = [
  { name: "authController.js", icon: "js", active: true },
  { name: "styles.css", icon: "css", active: false },
  { name: "index.html", icon: "html", active: false },
];

const INITIAL_CODE = `import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AuthComponent() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({ email });
    /* Typo detected: processData is undefined here */
    const result = processData(input);
    
    if (error) {
        alert(error.error_description || error.message);
    } else {
        alert('Check your email for the login link!');
    }

    setLoading(false);
  };
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  initials,
  color,
  size = 32,
  online,
}: {
  initials: string;
  color: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `${color}22`,
          border: `1.5px solid ${color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.35,
          fontWeight: 600,
          color: color,
          letterSpacing: "0.02em",
        }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: online ? "#22C55E" : "#6B7280",
            border: "1.5px solid #0A0A0F",
          }}
        />
      )}
    </div>
  );
}

function AiBotAvatar() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4F7EEB22, #A855F722)",
        border: "1.5px solid #4F7EEB55",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Bot size={14} color="#4F7EEB" />
    </div>
  );
}

function CodeBubble({ code }: { code: string }) {
  return (
    <div className="code-bubble" style={{ marginTop: 6 }}>
      {code}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.type === "user";

  if (msg.isAI) {
    return (
      <div
        className="message-row"
        style={{
          padding: "10px 12px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <AiBotAvatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: "linear-gradient(90deg, #4F7EEB, #A855F7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CodePulse AI
            </span>
            <span style={{ fontSize: 10, color: "#4B5563" }}>{msg.time}</span>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #13131E, #1A1A2E)",
              border: "1px solid #1E1E32",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12.5,
              color: "#CBD5E1",
              lineHeight: 1.6,
            }}
          >
            <p>
              I&apos;ve detected a potential memory leak in the{" "}
              <code
                style={{
                  background: "#0D1117",
                  color: "#C083E4",
                  padding: "1px 5px",
                  borderRadius: 3,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                }}
              >
                fetchUser
              </code>{" "}
              function. Would you like me to refactor it?
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                style={{
                  background: "linear-gradient(135deg, #4F7EEB, #6B8FF0)",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "white",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.opacity = "0.85")
                }
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Refactor
              </button>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid #1E1E32",
                  borderRadius: 6,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#8892A4",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = "#2E2E4A")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = "#1E1E32")
                }
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div
        className="message-row"
        style={{
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 10, color: "#4B5563" }}>{msg.time}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#8892A4" }}>
            {msg.author}
          </span>
          <Avatar initials={msg.avatar} color={msg.avatarColor} size={24} />
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #1E2D52, #1E2040)",
            border: "1px solid #2E3A5C",
            borderRadius: "12px 4px 12px 12px",
            padding: "9px 13px",
            fontSize: 13,
            color: "#C8D6F0",
            lineHeight: 1.55,
            maxWidth: "85%",
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="message-row"
      style={{
        padding: "8px 12px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <Avatar
        initials={msg.avatar}
        color={msg.avatarColor}
        size={32}
        online={true}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: msg.avatarColor,
            }}
          >
            {msg.author}
          </span>
          <span style={{ fontSize: 10, color: "#4B5563" }}>{msg.time}</span>
        </div>
        <div
          style={{
            background: "#13131E",
            border: "1px solid #16162A",
            borderRadius: "4px 12px 12px 12px",
            padding: "9px 13px",
            fontSize: 13,
            color: "#CBD5E1",
            lineHeight: 1.55,
          }}
        >
          {msg.content}
          {msg.codeSnippet && <CodeBubble code={msg.codeSnippet} />}
        </div>
      </div>
    </div>
  );
}

function FileTabIcon({ type }: { type: string }) {
  if (type === "js")
    return (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#F0DB4F",
          background: "#2A2700",
          border: "1px solid #3D3800",
          borderRadius: 3,
          padding: "1px 3px",
          lineHeight: 1,
        }}
      >
        JS
      </span>
    );
  if (type === "css")
    return (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#4F9EEB",
          background: "#001529",
          border: "1px solid #002244",
          borderRadius: 3,
          padding: "1px 3px",
          lineHeight: 1,
        }}
      >
        CSS
      </span>
    );
  if (type === "html")
    return (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#E44D26",
          background: "#2A0800",
          border: "1px solid #3D1200",
          borderRadius: 3,
          padding: "1px 3px",
          lineHeight: 1,
        }}
      >
        HTM
      </span>
    );
  return <FileCode size={12} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("authController.js");
  const [sliderValue, setSliderValue] = useState(85);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      type: "user",
      author: "You",
      avatar: "YO",
      avatarColor: "#A855F7",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      content: input.trim(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Timeline time label based on slider
  const sliderTime = () => {
    const startMs = new Date().setHours(10, 0, 0, 0);
    const nowMs = new Date().setHours(11, 30, 0, 0);
    const ms = startMs + ((nowMs - startMs) * sliderValue) / 100;
    return new Date(ms).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          height: 52,
          background: "#0D0D18",
          borderBottom: "1px solid #1E1E32",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 16,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #4F7EEB, #A855F7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={14} color="white" fill="white" />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              background: "linear-gradient(90deg, #E2E8F0, #8892A4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CodePulse
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "#1E1E32" }} />

        {/* Center badges */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 8 }}>
          {/* Room badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#13131E",
              border: "1px solid #1E1E32",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "#C8D6F0",
            }}
          >
            <Hash size={13} color="#8892A4" />
            Room 101
          </div>

          {/* Online badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#13131E",
              border: "1px solid #1E1E32",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "#C8D6F0",
            }}
          >
            <Users size={13} color="#8892A4" />
            3 Online
          </div>

          {/* AI Active badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #0D1B3E, #150D2A)",
              border: "1px solid #2A3A6A",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "#A8C4FF",
            }}
          >
            <span
              className="ai-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4F7EEB",
                display: "inline-block",
              }}
            />
            AI Active
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#4B5563",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#8892A4")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#4B5563")}
          >
            <Settings size={18} />
          </button>
          <Avatar initials="YO" color="#A855F7" size={32} online={true} />
        </div>
      </header>

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* ── Left Panel: Team Chat ── */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #1E1E32",
            background: "#0C0C16",
          }}
        >
          {/* Chat header */}
          <div
            style={{
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              borderBottom: "1px solid #16162A",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#4B5563",
                textTransform: "uppercase",
              }}
            >
              Team Chat
            </span>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "#4F7EEB",
                fontWeight: 500,
              }}
            >
              View All
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #16162A",
              background: "#0C0C16",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#13131E",
                border: "1px solid #1E1E32",
                borderRadius: 10,
                padding: "6px 8px 6px 12px",
                transition: "border-color 0.15s",
              }}
              onFocus={() => { }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or /command..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#C8D6F0",
                  caretColor: "#4F7EEB",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#4B5563",
                    padding: 4,
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Smile size={15} />
                </button>
                <button
                  onClick={sendMessage}
                  style={{
                    width: 28,
                    height: 28,
                    background: input.trim()
                      ? "linear-gradient(135deg, #4F7EEB, #6B8FF0)"
                      : "#1A1A2E",
                    border: "none",
                    borderRadius: 7,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  <Send
                    size={13}
                    color={input.trim() ? "white" : "#2E2E4A"}
                    style={{ transform: "translateX(1px)" }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Monaco Editor ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background: "#0B0B14",
          }}
        >
          {/* File Tabs */}
          <div
            style={{
              height: 44,
              display: "flex",
              alignItems: "stretch",
              borderBottom: "1px solid #1E1E32",
              background: "#0D0D18",
              overflowX: "auto",
            }}
          >
            {FILE_TABS.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.name
                      ? "2px solid #4F7EEB"
                      : "2px solid transparent",
                  color:
                    activeTab === tab.name ? "#E2E8F0" : "#4B5563",
                  fontSize: 12.5,
                  fontWeight: activeTab === tab.name ? 500 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseOver={(e) => {
                  if (activeTab !== tab.name)
                    e.currentTarget.style.color = "#8892A4";
                }}
                onMouseOut={(e) => {
                  if (activeTab !== tab.name)
                    e.currentTarget.style.color = "#4B5563";
                }}
              >
                <FileTabIcon type={tab.icon} />
                {tab.name}
                {activeTab === tab.name && (
                  <span
                    style={{
                      marginLeft: 2,
                      color: "#4B5563",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={12} />
                  </span>
                )}
              </button>
            ))}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 12px",
              }}
            >
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#4B5563",
                  padding: 4,
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Play size={14} />
              </button>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#4B5563",
                  padding: 4,
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <MonacoEditor
              height="100%"
              defaultLanguage="javascript"
              value={INITIAL_CODE}
              theme="vs-dark"
              options={{
                fontSize: 13.5,
                fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
                fontLigatures: true,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                contextmenu: false,
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  verticalScrollbarSize: 4,
                  horizontalScrollbarSize: 4,
                },
              }}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("codepulse-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    { token: "keyword", foreground: "C084FC" },
                    { token: "string", foreground: "86EFAC" },
                    { token: "comment", foreground: "4B5563", fontStyle: "italic" },
                    { token: "number", foreground: "F59E0B" },
                    { token: "identifier", foreground: "93C5FD" },
                    { token: "type", foreground: "34D399" },
                    { token: "function", foreground: "60A5FA" },
                    { token: "delimiter", foreground: "8892A4" },
                  ],
                  colors: {
                    "editor.background": "#0B0B14",
                    "editor.foreground": "#C8D6F0",
                    "editor.lineHighlightBackground": "#13131E",
                    "editor.selectionBackground": "#2E3A5C",
                    "editorLineNumber.foreground": "#2E3550",
                    "editorLineNumber.activeForeground": "#4F7EEB",
                    "editor.findMatchBackground": "#F59E0B33",
                    "editorCursor.foreground": "#4F7EEB",
                    "editorGutter.background": "#0B0B14",
                    "editorWidget.background": "#13131E",
                    "editorWidget.border": "#1E1E32",
                  },
                });
                monaco.editor.setTheme("codepulse-dark");
              }}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme("codepulse-dark");

                // Highlight line 17 (comment / bug line)
                editor.deltaDecorations(
                  [],
                  [
                    {
                      range: new monaco.Range(17, 1, 17, 200),
                      options: {
                        isWholeLine: true,
                        className: "",
                        inlineClassName: "",
                        linesDecorationsClassName: "",
                        overviewRuler: {
                          color: "#EF4444",
                          position: monaco.editor.OverviewRulerLane.Right,
                        },
                        minimap: {
                          color: "#EF4444",
                          position: 1,
                        },
                      },
                    },
                  ]
                );
              }}
            />

            {/* Floating collaborator cursor label */}
            <div
              style={{
                position: "absolute",
                top: 242,
                left: 480,
                background: "#22C55E",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "4px 4px 4px 0",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(34,197,94,0.4)",
                zIndex: 5,
              }}
            >
              Priya
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div
        style={{
          height: 56,
          background: "#0D0D18",
          borderTop: "1px solid #1E1E32",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        {/* Time labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, color: "#4B5563", fontFamily: "JetBrains Mono, monospace" }}>
            {sliderTime()}
          </span>
          <span style={{ fontSize: 11, color: "#4B5563", fontFamily: "JetBrains Mono, monospace" }}>
            Current
          </span>
        </div>

        {/* Slider + markers */}
        <div style={{ position: "relative" }}>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            style={{
              width: "100%",
            }}
          />

          {/* Markers below */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 3,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "35%",
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "#EF4444",
                fontWeight: 500,
                letterSpacing: "0.03em",
              }}
            >
              Bug intro
            </span>
            <span
              style={{
                position: "absolute",
                left: "78%",
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "#22C55E",
                fontWeight: 500,
                letterSpacing: "0.03em",
              }}
            >
              Fixed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
