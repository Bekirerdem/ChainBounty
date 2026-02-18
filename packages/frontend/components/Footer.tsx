"use client";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                    }}
                >
                    {/* Left: Branding */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.2rem" }}>🔺</span>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            ChainBounty
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            — Cross-Chain Bounty Platform
                        </span>
                    </div>

                    {/* Center: Links */}
                    <div style={{ display: "flex", gap: "1.5rem" }}>
                        {[
                            { label: "GitHub", href: "https://github.com" },
                            { label: "Docs", href: "#" },
                            { label: "Twitter", href: "#" },
                        ].map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: "var(--text-muted)",
                                    textDecoration: "none",
                                    fontSize: "0.8rem",
                                    fontWeight: 500,
                                    transition: "color 0.2s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Right: Chain status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: "var(--status-open)",
                                    boxShadow: "0 0 6px var(--status-open)",
                                }}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                C-Chain
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: "var(--status-open)",
                                    boxShadow: "0 0 6px var(--status-open)",
                                }}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                App-Chain
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div
                    style={{
                        marginTop: "1.5rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border-glass)",
                        textAlign: "center",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                    }}
                >
                    Built for Avalanche Build Games 2026 🏗️ Powered by ICM
                </div>
            </div>
        </footer>
    );
}
