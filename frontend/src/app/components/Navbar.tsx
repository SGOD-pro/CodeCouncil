"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrDefaultUser, type CPUser } from "../../lib/user";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Room", href: "/room/ALPHA-4291" },
    { label: "Hackathon", href: "/hackathon" },
    { label: "Docs", href: "/doc" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<CPUser>({ name: "You", initials: "YO", color: "#A855F7" });

    useEffect(() => {
        setUser(getOrDefaultUser());
        // refresh when localStorage changes (e.g. login from landing page)
        const onStorage = () => setUser(getOrDefaultUser());
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return (
        <header
            style={{
                position: "sticky", top: 0, zIndex: 100,
                background: "#1A1A24",
                borderBottom: "1px solid #2D2D35",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 24px", height: 56, flexShrink: 0,
            }}
        >
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, background: "linear-gradient(90deg, #E2E8F0, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
                    CodeCouncil
                </span>
            </Link>

            {/* Nav Links */}
            <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {NAV_LINKS.map((link) => {
                    // active if exact match OR if on a sub-route (e.g. /room/ALPHA-4291 → Room active)
                    const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                textDecoration: "none", padding: "6px 14px", borderRadius: 8,
                                fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                                color: isActive ? "#3B82F6" : "#8892A4",
                                background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                                border: isActive ? "1px solid rgba(59,130,246,0.22)" : "1px solid transparent",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = "#C8D6F0"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
                            onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "#8892A4"; e.currentTarget.style.background = "transparent"; } }}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Right: bell + avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Notification bell */}
                <button
                    style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#8892A4", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#C8D6F0"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8892A4"; e.currentTarget.style.background = "transparent"; }}
                    title="Notifications"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", border: "1.5px solid #1A1A24" }} />
                </button>

                {/* Avatar — derived from codepulse_user */}
                <div
                    style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${user.color}, ${user.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", flexShrink: 0, border: `2px solid ${user.color}44` }}
                    title={user.name}
                >
                    {user.initials}
                </div>
            </div>
        </header>
    );
}
