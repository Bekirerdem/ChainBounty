"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { formatAddress } from "@/lib/mock-data";

const MOCK_WALLET = "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/bounties", label: "Bounties" },
    { href: "/create", label: "Create Bounty" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [connected, setConnected] = useState(false);

    return (
        <nav className="navbar">
            <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🔺</span>
                    <span
                        style={{
                            fontSize: "1.2rem",
                            fontWeight: 800,
                            background: "linear-gradient(135deg, #f0f0f5 0%, #E84142 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        ChainBounty
                    </span>
                </Link>

                {/* Nav Links */}
                <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                color: pathname === link.href ? "var(--avax-red)" : "var(--text-secondary)",
                                transition: "color 0.2s ease",
                                position: "relative",
                            }}
                        >
                            {link.label}
                            {pathname === link.href && (
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: "-4px",
                                        left: 0,
                                        right: 0,
                                        height: "2px",
                                        background: "var(--avax-red)",
                                        borderRadius: "1px",
                                    }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Wallet Connect */}
                <button
                    onClick={() => setConnected(!connected)}
                    style={{
                        padding: "8px 20px",
                        borderRadius: "12px",
                        border: connected ? "1px solid rgba(232, 65, 66, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                        background: connected
                            ? "rgba(232, 65, 66, 0.1)"
                            : "linear-gradient(135deg, var(--avax-red), #c0392b)",
                        color: connected ? "var(--avax-red)" : "white",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    {connected ? (
                        <>
                            <span
                                style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: "var(--status-open)",
                                    boxShadow: "0 0 6px var(--status-open)",
                                }}
                            />
                            {formatAddress(MOCK_WALLET)}
                        </>
                    ) : (
                        "🔗 Connect Wallet"
                    )}
                </button>
            </div>
        </nav>
    );
}
