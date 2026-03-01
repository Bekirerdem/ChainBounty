"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useDemo } from "@/contexts/DemoContext";
import { useAccount } from "wagmi";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/bounties", label: "Bounties" },
    { href: "/create", label: "Create" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { isDemoMode, toggleDemoMode } = useDemo();
    const { isConnected } = useAccount();

    const allLinks = [
        ...navLinks,
        ...(isConnected ? [{ href: "/dashboard/employer", label: "Dashboard" }] : []),
    ];

    // Hydration guard: ConnectButton reads wallet state from storage on the client.
    // Showing it only after mount prevents the SSR mismatch. The initialState
    // frozen in Providers (via useRef) ensures wagmi doesn't trigger a reconnect
    // cycle on navigation, so no additional status check is needed here.
    useEffect(() => { setMounted(true); }, []);

    return (
        <nav className="navbar">
            <div
                className="container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "64px",
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <span style={{ fontSize: "1.4rem" }}>🔺</span>
                    <span
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "1.1rem",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            textTransform: "uppercase" as const,
                            color: "var(--text-primary)",
                        }}
                    >
                        Chain<span className="gradient-text">Bounty</span>
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div
                    className="nav-desktop hidden md:flex"
                    style={{
                        alignItems: "center",
                        gap: "2rem",
                    }}
                >
                    {allLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                textDecoration: "none",
                                fontFamily: "var(--font-heading)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.08em",
                                color:
                                    pathname === link.href || (link.href.startsWith("/dashboard") && pathname?.startsWith("/dashboard"))
                                        ? "var(--text-primary)"
                                        : "var(--text-muted)",
                                transition: "color 0.2s ease",
                                position: "relative",
                            }}
                        >
                            {link.label}
                            {(pathname === link.href || (link.href.startsWith("/dashboard") && pathname?.startsWith("/dashboard"))) && (
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: "-4px",
                                        left: 0,
                                        right: 0,
                                        height: "2px",
                                        background: "var(--avax-red)",
                                    }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {/* Demo Mode Toggle */}
                    <button
                        onClick={toggleDemoMode}
                        title={isDemoMode ? "Disable Demo Mode to use real smart contracts" : "Enable Demo Mode to navigate with mock data"}
                        className={`hidden md:flex px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            isDemoMode 
                                ? "bg-avax-red/10 text-avax-red border-avax-red/30 shadow-[0_0_8px_rgba(232,65,66,0.2)]" 
                                : "bg-bg-elevated text-text-muted border-border-primary hover:text-white"
                        }`}
                    >
                        {isDemoMode ? "Mock Data" : "Live Net"}
                    </button>

                    {/* Wallet Connect — RainbowKit */}
                    {mounted ? (
                        <ConnectButton />
                    ) : (
                        <div style={{ width: "150px", height: "40px" }} />
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="mobile-toggle md:hidden"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        {mobileOpen ? "✕" : "☰"}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div
                    style={{
                        padding: "1rem var(--space-page)",
                        borderTop: "1px solid var(--border-primary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                    }}
                >
                    {allLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                textDecoration: "none",
                                fontFamily: "var(--font-heading)",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.06em",
                                color:
                                    pathname === link.href || (link.href.startsWith("/dashboard") && pathname?.startsWith("/dashboard"))
                                        ? "var(--text-primary)"
                                        : "var(--text-muted)",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <button
                        onClick={() => { toggleDemoMode(); setMobileOpen(false); }}
                        className={`mt-4 px-4 py-3 w-full text-center rounded-none text-sm font-bold uppercase tracking-wider border transition-all ${
                            isDemoMode 
                                ? "bg-avax-red/10 text-avax-red border-avax-red/30" 
                                : "bg-bg-elevated text-text-muted border-border-primary hover:text-white"
                        }`}
                    >
                        {isDemoMode ? "🟢 Mock Data" : "🔴 Live Net"}
                    </button>
                </div>
            )}
        </nav>
    );
}
