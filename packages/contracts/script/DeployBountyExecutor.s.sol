// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/app-chain/BountyExecutor.sol";

/// @title Deploy BountyExecutor to App-Chain
/// @dev Usage: forge script script/DeployBountyExecutor.s.sol --rpc-url $APP_CHAIN_RPC_URL --broadcast
contract DeployBountyExecutor is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        bytes32 cChainBlockchainID = vm.envBytes32("C_CHAIN_BLOCKCHAIN_ID");
        address bountyManagerAddress = vm.envAddress("BOUNTY_MANAGER_ADDRESS");
        address teleporterMessenger = vm.envAddress(
            "TELEPORTER_MESSENGER_ADDRESS"
        );

        vm.startBroadcast(deployerKey);
        BountyExecutor bountyExecutor = new BountyExecutor(
            teleporterMessenger,
            cChainBlockchainID,
            bountyManagerAddress
        );
        vm.stopBroadcast();

        console.log("BountyExecutor deployed at:", address(bountyExecutor));
        console.log("  Teleporter:", teleporterMessenger);
        console.log("  C-Chain ID:", vm.toString(cChainBlockchainID));
        console.log("  BountyManager:", bountyManagerAddress);
    }
}
