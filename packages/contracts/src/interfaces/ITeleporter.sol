// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
