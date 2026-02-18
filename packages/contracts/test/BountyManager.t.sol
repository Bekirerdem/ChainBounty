// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/c-chain/BountyManager.sol";

/// @title BountyManager Unit Tests
/// @notice C-Chain BountyManager kontratı için temel testler
/// @dev Teleporter mock'ları Hafta 2'de implement edilecek
contract BountyManagerTest is Test {
    BountyManager public bountyManager;

    // Test adresleri
    address public creator = makeAddr("creator");
    address public freelancer = makeAddr("freelancer");

    // Mock değerler
    address public mockTeleporter = makeAddr("teleporter");
    bytes32 public appChainID = keccak256("app-chain");
    address public mockExecutor = makeAddr("executor");

    function setUp() public {
        bountyManager = new BountyManager(
            mockTeleporter,
            appChainID,
            mockExecutor
        );

        // Creator'a AVAX ver
        vm.deal(creator, 100 ether);
    }

    function test_InitialState() public view {
        assertEq(bountyManager.nextBountyId(), 0);
        assertEq(address(bountyManager.teleporterMessenger()), mockTeleporter);
        assertEq(bountyManager.appChainBlockchainID(), appChainID);
        assertEq(bountyManager.bountyExecutorAddress(), mockExecutor);
    }

    // TODO: Hafta 2'de implement edilecek testler:
    // - test_CreateBounty_Success
    // - test_CreateBounty_ZeroReward_Reverts
    // - test_CreateBounty_PastDeadline_Reverts
    // - test_CancelBounty_Success
    // - test_CancelBounty_NotCreator_Reverts
    // - test_ReceiveApproval_ReleasesPayment
    // - test_ReceiveDispute_UpdatesStatus
    // - test_InvalidCaller_Reverts
}
