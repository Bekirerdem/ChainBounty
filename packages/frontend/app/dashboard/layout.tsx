"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

const tabs = [
    { href: "/dashboard/employer", label: "Employer", icon: "📋" },
    { href: "/dashboard/developer", label: "Developer", icon: "⚡" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { address, isConnected } = useAccount();

    if (!isConnected) {
        return (
            <div className="container" style={{ paddingTop: "8rem", textAlign: "center" }}>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", marginBottom: "1rem" }}>
                    Dashboard
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Dashboard&apos;a erişmek için cüzdanınızı bağlayın.
                </p>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <p className="section-number">Dashboard</p>
                <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", marginBottom: "0.5rem" }}>
                    My <span className="gradient-text">Dashboard</span>
                </h1>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {address}
                </p>
            </div>

            {/* Tabs */}
            <div
                className="flex gap-0"
                style={{
                    borderBottom: "1px solid var(--border-primary)",
                    marginBottom: "2rem",
                }}
            >
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            style={{
                                textDecoration: "none",
                                padding: "0.75rem 1.5rem",
                                fontFamily: "var(--font-heading)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                                borderBottom: isActive ? "2px solid var(--avax-red)" : "2px solid transparent",
                                transition: "all 0.2s",
                            }}
                        >
                            {tab.icon} {tab.label}
                        </Link>
                    );
                })}
            </div>

            {/* Content */}
            {children}
        </div>
    );
}
