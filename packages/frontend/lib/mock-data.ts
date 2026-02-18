// ============================================================
// ChainBounty — Mock Data Layer
// Mock mode aktifken blockchain yerine bu veriler kullanılır.
// Blockchain bağlandığında useMockMode = false yapılacak.
// ============================================================

export const useMockMode = true;

// ============================================================
//                      TYPES
// ============================================================

export type BountyStatus = "Open" | "InProgress" | "Completed" | "Disputed" | "Cancelled" | "Expired";

export interface Bounty {
    bountyId: number;
    creator: string;
    title: string;
    description: string;
    reward: string; // AVAX cinsinden string (örn: "2.5")
    deadline: number; // Unix timestamp
    status: BountyStatus;
    submissionCount: number;
    createdAt: number;
    tags: string[];
}

export interface Submission {
    submissionId: number;
    bountyId: number;
    submitter: string;
    solutionURI: string;
    submittedAt: number;
    approved: boolean;
}

// ============================================================
//                    MOCK BOUNTIES
// ============================================================

const now = Math.floor(Date.now() / 1000);
const DAY = 86400;

export const mockBounties: Bounty[] = [
    {
        bountyId: 0,
        creator: "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12",
        title: "Build a Cross-Chain Token Bridge UI",
        description:
            "Design and implement a sleek, responsive UI for a cross-chain token bridge. The interface should support wallet connection, token selection, chain switching, and real-time transaction status tracking. Must use React and integrate with Wagmi hooks. Bonus points for smooth animations and dark mode support.",
        reward: "5.0",
        deadline: now + 14 * DAY,
        status: "Open",
        submissionCount: 2,
        createdAt: now - 3 * DAY,
        tags: ["Frontend", "React", "Web3"],
    },
    {
        bountyId: 1,
        creator: "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd",
        title: "Smart Contract Audit for DeFi Vault",
        description:
            "Perform a comprehensive security audit on a Solidity DeFi vault contract (~500 lines). Check for reentrancy, access control issues, integer overflow/underflow, flash loan attacks, and provide a detailed report with severity levels. Experience with Foundry testing required.",
        reward: "12.0",
        deadline: now + 21 * DAY,
        status: "Open",
        submissionCount: 0,
        createdAt: now - 1 * DAY,
        tags: ["Solidity", "Security", "Audit"],
    },
    {
        bountyId: 2,
        creator: "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12",
        title: "AVAX Price Feed Oracle Integration",
        description:
            "Integrate Chainlink price feeds into an existing Avalanche smart contract. The contract needs reliable AVAX/USD pricing for calculating bounty rewards in dollar terms. Include proper error handling for stale prices and implement a fallback mechanism.",
        reward: "3.5",
        deadline: now + 5 * DAY,
        status: "InProgress",
        submissionCount: 3,
        createdAt: now - 10 * DAY,
        tags: ["Solidity", "Oracle", "Chainlink"],
    },
    {
        bountyId: 3,
        creator: "0x9988776655443322110099887766554433221100",
        title: "Subgraph for Bounty Event Indexing",
        description:
            "Create a subgraph using The Graph protocol to index BountyCreated, SolutionSubmitted, and PaymentReleased events from our smart contracts. Should support efficient querying of bounties by status, creator, and date range. Deploy to Avalanche subgraph endpoint.",
        reward: "4.0",
        deadline: now - 2 * DAY,
        status: "Completed",
        submissionCount: 1,
        createdAt: now - 20 * DAY,
        tags: ["TheGraph", "Indexing", "Backend"],
    },
    {
        bountyId: 4,
        creator: "0xDeAdBeEf00000000000000000000000000000001",
        title: "Animated Landing Page for Web3 Startup",
        description:
            "Build a stunning, conversion-focused landing page for a Web3 startup. Must include: hero section with 3D animation, feature showcase with scroll animations, team section, tokenomics visualization, and a newsletter signup. Prioritize performance (90+ Lighthouse score).",
        reward: "8.0",
        deadline: now + 3 * DAY,
        status: "Disputed",
        submissionCount: 2,
        createdAt: now - 15 * DAY,
        tags: ["Frontend", "Design", "Animation"],
    },
    {
        bountyId: 5,
        creator: "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd",
        title: "ERC-20 Token Faucet for Testnet",
        description:
            "Develop a simple testnet faucet for an ERC-20 token on Avalanche Fuji. Include rate limiting (1 request per address per 24h), a clean web UI with wallet connect, and admin functions for refilling the faucet. Use Foundry for contracts and Next.js for frontend.",
        reward: "2.0",
        deadline: now - 5 * DAY,
        status: "Expired",
        submissionCount: 0,
        createdAt: now - 35 * DAY,
        tags: ["Solidity", "Full-Stack", "Testnet"],
    },
    {
        bountyId: 6,
        creator: "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12",
        title: "ICM Cross-Chain Messaging Dashboard",
        description:
            "Build a real-time dashboard that visualizes cross-chain messages between C-Chain and App-Chain via Avalanche ICM. Show message status (pending, delivered, failed), gas costs, and latency metrics. Include filtering and a timeline view.",
        reward: "6.5",
        deadline: now + 30 * DAY,
        status: "Open",
        submissionCount: 1,
        createdAt: now - 2 * DAY,
        tags: ["Frontend", "ICM", "Dashboard"],
    },
];

// ============================================================
//                   MOCK SUBMISSIONS
// ============================================================

export const mockSubmissions: Submission[] = [
    {
        submissionId: 0,
        bountyId: 0,
        submitter: "0xFrEeLaNcEr1111111111111111111111111111111",
        solutionURI: "https://github.com/freelancer1/bridge-ui",
        submittedAt: now - 2 * DAY,
        approved: false,
    },
    {
        submissionId: 1,
        bountyId: 0,
        submitter: "0xFrEeLaNcEr2222222222222222222222222222222",
        solutionURI: "https://github.com/freelancer2/cross-chain-bridge",
        submittedAt: now - 1 * DAY,
        approved: false,
    },
    {
        submissionId: 2,
        bountyId: 2,
        submitter: "0xFrEeLaNcEr1111111111111111111111111111111",
        solutionURI: "https://github.com/freelancer1/oracle-integration",
        submittedAt: now - 7 * DAY,
        approved: false,
    },
    {
        submissionId: 3,
        bountyId: 2,
        submitter: "0xFrEeLaNcEr3333333333333333333333333333333",
        solutionURI: "https://github.com/freelancer3/avax-oracle",
        submittedAt: now - 6 * DAY,
        approved: false,
    },
    {
        submissionId: 4,
        bountyId: 2,
        submitter: "0xFrEeLaNcEr2222222222222222222222222222222",
        solutionURI: "https://github.com/freelancer2/price-feed",
        submittedAt: now - 5 * DAY,
        approved: false,
    },
    {
        submissionId: 5,
        bountyId: 3,
        submitter: "0xFrEeLaNcEr3333333333333333333333333333333",
        solutionURI: "https://github.com/freelancer3/bounty-subgraph",
        submittedAt: now - 12 * DAY,
        approved: true,
    },
    {
        submissionId: 6,
        bountyId: 4,
        submitter: "0xFrEeLaNcEr1111111111111111111111111111111",
        solutionURI: "https://github.com/freelancer1/web3-landing",
        submittedAt: now - 8 * DAY,
        approved: false,
    },
    {
        submissionId: 7,
        bountyId: 4,
        submitter: "0xFrEeLaNcEr2222222222222222222222222222222",
        solutionURI: "https://github.com/freelancer2/startup-page",
        submittedAt: now - 7 * DAY,
        approved: false,
    },
    {
        submissionId: 8,
        bountyId: 6,
        submitter: "0xFrEeLaNcEr3333333333333333333333333333333",
        solutionURI: "https://github.com/freelancer3/icm-dashboard",
        submittedAt: now - 1 * DAY,
        approved: false,
    },
];

// ============================================================
//                   HELPER FUNCTIONS
// ============================================================

export function getBountyById(id: number): Bounty | undefined {
    return mockBounties.find((b) => b.bountyId === id);
}

export function getSubmissionsForBounty(bountyId: number): Submission[] {
    return mockSubmissions.filter((s) => s.bountyId === bountyId);
}

export function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDeadline(deadline: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = deadline - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
}

export function formatAvax(amount: string): string {
    return `${amount} AVAX`;
}

// Mock stats
export const mockStats = {
    totalBounties: mockBounties.length,
    totalAvaxLocked: mockBounties
        .filter((b) => b.status === "Open" || b.status === "InProgress")
        .reduce((sum, b) => sum + parseFloat(b.reward), 0)
        .toFixed(1),
    activeFreelancers: 12,
    completedBounties: mockBounties.filter((b) => b.status === "Completed").length,
};
