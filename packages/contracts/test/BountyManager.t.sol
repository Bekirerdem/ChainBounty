// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/c-chain/BountyManager.sol";
import "../src/interfaces/IBountyTypes.sol";
import "./mocks/MockTeleporter.sol";

/// @title BountyManager Unit Tests
/// @notice C-Chain BountyManager kontratı için güvenlik testleri
contract BountyManagerTest is Test {
    BountyManager public bountyManager;
    MockTeleporter public teleporter;

    // Test adresleri
    address public creator = makeAddr("creator");
    address public freelancer = makeAddr("freelancer");

    // Mock değerler
    bytes32 public appChainID = keccak256("app-chain");
    address public mockExecutor = makeAddr("executor");

    function setUp() public {
        teleporter = new MockTeleporter();
        bountyManager = new BountyManager(address(teleporter), appChainID);
        bountyManager.setExecutor(mockExecutor);
        vm.deal(creator, 100 ether);
        vm.deal(freelancer, 10 ether);
    }

    function test_InitialState() public view {
        assertEq(bountyManager.nextBountyId(), 100);
        assertEq(
            address(bountyManager.teleporterMessenger()),
            address(teleporter)
        );
        assertEq(bountyManager.appChainId(), appChainID);
        assertEq(bountyManager.allowedAppChainExecutor(), mockExecutor);
    }

    // ============================================================
    //                  FIX 2: ForceSettle Timelock Tests
    // ============================================================

    function test_ForceSettle_TimelockEnforced() public {
        // Setup: bounty oluştur
        vm.prank(creator);
        bountyManager.createBounty{value: 1 ether}("test");
        uint256 bountyId = 100; // nextBountyId ilk 100'den başlıyor

        // Intent kaydet
        vm.prank(creator);
        bountyManager.requestForceSettle(bountyId, freelancer);

        // Hemen execute etmeye çalış — revert etmeli
        vm.prank(creator);
        vm.expectRevert(BountyManager.Unauthorized.selector);
        bountyManager.executeForceSettle(bountyId);

        // 24 saat ilerle
        vm.warp(block.timestamp + 24 hours + 1);

        // Şimdi execute et — başarılı olmalı
        vm.prank(creator);
        bountyManager.executeForceSettle(bountyId);

        // Bounty completed ve AVAX transfer edildi mi?
        (, , , , bool isActive, bool isCompleted) = bountyManager.bounties(
            bountyId
        );
        assertFalse(isActive);
        assertTrue(isCompleted);
        assertEq(freelancer.balance, 11 ether); // 10 + 1
    }

    function test_ForceSettle_OnlyEmployer() public {
        vm.prank(creator);
        bountyManager.createBounty{value: 1 ether}("test");

        vm.prank(freelancer); // Yanlış kişi
        vm.expectRevert(BountyManager.Unauthorized.selector);
        bountyManager.requestForceSettle(100, freelancer);
    }

    // ============================================================
    //                  FIX 4: CancelBounty ICM Tests
    // ============================================================

    function test_CancelBounty_RefundsAndSendsICM() public {
        // Bounty oluştur
        vm.prank(creator);
        bountyManager.createBounty{value: 5 ether}("cancel-test");
        uint256 bountyId = 100;

        uint256 balanceBefore = creator.balance;

        // İptal et
        vm.prank(creator);
        bountyManager.cancelBounty(bountyId);

        // AVAX iade edildi mi?
        assertEq(creator.balance, balanceBefore + 5 ether);

        // Bounty state
        (, , , , bool isActive, bool isCompleted) = bountyManager.bounties(
            bountyId
        );
        assertFalse(isActive);
        assertFalse(isCompleted);
    }

    function test_CancelBounty_OnlyEmployer() public {
        vm.prank(creator);
        bountyManager.createBounty{value: 1 ether}("test");

        vm.prank(freelancer); // Yanlış kişi
        vm.expectRevert(BountyManager.Unauthorized.selector);
        bountyManager.cancelBounty(100);
    }
}
