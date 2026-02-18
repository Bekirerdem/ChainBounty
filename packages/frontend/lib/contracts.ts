// ============================================================
// Contract ABIs & Addresses
// Will be populated after deployment (Hafta 2)
// ============================================================

// BountyManager (C-Chain) address
export const BOUNTY_MANAGER_ADDRESS =
    (process.env.NEXT_PUBLIC_BOUNTY_MANAGER_ADDRESS as `0x${string}`) ||
    "0x0000000000000000000000000000000000000000";

// BountyExecutor (App-Chain) address
export const BOUNTY_EXECUTOR_ADDRESS =
    (process.env.NEXT_PUBLIC_BOUNTY_EXECUTOR_ADDRESS as `0x${string}`) ||
    "0x0000000000000000000000000000000000000000";

// ============================================================
// BountyManager ABI (C-Chain)
// ============================================================
export const bountyManagerABI = [
    {
        type: "function",
        name: "createBounty",
        inputs: [
            { name: "_title", type: "string" },
            { name: "_description", type: "string" },
            { name: "_deadline", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        name: "cancelBounty",
        inputs: [{ name: "_bountyId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "getBounty",
        inputs: [{ name: "_bountyId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "bountyId", type: "uint256" },
                    { name: "creator", type: "address" },
                    { name: "title", type: "string" },
                    { name: "description", type: "string" },
                    { name: "reward", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "status", type: "uint8" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getEscrowedAmount",
        inputs: [{ name: "_bountyId", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "nextBountyId",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "BountyCreated",
        inputs: [
            { name: "bountyId", type: "uint256", indexed: true },
            { name: "creator", type: "address", indexed: true },
            { name: "title", type: "string", indexed: false },
            { name: "reward", type: "uint256", indexed: false },
            { name: "deadline", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "PaymentReleased",
        inputs: [
            { name: "bountyId", type: "uint256", indexed: true },
            { name: "recipient", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "BountyCancelled",
        inputs: [{ name: "bountyId", type: "uint256", indexed: true }],
    },
] as const;

// ============================================================
// BountyExecutor ABI (App-Chain)
// ============================================================
export const bountyExecutorABI = [
    {
        type: "function",
        name: "submitSolution",
        inputs: [
            { name: "_bountyId", type: "uint256" },
            { name: "_solutionURI", type: "string" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "approveSolution",
        inputs: [{ name: "_submissionId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "openDispute",
        inputs: [{ name: "_bountyId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "getBounty",
        inputs: [{ name: "_bountyId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "bountyId", type: "uint256" },
                    { name: "creator", type: "address" },
                    { name: "title", type: "string" },
                    { name: "description", type: "string" },
                    { name: "reward", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "status", type: "uint8" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getSubmission",
        inputs: [{ name: "_submissionId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "submissionId", type: "uint256" },
                    { name: "bountyId", type: "uint256" },
                    { name: "submitter", type: "address" },
                    { name: "solutionURI", type: "string" },
                    { name: "submittedAt", type: "uint256" },
                    { name: "approved", type: "bool" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getSubmissionCount",
        inputs: [{ name: "_bountyId", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "BountyReceived",
        inputs: [
            { name: "bountyId", type: "uint256", indexed: true },
            { name: "title", type: "string", indexed: false },
            { name: "reward", type: "uint256", indexed: false },
            { name: "deadline", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "SolutionSubmitted",
        inputs: [
            { name: "submissionId", type: "uint256", indexed: true },
            { name: "bountyId", type: "uint256", indexed: true },
            { name: "submitter", type: "address", indexed: true },
            { name: "solutionURI", type: "string", indexed: false },
        ],
    },
    {
        type: "event",
        name: "SolutionApproved",
        inputs: [
            { name: "submissionId", type: "uint256", indexed: true },
            { name: "bountyId", type: "uint256", indexed: true },
            { name: "submitter", type: "address", indexed: false },
        ],
    },
] as const;
