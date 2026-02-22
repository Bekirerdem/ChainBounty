"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCreateBounty } from "@/hooks/useBounty";
import { useMockMode } from "@/lib/mock-data";

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

    const { createTask } = useCreateBounty();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);

        if (useMockMode) {
            // Mock submission delay
            await new Promise((r) => setTimeout(r, 1500));
            setSuccess(true);
            setTimeout(() => {
                router.push("/bounties");
            }, 2000);
        } else {
            try {
                // In a real app we might store JSON in IPFS. For hackathon, we combine title and description.
                await createTask(`${form.title} | ${form.description}`, form.reward);
                // Note: createTask is async but in wagmi v2 writeContract doesn't wait for receipt by default. 
                // We'll just show success immediately for MVP simplicity.
                setSuccess(true);
                setTimeout(() => {
                    router.push("/bounties");
                }, 2000);
            } catch (err) {
                console.error("Contract Error:", err);
                setSubmitting(false);
            }
        }
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
            <main className="container pt-32 pb-20 min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card max-w-lg w-full p-12 text-center border-avax-red/20 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-avax-red/5 to-transparent pointer-events-none" />
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-bold mb-3 font-outfit text-white">
                        Bounty Created!
                    </h2>
                    <p className="text-text-secondary mb-2 text-lg">
                        Your bounty has been posted on C-Chain (mock)
                    </p>
                    <p className="text-text-muted text-sm font-mono mt-6 animate-pulse">
                        Redirecting to bounties page...
                    </p>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="container pt-32 pb-20 min-h-screen">
            <motion.div initial="hidden" animate="visible" className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div custom={0} variants={fadeUp} className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 font-outfit tracking-tight">
                        Create <span className="text-avax-red">Bounty</span>
                    </h1>
                    <p className="text-xl text-text-secondary font-light">
                        Post a task, lock AVAX in escrow, and recruit talent.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form custom={1} variants={fadeUp} onSubmit={handleSubmit}>
                    <div className="glass-card p-8 md:p-10 border-t border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-avax-red via-transparent to-transparent opacity-50" />
                        
                        {/* Title */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">
                                Bounty Title
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Build a Cross-Chain Token Bridge UI"
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                className="form-input w-full bg-bg-secondary/40 focus:bg-bg-secondary/80 text-lg py-3"
                            />
                            {errors.title && <span className="text-avax-red text-xs mt-2 block font-medium">{errors.title}</span>}
                            <div className="text-xs text-text-muted mt-2 text-right">
                                {form.title.length}/100
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">
                                Description
                            </label>
                            <textarea
                                placeholder="Describe the task in detail. Include requirements, deliverables, and any relevant context..."
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                className="form-input w-full bg-bg-secondary/40 focus:bg-bg-secondary/80 min-h-[200px] resize-y"
                            />
                            {errors.description && <span className="text-avax-red text-xs mt-2 block font-medium">{errors.description}</span>}
                        </div>

                        {/* Reward + Deadline Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Reward */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">
                                    Reward (AVAX)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.1"
                                        min="0"
                                        value={form.reward}
                                        onChange={(e) => updateField("reward", e.target.value)}
                                        className="form-input w-full pr-20 text-lg font-mono"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-avax-red font-bold text-sm">
                                        🔺 AVAX
                                    </span>
                                </div>
                                {errors.reward && <span className="text-avax-red text-xs mt-2 block font-medium">{errors.reward}</span>}
                                <div className="text-xs text-text-muted mt-2">
                                    Funds will be locked in escrow.
                                </div>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.deadline}
                                    onChange={(e) => updateField("deadline", e.target.value)}
                                    className="form-input w-full text-lg"
                                />
                                {errors.deadline && <span className="text-avax-red text-xs mt-2 block font-medium">{errors.deadline}</span>}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="mb-10">
                            <label className="block text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">
                                Tags (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Solidity, Frontend, Design (comma-separated)"
                                value={form.tags}
                                onChange={(e) => updateField("tags", e.target.value)}
                                className="form-input w-full"
                            />
                        </div>

                        {/* Info Card */}
                        <div className="bg-avax-red/5 border border-avax-red/10 rounded-none p-5 mb-8 text-sm text-text-secondary leading-relaxed flex items-start gap-3">
                            <span className="text-lg">⚡</span>
                            <div>
                                <strong className="text-avax-red font-semibold block mb-1">How it works</strong>
                                Your reward amount will be locked in a smart contract on C-Chain. When you approve a submission, the payment is automatically released to the freelancer via ICM cross-chain messaging.
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4 justify-end items-center border-t border-white/5 pt-8">
                            <button
                                type="button"
                                onClick={() => router.push("/bounties")}
                                className="px-6 py-3 text-sm font-semibold text-text-muted hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-avax px-10 py-3 text-base flex items-center gap-2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>🚀 Create Bounty</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </motion.div>
        </main>
    );
}
