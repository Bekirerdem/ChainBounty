// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {
    ITeleporterReceiver,
    ITeleporterMessenger,
    TeleporterMessageInput,
    TeleporterFeeInfo
} from "../interfaces/ITeleporter.sol";
import {IBountyTypes} from "../interfaces/IBountyTypes.sol";

/**
 * @title BountyExecutor
 * @dev App-Chain üzerinde çalışan operasyon kontratı.
 *
 * Güvenlik Modeli:
 * - receiveTeleporterMessage() → C-Chain'den gelen CREATE_BOUNTY ile employer'ı kaydeder
 * - acceptProposal() → sadece o bounty'nin gerçek employer'ı çağırabilir (artık mock yok)
 * - approveWorkAndTriggerPayment() → sadece employer çağırır, ICM ile C-Chain'e ödeme tetikler
 */
contract BountyExecutor is ReentrancyGuard, ITeleporterReceiver {
    // ============================================================
    //                         TYPES
    // ============================================================

    struct Proposal {
        uint256 proposalId;
        uint256 bountyId;
        address developer;
        uint256 requestedAmount;
        uint256 deliveryTime;
        string contactInfo;
        bool isAccepted;
    }

    // ============================================================
    //                      STATE VARIABLES
    // ============================================================

    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => uint256[]) public bountyProposals;
    mapping(uint256 => uint256) public acceptedProposals;

    /**
     * @notice C-Chain'den ICM ile öğrenilen employer adresleri.
     * Web2 analoji: Redis cache — C-Chain DB'den gelen veriyi burada tutuyoruz.
     * Artık _mockEmployer parametresine gerek yok.
     */
    mapping(uint256 => address) public bountyEmployers;

    // --- Teleporter Config ---
    address public teleporterMessenger;
    bytes32 public cChainId;
    address public bountyManagerAddress;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event BountyRegistered(uint256 indexed bountyId, address indexed employer);
    event ProposalSubmitted(
        uint256 indexed proposalId,
        uint256 indexed bountyId,
        address indexed developer,
        uint256 requestedAmount
    );
    event ProposalAccepted(
        uint256 indexed proposalId,
        uint256 indexed bountyId,
        address indexed employer
    );
    event PaymentTriggered(uint256 indexed bountyId, address indexed developer);
    event FraudulentClaimOverridden(
        uint256 indexed bountyId,
        address indexed fraudster,
        address indexed realEmployer
    );
    event BountyCancelled(uint256 indexed bountyId);

    // ============================================================
    //                         ERRORS
    // ============================================================

    error InvalidAmount();
    error InvalidDeliveryTime();
    error ProposalNotFound();
    error BountyNotRegistered();
    error BountyAlreadyHasAcceptedProposal();
    error Unauthorized();
    error AlreadySubmitted();

    // ============================================================
    //                       CONSTRUCTOR
    // ============================================================

    constructor(
        address _teleporterMessenger,
        bytes32 _cChainId,
        address _bountyManagerAddress
    ) {
        nextProposalId = 1;
        teleporterMessenger = _teleporterMessenger;
        cChainId = _cChainId;
        bountyManagerAddress = _bountyManagerAddress;
    }

    // ============================================================
    //                     TELEPORTER RECEIVER
    // ============================================================

    /**
     * @dev C-Chain'den (BountyManager) gelen ICM mesajlarını işler.
     *
     * CREATE_BOUNTY geldiğinde: bountyEmployers mapping'ini günceller.
     * Bu, acceptProposal() fonksiyonunun gerçek yetki kontrolü yapmasını sağlar.
     *
     * Güvenlik Katmanları:
     * 1. msg.sender mutlaka Teleporter kontratı olmalı
     * 2. sourceChainID mutlaka kayıtlı C-Chain olmalı
     * 3. sourceAddress mutlaka kayıtlı BountyManager olmalı
     */
    function receiveTeleporterMessage(
        bytes32 sourceChainID,
        address sourceAddress,
        bytes calldata messageData
    ) external override nonReentrant {
        // --- Güvenlik Kontrolleri ---
        if (msg.sender != teleporterMessenger) revert Unauthorized();
        if (sourceChainID != cChainId) revert Unauthorized();
        if (sourceAddress != bountyManagerAddress) revert Unauthorized();

        // --- Decode ---
        (
            IBountyTypes.MessageType msgType,
            uint256 bountyId,
            address employer
        ) = abi.decode(
                messageData,
                (IBountyTypes.MessageType, uint256, address)
            );

        if (msgType == IBountyTypes.MessageType.CREATE_BOUNTY) {
            // GÜVENLIK FIX: Teleporter mesajı HER ZAMAN kazanır.
            // claimEmployer() ile sahte kayıt yapılmışsa bile overwrite eder.
            address previousClaim = bountyEmployers[bountyId];
            bountyEmployers[bountyId] = employer;
            emit BountyRegistered(bountyId, employer);

            // Sahte claim tespit edildiyse log at
            if (previousClaim != address(0) && previousClaim != employer) {
                emit FraudulentClaimOverridden(
                    bountyId,
                    previousClaim,
                    employer
                );
            }
        }
        // Fix 4: CANCEL_BOUNTY handler — stale data engellenir
        else if (msgType == IBountyTypes.MessageType.CANCEL_BOUNTY) {
            // Bounty iptal edildi — employer kaydını sil
            // Bu, yeni teklif verilmesini engeller (submitProposal BountyNotRegistered revert eder)
            delete bountyEmployers[bountyId];
            emit BountyCancelled(bountyId);
        }
    }

    // ============================================================
    //                     EXTERNAL FUNCTIONS
    // ============================================================

    // claimEmployer() KALDIRILDI — Güvenlik Fix #1
    // Race condition: Saldırgan ICM mesajından önce kendini employer olarak kaydedebiliyordu.
    // Artık employer kaydı SADECE Teleporter üzerinden yapılır.

    /**
     * @dev Geliştirici, C-Chain'de açılmış bir ilana başvurur.
     * Bounty'nin bu zincirde kayıtlı olması (CREATE_BOUNTY ICM mesajı gelmiş) şart.
     *
     * @param _bountyId C-Chain'deki bounty ID
     * @param _requestedAmount Talep edilen ücret (wei)
     * @param _deliveryTime Teslimat bitiş tarihi (unix timestamp)
     * @param _contactInfo İletişim bilgisi (şifrelenmiş önerilir)
     */
    function submitProposal(
        uint256 _bountyId,
        uint256 _requestedAmount,
        uint256 _deliveryTime,
        string memory _contactInfo
    ) external nonReentrant {
        // Bounty bu zincirde kayıtlı mı? (CREATE_BOUNTY ICM mesajı geldi mi?)
        if (bountyEmployers[_bountyId] == address(0))
            revert BountyNotRegistered();
        if (_requestedAmount == 0) revert InvalidAmount();
        if (_deliveryTime <= block.timestamp) revert InvalidDeliveryTime();

        // Aynı geliştirici aynı bounty'ye iki kez teklif veremesin
        uint256[] storage existingProposals = bountyProposals[_bountyId];
        for (uint256 i = 0; i < existingProposals.length; i++) {
            if (proposals[existingProposals[i]].developer == msg.sender) {
                revert AlreadySubmitted();
            }
        }

        uint256 currentProposalId = nextProposalId;

        proposals[currentProposalId] = Proposal({
            proposalId: currentProposalId,
            bountyId: _bountyId,
            developer: msg.sender,
            requestedAmount: _requestedAmount,
            deliveryTime: _deliveryTime,
            contactInfo: _contactInfo,
            isAccepted: false
        });

        bountyProposals[_bountyId].push(currentProposalId);
        nextProposalId++;

        emit ProposalSubmitted(
            currentProposalId,
            _bountyId,
            msg.sender,
            _requestedAmount
        );
    }

    /**
     * @dev İşveren, gelen tekliflerden birini kabul eder.
     *
     * Güvenlik: msg.sender, C-Chain'den ICM ile öğrenilen gerçek employer olmalı.
     * _mockEmployer parametresi tamamen kaldırıldı.
     *
     * @param _proposalId Kabul edilecek teklif ID'si
     */
    function acceptProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage prop = proposals[_proposalId];
        if (prop.developer == address(0)) revert ProposalNotFound();

        uint256 bountyId = prop.bountyId;

        // Gerçek yetki kontrolü: ICM ile öğrenilen employer mı çağırıyor?
        if (msg.sender != bountyEmployers[bountyId]) revert Unauthorized();

        if (acceptedProposals[bountyId] != 0)
            revert BountyAlreadyHasAcceptedProposal();

        prop.isAccepted = true;
        acceptedProposals[bountyId] = _proposalId;

        emit ProposalAccepted(_proposalId, bountyId, msg.sender);
    }

    /**
     * @dev İşveren teslim edilen işi onaylar, ICM ile C-Chain'e ödeme tetikler.
     *
     * Güvenlik: Sadece o bounty'nin employer'ı çağırabilir.
     *
     * @param _bountyId Ödemesi yapılacak bounty ID'si
     */
    function approveWorkAndTriggerPayment(
        uint256 _bountyId
    ) external nonReentrant {
        // Yetki kontrolü
        if (msg.sender != bountyEmployers[_bountyId]) revert Unauthorized();

        uint256 acceptedProposalId = acceptedProposals[_bountyId];
        if (acceptedProposalId == 0) revert ProposalNotFound();

        Proposal storage prop = proposals[acceptedProposalId];

        // ICM Payload: MessageType + bountyId + developer adresi
        bytes memory messageData = abi.encode(
            IBountyTypes.MessageType.APPROVE_SOLUTION,
            _bountyId,
            prop.developer
        );

        TeleporterMessageInput memory messageInput = TeleporterMessageInput({
            destinationBlockchainID: cChainId,
            destinationAddress: bountyManagerAddress,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: address(0),
                amount: 0
            }),
            requiredGasLimit: 300_000,
            allowedRelayerAddresses: new address[](0),
            message: messageData
        });

        emit PaymentTriggered(_bountyId, prop.developer);

        ITeleporterMessenger(teleporterMessenger).sendCrossChainMessage(
            messageInput
        );
    }

    // ============================================================
    //                    AUTO-RELEASE (ANTI-GHOSTING)
    // ============================================================

    /// @notice Developer'ın iş teslim zamanı
    mapping(uint256 => uint256) public workDeliveredAt;

    /// @notice Auto-release süresi
    uint256 public constant AUTO_RELEASE_TIMEOUT = 72 hours;

    event WorkDelivered(uint256 indexed bountyId, address indexed developer);
    event AutoReleaseTriggered(
        uint256 indexed bountyId,
        address indexed developer
    );

    /// @dev Developer, kabul edilmiş teklifi olan bir bounty için işi teslim eder.
    function deliverWork(uint256 _bountyId) external nonReentrant {
        uint256 acceptedProposalId = acceptedProposals[_bountyId];
        if (acceptedProposalId == 0) revert ProposalNotFound();

        Proposal storage prop = proposals[acceptedProposalId];
        if (prop.developer != msg.sender) revert Unauthorized();
        if (workDeliveredAt[_bountyId] != 0) revert AlreadySubmitted(); // Zaten teslim edilmiş

        workDeliveredAt[_bountyId] = block.timestamp;
        emit WorkDelivered(_bountyId, msg.sender);
    }

    /// @dev 72 saat sonra developer veya herhangi biri ödemeyi tetikleyebilir.
    function autoReleasePayment(uint256 _bountyId) external nonReentrant {
        if (workDeliveredAt[_bountyId] == 0) revert ProposalNotFound();
        if (
            block.timestamp < workDeliveredAt[_bountyId] + AUTO_RELEASE_TIMEOUT
        ) {
            revert Unauthorized(); // Henüz timeout olmadı
        }

        uint256 acceptedProposalId = acceptedProposals[_bountyId];
        Proposal storage prop = proposals[acceptedProposalId];

        emit AutoReleaseTriggered(_bountyId, prop.developer);

        // ICM ile C-Chain'e ödeme tetikle (approveWorkAndTriggerPayment ile aynı mantık)
        bytes memory messageData = abi.encode(
            IBountyTypes.MessageType.APPROVE_SOLUTION,
            _bountyId,
            prop.developer
        );

        TeleporterMessageInput memory messageInput = TeleporterMessageInput({
            destinationBlockchainID: cChainId,
            destinationAddress: bountyManagerAddress,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: address(0),
                amount: 0
            }),
            requiredGasLimit: 300_000,
            allowedRelayerAddresses: new address[](0),
            message: messageData
        });

        ITeleporterMessenger(teleporterMessenger).sendCrossChainMessage(
            messageInput
        );
    }
}
