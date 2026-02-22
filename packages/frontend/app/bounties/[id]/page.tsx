"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getBountyById, getSubmissionsForBounty, formatAddress, formatDeadline, useMockMode } from "@/lib/mock-data";
import { useSubmitWork } from "@/hooks/useBounty";

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
    const bounty = getBountyById(bountyId);
    const submissions = getSubmissionsForBounty(bountyId);

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [repoLink, setRepoLink] = useState("");
    const [demoLink, setDemoLink] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { submitWork } = useSubmitWork();

    if (!bounty) {
        return (
            <div className="container pt-32 pb-20 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-display font-bold mb-4 text-avax-red">404</h1>
                    <p className="text-gray-400 mb-8">Bounty not found.</p>
                    <Link href="/bounties" className="btn-ghost">
                        Back to Bounties
                    </Link>
                </div>
            </div>
        );
    }

    const amount = bounty.reward;
    const currency = "AVAX";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (useMockMode) {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsSubmitting(false);
            setIsSubmitModalOpen(false);
            // In a real app, we would refresh the data
            alert("Submission received! (Mock)");
        } else {
            try {
                // Submit work to the App-Chain executor
                await submitWork(bountyId, repoLink);
                setIsSubmitting(false);
                setIsSubmitModalOpen(false);
                alert("Submission sent to ChainBounty App-Chain!");
            } catch (error) {
                console.error("Submission Error", error);
                setIsSubmitting(false);
                alert("Submission failed. Check console.");
            }
        }
    };

    return (
        <main className="container pt-32 pb-20 min-h-screen">
            <Link 
                href="/bounties" 
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-8 group"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-2 group-hover:-translate-x-1 transition-transform"
                >
                    <path d="m15 18-6-6 6-6"/>
                </svg>
                Back to Bounties
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    className="lg:col-span-2 space-y-8"
                >
                    <motion.div 
                        custom={0} 
                        variants={fadeUp} 
                        className="glass-card p-8 border-l-4 border-l-avax-red"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-display font-bold mb-2">{bounty.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <div className="w-4 h-4 rounded-full bg-linear-to-r from-avax-red to-orange-500 flex items-center justify-center text-[10px] text-white font-bold">
                                            {formatAddress(bounty.creator).charAt(0)}
                                        </div>
                                        {formatAddress(bounty.creator)}
                                    </span>
                                    <span>•</span>
                                    <span>Created {new Date(bounty.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <StatusBadge status={bounty.status} />
                        </div>

                        <div className="prose prose-invert max-w-none text-gray-300">
                            <h3 className="text-white font-display text-lg mb-2">Description</h3>
                            <p className="whitespace-pre-line leading-relaxed">
                                {bounty.description}
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-2">
                            {bounty.tags.map((tag) => (
                                <span 
                                    key={tag} 
                                    className="px-3 py-1 bg-white/5 border border-white/10 text-xs text-gray-400 uppercase tracking-wider font-semibold hover:border-avax-red/50 hover:text-white transition-colors"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Submissions Section */}
                    <motion.div custom={2} variants={fadeUp}>
                        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                            Submissions 
                            <span className="text-sm font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                {submissions.length}
                            </span>
                        </h2>
                        
                        {submissions.length === 0 ? (
                            <div className="glass-card p-8 text-center border-dashed border-2 border-white/10">
                                <p className="text-gray-400">No submissions yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((sub) => (
                                    <div key={sub.submissionId} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-avax-red/30 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-white">{formatAddress(sub.submitter)}</span>
                                                <span className="text-xs text-gray-500">• {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-400 line-clamp-2">{sub.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {sub.repoLink && (
                                                <a 
                                                    href={sub.repoLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="btn-ghost text-xs py-1.5 px-3"
                                                >
                                                    Repo
                                                </a>
                                            )}
                                            {sub.demoLink && (
                                                <a 
                                                    href={sub.demoLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="btn-ghost text-xs py-1.5 px-3"
                                                >
                                                    Demo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Sidebar */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="glass-card p-6 sticky top-24">
                        <div className="mb-6">
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-1">Reward</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-display font-bold text-white">{amount}</span>
                                <span className="text-xl font-bold text-avax-red">{currency}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                ≈ ${(parseFloat(amount) * 25).toLocaleString()} USD (Est.)
                            </p>
                        </div>


                        <div className="mb-8">
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-1">Deadline</h3>
                            <p className="text-lg font-outfit text-white">{formatDeadline(bounty.deadline)}</p>
                        </div>

                        {bounty.status === "Open" && (
                            <button 
                                onClick={() => setIsSubmitModalOpen(true)}
                                className="btn-avax w-full justify-center group"
                            >
                                Submit Work
                                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        )}
                        
                        {bounty.status !== "Open" && (
                            <div className="w-full py-3 bg-white/5 text-center text-gray-400 font-medium cursor-not-allowed border border-white/5">
                                Submissions Closed
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Submission Modal */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card max-w-lg w-full p-8 border-avax-red/30"
                    >
                        <h2 className="text-2xl font-display font-bold mb-6">Submit Your Work</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                    Repository Link
                                </label>
                                <input 
                                    type="url" 
                                    required
                                    placeholder="https://github.com/..."
                                    value={repoLink}
                                    onChange={(e) => setRepoLink(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                    Demo Link (Optional)
                                </label>
                                <input 
                                    type="url" 
                                    placeholder="https://..."
                                    value={demoLink}
                                    onChange={(e) => setDemoLink(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    className="btn-ghost flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="btn-avax flex-1 justify-center"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Project"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
