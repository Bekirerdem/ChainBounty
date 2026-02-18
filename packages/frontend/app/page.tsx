"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BountyCard from "@/components/BountyCard";
import { mockBounties, mockStats } from "@/lib/mock-data";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
};

const stats = [
    { label: "Total Bounties", value: mockStats.totalBounties.toString(), icon: "📋" },
    { label: "AVAX Locked", value: `${mockStats.totalAvaxLocked}`, icon: "🔺" },
    { label: "Active Freelancers", value: mockStats.activeFreelancers.toString(), icon: "👥" },
    { label: "Completed", value: mockStats.completedBounties.toString(), icon: "✅" },
];

export default function HomePage() {
    const featuredBounties = mockBounties.filter((b) => b.status === "Open").slice(0, 3);

    return (
        <main>
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-glow" />
                <div className="container" style={{ position: "relative", zIndex: 1 }}>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        style={{
                            textAlign: "center",
                            paddingTop: "6rem",
                            paddingBottom: "4rem",
                        }}
                    >
                        <motion.div
                            custom={0}
                            variants={fadeUp}
                            style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: "var(--avax-red)",
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                                marginBottom: "1.5rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: "var(--avax-red)",
                                    boxShadow: "0 0 12px var(--avax-red-glow)",
                                    animation: "pulse 2s ease-in-out infinite",
                                }}
                            />
                            Built on Avalanche ICM
                        </motion.div>

                        <motion.h1
                            custom={1}
                            variants={fadeUp}
                            style={{
                                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                                fontWeight: 800,
                                lineHeight: 1.05,
                                marginBottom: "1.5rem",
                            }}
                        >
                            <span
                                style={{
                                    background: "linear-gradient(135deg, #f0f0f5 0%, #9495a5 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                Cross-Chain
                            </span>
                            <br />
                            <span
                                style={{
                                    background: "linear-gradient(135deg, #E84142 0%, #ff6b6b 50%, #E84142 100%)",
                                    backgroundSize: "200% 200%",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    animation: "gradientShift 4s ease infinite",
                                }}
                            >
                                Bounty Platform
                            </span>
                        </motion.h1>

                        <motion.p
                            custom={2}
                            variants={fadeUp}
                            style={{
                                fontSize: "1.2rem",
                                color: "var(--text-secondary)",
                                maxWidth: "600px",
                                margin: "0 auto 2.5rem",
                                lineHeight: 1.7,
                            }}
                        >
                            Create bounties on C-Chain, execute on App-Chain, settle payments
                            automatically via Avalanche ICM — trustless & gas-efficient.
                        </motion.p>

                        <motion.div
                            custom={3}
                            variants={fadeUp}
                            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
                        >
                            <Link href="/bounties">
                                <button className="btn-primary" style={{ fontSize: "1.1rem", padding: "16px 36px" }}>
                                    🚀 Explore Bounties
                                </button>
                            </Link>
                            <Link href="/create">
                                <button
                                    style={{
                                        fontSize: "1.1rem",
                                        padding: "16px 36px",
                                        borderRadius: "12px",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(255,255,255,0.03)",
                                        color: "var(--text-secondary)",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    ✨ Post a Bounty
                                </button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="container" style={{ marginTop: "-2rem", position: "relative", zIndex: 2 }}>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            custom={i}
                            variants={fadeUp}
                            className="glass-card stat-card"
                            style={{
                                padding: "1.5rem",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
                            <div
                                style={{
                                    fontSize: "1.75rem",
                                    fontWeight: 800,
                                    background: "linear-gradient(135deg, #f0f0f5, #9495a5)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                {stat.value}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* How It Works */}
            <section className="container" style={{ marginTop: "5rem" }}>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <motion.h2
                        custom={0}
                        variants={fadeUp}
                        style={{
                            textAlign: "center",
                            fontSize: "2rem",
                            fontWeight: 700,
                            marginBottom: "3rem",
                        }}
                    >
                        How It{" "}
                        <span style={{ color: "var(--avax-red)" }}>Works</span>
                    </motion.h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "1.5rem",
                        }}
                    >
                        {[
                            {
                                icon: "📝",
                                title: "1. Create Bounty",
                                desc: "Post a task on C-Chain and lock AVAX in escrow",
                                chain: "C-Chain",
                                chainColor: "var(--avax-red)",
                            },
                            {
                                icon: "⚡",
                                title: "2. Submit Solution",
                                desc: "Freelancers submit solutions on App-Chain with minimal gas",
                                chain: "App-Chain",
                                chainColor: "var(--status-progress)",
                            },
                            {
                                icon: "💰",
                                title: "3. Get Paid",
                                desc: "Approved submissions trigger automatic cross-chain payment",
                                chain: "ICM Bridge",
                                chainColor: "var(--status-completed)",
                            },
                        ].map((step, i) => (
                            <motion.div
                                key={step.title}
                                custom={i + 1}
                                variants={fadeUp}
                                className="glass-card"
                                style={{ padding: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{step.icon}</div>
                                <h3
                                    style={{
                                        fontSize: "1.2rem",
                                        fontWeight: 700,
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    {step.title}
                                </h3>
                                <p
                                    style={{
                                        color: "var(--text-secondary)",
                                        lineHeight: 1.6,
                                        marginBottom: "1rem",
                                        fontSize: "0.95rem",
                                    }}
                                >
                                    {step.desc}
                                </p>
                                <span
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: "999px",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: step.chainColor,
                                        background: `${step.chainColor}15`,
                                        border: `1px solid ${step.chainColor}30`,
                                    }}
                                >
                                    {step.chain}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Featured Bounties */}
            <section className="container" style={{ marginTop: "5rem", marginBottom: "5rem" }}>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <motion.div
                        custom={0}
                        variants={fadeUp}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "2rem",
                        }}
                    >
                        <h2 style={{ fontSize: "2rem", fontWeight: 700 }}>
                            Featured{" "}
                            <span style={{ color: "var(--avax-red)" }}>Bounties</span>
                        </h2>
                        <Link
                            href="/bounties"
                            style={{
                                color: "var(--avax-red)",
                                textDecoration: "none",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            View All →
                        </Link>
                    </motion.div>

                    <div className="bounty-grid">
                        {featuredBounties.map((bounty, i) => (
                            <motion.div key={bounty.bountyId} custom={i + 1} variants={fadeUp}>
                                <BountyCard bounty={bounty} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
