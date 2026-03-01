"use client";

import { useAccount } from "wagmi";
import { useAllBounties, useProposalCount } from "@/hooks/useBounty";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReadContracts } from "wagmi";
import { BOUNTY_EXECUTOR_ADDRESS, BOUNTY_EXECUTOR_ABI } from "@/lib/contracts";
import { bountyAppChain } from "@/lib/chains";
import { formatEther } from "viem";

interface MyProposal {
    proposalId: number;
    bountyId: number;
    requestedAmount: string;
    status: "Pending" | "Accepted";
    bountyTitle?: string;
}

export default function DeveloperDashboard() {
    const { address } = useAccount();
    const { bounties } = useAllBounties();
    const { proposalCount, isLoading: isCountLoading } = useProposalCount();

    // Fetch all proposals
    const proposalContracts = Array.from({ length: proposalCount }).map((_, i) => ({
        address: BOUNTY_EXECUTOR_ADDRESS as `0x${string}`,
        abi: BOUNTY_EXECUTOR_ABI,
        functionName: "proposals" as const,
        args: [BigInt(i)],
        chainId: bountyAppChain.id,
    }));

    const { data: results, isLoading: isProposalsLoading } = useReadContracts({
        contracts: proposalContracts,
        query: { enabled: proposalCount > 0 },
    });

    // Filter proposals by connected wallet
    const myProposals: MyProposal[] = [];
    if (results) {
        results.forEach((result) => {
            if (result.status === "success" && result.result) {
                const [pId, bId, developer, requestedAmount, , , isAccepted] =
                    result.result as unknown as [bigint, bigint, string, bigint, bigint, string, boolean];

                if (developer.toLowerCase() === address?.toLowerCase()) {
                    const bounty = bounties.find((b) => b.bountyId === Number(bId));
                    myProposals.push({
                        proposalId: Number(pId),
                        bountyId: Number(bId),
                        requestedAmount: formatEther(requestedAmount),
                        status: isAccepted ? "Accepted" : "Pending",
                        bountyTitle: bounty?.title ?? `Bounty #${Number(bId)}`,
                    });
                }
            }
        });
    }

    const isLoading = isCountLoading || isProposalsLoading;
    const pendingProposals = myProposals.filter((p) => p.status === "Pending");
    const acceptedProposals = myProposals.filter((p) => p.status === "Accepted");
    const totalEarned = acceptedProposals.reduce((sum, p) => sum + parseFloat(p.requestedAmount), 0);

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div style={{
                    width: 24, height: 24, border: "2px solid var(--border-primary)",
                    borderTop: "2px solid var(--avax-red)", borderRadius: "50%",
                    animation: "spin 1s linear infinite", margin: "0 auto 1rem",
                }} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading proposals...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: "2rem" }}>
                {[
                    { label: "Toplam Teklif", value: myProposals.length, color: "var(--text-primary)" },
                    { label: "Bekleyen", value: pendingProposals.length, color: "var(--status-progress)" },
                    { label: "Kabul Edilen", value: acceptedProposals.length, color: "var(--status-open)" },
                    { label: "Kazanılan AVAX", value: totalEarned.toFixed(2), color: "var(--avax-red)" },
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

            {/* Proposal list */}
            {myProposals.length === 0 ? (
                <div
                    className="glass-card"
                    style={{ padding: "3rem", textAlign: "center" }}
                >
                    <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>⚡</p>
                    <p style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        marginBottom: "0.5rem",
                    }}>
                        Henüz teklif vermediniz
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        Açık bounty&apos;lere göz atıp işe başlayın.
                    </p>
                    <Link href="/bounties" className="btn-avax btn-sm">
                        Bounty&apos;lere Göz At →
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {myProposals.map((proposal, i) => (
                        <motion.div
                            key={proposal.proposalId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                        >
                            <Link
                                href={`/bounties/${proposal.bountyId}`}
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
                                            <span
                                                className="badge"
                                                style={{
                                                    background: proposal.status === "Accepted"
                                                        ? "rgba(74,222,128,0.1)"
                                                        : "rgba(251,191,36,0.1)",
                                                    color: proposal.status === "Accepted"
                                                        ? "var(--status-open)"
                                                        : "var(--status-progress)",
                                                    border: `1px solid ${
                                                        proposal.status === "Accepted"
                                                            ? "rgba(74,222,128,0.2)"
                                                            : "rgba(251,191,36,0.2)"
                                                    }`,
                                                }}
                                            >
                                                {proposal.status === "Accepted" ? "Kabul Edildi" : "Bekliyor"}
                                            </span>
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
                                            {proposal.bountyTitle}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <p style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: "1rem",
                                            fontWeight: 800,
                                            color: "var(--avax-red)",
                                        }}>
                                            {proposal.requestedAmount} <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>AVAX</span>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
