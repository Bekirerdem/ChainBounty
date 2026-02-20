"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/bounties", label: "Bounties" },
    { href: "/create", label: "Create" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

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
                        Chain<span style={{ color: "var(--avax-red)" }}>Bounty</span>
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
                    {navLinks.map((link) => (
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
                                    pathname === link.href
                                        ? "var(--text-primary)"
                                        : "var(--text-muted)",
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
                                    }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {/* Wallet Connect — RainbowKit */}
                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openAccountModal,
                            openChainModal,
                            openConnectModal,
                            mounted,
                        }) => {
                            const ready = mounted;
                            const connected = ready && account && chain;

                            return (
                                <div
                                    {...(!ready && {
                                        "aria-hidden": true,
                                        style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                                    })}
                                >
                                    {!connected ? (
                                        <button
                                            onClick={openConnectModal}
                                            className="btn-avax btn-sm"
                                        >
                                            Connect
                                        </button>
                                    ) : chain.unsupported ? (
                                        <button
                                            onClick={openChainModal}
                                            className="btn-sm"
                                            style={{
                                                background: "rgba(239,68,68,0.15)",
                                                border: "1px solid #ef4444",
                                                color: "#ef4444",
                                                borderRadius: "6px",
                                                padding: "6px 12px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            Wrong Network
                                        </button>
                                    ) : (
                                        <button
                                            onClick={openAccountModal}
                                            className="btn-ghost btn-sm"
                                            style={{
                                                borderColor: "var(--border-avax)",
                                                color: "var(--avax-red)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "6px",
                                                    height: "6px",
                                                    borderRadius: "50%",
                                                    background: "var(--status-open)",
                                                    boxShadow: "0 0 8px var(--status-open)",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            {account.displayName}
                                        </button>
                                    )}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>

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
                    {navLinks.map((link) => (
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
                                    pathname === link.href
                                        ? "var(--text-primary)"
                                        : "var(--text-muted)",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
