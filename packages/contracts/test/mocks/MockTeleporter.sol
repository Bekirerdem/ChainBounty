// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TeleporterMessageInput} from "../../src/interfaces/ITeleporter.sol";

/// @title MockTeleporter
/// @notice Test ortamı için Teleporter mock kontratı
contract MockTeleporter {
    event MessageSent(bytes32 destinationBlockchainID, address destinationAddress);

    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32) {
        emit MessageSent(messageInput.destinationBlockchainID, messageInput.destinationAddress);
        return keccak256(abi.encode(block.timestamp));
    }
}
