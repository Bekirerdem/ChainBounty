// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BountyExecutor
 * @dev App-Chain (veya L1) üzerinde çalışan, geliştiricilerin teklif (Proposal) verip, işverenlerin onayladığı operasyon kontratı.
 */
contract BountyExecutor is ReentrancyGuard {
    // --- Structs ---
    struct Proposal {
        uint256 proposalId;
        uint256 bountyId; // C-Chain'deki Bounty kimliği
        address developer;
        uint256 requestedAmount; // Geliştiricinin talep ettiği ücret
        uint256 deliveryTime; // Unix Timestamp (Teslimat Bitiş Süresi)
        string contactInfo; // Şifrelenmiş veya düz metin iletişim bilgisi
        bool isAccepted;
    }

    // --- State Variables ---
    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;
    
    // bountyId => o ilana verilen tekliflerin ID'lerinin listesi
    mapping(uint256 => uint256[]) public bountyProposals;
    
    // bountyId => o ilanda kabul edilen proposalId (0 ise henüz kabul edilen yok)
    mapping(uint256 => uint256) public acceptedProposals;

    // --- Events ---
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

    // --- Errors ---
    error InvalidAmount();
    error ProposalNotFound();
    error BountyAlreadyHasAcceptedProposal();
    error Unauthorized(); // Normalde sadece o Bounty'nin işvereni (employer) onaylayabilir

    // --- Constructor ---
    constructor() {
        nextProposalId = 1;
    }

    // --- External Functions ---

    /**
     * @dev Geliştirici, C-Chain'de açılmış bir ilana (bountyId) başvurur.
     */
    function submitProposal(
        uint256 _bountyId,
        uint256 _requestedAmount,
        uint256 _deliveryTime,
        string memory _contactInfo
    ) external nonReentrant {
        if (_requestedAmount == 0) revert InvalidAmount();
        
        // MVP Notu: Geliştiricinin aynı ilana birden fazla teklif vermesi şimdilik engellenmedi.

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

        emit ProposalSubmitted(currentProposalId, _bountyId, msg.sender, _requestedAmount);
    }

    /**
     * @dev İşveren, gelen tekliflerden birini kabul eder. (Sözleşme mühürlenir)
     * @param _proposalId Kabul edilecek teklifin ID'si.
     * @param _mockEmployer MVP simülasyon amacıyla: Sender'ın işveren olup olmadığını doğrulamamız gerek. 
     * App-Chain, C-Chain'deki işveren bilgisini senkronize bilmeyebilir. 
     * Gerçek senaryoda bu işlem ya Teleporter kanalıyla çift yönlü doğrulanır, ya da Oracle kullanılır.
     * Şimdilik yetki kontrolünü basit tutuyoruz.
     */
    function acceptProposal(uint256 _proposalId, address _mockEmployer) external nonReentrant {
        Proposal storage prop = proposals[_proposalId];
        if (prop.developer == address(0)) revert ProposalNotFound();
        
        uint256 bountyId = prop.bountyId;
        if (acceptedProposals[bountyId] != 0) revert BountyAlreadyHasAcceptedProposal();
        
        // Mock yetki kontrolü
        if (msg.sender != _mockEmployer) revert Unauthorized();

        prop.isAccepted = true;
        acceptedProposals[bountyId] = _proposalId;

        emit ProposalAccepted(_proposalId, bountyId, msg.sender);
    }

    // İleride eklenecekler:
    // - completeWork: Geliştirici işi teslim eder.
    // - approveWorkAndTriggerPayment: İşveren onaylar ve Teleporter mesajı oluşturulup C-Chain'e yollanır.
}
