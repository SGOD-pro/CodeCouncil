// lib/useRoomData.ts — Single source of truth for room data
// Returns demo data for ALPHA-4291, empty skeleton for any other room.

export interface Snapshot {
  label: string;
  color: string;
  code: string;
}

export type MsgType = "user" | "other" | "ai";

export interface Message {
  id: number;
  type: MsgType;
  author: string;
  avatar: string;
  avatarColor: string;
  time: string;
  content: string;
  codeSnippet?: string;
  isAI?: boolean;
}

export interface TimelineEvent {
  snapshot: number; // 0-indexed
  type: "bug" | "fix";
  message: string;
}

export interface RoomData {
  isDemo: boolean;
  messages: Message[];
  snapshots: Snapshot[];
  timelineEvents: TimelineEvent[];
}

// ── Demo snapshots ─────────────────────────────────────────────────────────
const DEMO_SNAPSHOTS: Snapshot[] = [
  {
    label: "v1 · Clean",
    color: "#3B82F6",
    code: `import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchUser(userId) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export default function AuthComponent() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Check your email!');
    setLoading(false);
  };
}`,
  },
  {
    label: "v2 · Bug",
    color: "#EF4444",
    code: `import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchUser(userId) {
  const sessions = [];
  // memory leak here — session never cleared
  setInterval(() => {
    sessions.push(supabase.auth.getSession());
  }, 1000);

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export default function AuthComponent() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = processData(input); // processData is undefined
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    setLoading(false);
  };
}`,
  },
  {
    label: "v3 · Debug",
    color: "#F59E0B",
    code: `import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Team debugging — Arjun investigating leak
export async function fetchUser(userId) {
  // TODO: Priya — remove this setInterval, it's the leak
  const sessions = [];
  setInterval(() => {
    sessions.push(supabase.auth.getSession());
  }, 1000);

  console.log('[DEBUG] fetching user:', userId);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) console.error('[DEBUG] error:', error);
  return data;
}`,
  },
  {
    label: "v4 · Patch",
    color: "#A855F7",
    code: `import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fix attempt — using useRef to track interval
export async function fetchUser(userId) {
  let intervalId = null;
  const sessions = [];

  // attempt: store ref so we can clear
  intervalId = setInterval(() => {
    sessions.push(supabase.auth.getSession());
  }, 1000);

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // still not cleared... needs cleanup on unmount
  return data;
}`,
  },
  {
    label: "v5 · Fixed ✓",
    color: "#10B981",
    code: `import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✓ Fixed: no interval — single async call only
export async function fetchUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export default function AuthComponent() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (mounted.current) {
      if (error) alert(error.message);
      else alert('Check your email!');
      setLoading(false);
    }
  };
}`,
  },
];

// ── Demo timeline events (0-indexed snapshot positions) ────────────────────
const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    snapshot: 1, // v2 · Bug
    type: "bug",
    message: "🔴 Bug introduced: fetchUser has an uncleared setInterval causing a memory leak (lines 8–10). Consider refactoring.",
  },
  {
    snapshot: 4, // v5 · Fixed
    type: "fix",
    message: "✅ Fixed: setInterval removed. fetchUser now uses a single async query. Memory leak resolved. Great work!",
  },
];

// ── Empty skeleton for unknown rooms ───────────────────────────────────────
const EMPTY_DATA: RoomData = {
  isDemo: false,
  messages: [],
  snapshots: [
    { label: "v1", color: "#3B82F6", code: "// No snapshots for this room yet." },
  ],
  timelineEvents: [],
};

// ── Hook ───────────────────────────────────────────────────────────────────
export function useRoomData(
  roomId: string,
  userName: string,
  userInitials: string,
  userColor: string,
): RoomData {
  const isDemo = roomId === "ALPHA-4291";
  if (!isDemo) return EMPTY_DATA;

  const messages: Message[] = [
    { id: 1, type: "other", author: "Arjun", avatar: "AR", avatarColor: "#4F7EEB", time: "10:42 AM", content: "Hey checking the new function. Need to optimize the loop" },
    { id: 2, type: "other", author: "Priya", avatar: "PR", avatarColor: "#22C55E", time: "10:45 AM", content: "I think line 42 has a typo:", codeSnippet: "const result = processData(input);" },
    { id: 3, type: "user", author: userName, avatar: userInitials, avatarColor: userColor, time: "10:48 AM", content: "Good catch, fixing it. Pushing patch to staging" },
    { id: 4, type: "ai", author: "CodeCouncil AI", avatar: "AI", avatarColor: "#4F7EEB", time: "Just now", content: "Detected memory leak in fetchUser. Refactor?", isAI: true },
  ];

  return {
    isDemo: true,
    messages,
    snapshots: DEMO_SNAPSHOTS,
    timelineEvents: DEMO_TIMELINE_EVENTS,
  };
}
