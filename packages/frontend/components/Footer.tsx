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
                        gap: "1.5rem",
                    }}
                >
                    {/* Branding */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.1rem" }}>🔺</span>
                        <span
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.04em",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Chain<span style={{ color: "var(--avax-red)" }}>Bounty</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div style={{ display: "flex", gap: "2rem" }}>
                        {[
                            { label: "GitHub", href: "https://github.com/Bekirerdem/ChainBounty" },
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
                                    fontSize: "0.75rem",
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 600,
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.08em",
                                    transition: "color 0.2s ease",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "var(--text-primary)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = "var(--text-muted)")
                                }
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Chain Status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {["C-Chain", "App-Chain"].map((chain) => (
                            <div
                                key={chain}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <span
                                    style={{
                                        width: "5px",
                                        height: "5px",
                                        borderRadius: "50%",
                                        background: "var(--status-open)",
                                        boxShadow: "0 0 8px var(--status-open)",
                                        display: "inline-block",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "0.7rem",
                                        color: "var(--text-muted)",
                                        fontFamily: "var(--font-heading)",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {chain}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div
                    style={{
                        marginTop: "1.5rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border-primary)",
                        textAlign: "center",
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        letterSpacing: "0.06em",
                    }}
                >
                    Built for Avalanche Build Games 2026 — Powered by ICM Teleporter
                </div>
            </div>
        </footer>
    );
}
