// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@teleporter/ITeleporterMessenger.sol";
import "@teleporter/ITeleporterReceiver.sol";
import "../interfaces/IBountyTypes.sol";

/// @title BountyExecutor
/// @notice App-Chain kontratı — Submission yönetimi, doğrulama, onay
/// @dev Ucuz gas ortamında çalışır, sonuçları C-Chain'e Teleporter ile bildirir
contract BountyExecutor is ITeleporterReceiver, IBountyTypes {
    // ============================================================
    //                      STATE VARIABLES
    // ============================================================

    ITeleporterMessenger public immutable teleporterMessenger;

    /// @notice C-Chain blockchain ID'si
    bytes32 public immutable cChainBlockchainID;

    /// @notice C-Chain'deki BountyManager kontrat adresi
    address public immutable bountyManagerAddress;

    /// @notice Bounty ID -> BountyData (C-Chain'den mirror)
    mapping(uint256 => BountyData) public bounties;

    /// @notice Submission counter
    uint256 public nextSubmissionId;

    /// @notice Submission ID -> Submission data
    mapping(uint256 => Submission) public submissions;

    /// @notice Bounty ID -> submission ID'leri
    mapping(uint256 => uint256[]) public bountySubmissions;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event BountyReceived(
        uint256 indexed bountyId,
        string title,
        uint256 reward,
        uint256 deadline
    );

    event SolutionSubmitted(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address indexed submitter,
        string solutionURI
    );

    event SolutionApproved(
        uint256 indexed submissionId,
        uint256 indexed bountyId,
        address submitter
    );

    event DisputeOpened(
        uint256 indexed bountyId,
        address indexed opener
    );

    event BountyCancelledOnAppChain(uint256 indexed bountyId);

    // ============================================================
    //                         ERRORS
    // ============================================================

    error InvalidCaller();
    error InvalidSourceChain();
    error InvalidSender();
    error BountyNotFound();
    error BountyNotOpen();
    error SubmissionNotFound();
    error NotBountyCreator();
    error DeadlinePassed();
    error AlreadyApproved();

    // ============================================================
    //                       CONSTRUCTOR
    // ============================================================

    constructor(
        address _teleporterMessenger,
        bytes32 _cChainBlockchainID,
        address _bountyManagerAddress
    ) {
        teleporterMessenger = ITeleporterMessenger(_teleporterMessenger);
        cChainBlockchainID = _cChainBlockchainID;
        bountyManagerAddress = _bountyManagerAddress;
    }

    // ============================================================
    //                    EXTERNAL FUNCTIONS
    // ============================================================

    /// @notice Freelancer çözüm gönderir (ucuz gas!)
    /// @param _bountyId Hedef bounty ID
    /// @param _solutionURI Çözümün IPFS/URL adresi
    function submitSolution(
        uint256 _bountyId,
        string calldata _solutionURI
    ) external {
        BountyData storage bounty = bounties[_bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();
        if (bounty.status != BountyStatus.Open) revert BountyNotOpen();
        if (block.timestamp > bounty.deadline) revert DeadlinePassed();

        uint256 submissionId = nextSubmissionId++;

        Submission memory sub = Submission({
            submissionId: submissionId,
            bountyId: _bountyId,
            submitter: msg.sender,
            solutionURI: _solutionURI,
            submittedAt: block.timestamp,
            approved: false
        });

        submissions[submissionId] = sub;
        bountySubmissions[_bountyId].push(submissionId);

        emit SolutionSubmitted(submissionId, _bountyId, msg.sender, _solutionURI);
    }

    /// @notice İş veren submission'ı onaylar → C-Chain'e ödeme talimatı gönderilir
    /// @param _submissionId Onaylanacak submission ID
    function approveSolution(uint256 _submissionId) external {
        Submission storage sub = submissions[_submissionId];
        if (sub.submitter == address(0)) revert SubmissionNotFound();
        if (sub.approved) revert AlreadyApproved();

        BountyData storage bounty = bounties[sub.bountyId];
        if (bounty.creator != msg.sender) revert NotBountyCreator();

        sub.approved = true;
        bounty.status = BountyStatus.Completed;

        emit SolutionApproved(_submissionId, sub.bountyId, sub.submitter);

        // C-Chain'e ödeme talimatı gönder
        CrossChainMessage memory ccMsg = CrossChainMessage({
            msgType: MessageType.APPROVE_SOLUTION,
            bountyId: sub.bountyId,
            data: abi.encode(sub.submitter) // Ödeme alacak adres
        });

        teleporterMessenger.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: cChainBlockchainID,
                destinationAddress: bountyManagerAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: 400_000,
                allowedRelayerAddresses: new address[](0),
                message: abi.encode(ccMsg)
            })
        );
    }

    /// @notice Dispute aç (hem creator hem submitter açabilir)
    /// @param _bountyId Dispute açılacak bounty
    function openDispute(uint256 _bountyId) external {
        BountyData storage bounty = bounties[_bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();

        bounty.status = BountyStatus.Disputed;
        emit DisputeOpened(_bountyId, msg.sender);

        // C-Chain'e dispute bildir
        CrossChainMessage memory ccMsg = CrossChainMessage({
            msgType: MessageType.DISPUTE_OPENED,
            bountyId: _bountyId,
            data: abi.encode(msg.sender)
        });

        teleporterMessenger.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: cChainBlockchainID,
                destinationAddress: bountyManagerAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: 300_000,
                allowedRelayerAddresses: new address[](0),
                message: abi.encode(ccMsg)
            })
        );
    }

    // ============================================================
    //                   TELEPORTER RECEIVER
    // ============================================================

    /// @notice C-Chain'den gelen mesajları işle (yeni bounty, iptal vs.)
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external override {
        if (msg.sender != address(teleporterMessenger)) revert InvalidCaller();
        if (sourceBlockchainID != cChainBlockchainID) revert InvalidSourceChain();
        if (originSenderAddress != bountyManagerAddress) revert InvalidSender();

        CrossChainMessage memory ccMsg = abi.decode(message, (CrossChainMessage));

        if (ccMsg.msgType == MessageType.CREATE_BOUNTY) {
            _handleNewBounty(ccMsg.data);
        } else if (ccMsg.msgType == MessageType.CANCEL_BOUNTY) {
            _handleCancellation(ccMsg.bountyId);
        }
    }

    // ============================================================
    //                   INTERNAL FUNCTIONS
    // ============================================================

    /// @dev C-Chain'den gelen yeni bounty'yi kaydet
    function _handleNewBounty(bytes memory _data) internal {
        BountyData memory bounty = abi.decode(_data, (BountyData));
        bounties[bounty.bountyId] = bounty;

        emit BountyReceived(
            bounty.bountyId,
            bounty.title,
            bounty.reward,
            bounty.deadline
        );
    }

    /// @dev Bounty iptalini işle
    function _handleCancellation(uint256 _bountyId) internal {
        BountyData storage bounty = bounties[_bountyId];
        bounty.status = BountyStatus.Cancelled;
        emit BountyCancelledOnAppChain(_bountyId);
    }

    // ============================================================
    //                     VIEW FUNCTIONS
    // ============================================================

    /// @notice Bounty bilgilerini getir
    function getBounty(uint256 _bountyId) external view returns (BountyData memory) {
        return bounties[_bountyId];
    }

    /// @notice Bounty'ye ait submission'ları getir
    function getSubmissionIds(uint256 _bountyId) external view returns (uint256[] memory) {
        return bountySubmissions[_bountyId];
    }

    /// @notice Submission bilgilerini getir
    function getSubmission(uint256 _submissionId) external view returns (Submission memory) {
        return submissions[_submissionId];
    }

    /// @notice Bir bounty'nin toplam submission sayısı
    function getSubmissionCount(uint256 _bountyId) external view returns (uint256) {
        return bountySubmissions[_bountyId].length;
    }
}
