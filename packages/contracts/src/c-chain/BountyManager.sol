// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@teleporter/ITeleporterMessenger.sol";
import "@teleporter/ITeleporterReceiver.sol";
import "../interfaces/IBountyTypes.sol";

/// @title BountyManager
/// @notice C-Chain kontratı — Bounty oluşturma, AVAX escrow, ödeme yönetimi
/// @dev ICM/Teleporter ile App-Chain'deki BountyExecutor'a mesaj gönderir/alır
contract BountyManager is ITeleporterReceiver, IBountyTypes {
    // ============================================================
    //                      STATE VARIABLES
    // ============================================================

    /// @notice TeleporterMessenger kontratı (tüm chain'lerde aynı adres)
    ITeleporterMessenger public immutable teleporterMessenger;

    /// @notice Hedef App-Chain'in blockchain ID'si (bytes32)
    bytes32 public immutable appChainBlockchainID;

    /// @notice App-Chain'deki BountyExecutor kontrat adresi
    address public immutable bountyExecutorAddress;

    /// @notice Bounty counter
    uint256 public nextBountyId;

    /// @notice Bounty ID -> BountyData mapping
    mapping(uint256 => BountyData) public bounties;

    /// @notice Bounty ID -> escrowed amount
    mapping(uint256 => uint256) public escrowedAmounts;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        string title,
        uint256 reward,
        uint256 deadline
    );

    event BountySentCrossChain(
        uint256 indexed bountyId,
        bytes32 indexed messageId
    );

    event PaymentReleased(
        uint256 indexed bountyId,
        address indexed recipient,
        uint256 amount
    );

    event BountyCancelled(uint256 indexed bountyId);

    event DisputeReceived(uint256 indexed bountyId);

    // ============================================================
    //                         ERRORS
    // ============================================================

    error InvalidCaller();
    error InvalidSourceChain();
    error InvalidSender();
    error BountyNotFound();
    error BountyNotOpen();
    error InsufficientReward();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error NotBountyCreator();

    // ============================================================
    //                       CONSTRUCTOR
    // ============================================================

    constructor(
        address _teleporterMessenger,
        bytes32 _appChainBlockchainID,
        address _bountyExecutorAddress
    ) {
        teleporterMessenger = ITeleporterMessenger(_teleporterMessenger);
        appChainBlockchainID = _appChainBlockchainID;
        bountyExecutorAddress = _bountyExecutorAddress;
    }

    // ============================================================
    //                    EXTERNAL FUNCTIONS
    // ============================================================

    /// @notice Yeni bounty oluştur ve App-Chain'e gönder
    /// @param _title Bounty başlığı
    /// @param _description Bounty açıklaması
    /// @param _deadline Son teslim tarihi (unix timestamp)
    function createBounty(
        string calldata _title,
        string calldata _description,
        uint256 _deadline
    ) external payable {
        if (msg.value == 0) revert InsufficientReward();
        if (_deadline <= block.timestamp) revert DeadlinePassed();

        uint256 bountyId = nextBountyId++;

        // Bounty verisini oluştur
        BountyData memory bounty = BountyData({
            bountyId: bountyId,
            creator: msg.sender,
            title: _title,
            description: _description,
            reward: msg.value,
            deadline: _deadline,
            status: BountyStatus.Open
        });

        bounties[bountyId] = bounty;
        escrowedAmounts[bountyId] = msg.value;

        emit BountyCreated(bountyId, msg.sender, _title, msg.value, _deadline);

        // Cross-chain mesaj hazırla
        CrossChainMessage memory ccMsg = CrossChainMessage({
            msgType: MessageType.CREATE_BOUNTY,
            bountyId: bountyId,
            data: abi.encode(bounty)
        });

        // Teleporter ile App-Chain'e gönder
        bytes32 messageId = teleporterMessenger.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: appChainBlockchainID,
                destinationAddress: bountyExecutorAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: 600_000,
                allowedRelayerAddresses: new address[](0),
                message: abi.encode(ccMsg)
            })
        );

        emit BountySentCrossChain(bountyId, messageId);
    }

    /// @notice Bounty'yi iptal et (sadece Open durumunda, creator tarafından)
    /// @param _bountyId İptal edilecek bounty ID
    function cancelBounty(uint256 _bountyId) external {
        BountyData storage bounty = bounties[_bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();
        if (bounty.creator != msg.sender) revert NotBountyCreator();
        if (bounty.status != BountyStatus.Open) revert BountyNotOpen();

        bounty.status = BountyStatus.Cancelled;

        // Escrowed AVAX'i geri ver
        uint256 amount = escrowedAmounts[_bountyId];
        escrowedAmounts[_bountyId] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit BountyCancelled(_bountyId);

        // App-Chain'e iptal bildir
        CrossChainMessage memory ccMsg = CrossChainMessage({
            msgType: MessageType.CANCEL_BOUNTY,
            bountyId: _bountyId,
            data: ""
        });

        teleporterMessenger.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: appChainBlockchainID,
                destinationAddress: bountyExecutorAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: 200_000,
                allowedRelayerAddresses: new address[](0),
                message: abi.encode(ccMsg)
            })
        );
    }

    // ============================================================
    //                   TELEPORTER RECEIVER
    // ============================================================

    /// @notice App-Chain'den gelen mesajları işle
    /// @dev Sadece TeleporterMessenger tarafından çağrılabilir
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external override {
        if (msg.sender != address(teleporterMessenger)) revert InvalidCaller();
        if (sourceBlockchainID != appChainBlockchainID) revert InvalidSourceChain();
        if (originSenderAddress != bountyExecutorAddress) revert InvalidSender();

        CrossChainMessage memory ccMsg = abi.decode(message, (CrossChainMessage));

        if (ccMsg.msgType == MessageType.APPROVE_SOLUTION) {
            _handleApproval(ccMsg.bountyId, ccMsg.data);
        } else if (ccMsg.msgType == MessageType.DISPUTE_OPENED) {
            _handleDispute(ccMsg.bountyId);
        }
    }

    // ============================================================
    //                   INTERNAL FUNCTIONS
    // ============================================================

    /// @dev Onaylanan submission için ödemeyi serbest bırak
    function _handleApproval(uint256 _bountyId, bytes memory _data) internal {
        BountyData storage bounty = bounties[_bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();

        address recipient = abi.decode(_data, (address));

        bounty.status = BountyStatus.Completed;

        uint256 amount = escrowedAmounts[_bountyId];
        escrowedAmounts[_bountyId] = 0;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(_bountyId, recipient, amount);
    }

    /// @dev Dispute bildirimini işle
    function _handleDispute(uint256 _bountyId) internal {
        BountyData storage bounty = bounties[_bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();

        bounty.status = BountyStatus.Disputed;
        emit DisputeReceived(_bountyId);
    }

    // ============================================================
    //                     VIEW FUNCTIONS
    // ============================================================

    /// @notice Bounty bilgilerini getir
    function getBounty(uint256 _bountyId) external view returns (BountyData memory) {
        return bounties[_bountyId];
    }

    /// @notice Escrow'daki miktarı getir
    function getEscrowedAmount(uint256 _bountyId) external view returns (uint256) {
        return escrowedAmounts[_bountyId];
    }

    /// @notice receive() — kontrat AVAX alabilmesi için
    receive() external payable {}
}
