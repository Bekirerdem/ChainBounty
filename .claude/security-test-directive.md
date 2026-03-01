# ChainBounty Güvenlik Test Direktifi

Bu dökümanı Antigravity'deki Opus 4.6 veya Gemini 3.1 Pro'ya aynen yapıştır. Kontrat kodlarını da (BountyManager.sol, BountyExecutor.sol, IBountyTypes.sol, ITeleporter.sol) beraber gönder.

---

## Görev Tanımı

Aşağıdaki iki Solidity kontratını (BountyManager.sol ve BountyExecutor.sol) üç spesifik güvenlik kriteri üzerinden analiz et. Her kriter için:
1. Mevcut kodda bu zafiyete karşı koruma VAR MI / YOK MU — net söyle
2. Varsa: korumanın yeterliliğini değerlendir, eksiklerini belirt
3. Yoksa: sömürü senaryosunu (exploit scenario) adım adım anlat ve düzeltme kodunu yaz

Analiz sırasında Avalanche ICM/Teleporter mimarisini dikkate al: mesajlar Teleporter kontratı üzerinden relay edilir, `receiveTeleporterMessage()` çağrısı Teleporter kontratından gelir (msg.sender == teleporterMessenger).

---

## KRİTER 1: Teleporter Mesaj Sahteciliği (Spoofing)

### Analiz Edilecek Fonksiyonlar
- `BountyManager.receiveTeleporterMessage()` (satır 240-276)
- `BountyExecutor.receiveTeleporterMessage()` (satır 120-146)

### Test Soruları

1. **msg.sender Kontrolü**: Her iki kontratta da `msg.sender != teleporterMessenger` kontrolü var. Ancak `teleporterMessenger` adresi constructor'da set ediliyor ve değiştirilemez. Bu yeterli mi? Teleporter kontratı upgrade edilirse ne olur?

2. **sourceChainID Kontrolü**: `sourceChainID != appChainId` (veya `cChainId`) kontrolü var. Saldırgan kendi L1'ini deploy edip aynı blockchain ID'yi kullanabilir mi? Avalanche'da blockchain ID'ler unique mı?

3. **sourceAddress Kontrolü**: `sourceAddress != allowedAppChainExecutor` kontrolü var. Bu adres `setExecutor()` ile değiştirilebilir ve `setExecutor()` sadece `onlyOwner` korumalı. Owner key'i ele geçirilirse tüm sistem düşer — bu riski değerlendir.

4. **claimEmployer() Açığı**: `BountyExecutor.claimEmployer()` (satır 159-163) fonksiyonu, ICM mesajı gelmeden employer'ın kendini kaydetmesine izin veriyor. Saldırı senaryosu: Saldırgan, C-Chain'de bounty oluşturulmadan önce App-Chain'de `claimEmployer(futureId)` çağırarak henüz oluşturulmamış bir bounty'nin employer'ı olabilir mi? Bu durumda ICM mesajı geldiğinde overwrite eder mi, yoksa `if (bountyEmployers[_bountyId] != address(0)) revert Unauthorized()` kontrolü bunu engeller mi? Tam sömürü akışını analiz et.

5. **Mesaj Replay Saldırısı**: Aynı ICM mesajı birden fazla kez relay edilebilir mi? `receiveTeleporterMessage` içinde nonce veya idempotency kontrolü var mı? Teleporter'ın kendisi bunu garantiliyor mu?

### Beklenen Çıktı Formatı
```
## Kriter 1: Teleporter Mesaj Sahteciliği

### 1.1 msg.sender Kontrolü
- Durum: [KORUNUYOR / KISMI / KORUNMUYOR]
- Analiz: ...
- Risk Seviyesi: [DÜŞÜK / ORTA / YÜKSEK / KRİTİK]
- Öneri: ...

### 1.2 sourceChainID Kontrolü
...

### 1.3 sourceAddress Kontrolü
...

### 1.4 claimEmployer() Açığı
...

### 1.5 Mesaj Replay
...
```

---

## KRİTER 2: Reentrancy Zafiyeti

### Analiz Edilecek Fonksiyonlar
- `BountyManager.cancelBounty()` (satır 182-197) — AVAX iade
- `BountyManager.forceSettleByEmployer()` (satır 206-225) — AVAX ödeme
- `BountyManager.receiveTeleporterMessage()` (satır 240-276) — AVAX ödeme
- `BountyExecutor.submitProposal()` (satır 174-215) — state yazma

### Test Soruları

1. **CEI Pattern Uyumu**: Her fonksiyonda Checks-Effects-Interactions sırası doğru mu? State (isActive, isCompleted, budget) güncellenmeden ÖNCE external call yapılıyor mu?

2. **ReentrancyGuard Kapsamı**: Her iki kontrat da OpenZeppelin ReentrancyGuard kullanıyor. `nonReentrant` modifier'ı her external call yapan fonksiyona uygulanmış mı? Eksik kalan var mı?

3. **Cross-Function Reentrancy**: `cancelBounty()` çağrılırken `.call{value: refundAmount}("")` external call'u sırasında saldırgan fallback fonksiyonundan `forceSettleByEmployer()` çağırabilir mi? ReentrancyGuard cross-function reentrancy'yi engelliyor mu? (Evet engelliyor çünkü aynı storage slot'u lock'lıyor — ama bunu doğrula.)

4. **budget = 0 Öncesi Ödeme**: `receiveTeleporterMessage()` içinde `b.budget = 0` satır 270'de yapılıyor, `.call{value: payment}` satır 274'te. `payment` local variable'a atanmış (`uint256 payment = b.budget`). Bu CEI'ye uygun mu? Eğer `.call` revert ederse state tutarsız kalır mı?

5. **Read-Only Reentrancy**: Saldırgan, ödeme `.call`'u sırasında fallback'ten `bounties(bountyId)` read çağrısı yaparak henüz güncellenmiş ama ödenmemiş bir state görebilir mi? Bu, DeFi entegrasyonları için risk oluşturur mu?

### Beklenen Çıktı Formatı
```
## Kriter 2: Reentrancy Zafiyeti

### 2.1 CEI Pattern Analizi
- cancelBounty(): [UYUMLU / UYUMSUZ] — ...
- forceSettleByEmployer(): [UYUMLU / UYUMSUZ] — ...
- receiveTeleporterMessage(): [UYUMLU / UYUMSUZ] — ...

### 2.2 ReentrancyGuard Kapsamı
...

### 2.3 Cross-Function Reentrancy
...

### 2.4 State Tutarlılığı
...

### 2.5 Read-Only Reentrancy
...
```

---

## KRİTER 3: Kilitli Fon Durumu (Deadlock)

### Analiz Edilecek Senaryolar

1. **ICM Mesajı Ulaşmadı — CREATE_BOUNTY**: Employer C-Chain'de `createBounty()` çağırdı, AVAX kilitlendi. Ama ICM mesajı App-Chain'e hiç ulaşmadı (relayer down, gas limit yetersiz, vb). Sonuç: App-Chain'de `bountyEmployers[bountyId] == 0x0`, kimse submitProposal yapamaz. C-Chain'de AVAX kilitli. AVAX'ı kurtarma yolu:
   - `cancelBounty()` — employer çağırabilir. Yeterli mi?
   - Soru: `cancelBounty()` çağrıldığında App-Chain'e CANCEL_BOUNTY mesajı gönderilmiyor. Bu sorun mu? App-Chain'de stale data kalır mı?

2. **ICM Mesajı Ulaşmadı — APPROVE_SOLUTION**: Employer App-Chain'de `approveWorkAndTriggerPayment()` çağırdı. Ama ICM mesajı C-Chain'e ulaşmadı. Sonuç: App-Chain'de iş "tamamlandı" görünüyor ama C-Chain'de AVAX hala kilitli. Kurtarma:
   - `forceSettleByEmployer()` mevcut — employer doğrudan C-Chain'de ödemeyi tetikleyebilir
   - Soru: `forceSettleByEmployer()` herhangi bir `_developer` adresine ödeme yapıyor. Employer kötü niyetli ise kendi adresine ödeme yapabilir mi? Bu fonksiyonun App-Chain'deki `acceptedProposals` verisiyle doğrulanması gerekmiyor mu?

3. **Employer Ghosting**: Employer bounty oluşturdu, developer proposal submit etti ve kabul edildi. Developer işi teslim etti ama employer `approveWorkAndTriggerPayment()` çağırmayı reddediyor. Şu an kontratta timeout/auto-release mekanizması YOK. AVAX sonsuza dek kilitli kalır. Çözüm öner:
   - Timelock pattern önerisi (deliveryTime + grace period sonrası developer'ın tetikleyebildiği auto-release)
   - Gerekli kontrat değişikliklerini pseudo-code olarak yaz

4. **Çift Harcama (Double Spend)**: `forceSettleByEmployer()` ve `receiveTeleporterMessage()` aynı bounty için yarışırsa ne olur? İkisi de `isActive` kontrolü yapıyor — biri çalıştığında diğeri revert eder. Ama timing açısından: TX1 mempool'da, TX2 de mempool'da — miner ikisini de aynı blokta include edebilir mi? Bu durumda biri başarılı olur diğeri revert eder mi? Doğrula.

5. **requiredGasLimit Yetersizliği**: `createBounty()` ICM mesajında `requiredGasLimit: 100_000`, `approveWorkAndTriggerPayment()` mesajında `requiredGasLimit: 300_000` set edilmiş. Bu değerler yeterli mi? `receiveTeleporterMessage()` fonksiyonlarının gas consumption'ını hesapla. Yetersiz gas durumunda mesaj kaybolur mu yoksa retry edilir mi?

### Beklenen Çıktı Formatı
```
## Kriter 3: Kilitli Fon Durumu (Deadlock)

### 3.1 CREATE_BOUNTY ICM Hatası
- Risk: [VAR / YOK]
- Mevcut Koruma: cancelBounty() — [YETERLİ / YETERSİZ]
- Stale Data Riski: ...
- Öneri: ...

### 3.2 APPROVE_SOLUTION ICM Hatası
- Risk: [VAR / YOK]
- forceSettleByEmployer() Güvenliği: [GÜVENLİ / RİSKLİ]
- Öneri: ...

### 3.3 Employer Ghosting (Zaman Aşımı Eksikliği)
- Durum: [KORUNMUYOR]
- Sömürü Senaryosu: ...
- Çözüm Pseudo-Code: ...

### 3.4 Çift Harcama Yarış Koşulu
- Analiz: ...

### 3.5 Gas Limit Yeterliliği
- createBounty ICM (100k): [YETERLİ / YETERSİZ]
- approveWork ICM (300k): [YETERLİ / YETERSİZ]
- Öneri: ...
```

---

## Genel Kurallar

- Her bulguyu DÜŞÜK / ORTA / YÜKSEK / KRİTİK olarak sınıflandır
- "Hackathon demosu için kabul edilebilir" diye geçiştirme — production-grade analiz yap
- Soyut değil, BU KODDAKİ satır numaralarını referans göstererek analiz et
- Düzeltme önerilerini Solidity kodu olarak ver (sadece değişen kısımlar)
- Avalanche ICM/Teleporter'ın kendi güvenlik garantilerini dikkate al (mesaj nonce, relay mekanizması)
