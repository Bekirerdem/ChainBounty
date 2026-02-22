// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITeleporterReceiver} from "../interfaces/ITeleporter.sol";

/**
 * @title BountyManager
 * @dev C-Chain üzerinde çalışan, işverenlerin ilan açıp AVAX kilitlediği ana kontrat (Escrow).
 */
contract BountyManager is ReentrancyGuard, ITeleporterReceiver {
    // --- Structs ---
    struct Bounty {
        uint256 bountyId;
        address employer;
        uint256 budget;
        string ipfsDocHash; // Görev detaylarını içeren dosyanın hash'i
        bool isActive;
        bool isCompleted;
    }

    // --- State Variables ---
    address public owner;
    uint256 public nextBountyId;
    mapping(uint256 => Bounty) public bounties;

    // Teleporter Config
    address public teleporterMessenger;
    address public allowedAppChainExecutor;
    bytes32 public appChainId;

    // --- Events ---
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed employer,
        uint256 budget,
        string ipfsDocHash
    );
    event BountyCompleted(uint256 indexed bountyId, address indexed developer);
    event BountyCancelled(uint256 indexed bountyId);
    event ExecutorSet(address indexed executor);

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // --- Errors ---
    error InvalidBudget();
    error BountyNotFound();
    error BountyNotActive();
    error Unauthorized();

    // --- Constructor ---
    constructor(address _teleporterMessenger, bytes32 _appChainId) {
        owner = msg.sender;
        nextBountyId = 1;
        teleporterMessenger = _teleporterMessenger;
        appChainId = _appChainId;
    }

    // --- Admin Functions ---

    /**
     * @dev Deploy sonrası BountyExecutor adresini set eder. Sadece owner çağırabilir.
     * @param _executor App-Chain'deki BountyExecutor kontrat adresi.
     */
    function setExecutor(address _executor) external onlyOwner {
        allowedAppChainExecutor = _executor;
        emit ExecutorSet(_executor);
    }

    // --- External Functions ---

    /**
     * @dev İşveren tarafından yeni bir iş ilanı (Bounty) oluşturur ve gönderilen AVAX'ı kilitler.
     * @param _ipfsDocHash Görev tanımının bulunduğu IPFS hash'i.
     */
    function createBounty(
        string memory _ipfsDocHash
    ) external payable nonReentrant {
        if (msg.value == 0) revert InvalidBudget();

        uint256 currentBountyId = nextBountyId;

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
    }

    /**
     * @dev Teleporter mesajını alır ve doğrular (receiver).
     * @param sourceChainID Mesajın geldiği zincir (App-Chain).
     * @param sourceAddress Mesajı gönderen kontrat adresi (BountyExecutor).
     * @param messageData Encoded payload (bountyId, developer address).
     */
    function receiveTeleporterMessage(
        bytes32 sourceChainID,
        address sourceAddress,
        bytes calldata messageData
    ) external override nonReentrant {
        // Mock Güvenlik Kontrolleri
        if (msg.sender != teleporterMessenger) revert Unauthorized();
        if (sourceChainID != appChainId) revert Unauthorized();
        if (sourceAddress != allowedAppChainExecutor) revert Unauthorized();

        // Veriyi decode et
        (uint256 bountyId, address developer) = abi.decode(
            messageData,
            (uint256, address)
        );

        Bounty storage b = bounties[bountyId];
        if (!b.isActive || b.isCompleted) revert BountyNotActive();

        b.isCompleted = true;
        b.isActive = false;

        uint256 payment = b.budget;
        b.budget = 0;

        // ETH (AVAX) Transferi
        (bool success, ) = developer.call{value: payment}("");
        require(success, "Payment failed");

        emit BountyCompleted(bountyId, developer);
    }
}
