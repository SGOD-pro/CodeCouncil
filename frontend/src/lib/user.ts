// lib/user.ts — Shared user state helpers (localStorage)

export interface CPUser {
    name: string;
    initials: string;
    color: string;
}

const STORAGE_KEY = "codepulse_user";

const AVATAR_COLORS = [
    "#A855F7", "#3B82F6", "#10B981", "#F59E0B",
    "#EF4444", "#EC4899", "#6366F1", "#14B8A6",
];

function colorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getUser(): CPUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as CPUser;
    } catch {
        return null;
    }
}

export function setUser(name: string, color?: string): CPUser {
    const trimmed = name.trim() || "You";
    const words = trimmed.split(/\s+/);
    const initials = words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase();
    const resolvedColor = color ?? colorFromName(trimmed);
    const user: CPUser = { name: trimmed, initials, color: resolvedColor };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // also keep legacy key for backwards compat
    localStorage.setItem("cp_userName", trimmed);
    return user;
}

export function getOrDefaultUser(): CPUser {
    return getUser() ?? { name: "Alex Demo", initials: "AD", color: "#3B82F6" };
}
