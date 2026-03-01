// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/app-chain/BountyExecutor.sol";
import "../src/interfaces/IBountyTypes.sol";
import "./mocks/MockTeleporter.sol";

/// @title BountyExecutor Unit Tests
/// @notice App-Chain BountyExecutor kontratı için güvenlik testleri
contract BountyExecutorTest is Test {
    BountyExecutor public bountyExecutor;
    MockTeleporter public teleporter;

    // Test adresleri
    address public creator = makeAddr("creator");
    address public freelancer = makeAddr("freelancer");

    // Mock değerler
    bytes32 public cChainID = keccak256("c-chain");
    address public mockManager = makeAddr("manager");

    function setUp() public {
        teleporter = new MockTeleporter();
        bountyExecutor = new BountyExecutor(
            address(teleporter),
            cChainID,
            mockManager
        );
    }

    function test_InitialState() public view {
        assertEq(bountyExecutor.nextProposalId(), 1);
    }

    // ============================================================
    //                  FIX 1: Teleporter Overwrite Tests
    // ============================================================

    function test_TeleporterOverwritesFraudulentClaim() public {
        uint256 bountyId = 100;
        address realEmployer = makeAddr("realEmployer");

        // Teleporter olarak mesaj gönder
        vm.prank(address(teleporter));
        bytes memory messageData = abi.encode(
            IBountyTypes.MessageType.CREATE_BOUNTY,
            bountyId,
            realEmployer
        );
        bountyExecutor.receiveTeleporterMessage(
            cChainID,
            mockManager,
            messageData
        );

        assertEq(bountyExecutor.bountyEmployers(bountyId), realEmployer);
    }

    function test_RejectMessageFromWrongSource() public {
        uint256 bountyId = 100;
        address fakeEmployer = makeAddr("fake");

        bytes memory messageData = abi.encode(
            IBountyTypes.MessageType.CREATE_BOUNTY,
            bountyId,
            fakeEmployer
        );

        // Yanlış Teleporter adresi
        vm.prank(makeAddr("fakeTeleporter"));
        vm.expectRevert(BountyExecutor.Unauthorized.selector);
        bountyExecutor.receiveTeleporterMessage(
            cChainID,
            mockManager,
            messageData
        );

        // Yanlış source chain
        vm.prank(address(teleporter));
        vm.expectRevert(BountyExecutor.Unauthorized.selector);
        bountyExecutor.receiveTeleporterMessage(
            keccak256("wrong-chain"),
            mockManager,
            messageData
        );

        // Yanlış source address
        vm.prank(address(teleporter));
        vm.expectRevert(BountyExecutor.Unauthorized.selector);
        bountyExecutor.receiveTeleporterMessage(
            cChainID,
            makeAddr("wrongManager"),
            messageData
        );
    }

    // ============================================================
    //                  FIX 3: Auto-Release Tests
    // ============================================================

    /// @dev Helper: Bounty kaydet + teklif + kabul et
    function _setupAcceptedBounty(
        uint256 bountyId,
        address employer,
        address developer
    ) internal {
        // Teleporter ile employer kaydet
        vm.prank(address(teleporter));
        bountyExecutor.receiveTeleporterMessage(
            cChainID,
            mockManager,
            abi.encode(
                IBountyTypes.MessageType.CREATE_BOUNTY,
                bountyId,
                employer
            )
        );

        // Developer teklif verir
        vm.prank(developer);
        bountyExecutor.submitProposal(
            bountyId,
            1 ether,
            block.timestamp + 7 days,
            "contact"
        );

        // Employer kabul eder
        vm.prank(employer);
        bountyExecutor.acceptProposal(1);
    }

    function test_AutoRelease_TimeoutEnforced() public {
        uint256 bountyId = 100;
        address employer = makeAddr("employer");
        address developer = makeAddr("developer");

        _setupAcceptedBounty(bountyId, employer, developer);

        // Developer iş teslim eder
        vm.prank(developer);
        bountyExecutor.deliverWork(bountyId);

        // Hemen auto-release dene — revert etmeli
        vm.expectRevert(BountyExecutor.Unauthorized.selector);
        bountyExecutor.autoReleasePayment(bountyId);

        // 72 saat ilerle
        vm.warp(block.timestamp + 72 hours + 1);

        // Şimdi tetikle — başarılı olmalı (MockTeleporter sendCrossChainMessage'ı handle eder)
        bountyExecutor.autoReleasePayment(bountyId);
    }

    function test_DeliverWork_OnlyAcceptedDeveloper() public {
        uint256 bountyId = 100;
        address employer = makeAddr("employer");
        address developer = makeAddr("developer");
        address attacker = makeAddr("attacker");

        _setupAcceptedBounty(bountyId, employer, developer);

        // Saldırgan deliverWork çağrılamaz
        vm.prank(attacker);
        vm.expectRevert(BountyExecutor.Unauthorized.selector);
        bountyExecutor.deliverWork(bountyId);

        // Gerçek developer çağırabilir
        vm.prank(developer);
        bountyExecutor.deliverWork(bountyId);
        assertEq(bountyExecutor.workDeliveredAt(bountyId), block.timestamp);
    }

    // ============================================================
    //                  FIX 4: CANCEL_BOUNTY Handler Tests
    // ============================================================

    function test_CancelBounty_ClearsEmployer() public {
        uint256 bountyId = 100;
        address employer = makeAddr("employer");

        // Önce bounty kaydet
        vm.prank(address(teleporter));
        bountyExecutor.receiveTeleporterMessage(
            cChainID,
            mockManager,
            abi.encode(
                IBountyTypes.MessageType.CREATE_BOUNTY,
                bountyId,
                employer
            )
        );
        assertEq(bountyExecutor.bountyEmployers(bountyId), employer);

        // Cancel mesajı gönder
        vm.prank(address(teleporter));
        bountyExecutor.receiveTeleporterMessage(
            cChainID,
            mockManager,
            abi.encode(
                IBountyTypes.MessageType.CANCEL_BOUNTY,
                bountyId,
                employer
            )
        );

        // Employer silinmiş olmalı
        assertEq(bountyExecutor.bountyEmployers(bountyId), address(0));

        // Yeni teklif verilemez
        vm.prank(makeAddr("developer"));
        vm.expectRevert(BountyExecutor.BountyNotRegistered.selector);
        bountyExecutor.submitProposal(
            bountyId,
            1 ether,
            block.timestamp + 7 days,
            "contact"
        );
    }
}
