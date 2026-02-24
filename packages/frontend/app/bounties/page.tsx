"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import BountyCard from "@/components/BountyCard";
import { useAllBounties } from "@/hooks/useBounty";
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

const statusFilters: FilterStatus[] = ["All", "Open", "InProgress", "Completed", "Disputed", "Cancelled", "Expired"];

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
    
    const { bounties: liveBounties, isLoading } = useAllBounties();

    const filteredBounties = useMemo(() => {
        let result = [...liveBounties];

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
    }, [filter, sort, search, liveBounties]);

    return (
        <main className="container pt-32 pb-20 min-h-screen">
            {/* Page Header */}
            <motion.div initial="hidden" animate="visible" className="mb-12">
                <motion.h1
                    custom={0}
                    variants={fadeUp}
                    className="text-4xl md:text-5xl font-bold mb-4 font-outfit tracking-tight"
                >
                    Explore <span className="gradient-text">Bounties</span>
                </motion.h1>
                <motion.p
                    custom={1}
                    variants={fadeUp}
                    className="text-lg text-text-secondary max-w-2xl font-light"
                >
                    Discover tasks, contribute to the ecosystem, and earn AVAX.
                    Filter by status or search for specific opportunities.
                </motion.p>
            </motion.div>

            {/* Filters Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card mb-10 p-5 md:p-6"
            >
                <div className="flex items-center gap-4">
                    {/* Search — left */}
                    <div className="relative w-[220px] shrink-0">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search bounties..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: "2.75rem" }}
                            className="form-input w-full bg-bg-secondary/50 border-border-glass focus:border-avax-red/50 transition-colors"
                        />
                    </div>

                    {/* Status Filters — center */}
                    <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                        {statusFilters.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`badge transition-all duration-200 cursor-pointer ${
                                    filter === s
                                        ? ""
                                        : "bg-transparent text-text-muted hover:text-avax-red"
                                }`}
                                style={
                                    filter === s
                                        ? {
                                              background: "rgba(232, 65, 66, 0.1)",
                                              color: "#e84142",
                                              borderColor: "rgba(232, 65, 66, 0.2)",
                                          }
                                        : {
                                              borderColor: "rgba(255,255,255,0.08)",
                                          }
                                }
                                onMouseEnter={(e) => {
                                    if (filter !== s) {
                                        e.currentTarget.style.background = "rgba(232, 65, 66, 0.08)";
                                        e.currentTarget.style.borderColor = "rgba(232, 65, 66, 0.2)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (filter !== s) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                    }
                                }}
                            >
                                {s === "InProgress" ? "In Progress" : s}
                            </button>
                        ))}
                    </div>

                    {/* Sort — right */}
                    <div className="relative min-w-[160px] shrink-0">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            style={{ paddingRight: "2.5rem" }}
                            className="form-input w-full appearance-none cursor-pointer bg-bg-secondary/50 border-border-glass hover:border-avax-red/30 px-4 py-2"
                        >
                            {sortOptions.map((opt) => (
                                <option
                                    key={opt.value}
                                    value={opt.value}
                                    style={{ background: "#181818", color: "#f5f5f5" }}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Results Count */}
            <div className="flex items-center gap-3 mb-6 text-sm text-text-muted font-mono uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-avax-red inline-block shrink-0"></span>
                Showing {filteredBounties.length} result{filteredBounties.length !== 1 ? "s" : ""}
            </div>

            {/* Bounty Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                     <svg className="animate-spin h-8 w-8 text-avax-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : filteredBounties.length > 0 ? (
                <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBounties.map((bounty, i) => (
                        <motion.div key={bounty.bountyId} custom={i} variants={fadeUp}>
                            <BountyCard bounty={bounty} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="glass-card py-24 text-center border border-dashed border-white/10">
                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                    <h3 className="text-2xl font-bold mb-2 font-outfit">No bounties found</h3>
                    <p className="text-text-secondary">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
                </div>
            )}
        </main>
    );
}
