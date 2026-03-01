# ChainBounty Security Fix Directive

Bu direktifi Antigravity'deki Code modunda Opus 4.6'ya ver. Kontrat dosyalarını zaten görebilir (proje açık).

---

## GÖREV

Güvenlik auditinden çıkan 4 bulguyu düzelt. Her fix için:
1. Kontrat kodunu değiştir
2. İlgili unit test'i yaz
3. `forge test -vvv` çalıştırıp testlerin geçtiğini doğrula

Mevcut test dosyaları neredeyse boş (sadece `test_InitialState`), dolayısıyla testleri genişletmen gerekecek.

---

## FIX 1: claimEmployer() Race Condition [KRİTİK]

**Dosya**: `packages/contracts/src/app-chain/BountyExecutor.sol`

**Sorun**: `claimEmployer()` (satır 159-163) ilk çağıranı employer yapıyor. Saldırgan `nextBountyId`'yi C-Chain'den okuyup, bounty oluşturulmadan ÖNCE kendini employer olarak kaydedebilir. ICM mesajı geldiğinde `bountyEmployers[bountyId] != address(0)` olduğu için Teleporter overwrite YAPMIYOR — saldırgan employer kalıyor.

**Yapılacak 2 değişiklik**:

### 1a. receiveTeleporterMessage() içinde HER ZAMAN overwrite yap

Satır 140-144'ü şu şekilde değiştir:

```solidity
if (msgType == IBountyTypes.MessageType.CREATE_BOUNTY) {
    // GÜVENLIK FIX: Teleporter mesajı HER ZAMAN kazanır.
    // claimEmployer() ile sahte kayıt yapılmışsa bile overwrite eder.
    // Önceki adres varsa event'te belirtilir.
    address previousClaim = bountyEmployers[bountyId];
    bountyEmployers[bountyId] = employer;
    emit BountyRegistered(bountyId, employer);

    // Sahte claim tespit edildiyse log at (opsiyonel, debug için faydalı)
    if (previousClaim != address(0) && previousClaim != employer) {
        emit FraudulentClaimOverridden(bountyId, previousClaim, employer);
    }
}
```

Yeni event ekle (events bölümüne):
```solidity
event FraudulentClaimOverridden(uint256 indexed bountyId, address indexed fraudster, address indexed realEmployer);
```

### 1b. claimEmployer() fonksiyonunu tamamen KALDIR

Satır 152-163'ü (yorum + fonksiyon) tamamen sil.

Frontend'deki `useClaimEmployer()` hook'u artık kullanılmayacak — ama frontend değişikliği bu scope'un dışında, sadece kontratı düzelt.

### Test (BountyExecutor.t.sol'a ekle):

```solidity
function test_TeleporterOverwritesFraudulentClaim() public {
    // 1. Saldırgan bountyEmployers'a kendini kaydeder (claimEmployer kaldırıldıysa bu test skip)
    // 2. Teleporter mesajı gelir — gerçek employer'ı yazar
    // 3. Doğrula: bountyEmployers[bountyId] == gerçek employer

    uint256 bountyId = 100;
    address realEmployer = makeAddr("realEmployer");

    // Teleporter olarak mesaj gönder
    vm.prank(mockTeleporter);
    bytes memory messageData = abi.encode(
        IBountyTypes.MessageType.CREATE_BOUNTY,
        bountyId,
        realEmployer
    );
    bountyExecutor.receiveTeleporterMessage(cChainID, mockManager, messageData);

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
    bountyExecutor.receiveTeleporterMessage(cChainID, mockManager, messageData);

    // Yanlış source chain
    vm.prank(mockTeleporter);
    vm.expectRevert(BountyExecutor.Unauthorized.selector);
    bountyExecutor.receiveTeleporterMessage(keccak256("wrong-chain"), mockManager, messageData);

    // Yanlış source address
    vm.prank(mockTeleporter);
    vm.expectRevert(BountyExecutor.Unauthorized.selector);
    bountyExecutor.receiveTeleporterMessage(cChainID, makeAddr("wrongManager"), messageData);
}
```

---

## FIX 2: forceSettleByEmployer() Kötüye Kullanım [YÜKSEK]

**Dosya**: `packages/contracts/src/c-chain/BountyManager.sol`

**Sorun**: `forceSettleByEmployer()` (satır 206-225) employer'ın HERHANGİ bir `_developer` adresine ödeme yapmasına izin veriyor. Employer kendi adresini geçerek fonları geri çekebilir.

**Yapılacak değişiklik**: Fonksiyona timelock mekanizması ekle. Employer önce "settle intent" kaydeder, 24 saat sonra execute eder. Bu süre içinde developer itiraz edebilir veya en azından durumun farkına varır.

Satır 199-225'i şu şekilde değiştir:

```solidity
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

event ForceSettleRequested(uint256 indexed bountyId, address indexed employer, address indexed developer);
event ForceSettleExecuted(uint256 indexed bountyId, address indexed developer);

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
    if (block.timestamp < intent.requestedAt + SETTLE_TIMELOCK) revert Unauthorized();

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
```

Eski `forceSettleByEmployer()` fonksiyonunu tamamen kaldır.

### Test (BountyManager.t.sol'a ekle):

```solidity
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
    (,,,, bool isActive, bool isCompleted) = bountyManager.bounties(bountyId);
    assertFalse(isActive);
    assertTrue(isCompleted);
    assertEq(freelancer.balance, 1 ether);
}

function test_ForceSettle_OnlyEmployer() public {
    vm.prank(creator);
    bountyManager.createBounty{value: 1 ether}("test");

    vm.prank(freelancer); // Yanlış kişi
    vm.expectRevert(BountyManager.Unauthorized.selector);
    bountyManager.requestForceSettle(100, freelancer);
}
```

**ÖNEMLİ**: `createBounty` testlerinde Teleporter mock gerekiyor çünkü `sendCrossChainMessage` çağrılıyor. Mock kontrat oluştur:

```solidity
// test/mocks/MockTeleporter.sol
contract MockTeleporter {
    event MessageSent(bytes32 destinationBlockchainID, address destinationAddress);

    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32) {
        emit MessageSent(messageInput.destinationBlockchainID, messageInput.destinationAddress);
        return keccak256(abi.encode(block.timestamp));
    }
}
```

setUp()'ta `mockTeleporter` yerine bu kontratı deploy et:
```solidity
MockTeleporter public teleporter;

function setUp() public {
    teleporter = new MockTeleporter();
    bountyManager = new BountyManager(address(teleporter), appChainID);
    bountyManager.setExecutor(mockExecutor);
    vm.deal(creator, 100 ether);
    vm.deal(freelancer, 10 ether);
}
```

---

## FIX 3: Employer Ghosting — Auto-Release Timeout [KRİTİK]

**Dosya**: `packages/contracts/src/app-chain/BountyExecutor.sol`

**Sorun**: Employer işi onaylamayı reddederse (`approveWorkAndTriggerPayment()` çağırmaz), AVAX C-Chain'de sonsuza dek kilitli kalır.

**Yapılacak değişiklik**: Developer "iş teslim edildi" kaydı yapar. 72 saat employer yanıt vermezse developer ödemeyi tetikleyebilir.

Yeni state variables ve fonksiyonlar ekle:

```solidity
// ============================================================
//                    AUTO-RELEASE (ANTI-GHOSTING)
// ============================================================

/// @notice Developer'ın iş teslim zamanı
mapping(uint256 => uint256) public workDeliveredAt;

/// @notice Auto-release süresi
uint256 public constant AUTO_RELEASE_TIMEOUT = 72 hours;

event WorkDelivered(uint256 indexed bountyId, address indexed developer);
event AutoReleaseTriggered(uint256 indexed bountyId, address indexed developer);

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
    if (block.timestamp < workDeliveredAt[_bountyId] + AUTO_RELEASE_TIMEOUT) {
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

    ITeleporterMessenger(teleporterMessenger).sendCrossChainMessage(messageInput);
}
```

### Test (BountyExecutor.t.sol'a ekle):

```solidity
function test_AutoRelease_TimeoutEnforced() public {
    uint256 bountyId = 100;
    address employer = makeAddr("employer");
    address developer = makeAddr("developer");

    // Teleporter ile employer kaydet
    vm.prank(mockTeleporter);
    bountyExecutor.receiveTeleporterMessage(
        cChainID,
        mockManager,
        abi.encode(IBountyTypes.MessageType.CREATE_BOUNTY, bountyId, employer)
    );

    // Developer teklif verir
    vm.prank(developer);
    bountyExecutor.submitProposal(bountyId, 1 ether, block.timestamp + 7 days, "contact");

    // Employer kabul eder
    vm.prank(employer);
    bountyExecutor.acceptProposal(1);

    // Developer iş teslim eder
    vm.prank(developer);
    bountyExecutor.deliverWork(bountyId);

    // Hemen auto-release dene — revert etmeli
    vm.expectRevert(BountyExecutor.Unauthorized.selector);
    bountyExecutor.autoReleasePayment(bountyId);

    // 72 saat ilerle
    vm.warp(block.timestamp + 72 hours + 1);

    // Şimdi tetikle — Teleporter mock gerekiyor, sendCrossChainMessage çağrılacak
    // MockTeleporter deploy edilmişse başarılı olur
    bountyExecutor.autoReleasePayment(bountyId);
}

function test_DeliverWork_OnlyAcceptedDeveloper() public {
    uint256 bountyId = 100;
    address employer = makeAddr("employer");
    address developer = makeAddr("developer");
    address attacker = makeAddr("attacker");

    // Setup: bounty kaydet + teklif ver + kabul et
    vm.prank(mockTeleporter);
    bountyExecutor.receiveTeleporterMessage(
        cChainID, mockManager,
        abi.encode(IBountyTypes.MessageType.CREATE_BOUNTY, bountyId, employer)
    );
    vm.prank(developer);
    bountyExecutor.submitProposal(bountyId, 1 ether, block.timestamp + 7 days, "contact");
    vm.prank(employer);
    bountyExecutor.acceptProposal(1);

    // Saldırgan deliverWork çağıramaz
    vm.prank(attacker);
    vm.expectRevert(BountyExecutor.Unauthorized.selector);
    bountyExecutor.deliverWork(bountyId);

    // Gerçek developer çağırabilir
    vm.prank(developer);
    bountyExecutor.deliverWork(bountyId);
    assertEq(bountyExecutor.workDeliveredAt(bountyId), block.timestamp);
}
```

---

## FIX 4: cancelBounty() Stale Data [ORTA]

**Dosya**: `packages/contracts/src/c-chain/BountyManager.sol`

**Sorun**: `cancelBounty()` çağrıldığında App-Chain'e CANCEL_BOUNTY mesajı gönderilmiyor. Developerlar iptal edilmiş bir bounty'ye teklif vermeye devam edebilir.

**Yapılacak değişiklik**: `cancelBounty()` fonksiyonuna ICM mesajı ekle.

Satır 193'ten sonra (emit'ten sonra, .call'dan önce) ekle:

```solidity
emit BountyCancelled(_bountyId, msg.sender);

// App-Chain'e iptal bildir
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

    ITeleporterMessenger(teleporterMessenger).sendCrossChainMessage(cancelInput);
}

(bool success, ) = msg.sender.call{value: refundAmount}("");
if (!success) revert PaymentFailed();
```

**Ayrıca BountyExecutor.sol'da** `receiveTeleporterMessage()` CANCEL_BOUNTY'yi handle etmeli:

Satır 144'ten sonra (mevcut CANCEL_BOUNTY yorumunun yerine):

```solidity
if (msgType == IBountyTypes.MessageType.CREATE_BOUNTY) {
    address previousClaim = bountyEmployers[bountyId];
    bountyEmployers[bountyId] = employer;
    emit BountyRegistered(bountyId, employer);
    if (previousClaim != address(0) && previousClaim != employer) {
        emit FraudulentClaimOverridden(bountyId, previousClaim, employer);
    }
} else if (msgType == IBountyTypes.MessageType.CANCEL_BOUNTY) {
    // Bounty iptal edildi — employer kaydını sil
    // Bu, yeni teklif verilmesini engeller (submitProposal BountyNotRegistered revert eder)
    delete bountyEmployers[bountyId];
    emit BountyCancelled(bountyId);
}
```

Yeni event ve error ekle:
```solidity
event BountyCancelled(uint256 indexed bountyId);
```

---

## Çalıştırma Sırası

1. İlk önce `test/mocks/MockTeleporter.sol` oluştur
2. Fix 1'i uygula (BountyExecutor — claimEmployer kaldır + overwrite)
3. Fix 3'ü uygula (BountyExecutor — deliverWork + autoRelease)
4. Fix 4'ün BountyExecutor kısmını uygula (CANCEL_BOUNTY handler)
5. Fix 2'yi uygula (BountyManager — forceSettle timelock)
6. Fix 4'ün BountyManager kısmını uygula (cancelBounty ICM mesajı)
7. Tüm testleri güncelle ve çalıştır: `forge test -vvv`
8. `forge fmt` ile formatting düzelt
9. ABI'leri yeniden extract et: frontend'deki `lib/contracts.ts` güncellenecek

**Dikkat**: Frontend'deki `useClaimEmployer()` ve `useForceSettle()` hook'ları artık çalışmayacak. Bunlar ayrı bir PR'da güncellenebilir. Bu scope sadece kontrat güvenliği.
