// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A message receipt identifies the message that was delivered by its nonce,
// and the address that can redeem the reward for that message.
struct TeleporterMessageReceipt {
    uint256 receivedMessageNonce;
    address relayerRewardAddress;
}

// Represents the fee information associated to a given Teleporter message.
struct TeleporterFeeInfo {
    address feeTokenAddress;
    uint256 amount;
}

// Represents all of the information required for submitting a Teleporter message
// to be sent to the given destination chain ID and address.
struct TeleporterMessageInput {
    bytes32 destinationBlockchainID;
    address destinationAddress;
    TeleporterFeeInfo feeInfo;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    bytes message;
}

interface ITeleporterReceiver {
    /**
     * @dev Called by TeleporterMessenger on the receiving AppChain.
     * @param sourceChainID The Chain ID of the source network
     * @param sourceAddress The address of the sender contract on the source network
     * @param messageData Encoded payload
     */
    function receiveTeleporterMessage(
        bytes32 sourceChainID,
        address sourceAddress,
        bytes calldata messageData
    ) external;
}

interface ITeleporterMessenger {
    /**
     * @notice Called by transactions to initiate the sending of a cross-chain message.
     * @return The message ID of the newly sent message.
     */
    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32);
}
