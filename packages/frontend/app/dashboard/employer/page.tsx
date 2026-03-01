"use client";

import { useAccount } from "wagmi";
import { useAllBounties } from "@/hooks/useBounty";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { motion } from "framer-motion";

export default function EmployerDashboard() {
    const { address } = useAccount();
    const { bounties, isLoading } = useAllBounties();

    // Filter bounties by connected wallet (employer/creator)
    const myBounties = bounties.filter(
        (b) => b.creator.toLowerCase() === address?.toLowerCase()
    );

    const activeBounties = myBounties.filter((b) => b.status === "Open" || b.status === "InProgress");
    const completedBounties = myBounties.filter((b) => b.status === "Completed");
    const cancelledBounties = myBounties.filter((b) => b.status === "Cancelled");
    const totalLocked = activeBounties.reduce((sum, b) => sum + parseFloat(b.reward), 0);
    const totalSpent = completedBounties.reduce((sum, b) => sum + parseFloat(b.reward), 0);

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div style={{
                    width: 24, height: 24, border: "2px solid var(--border-primary)",
                    borderTop: "2px solid var(--avax-red)", borderRadius: "50%",
                    animation: "spin 1s linear infinite", margin: "0 auto 1rem",
                }} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading bounties...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: "2rem" }}>
                {[
                    { label: "Aktif Bounty", value: activeBounties.length, color: "var(--status-open)" },
                    { label: "Kilitli AVAX", value: `${totalLocked.toFixed(2)}`, color: "var(--avax-red)" },
                    { label: "Tamamlanan", value: completedBounties.length, color: "var(--status-completed)" },
                    { label: "Harcanan AVAX", value: `${totalSpent.toFixed(2)}`, color: "var(--status-completed)" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                    >
                        <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Bounty list */}
            {myBounties.length === 0 ? (
                <div
                    className="glass-card"
                    style={{
                        padding: "3rem",
                        textAlign: "center",
                    }}
                >
                    <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>📋</p>
                    <p style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        marginBottom: "0.5rem",
                    }}>
                        Henüz bounty oluşturmadınız
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        İlk bounty&apos;nizi oluşturup yetenekli geliştiricileri çekin.
                    </p>
                    <Link href="/create" className="btn-avax btn-sm">
                        Bounty Oluştur →
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {myBounties.map((bounty, i) => (
                        <motion.div
                            key={bounty.bountyId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                        >
                            <Link
                                href={`/bounties/${bounty.bountyId}`}
                                style={{ textDecoration: "none" }}
                            >
                                <div
                                    className="glass-card"
                                    style={{
                                        padding: "1rem 1.25rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex items-center gap-2" style={{ marginBottom: "0.25rem" }}>
                                            <span style={{
                                                fontFamily: "var(--font-heading)",
                                                fontSize: "0.65rem",
                                                color: "var(--text-muted)",
                                                fontWeight: 700,
                                            }}>
                                                #{bounty.bountyId}
                                            </span>
                                            <StatusBadge status={bounty.status} />
                                        </div>
                                        <p style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: "0.85rem",
                                            fontWeight: 700,
                                            color: "var(--text-primary)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}>
                                            {bounty.title}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <p style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: "1rem",
                                            fontWeight: 800,
                                            color: "var(--avax-red)",
                                        }}>
                                            {bounty.reward} <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>AVAX</span>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Summary footer */}
            {cancelledBounties.length > 0 && (
                <p style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: "1.5rem",
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "0.05em",
                }}>
                    {cancelledBounties.length} bounty iptal edildi
                </p>
            )}
        </div>
    );
}
