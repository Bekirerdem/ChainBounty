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
 * @title BountyManager
 * @dev C-Chain üzerinde çalışan Escrow kontratı.
 *
 * Güvenlik Modeli:
 * - createBounty() → AVAX kilitler + ICM ile App-Chain'e employer'ı bildirir
 * - receiveTeleporterMessage() → sadece BountyExecutor'dan gelen onay ile ödeme yapar
 * - cancelBounty() → sadece employer iptal edebilir, AVAX iade edilir
 */
contract BountyManager is ReentrancyGuard, ITeleporterReceiver {
    // ============================================================
    //                         TYPES
    // ============================================================

    struct Bounty {
        uint256 bountyId;
        address employer;
        uint256 budget;
        string ipfsDocHash;
        bool isActive;
        bool isCompleted;
    }

    // ============================================================
    //                      STATE VARIABLES
    // ============================================================

    address public owner;
    uint256 public nextBountyId;
    mapping(uint256 => Bounty) public bounties;

    address public teleporterMessenger;
    address public allowedAppChainExecutor;
    bytes32 public appChainId;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed employer,
        uint256 budget,
        string ipfsDocHash
    );
    event BountyCompleted(uint256 indexed bountyId, address indexed developer);
    event BountyCancelled(uint256 indexed bountyId, address indexed employer);
    event ExecutorSet(address indexed executor);

    // ============================================================
    //                         ERRORS
    // ============================================================

    error InvalidBudget();
    error BountyNotFound();
    error BountyNotActive();
    error Unauthorized();
    error PaymentFailed();
    error ExecutorNotSet();

    // ============================================================
    //                        MODIFIERS
    // ============================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // ============================================================
    //                       CONSTRUCTOR
    // ============================================================

    constructor(address _teleporterMessenger, bytes32 _appChainId) {
        owner = msg.sender;
        nextBountyId = 100;
        teleporterMessenger = _teleporterMessenger;
        appChainId = _appChainId;
    }

    // ============================================================
    //                      ADMIN FUNCTIONS
    // ============================================================

    /**
     * @dev Deploy sonrası App-Chain'deki BountyExecutor adresini kaydeder.
     * İki kontrat birbirini tanıması gerektiği için önce BountyManager deploy edilir,
     * ardından BountyExecutor deploy edilip bu fonksiyon çağrılır.
     */
    function setExecutor(address _executor) external onlyOwner {
        allowedAppChainExecutor = _executor;
        emit ExecutorSet(_executor);
    }

    // ============================================================
    //                     EXTERNAL FUNCTIONS
    // ============================================================

    /**
     * @dev İşveren yeni bir bounty açar, AVAX kilitler ve App-Chain'e employer bilgisini gönderir.
     *
     * Akış:
     * 1. AVAX kilitle (escrow)
     * 2. Bounty state'ini kaydet
     * 3. ICM ile App-Chain'e CREATE_BOUNTY mesajı gönder → employer artık App-Chain'de de biliniyor
     *
     * @param _ipfsDocHash Görev tanımının IPFS hash'i
     */
    function createBounty(
        string memory _ipfsDocHash
    ) external payable nonReentrant {
        if (msg.value == 0) revert InvalidBudget();
        if (allowedAppChainExecutor == address(0)) revert ExecutorNotSet();

        uint256 currentBountyId = nextBountyId;

        // CEI Pattern: State güncelle, sonra dışarıya mesaj gönder
        bounties[currentBountyId] = Bounty({
            bountyId: currentBountyId,
            employer: msg.sender,
            budget: msg.value,
            ipfsDocHash: _ipfsDocHash,
            isActive: true,
            isCompleted: false
        });

        nextBountyId++;

        emit BountyCreated(
            currentBountyId,
            msg.sender,
            msg.value,
            _ipfsDocHash
        );

        // ICM Payload: MessageType + bountyId + employer adresi
        // App-Chain bu veriyi decode edip bountyEmployers[bountyId] = employer yazacak
        bytes memory messageData = abi.encode(
            IBountyTypes.MessageType.CREATE_BOUNTY,
            currentBountyId,
            msg.sender // employer
        );

        TeleporterMessageInput memory messageInput = TeleporterMessageInput({
            destinationBlockchainID: appChainId,
            destinationAddress: allowedAppChainExecutor,
            feeInfo: TeleporterFeeInfo({
                feeTokenAddress: address(0),
                amount: 0
            }),
            requiredGasLimit: 100_000,
            allowedRelayerAddresses: new address[](0),
            message: messageData
        });

        ITeleporterMessenger(teleporterMessenger).sendCrossChainMessage(
            messageInput
        );
    }

    /**
     * @dev İşveren aktif bir bounty'yi iptal eder ve kilitli AVAX'ını geri alır.
     * Sadece henüz teklif kabul edilmemiş bounty'ler iptal edilebilir.
     * (App-Chain'de acceptedProposals[bountyId] != 0 ise bu çağrı yapılmamalı — UI sorumluluğu)
     *
     * @param _bountyId İptal edilecek bounty
     */
    function cancelBounty(uint256 _bountyId) external nonReentrant {
        Bounty storage b = bounties[_bountyId];
        if (b.employer == address(0)) revert BountyNotFound();
        if (b.employer != msg.sender) revert Unauthorized();
        if (!b.isActive || b.isCompleted) revert BountyNotActive();

        // CEI: State'i güncelle, sonra para gönder
        uint256 refundAmount = b.budget;
        b.isActive = false;
        b.budget = 0;

        emit BountyCancelled(_bountyId, msg.sender);

        // App-Chain'e iptal bildir (Fix 4: Stale data engelle)
        if (allowedAppChainExecutor != address(0)) {
            bytes memory cancelMessage = abi.encode(
                IBountyTypes.MessageType.CANCEL_BOUNTY,
                _bountyId,
                msg.sender
            );

            TeleporterMessageInput memory cancelInput = TeleporterMessageInput({
                destinationBlockchainID: appChainId,
                destinationAddress: allowedAppChainExecutor,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: 100_000,
                allowedRelayerAddresses: new address[](0),
                message: cancelMessage
            });

            ITeleporterMessenger(teleporterMessenger).sendCrossChainMessage(
                cancelInput
            );
        }

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert PaymentFailed();
    }

    // ============================================================
    //                    FORCE SETTLE (FALLBACK)
    // ============================================================

    /// @notice Employer'ın force settle talebini kaydettiği mapping
    /// bountyId => (developer, requestTimestamp)
    struct SettleIntent {
        address developer;
        uint256 requestedAt;
    }
    mapping(uint256 => SettleIntent) public settleIntents;

    /// @notice Timelock süresi — intent'ten execution'a kadar beklenecek süre
    uint256 public constant SETTLE_TIMELOCK = 24 hours;

    event ForceSettleRequested(
        uint256 indexed bountyId,
        address indexed employer,
        address indexed developer
    );
    event ForceSettleExecuted(
        uint256 indexed bountyId,
        address indexed developer
    );

    /// @dev Adım 1: Employer settle intent kaydeder. 24 saat sonra execute edebilir.
    function requestForceSettle(
        uint256 _bountyId,
        address _developer
    ) external nonReentrant {
        Bounty storage b = bounties[_bountyId];
        if (b.employer == address(0)) revert BountyNotFound();
        if (b.employer != msg.sender) revert Unauthorized();
        if (!b.isActive || b.isCompleted) revert BountyNotActive();
        if (_developer == address(0)) revert PaymentFailed();

        settleIntents[_bountyId] = SettleIntent({
            developer: _developer,
            requestedAt: block.timestamp
        });

        emit ForceSettleRequested(_bountyId, msg.sender, _developer);
    }

    /// @dev Adım 2: Timelock sonrası execute et.
    function executeForceSettle(uint256 _bountyId) external nonReentrant {
        Bounty storage b = bounties[_bountyId];
        if (b.employer == address(0)) revert BountyNotFound();
        if (b.employer != msg.sender) revert Unauthorized();
        if (!b.isActive || b.isCompleted) revert BountyNotActive();

        SettleIntent memory intent = settleIntents[_bountyId];
        if (intent.developer == address(0)) revert BountyNotFound();
        if (block.timestamp < intent.requestedAt + SETTLE_TIMELOCK)
            revert Unauthorized();

        // CEI
        b.isCompleted = true;
        b.isActive = false;
        uint256 payment = b.budget;
        b.budget = 0;

        delete settleIntents[_bountyId];

        emit ForceSettleExecuted(_bountyId, intent.developer);
        emit BountyCompleted(_bountyId, intent.developer);

        (bool success, ) = intent.developer.call{value: payment}("");
        if (!success) revert PaymentFailed();
    }

    /**
     * @dev App-Chain'den (BountyExecutor) gelen ICM mesajını işler.
     * Sadece APPROVE_PAYMENT mesajları ile ödeme tetiklenir.
     *
     * Güvenlik Katmanları:
     * 1. msg.sender mutlaka Teleporter kontratı olmalı
     * 2. sourceChainID mutlaka kayıtlı App-Chain olmalı
     * 3. sourceAddress mutlaka kayıtlı BountyExecutor olmalı
     *
     * @param sourceChainID Mesajın geldiği zincir
     * @param sourceAddress Mesajı gönderen kontrat
     * @param messageData Encoded payload
     */
    function receiveTeleporterMessage(
        bytes32 sourceChainID,
        address sourceAddress,
        bytes calldata messageData
    ) external override nonReentrant {
        // --- Güvenlik Kontrolleri ---
        if (msg.sender != teleporterMessenger) revert Unauthorized();
        if (sourceChainID != appChainId) revert Unauthorized();
        if (sourceAddress != allowedAppChainExecutor) revert Unauthorized();

        // --- Decode ---
        (
            IBountyTypes.MessageType msgType,
            uint256 bountyId,
            address developer
        ) = abi.decode(
                messageData,
                (IBountyTypes.MessageType, uint256, address)
            );

        // Sadece ödeme onayını işle
        if (msgType != IBountyTypes.MessageType.APPROVE_SOLUTION) return;

        Bounty storage b = bounties[bountyId];
        if (!b.isActive || b.isCompleted) revert BountyNotActive();

        // CEI: State güncelle, sonra para gönder
        b.isCompleted = true;
        b.isActive = false;
        uint256 payment = b.budget;
        b.budget = 0;

        emit BountyCompleted(bountyId, developer);

        (bool success, ) = developer.call{value: payment}("");
        if (!success) revert PaymentFailed();
    }
}
