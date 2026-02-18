"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import BountyCard from "@/components/BountyCard";
import { mockBounties } from "@/lib/mock-data";
import type { BountyStatus } from "@/lib/mock-data";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
    }),
};

type FilterStatus = "All" | BountyStatus;
type SortOption = "newest" | "reward-high" | "reward-low" | "deadline";

const statusFilters: FilterStatus[] = ["All", "Open", "InProgress", "Completed", "Disputed", "Expired"];

const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "reward-high", label: "Highest Reward" },
    { value: "reward-low", label: "Lowest Reward" },
    { value: "deadline", label: "Ending Soon" },
];

export default function BountiesPage() {
    const [filter, setFilter] = useState<FilterStatus>("All");
    const [sort, setSort] = useState<SortOption>("newest");
    const [search, setSearch] = useState("");

    const filteredBounties = useMemo(() => {
        let result = [...mockBounties];

        // Filter by status
        if (filter !== "All") {
            result = result.filter((b) => b.status === filter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (b) =>
                    b.title.toLowerCase().includes(q) ||
                    b.description.toLowerCase().includes(q) ||
                    b.tags.some((t) => t.toLowerCase().includes(q))
            );
        }

        // Sort
        switch (sort) {
            case "newest":
                result.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case "reward-high":
                result.sort((a, b) => parseFloat(b.reward) - parseFloat(a.reward));
                break;
            case "reward-low":
                result.sort((a, b) => parseFloat(a.reward) - parseFloat(b.reward));
                break;
            case "deadline":
                result.sort((a, b) => a.deadline - b.deadline);
                break;
        }

        return result;
    }, [filter, sort, search]);

    return (
        <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
            {/* Page Header */}
            <motion.div initial="hidden" animate="visible">
                <motion.h1
                    custom={0}
                    variants={fadeUp}
                    style={{
                        fontSize: "2.5rem",
                        fontWeight: 800,
                        marginBottom: "0.5rem",
                    }}
                >
                    Explore{" "}
                    <span style={{ color: "var(--avax-red)" }}>Bounties</span>
                </motion.h1>
                <motion.p
                    custom={1}
                    variants={fadeUp}
                    style={{
                        color: "var(--text-secondary)",
                        fontSize: "1.1rem",
                        marginBottom: "2rem",
                    }}
                >
                    Find tasks that match your skills and earn AVAX
                </motion.p>
            </motion.div>

            {/* Filters Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card"
                style={{
                    padding: "1.25rem",
                    marginBottom: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                {/* Search */}
                <div style={{ position: "relative" }}>
                    <span
                        style={{
                            position: "absolute",
                            left: "14px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "1rem",
                            color: "var(--text-muted)",
                        }}
                    >
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Search bounties by title, description, or tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: "42px", width: "100%" }}
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                    }}
                >
                    {/* Status Filters */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {statusFilters.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    border: filter === s ? "1px solid var(--avax-red)" : "1px solid var(--border-glass)",
                                    background: filter === s ? "rgba(232, 65, 66, 0.15)" : "transparent",
                                    color: filter === s ? "var(--avax-red)" : "var(--text-secondary)",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {s === "InProgress" ? "In Progress" : s}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortOption)}
                        className="form-input"
                        style={{
                            width: "auto",
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                        }}
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Results Count */}
            <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Showing {filteredBounties.length} of {mockBounties.length} bounties
            </div>

            {/* Bounty Grid */}
            {filteredBounties.length > 0 ? (
                <motion.div initial="hidden" animate="visible" className="bounty-grid">
                    {filteredBounties.map((bounty, i) => (
                        <motion.div key={bounty.bountyId} custom={i} variants={fadeUp}>
                            <BountyCard bounty={bounty} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div
                    className="glass-card"
                    style={{
                        padding: "4rem 2rem",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                        No bounties found
                    </h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Try adjusting your filters or search terms
                    </p>
                </div>
            )}
        </main>
    );
}
