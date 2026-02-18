"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
};

export default function CreateBountyPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: "",
        description: "",
        reward: "",
        deadline: "",
        tags: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = "Title is required";
        if (form.title.length > 100) newErrors.title = "Title must be under 100 characters";
        if (!form.description.trim()) newErrors.description = "Description is required";
        if (form.description.length < 20) newErrors.description = "Description must be at least 20 characters";
        if (!form.reward || parseFloat(form.reward) <= 0) newErrors.reward = "Reward must be greater than 0";
        if (parseFloat(form.reward) > 1000) newErrors.reward = "Maximum reward is 1000 AVAX";
        if (!form.deadline) newErrors.deadline = "Deadline is required";
        else {
            const deadlineDate = new Date(form.deadline);
            if (deadlineDate <= new Date()) newErrors.deadline = "Deadline must be in the future";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);

        // Mock submission delay
        await new Promise((r) => setTimeout(r, 1500));

        setSuccess(true);
        setTimeout(() => {
            router.push("/bounties");
        }, 2000);
    };

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    if (success) {
        return (
            <main className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card"
                    style={{ maxWidth: "500px", margin: "0 auto", padding: "3rem", textAlign: "center" }}
                >
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                        Bounty Created!
                    </h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        Your bounty has been posted on C-Chain (mock)
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Redirecting to bounties page...
                    </p>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
            <motion.div initial="hidden" animate="visible" style={{ maxWidth: "700px", margin: "0 auto" }}>
                {/* Header */}
                <motion.div custom={0} variants={fadeUp} style={{ marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Create{" "}
                        <span style={{ color: "var(--avax-red)" }}>Bounty</span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
                        Post a task, lock AVAX in escrow, and find talented freelancers
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form custom={1} variants={fadeUp} onSubmit={handleSubmit}>
                    <div className="glass-card form-card" style={{ padding: "2rem" }}>
                        {/* Title */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label className="form-label">
                                Bounty Title
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Build a Cross-Chain Token Bridge UI"
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                className="form-input"
                                style={{ width: "100%" }}
                            />
                            {errors.title && <span className="form-error">{errors.title}</span>}
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                {form.title.length}/100 characters
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label className="form-label">
                                Description
                            </label>
                            <textarea
                                placeholder="Describe the task in detail. Include requirements, deliverables, and any relevant context..."
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                className="form-input"
                                rows={6}
                                style={{ width: "100%", resize: "vertical", minHeight: "150px" }}
                            />
                            {errors.description && <span className="form-error">{errors.description}</span>}
                        </div>

                        {/* Reward + Deadline Row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                            {/* Reward */}
                            <div>
                                <label className="form-label">
                                    Reward (AVAX)
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.1"
                                        min="0"
                                        value={form.reward}
                                        onChange={(e) => updateField("reward", e.target.value)}
                                        className="form-input"
                                        style={{ width: "100%", paddingRight: "60px" }}
                                    />
                                    <span
                                        style={{
                                            position: "absolute",
                                            right: "14px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--avax-red)",
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        🔺 AVAX
                                    </span>
                                </div>
                                {errors.reward && <span className="form-error">{errors.reward}</span>}
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                    This amount will be locked in escrow
                                </div>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="form-label">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.deadline}
                                    onChange={(e) => updateField("deadline", e.target.value)}
                                    className="form-input"
                                    style={{ width: "100%" }}
                                />
                                {errors.deadline && <span className="form-error">{errors.deadline}</span>}
                            </div>
                        </div>

                        {/* Tags */}
                        <div style={{ marginBottom: "2rem" }}>
                            <label className="form-label">
                                Tags (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Solidity, Frontend, Design (comma-separated)"
                                value={form.tags}
                                onChange={(e) => updateField("tags", e.target.value)}
                                className="form-input"
                                style={{ width: "100%" }}
                            />
                        </div>

                        {/* Info Card */}
                        <div
                            style={{
                                padding: "1rem 1.25rem",
                                borderRadius: "12px",
                                background: "rgba(232, 65, 66, 0.05)",
                                border: "1px solid rgba(232, 65, 66, 0.15)",
                                marginBottom: "2rem",
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)",
                                lineHeight: 1.7,
                            }}
                        >
                            <strong style={{ color: "var(--avax-red)" }}>⚡ How it works:</strong> Your reward
                            amount will be locked in a smart contract on C-Chain. When you approve a submission,
                            the payment is automatically released to the freelancer via ICM cross-chain messaging.
                        </div>

                        {/* Submit */}
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => router.push("/bounties")}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "12px",
                                    border: "1px solid var(--border-glass)",
                                    background: "transparent",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting}
                                style={{
                                    padding: "12px 32px",
                                    fontSize: "0.95rem",
                                    opacity: submitting ? 0.7 : 1,
                                }}
                            >
                                {submitting ? "⏳ Creating..." : "🚀 Create Bounty"}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </motion.div>
        </main>
    );
}
