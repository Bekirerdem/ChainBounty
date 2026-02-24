"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatAddress, formatDeadline, useMockMode, BountyStatus } from "@/lib/mock-data";
import { useSubmitWork, useTaskDetails, useBountySubmissions, useAcceptProposal, useApprovePayment, useForceSettle, useCancelBounty, useClaimEmployer, useBountyEmployer } from "@/hooks/useBounty";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { BOUNTY_MANAGER_ADDRESS } from "@/lib/contracts";

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
    const bountyId = parseInt(id, 10);
    
    // Live Blockchain Hooks
    const { taskDetails, isLoading: isBountyLoading } = useTaskDetails(bountyId);
    const { submissions, refetch: refetchSubmissions } = useBountySubmissions(bountyId);
    const { submitWork } = useSubmitWork();
    
    // Wallet Connection Hooks
    const { isConnected, address } = useAccount();
    const { openConnectModal } = useConnectModal();

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [repoLink, setRepoLink] = useState("");
    const [demoLink, setDemoLink] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [releaseTxHash, setReleaseTxHash] = useState<string | null>(null);
    const [releaseSuccess, setReleaseSuccess] = useState(false);

    const { acceptProposal, isPending: isAccepting } = useAcceptProposal();
    const { approvePayment, isPending: isApproving } = useApprovePayment();
    const { forceSettle, isPending: isForceSettling } = useForceSettle();
    const { cancelBounty, isPending: isCancelling } = useCancelBounty();
    const { claimEmployer, isPending: isClaiming } = useClaimEmployer();
    const { employerOnAppChain, refetch: refetchEmployer } = useBountyEmployer(bountyId);

    // Parse the task details from the contract tuple
    let bounty = null;
    if (taskDetails) {
        const [id, employer, budget, ipfsDocHash, isActive, isCompleted] = taskDetails as unknown as [bigint, string, bigint, string, boolean, boolean];
        
        let title = ipfsDocHash;
        let description = ipfsDocHash;
        
        if (typeof ipfsDocHash === 'string' && ipfsDocHash.includes(" | ")) {
            const parts = ipfsDocHash.split(" | ");
            title = parts[0] || "Untitled";
            description = parts.slice(1).join(" | ") || "No description provided.";
        }

        let statusText: BountyStatus = "Open";
        if (isCompleted) statusText = "Completed";
        else if (!isActive) statusText = "Cancelled";

        bounty = {
            bountyId: Number(id),
            creator: employer,
            title: title,
            description: description,
            reward: formatEther(budget),
            deadline: Math.floor(Date.now() / 1000) + 86400 * 7,
            status: statusText,
            submissionCount: submissions.length,
            createdAt: Math.floor(Date.now() / 1000), 
            tags: ["Avalanche", "Web3"], 
        };
    }

    if (isBountyLoading) {
        return (
            <main className="container pt-32 pb-20 min-h-screen flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-avax-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </main>
        );
    }

    if (!bounty || (bounty.reward === "0" && bounty.title === "")) {
        return (
            <main className="container pt-32 pb-20 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "4rem",
                            fontWeight: 800,
                            color: "var(--avax-red)",
                            marginBottom: "1rem",
                        }}
                    >
                        404
                    </h1>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                        Bounty not found.
                    </p>
                    <Link href="/bounties" className="btn-ghost">
                        Back to Bounties
                    </Link>
                </div>
            </main>
        );
    }

    const amount = bounty.reward;

    const isEmployer = address && bounty && address.toLowerCase() === bounty.creator.toLowerCase();
    const acceptedSubmission = submissions.find(sub => sub.status === "Accepted");
    const hasAcceptedProposal = !!acceptedSubmission;
    const developerAddress = acceptedSubmission ? acceptedSubmission.submitter : null;

    const handleAccept = async (submissionId: number) => {
        if (!address) return;
        try {
            await acceptProposal(submissionId);
            setTimeout(() => refetchSubmissions(), 4000);
        } catch (error) {
            console.error("Accept Error:", error);
        }
    };

    const handleReleaseFunds = async () => {
        if (!address) return;
        try {
            const txHash = await approvePayment(bountyId);
            if (txHash) {
                setReleaseTxHash(txHash as string);
                setReleaseSuccess(true);
            }
        } catch (error) {
            console.error("Release Funds Error:", error);
        }
    };

    const handleForceSettle = async () => {
        const dev = developerAddress || prompt("Developer wallet address:");
        if (!dev) return;
        try {
            const txHash = await forceSettle(bountyId, dev);
            if (txHash) {
                setReleaseTxHash(txHash as string);
                setReleaseSuccess(true);
            }
        } catch (error) {
            console.error("Force Settle Error:", error);
        }
    };

    const handleClaimEmployer = async () => {
        if (!address) return;
        try {
            await claimEmployer(bountyId);
            refetchEmployer();
        } catch (error) {
            console.error("Claim employer error:", error);
        }
    };

    const handleCancelBounty = async () => {
        if (!address) return;
        if (!confirm("Cancel this bounty and get your AVAX refunded?")) return;
        try {
            await cancelBounty(bountyId);
            // Refetch bounty to reflect new Cancelled status
            window.location.reload();
        } catch (error) {
            console.error("Cancel Error:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (useMockMode) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsSubmitting(false);
            setIsSubmitModalOpen(false);
            alert("Submission received! (Mock)");
        } else {
            try {
                // Submit work to the App-Chain executor
                const combinedLink = demoLink ? `${repoLink} | ${demoLink}` : repoLink;
                await submitWork(bountyId, combinedLink, amount);
                setIsSubmitting(false);
                setIsSubmitModalOpen(false);
                // App-Chain tx confirmation takes a few seconds — wait before refetch
                setTimeout(() => refetchSubmissions(), 4000);
            } catch (error) {
                console.error("Submission Error", error);
                setIsSubmitting(false);
            }
        }
    };

    return (
        <main className="container pt-32 pb-20 min-h-screen">
            {/* Back link */}
            <Link
                href="/bounties"
                className="inline-flex items-center gap-2 mb-10 group"
                style={{
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                    <path d="m15 18-6-6 6-6"/>
                </svg>
                Back to Bounties
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── LEFT COLUMN ── */}
                <motion.div initial="hidden" animate="visible" className="lg:col-span-2 space-y-6">

                    {/* Title card */}
                    <motion.div
                        custom={0}
                        variants={fadeUp}
                        className="glass-card"
                        style={{ borderLeft: "3px solid var(--avax-red)" }}
                    >
                        <div style={{ padding: "2rem 2rem 1.5rem" }}>
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div style={{ flex: 1 }}>
                                    <div className="section-number" style={{ marginBottom: "0.75rem" }}>
                                        <span>Bounty #{bounty.bountyId}</span>
                                    </div>
                                    <h1
                                        style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: "clamp(1.4rem, 3vw, 2rem)",
                                            fontWeight: 800,
                                            letterSpacing: "-0.02em",
                                            lineHeight: 1.2,
                                            color: "var(--text-primary)",
                                            marginBottom: "1rem",
                                        }}
                                    >
                                        {bounty.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "3px 10px",
                                                background: "var(--avax-red-subtle)",
                                                border: "1px solid var(--border-avax)",
                                                fontFamily: "var(--font-heading)",
                                                fontWeight: 700,
                                                letterSpacing: "0.06em",
                                                textTransform: "uppercase",
                                                color: "var(--avax-red)",
                                            }}
                                        >
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--avax-red)", display: "inline-block" }} />
                                            {formatAddress(bounty.creator)}
                                        </span>
                                        <span style={{ color: "var(--border-hover)" }}>|</span>
                                        <span>Posted {new Date(bounty.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    </div>
                                </div>
                                <StatusBadge status={bounty.status} />
                            </div>
                        </div>

                        {/* Description */}
                        <div
                            style={{
                                padding: "1.5rem 2rem",
                                borderTop: "1px solid var(--border-primary)",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "0.7rem",
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: "var(--text-muted)",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                Description
                            </p>
                            <p
                                style={{
                                    fontSize: "0.9rem",
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.75,
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {bounty.description}
                            </p>
                        </div>

                        {/* Tags */}
                        {bounty.tags.length > 0 && (
                            <div
                                style={{
                                    padding: "1.25rem 2rem",
                                    borderTop: "1px solid var(--border-primary)",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                }}
                            >
                                {bounty.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            padding: "3px 10px",
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid var(--border-primary)",
                                            fontSize: "0.65rem",
                                            fontFamily: "var(--font-heading)",
                                            fontWeight: 700,
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Submissions */}
                    <motion.div custom={1} variants={fadeUp}>
                        <div className="flex items-center justify-between" style={{ marginBottom: "1.25rem" }}>
                            <h2
                                style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "1rem",
                                    fontWeight: 800,
                                    letterSpacing: "-0.01em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Submissions
                            </h2>
                            <span
                                style={{
                                    fontSize: "0.7rem",
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    color: "var(--text-muted)",
                                    padding: "2px 8px",
                                    border: "1px solid var(--border-primary)",
                                }}
                            >
                                {submissions.length}
                            </span>
                        </div>

                        {submissions.length === 0 ? (
                            <div
                                className="glass-card"
                                style={{
                                    padding: "3rem",
                                    textAlign: "center",
                                    borderStyle: "dashed",
                                }}
                            >
                                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    No submissions yet — be the first to contribute.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {submissions.map((sub) => (
                                    <div
                                        key={sub.submissionId}
                                        className="glass-card"
                                        style={{ padding: "1.25rem 1.5rem" }}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div style={{ flex: 1 }}>
                                                <div className="flex items-center gap-3" style={{ marginBottom: "0.4rem" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            fontFamily: "var(--font-heading)",
                                                            fontWeight: 700,
                                                            color: "var(--text-primary)",
                                                        }}
                                                    >
                                                        {formatAddress(sub.submitter)}
                                                    </span>
                                                    <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--border-hover)", display: "inline-block" }} />
                                                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                        {new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                    </span>
                                                    {sub.status === "Accepted" && (
                                                        <span
                                                            style={{
                                                                fontSize: "0.6rem",
                                                                fontFamily: "var(--font-heading)",
                                                                fontWeight: 700,
                                                                letterSpacing: "0.1em",
                                                                textTransform: "uppercase",
                                                                color: "var(--status-open)",
                                                                background: "rgba(74,222,128,0.08)",
                                                                border: "1px solid rgba(74,222,128,0.2)",
                                                                padding: "2px 7px",
                                                            }}
                                                        >
                                                            ✓ Accepted
                                                        </span>
                                                    )}
                                                </div>
                                                {sub.description && (
                                                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                                        {sub.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {sub.repoLink && (
                                                    <a href={sub.repoLink} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                                                        GitHub →
                                                    </a>
                                                )}
                                                {sub.demoLink && (
                                                    <a href={sub.demoLink} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                                                        Demo →
                                                    </a>
                                                )}
                                                {sub.status === "Pending" && isEmployer && !hasAcceptedProposal && (
                                                    <button
                                                        onClick={() => handleAccept(sub.submissionId)}
                                                        disabled={isAccepting}
                                                        className="btn-avax btn-sm"
                                                    >
                                                        {isAccepting ? "..." : "Accept"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* ── SIDEBAR ── */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                >
                    <div
                        className="glass-card"
                        style={{
                            position: "sticky",
                            top: "5.5rem",
                            overflow: "hidden",
                        }}
                    >
                        {/* Reward header */}
                        <div
                            style={{
                                padding: "1.75rem 1.75rem 1.5rem",
                                background: "linear-gradient(135deg, rgba(232,65,66,0.05) 0%, transparent 60%)",
                                borderBottom: "1px solid var(--border-primary)",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "0.65rem",
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 700,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    color: "var(--text-muted)",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                Reward
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span
                                    style={{
                                        fontFamily: "var(--font-heading)",
                                        fontSize: "2.5rem",
                                        fontWeight: 800,
                                        letterSpacing: "-0.03em",
                                        color: "var(--text-primary)",
                                        lineHeight: 1,
                                    }}
                                >
                                    {amount}
                                </span>
                                <span
                                    className="gradient-text"
                                    style={{
                                        fontFamily: "var(--font-heading)",
                                        fontSize: "1.1rem",
                                        fontWeight: 800,
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    AVAX
                                </span>
                            </div>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                                ≈ ${(parseFloat(amount) * 25).toLocaleString()} USD
                            </p>
                        </div>

                        {/* Meta row */}
                        <div
                            style={{
                                padding: "1.25rem 1.75rem",
                                borderBottom: "1px solid var(--border-primary)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.9rem",
                            }}
                        >
                            {/* Escrow */}
                            <div>
                                <p
                                    style={{
                                        fontSize: "0.62rem",
                                        fontFamily: "var(--font-heading)",
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        color: "var(--text-muted)",
                                        marginBottom: "0.35rem",
                                    }}
                                >
                                    Escrow Contract
                                </p>
                                <a
                                    href={`https://testnet.snowtrace.io/address/${BOUNTY_MANAGER_ADDRESS}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: "0.72rem",
                                        fontFamily: "monospace",
                                        color: "var(--avax-red)",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "opacity 0.2s",
                                    }}
                                >
                                    {formatAddress(BOUNTY_MANAGER_ADDRESS)}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </a>
                            </div>

                            {/* Deadline */}
                            <div>
                                <p
                                    style={{
                                        fontSize: "0.62rem",
                                        fontFamily: "var(--font-heading)",
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        color: "var(--text-muted)",
                                        marginBottom: "0.35rem",
                                    }}
                                >
                                    Deadline
                                </p>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    {formatDeadline(bounty.deadline)}
                                </p>
                            </div>
                        </div>

                        {/* Action area */}
                        <div style={{ padding: "1.5rem 1.75rem" }}>
                            {bounty.status === "Open" && (
                                <>
                                    {isEmployer ? (
                                        hasAcceptedProposal ? (
                                            releaseSuccess ? (
                                                <div
                                                    style={{
                                                        padding: "1rem",
                                                        background: "rgba(74,222,128,0.05)",
                                                        border: "1px solid rgba(74,222,128,0.15)",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "0.75rem",
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            fontSize: "0.8rem",
                                                            color: "var(--status-open)",
                                                            fontWeight: 600,
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        ✓ Payment initiated — ICM in transit
                                                    </p>
                                                    {releaseTxHash && (
                                                        <div style={{ textAlign: "center" }}>
                                                            <p style={{ fontSize: "0.6rem", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                                                                Transaction Hash
                                                            </p>
                                                            <code
                                                                style={{
                                                                    fontSize: "0.65rem",
                                                                    fontFamily: "monospace",
                                                                    background: "rgba(74,222,128,0.05)",
                                                                    border: "1px solid rgba(74,222,128,0.15)",
                                                                    padding: "4px 8px",
                                                                    color: "var(--status-open)",
                                                                    wordBreak: "break-all",
                                                                    display: "block",
                                                                    userSelect: "all",
                                                                }}
                                                            >
                                                                {releaseTxHash}
                                                            </code>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={handleForceSettle}
                                                        disabled={isForceSettling}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            fontSize: "0.7rem",
                                                            color: "var(--text-muted)",
                                                            textDecoration: "underline",
                                                            cursor: "pointer",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {isForceSettling ? "Settling..." : "Message stuck? Force settle"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                    <button
                                                        onClick={handleReleaseFunds}
                                                        disabled={isApproving}
                                                        className="btn-avax"
                                                        style={{
                                                            width: "100%",
                                                            justifyContent: "center",
                                                            background: "rgba(74,222,128,0.12)",
                                                            borderColor: "rgba(74,222,128,0.3)",
                                                            color: "var(--status-open)",
                                                        }}
                                                    >
                                                        {isApproving ? "Releasing..." : "Release Funds →"}
                                                    </button>
                                                    <button
                                                        onClick={handleForceSettle}
                                                        disabled={isForceSettling}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            fontSize: "0.7rem",
                                                            color: "var(--text-muted)",
                                                            textDecoration: "underline",
                                                            cursor: "pointer",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {isForceSettling ? "Settling..." : "Force settlement (fallback)"}
                                                    </button>
                                                </div>
                                            )
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {employerOnAppChain === "0x0000000000000000000000000000000000000000" ? (
                                                    <button
                                                        onClick={handleClaimEmployer}
                                                        disabled={isClaiming}
                                                        className="btn-avax"
                                                        style={{ width: "100%", justifyContent: "center" }}
                                                    >
                                                        {isClaiming ? "Registering..." : "Register on App-Chain →"}
                                                    </button>
                                                ) : (
                                                <div
                                                    style={{
                                                        padding: "0.85rem",
                                                        border: "1px solid var(--border-primary)",
                                                        textAlign: "center",
                                                        fontSize: "0.75rem",
                                                        color: "var(--text-muted)",
                                                        fontFamily: "var(--font-heading)",
                                                        letterSpacing: "0.05em",
                                                    }}
                                                >
                                                    Review submissions below to accept one
                                                </div>
                                                )}
                                                <button
                                                    onClick={handleCancelBounty}
                                                    disabled={isCancelling}
                                                    style={{
                                                        background: "none",
                                                        border: "1px solid rgba(232,65,66,0.2)",
                                                        padding: "0.6rem",
                                                        fontSize: "0.7rem",
                                                        fontFamily: "var(--font-heading)",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.08em",
                                                        textTransform: "uppercase",
                                                        color: "var(--avax-red)",
                                                        cursor: "pointer",
                                                        transition: "border-color 0.2s, background 0.2s",
                                                        width: "100%",
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,65,66,0.05)")}
                                                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                                >
                                                    {isCancelling ? "Cancelling..." : "Cancel Bounty & Refund AVAX"}
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        hasAcceptedProposal ? (
                                            <div
                                                style={{
                                                    padding: "0.85rem",
                                                    border: "1px solid var(--border-primary)",
                                                    textAlign: "center",
                                                    fontSize: "0.75rem",
                                                    color: "var(--text-muted)",
                                                    fontFamily: "var(--font-heading)",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                A proposal has been accepted
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (!isConnected && openConnectModal) {
                                                        openConnectModal();
                                                    } else {
                                                        setIsSubmitModalOpen(true);
                                                    }
                                                }}
                                                className="btn-avax"
                                                style={{ width: "100%", justifyContent: "center" }}
                                            >
                                                Submit Work →
                                            </button>
                                        )
                                    )}
                                </>
                            )}

                            {bounty.status !== "Open" && (
                                <div
                                    style={{
                                        padding: "0.85rem",
                                        border: "1px solid var(--border-primary)",
                                        textAlign: "center",
                                        fontSize: "0.75rem",
                                        color: "var(--text-muted)",
                                        fontFamily: "var(--font-heading)",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    Submissions Closed
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── SUBMIT MODAL ── */}
            {isSubmitModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card"
                        style={{ maxWidth: "480px", width: "100%", overflow: "hidden" }}
                    >
                        {/* Modal header */}
                        <div
                            style={{
                                padding: "1.75rem 2rem 1.5rem",
                                borderBottom: "1px solid var(--border-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <h2
                                style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "1.1rem",
                                    fontWeight: 800,
                                    letterSpacing: "-0.01em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Submit Your Work
                            </h2>
                            <button
                                onClick={() => setIsSubmitModalOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    fontSize: "1.25rem",
                                    cursor: "pointer",
                                    lineHeight: 1,
                                    padding: "2px",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal body */}
                        <form onSubmit={handleSubmit}>
                            <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div className="flex flex-col space-y-2">
                                    <label
                                        style={{
                                            fontSize: "0.65rem",
                                            fontFamily: "var(--font-heading)",
                                            fontWeight: 700,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        Repository Link
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://github.com/username/repo"
                                        value={repoLink}
                                        onChange={(e) => setRepoLink(e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <label
                                        style={{
                                            fontSize: "0.65rem",
                                            fontFamily: "var(--font-heading)",
                                            fontWeight: 700,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        Demo Link <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://your-demo.vercel.app"
                                        value={demoLink}
                                        onChange={(e) => setDemoLink(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div
                                style={{
                                    padding: "1.25rem 2rem",
                                    borderTop: "1px solid var(--border-primary)",
                                    display: "flex",
                                    gap: "0.75rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    className="btn-ghost"
                                    style={{ flex: 1, justifyContent: "center" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-avax"
                                    style={{ flex: 1, justifyContent: "center" }}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Project →"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
