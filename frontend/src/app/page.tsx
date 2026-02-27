"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import { setUser } from "../lib/user";

// ── Types ──────────────────────────────────────────────────────────────────
type ModalType = "create" | "join" | null;

// ── Feature cards data ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)",
    title: "Timeline Intelligence",
    desc: "Replay your entire debug session step-by-step. Scrub through every code change and pinpoint exactly when a bug was introduced.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)",
    title: "Hackathon Mode",
    desc: "Built for pressure. Countdown timer, critical issue tracking, AI fix suggestions with confidence scores — all in one focused view.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)",
    title: "Auto Docs",
    desc: "Paste your code, get production-ready documentation instantly. JSDoc, markdown, type annotations — export in one click.",
  },
];

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ type, onClose }: { type: ModalType; onClose: () => void }) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("ALPHA-4291");
  const [roomCode, setRoomCode] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");

  if (!type) return null;

  const handleCreate = () => {
    if (!userName.trim()) { setError("Please enter your name"); return; }
    if (!roomName.trim()) { setError("Please enter a room name"); return; }
    const slug = roomName.trim().toUpperCase().replace(/\s+/g, "-");
    setUser(userName.trim());
    router.push(`/room/${slug}`);
  };

  const handleJoin = () => {
    if (!userName.trim()) { setError("Please enter your name"); return; }
    if (!roomCode.trim()) { setError("Please enter a room code"); return; }
    const slug = roomCode.trim().toUpperCase().replace(/\s+/g, "-");
    setUser(userName.trim());
    router.push(`/room/${slug}`);
  };

  const isCreate = type === "create";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#13131E",
          border: "1px solid #2D2D3F",
          borderRadius: 16,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#E2E8F0" }}>
              {isCreate ? "Create a Room" : "Join a Room"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
              {isCreate ? "Start a new collaborative session" : "Enter a code to join your team"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, borderRadius: 6, display: "flex" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isCreate ? (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8892A4", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Room Name
              </label>
              <input
                value={roomName}
                onChange={(e) => { setRoomName(e.target.value); setError(""); }}
                placeholder="ALPHA-4291"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2D2D3F"; }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8892A4", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Room Code
              </label>
              <input
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value); setError(""); }}
                placeholder="e.g. ALPHA-4291"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2D2D3F"; }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8892A4", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Your Name
            </label>
            <input
              value={userName}
              onChange={(e) => { setUserName(e.target.value); setError(""); }}
              placeholder="Enter your name"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2D2D3F"; }}
              onKeyDown={(e) => { if (e.key === "Enter") isCreate ? handleCreate() : handleJoin(); }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "#EF4444", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </p>
          )}

          <button
            onClick={isCreate ? handleCreate : handleJoin}
            style={{
              marginTop: 4,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
              transition: "opacity 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {isCreate ? "Create Room →" : "Join Room →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0D0D18",
  border: "1px solid #2D2D3F",
  borderRadius: 8,
  color: "#E2E8F0",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

// ── Page ───────────────────────────────────────────────────────────────────
export default function Home() {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#E2E8F0", display: "flex", flexDirection: "column", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Navbar />
      <Modal type={modal} onClose={() => setModal(null)} />

      {/* HERO */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px 60px", maxWidth: 860, margin: "0 auto", width: "100%" }}>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.22)", marginBottom: 32 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B82F6", display: "inline-block", boxShadow: "0 0 8px rgba(59,130,246,0.8)" }} />
          <span style={{ fontSize: 12.5, color: "#93C5FD", fontWeight: 500, letterSpacing: "0.04em" }}>AI-Powered · Real-time · Collaborative</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: "clamp(48px, 8vw, 80px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", textAlign: "center", margin: "0 0 20px", background: "linear-gradient(160deg, #FFFFFF 30%, #64748B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          CodeCouncil
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#64748B", textAlign: "center", maxWidth: 520, lineHeight: 1.65, margin: "0 0 48px", fontWeight: 400 }}>
          AI-Powered Collaborative Debugging.{" "}
          <span style={{ color: "#94A3B8" }}>Debug together, ship faster, document automatically.</span>
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 96 }}>
          {/* Create Room */}
          <button
            id="btn-create-room"
            onClick={() => setModal("create")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "white",
              fontSize: 14, fontWeight: 600,
              boxShadow: "0 4px 24px rgba(59,130,246,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(59,130,246,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(59,130,246,0.35)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Create Room
          </button>

          {/* Join Room */}
          <button
            id="btn-join-room"
            onClick={() => setModal("join")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px",
              borderRadius: 10, cursor: "pointer",
              background: "transparent", color: "#C8D6F0",
              fontSize: 14, fontWeight: 600,
              border: "1px solid #2D2D35",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "#3D3D4A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2D2D35"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Join Room
          </button>
        </div>

        {/* Feature Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, width: "100%" }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 14, padding: "24px 22px", display: "flex", flexDirection: "column", gap: 14, transition: "border-color 0.2s, transform 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = f.border; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: f.bg, border: `1px solid ${f.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: "#E2E8F0", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #1E1E2E", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#374151" }}>© 2026 CodeCouncil · Built for devs, by devs</span>
      </footer>
    </div>
  );
}