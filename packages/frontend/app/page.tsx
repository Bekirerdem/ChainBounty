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
        transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    }),
};

const stats = [
    { label: "Total Bounties", value: mockStats.totalBounties.toString() },
    { label: "AVAX Locked", value: `${mockStats.totalAvaxLocked}` },
    { label: "Freelancers", value: mockStats.activeFreelancers.toString() },
    { label: "Completed", value: mockStats.completedBounties.toString() },
];

const marqueeItems = [
    "Cross-Chain Bounties",
    "◆",
    "Avalanche C-Chain",
    "◆",
    "ICM Teleporter",
    "◆",
    "App-Chain Execution",
    "◆",
    "Trustless Escrow",
    "◆",
    "Zero Gas Submissions",
    "◆",
];

const steps = [
    {
        num: "01",
        title: "Create a Bounty",
        desc: "Post your task on C-Chain with AVAX reward locked in escrow. Define scope, deadline, and requirements.",
    },
    {
        num: "02",
        title: "Submit Solutions",
        desc: "Freelancers submit work on App-Chain with near-zero gas fees. Multiple submissions, fair competition.",
    },
    {
        num: "03",
        title: "Approve & Pay",
        desc: "Accept the best solution. ICM Teleporter triggers trustless cross-chain payment from escrow.",
    },
];

export default function HomePage() {
    const featuredBounties = mockBounties.slice(0, 3);

    return (
        <main>
            {/* ============ HERO SECTION ============ */}
            <section className="hero-cinematic">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    style={{ position: "relative", zIndex: 1, maxWidth: "900px" }}
                >
                    {/* Label */}
                    <motion.p
                        custom={0}
                        variants={fadeUp}
                        className="text-label"
                        style={{ marginBottom: "1.5rem" }}
                    >
                        Built on Avalanche — Cross-Chain Protocol
                    </motion.p>

                    {/* Hero Title */}
                    <motion.h1
                        custom={1}
                        variants={fadeUp}
                        className="text-display-xl"
                        style={{ marginBottom: "1.5rem" }}
                    >
                        Ship Work.{" "}
                        <span className="gradient-text">Get Paid.</span>
                        <br />
                        Cross-Chain.
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        custom={2}
                        variants={fadeUp}
                        style={{
                            fontSize: "1.1rem",
                            color: "var(--text-secondary)",
                            maxWidth: "600px",
                            margin: "0 auto 2.5rem",
                            lineHeight: 1.6,
                        }}
                    >
                        Create bounties on C-Chain. Submit solutions on App-Chain with
                        near-zero gas. Settle payments trustlessly via ICM Teleporter.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        custom={3}
                        variants={fadeUp}
                        style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
                    >
                        <Link href="/bounties" style={{ textDecoration: "none" }}>
                            <button className="btn-avax">Explore Bounties →</button>
                        </Link>
                        <Link href="/create" style={{ textDecoration: "none" }}>
                            <button className="btn-ghost">Post a Bounty</button>
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* ============ MARQUEE STRIP ============ */}
            <div className="marquee-strip">
                <div className="marquee-content">
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <span key={i} className={item === "◆" ? "avax-accent" : ""}>
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* ============ STATS ============ */}
            <section style={{ padding: "5rem 0" }}>
                <div className="container">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "1px",
                            background: "var(--border-primary)",
                        }}
                    >
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                custom={i}
                                variants={fadeUp}
                                className="stat-card"
                            >
                                <p className="stat-value">{stat.value}</p>
                                <p className="stat-label">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ============ HOW IT WORKS ============ */}
            <section style={{ padding: "3rem 0 5rem" }}>
                <div className="container">
                    <div className="section-number">
                        <span>How It Works</span>
                    </div>

                    <h2
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: "3rem",
                        }}
                    >
                        Three Steps to{" "}
                        <span className="gradient-text">Trustless Work</span>
                    </h2>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "1px",
                            background: "var(--border-primary)",
                        }}
                    >
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                custom={i}
                                variants={fadeUp}
                                style={{
                                    padding: "2.5rem",
                                    background: "var(--bg-primary)",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "var(--font-heading)",
                                        fontSize: "3rem",
                                        fontWeight: 800,
                                        color: "var(--avax-red)",
                                        opacity: 0.15,
                                        lineHeight: 1,
                                        display: "block",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    {step.num}
                                </span>
                                <h3
                                    style={{
                                        fontFamily: "var(--font-heading)",
                                        fontSize: "1.2rem",
                                        fontWeight: 700,
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    {step.title}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "var(--text-secondary)",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ============ FEATURED BOUNTIES ============ */}
            <section style={{ padding: "3rem 0 6rem" }}>
                <div className="container">
                    <div className="section-number">
                        <span>Featured Bounties</span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "2rem",
                        }}
                    >
                        <h2
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                                fontWeight: 800,
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Latest <span className="gradient-text">Opportunities</span>
                        </h2>
                        <Link href="/bounties" style={{ textDecoration: "none" }}>
                            <button className="btn-ghost btn-sm">View All →</button>
                        </Link>
                    </div>

                    <motion.div
                        className="bounty-grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        {featuredBounties.map((bounty, i) => (
                            <motion.div key={bounty.bountyId} custom={i} variants={fadeUp}>
                                <BountyCard bounty={bounty} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ============ CTA SECTION ============ */}
            <section
                style={{
                    padding: "6rem 0",
                    textAlign: "center",
                    borderTop: "1px solid var(--border-primary)",
                    background:
                        "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,65,66,0.06), transparent)",
                }}
            >
                <div className="container">
                    <p className="text-label" style={{ marginBottom: "1.5rem" }}>
                        Ready to Start?
                    </p>
                    <h2
                        className="text-display"
                        style={{
                            fontSize: "clamp(2rem, 5vw, 3.5rem)",
                            marginBottom: "1rem",
                        }}
                    >
                        Build the Future of{" "}
                        <span className="gradient-text">Freelancing</span>
                    </h2>
                    <p
                        style={{
                            color: "var(--text-secondary)",
                            fontSize: "1.05rem",
                            maxWidth: "500px",
                            margin: "0 auto 2rem",
                            lineHeight: 1.6,
                        }}
                    >
                        Post your first bounty or start solving challenges. No middlemen, no
                        borders, no trust issues.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                        <Link href="/create" style={{ textDecoration: "none" }}>
                            <button className="btn-avax">Create Bounty →</button>
                        </Link>
                        <Link href="/bounties" style={{ textDecoration: "none" }}>
                            <button className="btn-ghost">Browse Bounties</button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============ RESPONSIVE OVERRIDE ============ */}
            <style jsx>{`
                @media (max-width: 768px) {
                    :global(.stat-card) {
                        text-align: center;
                    }
                }
            `}</style>
        </main>
    );
}
