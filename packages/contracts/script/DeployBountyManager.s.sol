// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/c-chain/BountyManager.sol";

/// @title Deploy BountyManager to C-Chain (Fuji Testnet)
/// @dev Usage: forge script script/DeployBountyManager.s.sol --rpc-url $C_CHAIN_RPC_URL --broadcast
contract DeployBountyManager is Script {
    function run() external {
        // Environment variables
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        bytes32 appChainBlockchainID = vm.envBytes32("APP_CHAIN_BLOCKCHAIN_ID");
        address teleporterMessenger = vm.envAddress(
            "TELEPORTER_MESSENGER_ADDRESS"
        );

        vm.startBroadcast(deployerKey);

        BountyManager bountyManager = new BountyManager(
            teleporterMessenger,
            appChainBlockchainID
        );

        vm.stopBroadcast();

        console.log("BountyManager deployed at:", address(bountyManager));
        console.log("  Teleporter:", teleporterMessenger);
        console.log("  App-Chain ID:", vm.toString(appChainBlockchainID));
        console.log(
            "  NOTE: BountyExecutor not set. Call setExecutor(address) after deploying BountyExecutor."
        );
    }
}
