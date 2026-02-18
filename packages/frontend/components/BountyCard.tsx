"use client";

import Link from "next/link";
import type { Bounty } from "@/lib/mock-data";
import { formatDeadline, formatAddress } from "@/lib/mock-data";
import StatusBadge from "./StatusBadge";

interface BountyCardProps {
    bounty: Bounty;
}

export default function BountyCard({ bounty }: BountyCardProps) {
    return (
        <Link href={`/bounties/${bounty.bountyId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="glass-card bounty-card" style={{ padding: "1.5rem", cursor: "pointer" }}>
                {/* Header: Status + Tags */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1rem",
                    }}
                >
                    <StatusBadge status={bounty.status} />
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {bounty.tags.slice(0, 2).map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                    color: "var(--text-secondary)",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <h3
                    style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {bounty.title}
                </h3>

                {/* Description (truncated) */}
                <p
                    style={{
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        marginBottom: "1.25rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {bounty.description}
                </p>

                {/* Footer: Reward + Deadline + Submissions */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border-glass)",
                    }}
                >
                    {/* Reward */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1.25rem" }}>🔺</span>
                        <span
                            style={{
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                background: "linear-gradient(135deg, #E84142, #ff6b6b)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {bounty.reward} AVAX
                        </span>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            ⏰ {formatDeadline(bounty.deadline)}
                        </span>
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            📝 {bounty.submissionCount}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
