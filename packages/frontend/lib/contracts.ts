// Auto-generated file — post security-fix ABI update (2026-03-01)
// Changes: forceSettleByEmployer → requestForceSettle + executeForceSettle (24h timelock)
//          claimEmployer removed, deliverWork + autoReleasePayment added (72h anti-ghosting)
export const BOUNTY_MANAGER_ADDRESS = (process.env
  .NEXT_PUBLIC_BOUNTY_MANAGER_ADDRESS ||
  "0x6ca6ccedd87a8b55cf29fdd22b42d18e1077313a") as `0x${string}`;
export const BOUNTY_EXECUTOR_ADDRESS = (process.env
  .NEXT_PUBLIC_BOUNTY_EXECUTOR_ADDRESS ||
  "0x1878c4Cc35428C8d4A0A7Df4B67fc9aADd73b43a") as `0x${string}`;

export const BOUNTY_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_teleporterMessenger",
        type: "address",
        internalType: "address",
      },
      { name: "_appChainId", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "SETTLE_TIMELOCK",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowedAppChainExecutor",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "appChainId",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "bounties",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "bountyId", type: "uint256", internalType: "uint256" },
      { name: "employer", type: "address", internalType: "address" },
      { name: "budget", type: "uint256", internalType: "uint256" },
      { name: "ipfsDocHash", type: "string", internalType: "string" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "isCompleted", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cancelBounty",
    inputs: [{ name: "_bountyId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createBounty",
    inputs: [{ name: "_ipfsDocHash", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "executeForceSettle",
    inputs: [{ name: "_bountyId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nextBountyId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "receiveTeleporterMessage",
    inputs: [
      { name: "sourceChainID", type: "bytes32", internalType: "bytes32" },
      { name: "sourceAddress", type: "address", internalType: "address" },
      { name: "messageData", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestForceSettle",
    inputs: [
      { name: "_bountyId", type: "uint256", internalType: "uint256" },
      { name: "_developer", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setExecutor",
    inputs: [{ name: "_executor", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settleIntents",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "developer", type: "address", internalType: "address" },
      { name: "requestedAt", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "teleporterMessenger",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BountyCancelled",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "employer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BountyCompleted",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BountyCreated",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "employer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "budget",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "ipfsDocHash",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ExecutorSet",
    inputs: [
      {
        name: "executor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ForceSettleExecuted",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ForceSettleRequested",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "employer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "BountyNotActive", inputs: [] },
  { type: "error", name: "BountyNotFound", inputs: [] },
  { type: "error", name: "ExecutorNotSet", inputs: [] },
  { type: "error", name: "InvalidBudget", inputs: [] },
  { type: "error", name: "PaymentFailed", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "Unauthorized", inputs: [] },
] as const;

export const BOUNTY_EXECUTOR_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_teleporterMessenger",
        type: "address",
        internalType: "address",
      },
      { name: "_cChainId", type: "bytes32", internalType: "bytes32" },
      {
        name: "_bountyManagerAddress",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "AUTO_RELEASE_TIMEOUT",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "acceptProposal",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "acceptedProposals",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approveWorkAndTriggerPayment",
    inputs: [{ name: "_bountyId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "autoReleasePayment",
    inputs: [{ name: "_bountyId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "bountyEmployers",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "bountyManagerAddress",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "bountyProposals",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cChainId",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deliverWork",
    inputs: [{ name: "_bountyId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nextProposalId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proposals",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "bountyId", type: "uint256", internalType: "uint256" },
      { name: "developer", type: "address", internalType: "address" },
      { name: "requestedAmount", type: "uint256", internalType: "uint256" },
      { name: "deliveryTime", type: "uint256", internalType: "uint256" },
      { name: "contactInfo", type: "string", internalType: "string" },
      { name: "isAccepted", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "receiveTeleporterMessage",
    inputs: [
      { name: "sourceChainID", type: "bytes32", internalType: "bytes32" },
      { name: "sourceAddress", type: "address", internalType: "address" },
      { name: "messageData", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitProposal",
    inputs: [
      { name: "_bountyId", type: "uint256", internalType: "uint256" },
      { name: "_requestedAmount", type: "uint256", internalType: "uint256" },
      { name: "_deliveryTime", type: "uint256", internalType: "uint256" },
      { name: "_contactInfo", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "teleporterMessenger",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "workDeliveredAt",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AutoReleaseTriggered",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BountyCancelled",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BountyRegistered",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "employer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FraudulentClaimOverridden",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "fraudster",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "realEmployer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentTriggered",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProposalAccepted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "employer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProposalSubmitted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "requestedAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WorkDelivered",
    inputs: [
      {
        name: "bountyId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "developer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "AlreadySubmitted", inputs: [] },
  { type: "error", name: "BountyAlreadyHasAcceptedProposal", inputs: [] },
  { type: "error", name: "BountyNotRegistered", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "InvalidDeliveryTime", inputs: [] },
  { type: "error", name: "ProposalNotFound", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "Unauthorized", inputs: [] },
] as const;
