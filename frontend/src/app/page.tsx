"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import CodeEditor from "./components/CodeEditor";

const DocGeneratorPanel = dynamic(() => import("./components/DocGeneratorPanel"), { ssr: false });

const SAMPLE_CODE = `import React from 'react';

export default function App () {
  // This is where code usually goes...
  return (
    <div>Hello World</div>
  );
}`;

const NAV_ICONS = [
  {
    id: "explorer",
    title: "Explorer",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "search",
    title: "Search",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: "docs",
    title: "Documentation Generator",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("explorer");

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (id === "docs") {
      setPanelOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0e1117] overflow-hidden">
      {/* Activity Bar */}
      <div className="w-12 flex flex-col items-center py-3 bg-[#0b0e14] border-r border-white/8 z-10 flex-shrink-0">
        {/* App Logo */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>

        {/* Nav Icons */}
        <div className="flex flex-col items-center gap-1 mt-1">
          {NAV_ICONS.map((nav) => (
            <button
              key={nav.id}
              title={nav.title}
              onClick={() => handleNavClick(nav.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150
                ${activeNav === nav.id
                  ? "text-white bg-white/10"
                  : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                }`}
            >
              {nav.icon}
            </button>
          ))}
        </div>

        {/* Settings at bottom */}
        <div className="mt-auto">
          <button
            title="Settings"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all duration-150"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title Bar */}
        <div className="h-10 bg-[#0b0e14] border-b border-white/8 flex items-center px-4 gap-3 flex-shrink-0">
          <span className="text-sm font-medium text-zinc-300">CodePulse Editor</span>
          <div className="flex-1" />
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
        </div>

        {/* Tab Bar */}
        <div className="h-9 bg-[#0d1017] border-b border-white/8 flex items-end px-2 flex-shrink-0">
          <div className="flex items-center gap-0.5 h-full px-3 border-b-2 border-blue-500 bg-[#0e1117] text-zinc-300 text-xs rounded-t-md">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="ml-1.5">App.tsx</span>
          </div>
        </div>

        {/* Code Editor */}
        <CodeEditor code={SAMPLE_CODE} />

        {/* Status Bar */}
        <div className="h-6 bg-blue-600 flex items-center px-4 gap-4 flex-shrink-0">
          <span className="text-xs text-blue-100">TypeScript JSX</span>
          <div className="flex-1" />
          <span className="text-xs text-blue-200">UTF-8</span>
          <span className="text-xs text-blue-200">Ln 1, Col 1</span>
        </div>
      </div>

      {/* Doc Generator Panel */}
      <DocGeneratorPanel isOpen={panelOpen} onClose={() => { setPanelOpen(false); setActiveNav("explorer"); }} />
    </div>
  );
}
