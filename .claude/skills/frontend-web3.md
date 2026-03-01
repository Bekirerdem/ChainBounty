# ChainBounty Frontend Web3 Skill

Bu skill dosyası, ChainBounty projesinin cross-chain frontend geliştirmesinde LLM'lerin tutarlı, güvenli ve kullanıcı dostu kod üretmesini sağlar. Tüm kurallar Avalanche C-Chain ↔ App-Chain (ICM/Teleporter) mimarisine özeldir.

---

## 1. Ağ Yönetimi (Network Switching)

### Zincir Tanımları
- **C-Chain (Fuji Testnet)**: chainId `43113` — Escrow işlemleri (createBounty, cancelBounty, requestForceSettle, executeForceSettle)
- **App-Chain (ChainBounty L1)**: chainId `779672` — Operasyon işlemleri (submitProposal, acceptProposal, approveWorkAndTriggerPayment, deliverWork, autoReleasePayment)
- Zincir konfigürasyonları `lib/chains.ts` içinde `defineChain()` ile tanımlıdır. Yeni zincir ekleme/değiştirme SADECE bu dosyadan yapılır.

### Kurallar

#### ZORUNLU: Write işlemlerinden önce doğru zincirde olduğunu kontrol et
```typescript
// HER write hook'unda bu pattern ZORUNLU:
const { chain } = useAccount();
const { switchChainAsync } = useSwitchChain();

if (chain?.id !== targetChain.id && switchChainAsync) {
  await switchChainAsync({ chainId: targetChain.id });
}
```

#### Fonksiyon → Zincir Eşleme Tablosu (MUTLAK REFERANS)
| Fonksiyon | Kontrat | Hedef Zincir | chainId |
|---|---|---|---|
| `createBounty()` | BountyManager | C-Chain Fuji | 43113 |
| `cancelBounty()` | BountyManager | C-Chain Fuji | 43113 |
| `requestForceSettle()` | BountyManager | C-Chain Fuji | 43113 |
| `executeForceSettle()` | BountyManager | C-Chain Fuji | 43113 |
| `bounties()` (read) | BountyManager | C-Chain Fuji | 43113 |
| `settleIntents()` (read) | BountyManager | C-Chain Fuji | 43113 |
| `submitProposal()` | BountyExecutor | App-Chain | 779672 |
| `acceptProposal()` | BountyExecutor | App-Chain | 779672 |
| `approveWorkAndTriggerPayment()` | BountyExecutor | App-Chain | 779672 |
| `deliverWork()` | BountyExecutor | App-Chain | 779672 |
| `autoReleasePayment()` | BountyExecutor | App-Chain | 779672 |
| `proposals()` (read) | BountyExecutor | App-Chain | 779672 |
| `workDeliveredAt()` (read) | BountyExecutor | App-Chain | 779672 |

#### KALDIRILDI (Güvenlik Fix Sonrası)
| Fonksiyon | Sebep |
|---|---|
| ~~`claimEmployer()`~~ | Race condition açığı — FIX 1 ile kaldırıldı |
| ~~`forceSettleByEmployer()`~~ | Timelock'suz kötüye kullanım — FIX 2 ile requestForceSettle/executeForceSettle olarak değişti |

#### YASAK
- Kullanıcıdan manuel RPC URL girmesini isteme — zincirler `lib/chains.ts`'den gelir
- `window.ethereum.request({ method: 'wallet_addEthereumChain' })` gibi low-level çağrılar YAPMA — Wagmi/RainbowKit bunu handle eder
- Read işlemlerinde `switchChain` çağırma — `useReadContract` zaten `chainId` parametresi alır

### Cüzdan Uyumluluğu
- RainbowKit v2 kullanılıyor: MetaMask, WalletConnect, Coinbase Wallet otomatik dahil
- Core Wallet (Avalanche native) desteği henüz yok — eklenecekse `lib/wagmi.ts`'de `getDefaultConfig` yerine manual `createConfig` kullanılmalı
- SSR: `cookieStorage` ile persist ediliyor (`lib/wagmi.ts`), "Connect Wallet flash" önlendi

---

## 2. Cross-Chain Durum Yönetimi (State UI)

### İşlem Yaşam Döngüsü
ChainBounty'de bir bounty'nin tam akışı iki zinciri kapsar. UI bu durumları kullanıcıya NET göstermeli:

```
[C-Chain] createBounty() → tx pending → tx confirmed → AVAX locked
     ↓
[ICM] Teleporter mesajı App-Chain'e iletiliyor (5-30 saniye)
     ↓
[App-Chain] BountyRegistered event → bountyEmployers[id] != 0x0
     ↓
[App-Chain] submitProposal() → acceptProposal() → approveWorkAndTriggerPayment()
     ↓
[ICM] APPROVE_SOLUTION mesajı C-Chain'e dönüyor (5-30 saniye)
     ↓
[C-Chain] receiveTeleporterMessage() → AVAX released → BountyCompleted event
```

### UI State Makinesi (HER bounty detay sayfasında ZORUNLU)
```typescript
type CrossChainStatus =
  | "idle"                    // Henüz işlem yok
  | "tx-pending"              // Cüzdan onayı bekleniyor
  | "tx-confirming"           // Zincirde onay bekleniyor
  | "icm-relaying"            // Teleporter mesajı yolda (karşı zinciri polling)
  | "icm-delivered"           // Karşı zincirde onaylandı
  | "failed"                  // Hata oluştu
  | "timeout";                // ICM mesajı 120 saniye içinde ulaşmadı
```

### ICM Durum Takibi Pattern'i
```typescript
// ICM mesajının karşı zincire ulaşıp ulaşmadığını kontrol et
// Örnek: createBounty sonrası App-Chain'de employer kaydını polling et
const pollForICMDelivery = async (bountyId: number, maxRetries = 24) => {
  for (let i = 0; i < maxRetries; i++) {
    const employer = await readContract({
      address: BOUNTY_EXECUTOR_ADDRESS,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: 'bountyEmployers',
      args: [BigInt(bountyId)],
      chainId: bountyAppChain.id,
    });
    if (employer !== '0x0000000000000000000000000000000000000000') {
      return 'delivered';
    }
    await new Promise(r => setTimeout(r, 5000)); // 5 saniye bekle
  }
  return 'timeout'; // 2 dakika sonra timeout
};
```

### Hata Yönetimi Kuralları

#### ZORUNLU: Her write işleminde try/catch
```typescript
try {
  setStatus("tx-pending");
  const hash = await writeContractAsync({ ... });
  setStatus("tx-confirming");
  // waitForTransactionReceipt ile onay bekle
  setStatus("icm-relaying");
  // polling başlat
} catch (err: any) {
  if (err.message?.includes("User rejected")) {
    setStatus("idle"); // Kullanıcı iptal etti, sessizce geri dön
  } else if (err.message?.includes("insufficient funds")) {
    setError("Yetersiz bakiye. Lütfen cüzdanınıza AVAX ekleyin.");
  } else {
    setError("İşlem başarısız oldu. Lütfen tekrar deneyin.");
    setStatus("failed");
  }
}
```

#### ZORUNLU: Timeout sonrası fallback göster
- `createBounty` sonrası ICM 120 saniyede ulaşmazsa → Kullanıcıya bekleme mesajı göster (claimEmployer kaldırıldı, ICM beklenmeli)
- `approveWorkAndTriggerPayment` sonrası ICM 120 saniyede ulaşmazsa → `requestForceSettle()` butonunu göster (24 saat timelock uyarısıyla)
- Developer iş teslim ettikten 72 saat sonra employer yanıt vermediyse → `autoReleasePayment()` butonunu developer'a göster
- Timeout mesajı kullanıcıya: "Cross-chain mesajı henüz ulaşmadı. Manuel onay ile devam edebilirsiniz."

#### YENİ: Force Settle Timelock UI Akışı
```
Employer "requestForceSettle" tıklar → Intent kaydedilir → 24 saat countdown göster
  → Countdown bitince "executeForceSettle" butonu aktif olur
  → Execute tıklanır → Ödeme yapılır
```

#### YENİ: Anti-Ghosting (Auto-Release) UI Akışı
```
Developer "deliverWork" tıklar → workDeliveredAt kaydedilir → 72 saat countdown göster
  → Employer bu sürede "approveWorkAndTriggerPayment" çağırabilir (normal akış)
  → 72 saat biterse → "autoReleasePayment" butonu developer'a aktif olur
  → Developer veya herhangi biri tetikler → ICM ile C-Chain'e ödeme gider
```

#### YASAK
- İşlem pending iken aynı butonu tekrar tıklanabilir bırakma
- ICM relay süresini kullanıcıya "anında" vaat etme — "genellikle 5-30 saniye" de
- Hata mesajlarında Solidity revert reason'ını ham gösterme — kullanıcı dostu mesaja çevir

### Error → Kullanıcı Mesajı Eşleme Tablosu
| Revert Error | Kullanıcı Mesajı |
|---|---|
| `InvalidBudget()` | "Bounty oluşturmak için AVAX miktarı belirtmelisiniz." |
| `BountyNotFound()` | "Bu bounty bulunamadı." |
| `BountyNotActive()` | "Bu bounty artık aktif değil." |
| `Unauthorized()` | "Bu işlem için yetkiniz yok." |
| `PaymentFailed()` | "Ödeme gönderilemedi. Alıcı adresi kontrol edilmelidir." |
| `ExecutorNotSet()` | "Sistem henüz yapılandırılmadı. Yönetici ile iletişime geçin." |
| `InvalidAmount()` | "Geçersiz tutar. 0'dan büyük bir değer girin." |
| `InvalidDeliveryTime()` | "Teslimat tarihi gelecekte bir zaman olmalıdır." |
| `BountyAlreadyHasAcceptedProposal()` | "Bu bounty için zaten bir teklif kabul edilmiş." |
| `AlreadySubmitted()` | "Bu bounty'ye zaten başvurdunuz." |

---

## 3. Viem/Wagmi Kontrat Etkileşim Standartları

### Dosya Yapısı
```
lib/
  chains.ts        → Zincir tanımları (defineChain)
  contracts.ts     → ABI + adresler (auto-generated veya manual)
  wagmi.ts         → Wagmi config (getDefaultConfig + chains)
hooks/
  useBounty.ts     → Tüm kontrat read/write hook'ları
```

### Read İşlemleri
```typescript
// TEKİL READ — useReadContract
const { data, isLoading, refetch } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'functionName',
  args: [arg1, arg2],
  chainId: targetChain.id,        // ZORUNLU: doğru zincir
  query: { enabled: !!condition }, // Koşullu çalıştırma
});

// TOPLU READ — useReadContracts (batch RPC)
// Tüm bounty'leri çekmek gibi N adet aynı fonksiyonu çağırmak için
const contracts = ids.map(id => ({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'bounties',
  args: [BigInt(id)],
  chainId: targetChain.id,
}));
const { data: results } = useReadContracts({ contracts });
```

### Write İşlemleri
```typescript
// STANDART WRITE PATTERN
const { writeContractAsync, isPending } = useWriteContract();

const doAction = async () => {
  // 1. Zincir kontrolü (yukarıdaki pattern)
  // 2. writeContractAsync çağrısı
  const hash = await writeContractAsync({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'functionName',
    args: [...],
    chainId: targetChain.id,
    value: parseEther(amount), // Sadece payable fonksiyonlarda
  });
  // 3. Receipt bekleme (opsiyonel)
  // 4. ICM polling (cross-chain işlemlerde)
};
```

### Tip Güvenliği
- ABI'ler `as const` ile export edilir (`lib/contracts.ts`) — Viem otomatik tip çıkarımı yapar
- BigInt dönüşümleri: Solidity `uint256` → TypeScript `BigInt(value)`
- Adres formatı: Her zaman `` `0x${string}` `` tipi kullan
- Wei/Ether: `parseEther()` (input) ve `formatEther()` (display) — ASLA manual hesaplama yapma

### YASAK
- `ethers.js` KULLANMA — proje tamamen Viem/Wagmi üzerine kurulu
- `useContractRead` (v1 syntax) KULLANMA — `useReadContract` (v2) kullan
- `usePrepareContractWrite` (v1) KULLANMA — v2'de `writeContractAsync` doğrudan kullanılır
- ABI'yi component içinde inline tanımlama — her zaman `lib/contracts.ts`'den import et
- `window.ethereum`'a doğrudan erişme — Wagmi provider üzerinden git

### Provider Hiyerarşisi (Değiştirme!)
```
app/providers.tsx:
  WagmiProvider (config from lib/wagmi.ts)
    → QueryClientProvider (TanStack Query)
      → RainbowKitProvider
        → DemoProvider (mock/live toggle)
```

### Demo Mode Kuralı
- `contexts/DemoContext.tsx` içindeki `isDemoMode` kontrol edilir
- `isDemoMode === true` → `lib/mock-data.ts`'den veri göster
- `isDemoMode === false` → gerçek kontrat çağrıları (`useBounty.ts` hook'ları)
- Yeni sayfa/component eklerken HER ZAMAN demo mode desteği koy
