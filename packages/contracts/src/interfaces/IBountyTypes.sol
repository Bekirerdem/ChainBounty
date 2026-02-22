// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IBountyTypes
/// @notice Shared types used across BountyManager (C-Chain) and BountyExecutor (App-Chain)
interface IBountyTypes {
    // ============================================================
    //                         ENUMS
    // ============================================================

    /// @notice Bounty lifecycle states
    enum BountyStatus {
        Open,           // Bounty created, accepting submissions
        InProgress,     // A submission is being reviewed
        Completed,      // Bounty fulfilled, payment released
        Disputed,       // Dispute opened
        Cancelled,      // Cancelled by creator (before any submission)
        Expired         // Deadline passed with no completion
    }

    /// @notice Cross-chain message types between BountyManager <-> BountyExecutor
    enum MessageType {
        CREATE_BOUNTY,      // C-Chain -> App-Chain: new bounty created
        SUBMIT_SOLUTION,    // App-Chain -> C-Chain: solution submitted (info only)
        APPROVE_SOLUTION,   // App-Chain -> C-Chain: release payment
        DISPUTE_OPENED,     // App-Chain -> C-Chain: dispute notification
        CANCEL_BOUNTY       // C-Chain -> App-Chain: bounty cancelled
    }

    // ============================================================
    //                        STRUCTS
    // ============================================================

    /// @notice Core bounty data (stored on both chains)
    struct BountyData {
        uint256 bountyId;
        address creator;
        string title;
        string description;
        uint256 reward;         // In wei (AVAX amount locked in escrow)
        uint256 deadline;       // Unix timestamp
        BountyStatus status;
    }

    /// @notice Submission data (stored on App-Chain)
    struct Submission {
        uint256 submissionId;
        uint256 bountyId;
        address submitter;
        string solutionURI;     // IPFS or URL to solution
        uint256 submittedAt;
        bool approved;
    }

    /// @notice Cross-chain message payload
    struct CrossChainMessage {
        MessageType msgType;
        uint256 bountyId;
        bytes data;             // ABI encoded additional data
    }
}
