"use client";

import Link from "next/link";
import type { Bounty } from "@/lib/mock-data";
import { formatDeadline } from "@/lib/mock-data";
import StatusBadge from "./StatusBadge";

interface BountyCardProps {
    bounty: Bounty;
}

export default function BountyCard({ bounty }: BountyCardProps) {
    return (
        <Link href={`/bounties/${bounty.bountyId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card card-interactive" style={{ padding: "1.5rem" }}>
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
                                    padding: "3px 10px",
                                    borderRadius: "0",
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-heading)",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.06em",
                                    color: "var(--text-secondary)",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid var(--border-primary)",
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
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
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

                {/* Description */}
                <p
                    style={{
                        fontSize: "0.85rem",
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

                {/* Footer: Reward + Meta */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border-primary)",
                    }}
                >
                    {/* Reward */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "1.1rem",
                                fontWeight: 800,
                                letterSpacing: "-0.01em",
                                color: "var(--text-primary)",
                            }}
                        >
                            {bounty.reward}
                        </span>
                        <span
                            className="gradient-text"
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "0.85rem",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                            }}
                        >
                            AVAX
                        </span>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span
                            style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontFamily: "var(--font-heading)",
                                letterSpacing: "0.04em",
                            }}
                        >
                            ⏰ {formatDeadline(bounty.deadline)}
                        </span>
                        <span
                            style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontFamily: "var(--font-heading)",
                                letterSpacing: "0.04em",
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
