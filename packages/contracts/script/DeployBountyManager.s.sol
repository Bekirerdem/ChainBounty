// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../src/c-chain/BountyManager.sol";

/// @title Deploy BountyManager to C-Chain (Fuji Testnet)
/// @dev Usage: forge script script/DeployBountyManager.s.sol --rpc-url $C_CHAIN_RPC_URL --broadcast
contract DeployBountyManager is Script {
    function run() external {
        // Environment variables
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        bytes32 appChainBlockchainID = vm.envBytes32("APP_CHAIN_BLOCKCHAIN_ID");
        address bountyExecutorAddress = vm.envAddress("BOUNTY_EXECUTOR_ADDRESS");
        address teleporterMessenger = vm.envAddress("TELEPORTER_MESSENGER_ADDRESS");

        vm.startBroadcast(deployerKey);

        BountyManager bountyManager = new BountyManager(
            teleporterMessenger,
            appChainBlockchainID,
            bountyExecutorAddress
        );

        vm.stopBroadcast();

        console.log("BountyManager deployed at:", address(bountyManager));
        console.log("  Teleporter:", teleporterMessenger);
        console.log("  App-Chain ID:", vm.toString(appChainBlockchainID));
        console.log("  BountyExecutor:", bountyExecutorAddress);
    }
}
