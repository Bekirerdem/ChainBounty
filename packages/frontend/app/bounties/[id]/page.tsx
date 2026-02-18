"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getBountyById, getSubmissionsForBounty, formatAddress, formatDeadline } from "@/lib/mock-data";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
};

export default function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const bounty = getBountyById(Number(id));
    const submissions = bounty ? getSubmissionsForBounty(bounty.bountyId) : [];
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [solutionUrl, setSolutionUrl] = useState("");
    const [submitted, setSubmitted] = useState(false);

    if (!bounty) {
        return (
            <main className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
                <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Bounty Not Found</h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                    The bounty you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Link href="/bounties">
                    <button className="btn-primary">← Back to Bounties</button>
                </Link>
            </main>
        );
    }

    const deadlineDate = new Date(bounty.deadline * 1000);

    return (
        <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
            {/* Breadcrumb */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "1.5rem" }}>
                <Link
                    href="/bounties"
                    style={{
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                    }}
                >
                    ← Back to Bounties
                </Link>
            </motion.div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 340px",
                    gap: "2rem",
                    alignItems: "start",
                }}
            >
                {/* Left Column: Main Content */}
                <motion.div initial="hidden" animate="visible">
                    {/* Bounty Header */}
                    <motion.div custom={0} variants={fadeUp} className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                            <StatusBadge status={bounty.status} size="md" />
                            <div style={{ display: "flex", gap: "6px" }}>
                                {bounty.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            fontSize: "0.75rem",
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

                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem", lineHeight: 1.3 }}>
                            {bounty.title}
                        </h1>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1.5rem",
                                fontSize: "0.85rem",
                                color: "var(--text-muted)",
                                marginBottom: "1.5rem",
                            }}
                        >
                            <span>Created by <strong style={{ color: "var(--text-secondary)" }}>{formatAddress(bounty.creator)}</strong></span>
                            <span>•</span>
                            <span>⏰ {formatDeadline(bounty.deadline)}</span>
                            <span>•</span>
                            <span>📝 {submissions.length} submissions</span>
                        </div>

                        <div
                            style={{
                                padding: "1.25rem",
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid var(--border-glass)",
                                lineHeight: 1.8,
                                color: "var(--text-secondary)",
                                fontSize: "0.95rem",
                            }}
                        >
                            {bounty.description}
                        </div>
                    </motion.div>

                    {/* Submissions */}
                    <motion.div custom={1} variants={fadeUp}>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>
                            Submissions ({submissions.length})
                        </h2>

                        {submissions.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {submissions.map((sub) => (
                                    <div
                                        key={sub.submissionId}
                                        className="glass-card"
                                        style={{
                                            padding: "1.25rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    marginBottom: "6px",
                                                }}
                                            >
                                                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                                    {formatAddress(sub.submitter)}
                                                </span>
                                                {sub.approved && (
                                                    <span
                                                        style={{
                                                            padding: "2px 8px",
                                                            borderRadius: "6px",
                                                            fontSize: "0.7rem",
                                                            fontWeight: 600,
                                                            color: "var(--status-open)",
                                                            background: "rgba(74, 222, 128, 0.1)",
                                                        }}
                                                    >
                                                        ✓ Approved
                                                    </span>
                                                )}
                                            </div>
                                            <a
                                                href={sub.solutionURI}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: "var(--status-completed)",
                                                    fontSize: "0.8rem",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                🔗 {sub.solutionURI}
                                            </a>
                                        </div>

                                        <div style={{ display: "flex", gap: "8px" }}>
                                            {!sub.approved && bounty.status !== "Completed" && (
                                                <>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ fontSize: "0.75rem", padding: "6px 14px" }}
                                                        onClick={() => alert("Mock: Solution approved! Payment will be sent cross-chain.")}
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            padding: "6px 14px",
                                                            borderRadius: "8px",
                                                            border: "1px solid rgba(248, 113, 113, 0.3)",
                                                            background: "rgba(248, 113, 113, 0.1)",
                                                            color: "var(--status-disputed)",
                                                            cursor: "pointer",
                                                            fontWeight: 600,
                                                        }}
                                                        onClick={() => alert("Mock: Dispute opened!")}
                                                    >
                                                        ⚠ Dispute
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                className="glass-card"
                                style={{ padding: "3rem 2rem", textAlign: "center" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
                                <p style={{ color: "var(--text-secondary)" }}>
                                    No submissions yet. Be the first to submit a solution!
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Right Column: Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ position: "sticky", top: "80px" }}
                >
                    {/* Reward Card */}
                    <div
                        className="glass-card"
                        style={{
                            padding: "2rem",
                            marginBottom: "1rem",
                            textAlign: "center",
                            background: "linear-gradient(135deg, rgba(232, 65, 66, 0.05), rgba(18, 20, 28, 0.6))",
                            border: "1px solid rgba(232, 65, 66, 0.15)",
                        }}
                    >
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Reward
                        </div>
                        <div
                            style={{
                                fontSize: "2.5rem",
                                fontWeight: 800,
                                background: "linear-gradient(135deg, #E84142, #ff6b6b)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                marginBottom: "4px",
                            }}
                        >
                            {bounty.reward} AVAX
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Locked in escrow on C-Chain
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Deadline</div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                    {deadlineDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            </div>
                            <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Creator</div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem", fontFamily: "monospace" }}>
                                    {formatAddress(bounty.creator)}
                                </div>
                            </div>
                            <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Bounty ID</div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>#{bounty.bountyId}</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    {bounty.status === "Open" && (
                        <button
                            className="btn-primary"
                            onClick={() => setShowSubmitModal(true)}
                            style={{
                                width: "100%",
                                padding: "14px",
                                fontSize: "1rem",
                                borderRadius: "12px",
                            }}
                        >
                            📤 Submit Solution
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => setShowSubmitModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card"
                        style={{
                            padding: "2rem",
                            maxWidth: "500px",
                            width: "90%",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!submitted ? (
                            <>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                                    Submit Solution
                                </h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                                    Provide a link to your solution (GitHub repo, IPFS, etc.)
                                </p>
                                <input
                                    type="url"
                                    placeholder="https://github.com/your-repo/solution"
                                    value={solutionUrl}
                                    onChange={(e) => setSolutionUrl(e.target.value)}
                                    className="form-input"
                                    style={{ width: "100%", marginBottom: "1rem" }}
                                />
                                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={() => setShowSubmitModal(false)}
                                        style={{
                                            padding: "10px 20px",
                                            borderRadius: "10px",
                                            border: "1px solid var(--border-glass)",
                                            background: "transparent",
                                            color: "var(--text-secondary)",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            setSubmitted(true);
                                            setTimeout(() => {
                                                setShowSubmitModal(false);
                                                setSubmitted(false);
                                                setSolutionUrl("");
                                            }, 2000);
                                        }}
                                        style={{ padding: "10px 20px" }}
                                    >
                                        🚀 Submit
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                                    Solution Submitted!
                                </h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    Your solution has been submitted on the App-Chain (mock)
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </main>
    );
}
