# ChainBounty Frontend Geliştirme Planı

Tarih: 2026-03-01
Durum: Kontrat güvenliği tamamlandı, hook'lar güncellendi, build temiz.
Hedef: Hackathon jürisini etkileyen, kullanılabilir bir cross-chain freelance platformu.

---

## Mevcut Durum — Ne VAR, Ne YOK

### ✅ Tamamlanmış
- Core bounty CRUD (oluştur, listele, filtrele, sırala, detay)
- Proposal submission + acceptance + payment trigger
- cancelBounty + forceSettle (timelock) + autoRelease (anti-ghosting) hook'ları
- Multi-chain auto-switching (C-Chain ↔ App-Chain)
- RainbowKit wallet bağlantısı
- Demo/Live mode toggle
- 3D hero, GSAP/Framer Motion animasyonlar
- Responsive dark theme

### ❌ Eksik (Hackathon İçin Önemli)
- Cross-chain status gösterimi (ICM mesaj durumu)
- Timelock countdown UI (24h force settle)
- Auto-release countdown UI (72h anti-ghosting)
- Employer/Developer dashboard
- İşlem geçmişi (transaction log)

---

## Hackathon Geliştirme Fazları

### FAZ 1: Cross-Chain UX (Jüri İçin En Etkili) ⭐ ÖNCELİK 1

Bu faz, projenin "sıradan bir dApp değil, cross-chain bir protokol" olduğunu gösterir.

#### 1.1 — Cross-Chain İşlem Durumu Componenti
**Dosya**: `components/CrossChainStatus.tsx` (YENİ)

İşlem yapıldığında (createBounty, approvePayment, cancelBounty) ekranda step-by-step ilerleme gösteren overlay/toast:

```
Adım 1: [✅] İşlem cüzdana gönderildi
Adım 2: [✅] C-Chain'de onaylandı (tx: 0x1a2b...)
Adım 3: [⏳] ICM mesajı App-Chain'e iletiliyor...
Adım 4: [  ] App-Chain'de kaydedildi
```

Teknik: İşlem hash'i sonrası `waitForTransactionReceipt` ile onay bekle → sonra karşı zincirde polling yap (useBountyEmployer / useIsTaskResolved). `CrossChainStatus` type'ı skill dosyasında tanımlı ("idle" | "tx-pending" | "tx-confirming" | "icm-relaying" | "icm-delivered" | "failed" | "timeout").

#### 1.2 — Force Settle Timelock Countdown
**Dosya**: `components/TimelockCountdown.tsx` (YENİ)

Employer "Manuel Ödeme" tıkladığında:
- `requestForceSettle` çağrılır
- 24 saat geri sayım başlar (useSettleIntent → canExecuteAt)
- Countdown sıfıra ulaşınca "Ödemeyi Onayla" butonu aktif olur
- `executeForceSettle` çağrılır

UI: Circular progress veya basit dijital sayaç. Sarı/turuncu renk tonu (uyarı).

#### 1.3 — Auto-Release Countdown (Anti-Ghosting)
**Dosya**: `components/AutoReleaseCountdown.tsx` (YENİ)

Developer "İşi Teslim Et" tıkladığında:
- `deliverWork` çağrılır
- 72 saat geri sayım başlar (useWorkDeliveredAt → autoReleaseAt)
- Countdown sıfıra ulaşınca "Otomatik Ödeme Al" butonu aktif olur
- `autoReleasePayment` çağrılır

UI: Progress bar + "Xg Xs kaldı" mesajı. Yeşil renk tonu (pozitif).

#### 1.4 — Bounty Detay Sayfası Güvenlik Butonları Entegrasyonu
**Dosya**: `app/bounties/[id]/page.tsx` (GÜNCELLE)

Mevcut sayfaya yeni butonlar ekle:
- Developer görünümü: "İşi Teslim Et" butonu (deliverWork) + AutoReleaseCountdown
- Employer görünümü: "Manuel Ödeme" butonu (requestForceSettle) + TimelockCountdown
- Her iki countdown componenti de bounty detayında inline gösterilmeli

---

### FAZ 2: Dashboard'lar (Kullanıcı Deneyimi) ⭐ ÖNCELİK 2

#### 2.1 — Employer Dashboard
**Dosya**: `app/dashboard/employer/page.tsx` (YENİ)

- Oluşturulan bounty'lerin listesi (aktif / tamamlanan / iptal)
- Her bounty için: teklif sayısı, durum, kilitli AVAX
- Toplam harcanan AVAX, aktif bounty sayısı
- Veri kaynağı: useAllBounties() filtrelenmiş (creator === connectedAddress)

#### 2.2 — Developer Dashboard
**Dosya**: `app/dashboard/developer/page.tsx` (YENİ)

- Verilen tekliflerin listesi (bekleyen / kabul edilen / tamamlanan)
- Her teklif için: bounty bilgisi, talep edilen tutar, durum
- Toplam kazanılan AVAX, aktif teklif sayısı
- Veri kaynağı: Tüm proposals filtrelenmiş (developer === connectedAddress)

#### 2.3 — Dashboard Layout
**Dosya**: `app/dashboard/layout.tsx` (YENİ)

- Sol sidebar: Employer / Developer tab
- Connected wallet adresini göster
- Navbar'a "Dashboard" linki ekle

---

### FAZ 3: UX Polish (Profesyonellik) ⭐ ÖNCELİK 3

#### 3.1 — Transaction Toast/Notification Sistemi
**Dosya**: `components/TransactionToast.tsx` (YENİ)

Her write işlemi sonrası:
- Başarı: Yeşil toast + explorer linki
- Hata: Kırmızı toast + kullanıcı dostu mesaj (skill dosyasındaki error mapping tablosu)
- Pending: Sarı toast + spinner

#### 3.2 — Explorer Linkleri
**Dosya**: `components/ExplorerLink.tsx` (YENİ)

- C-Chain tx'leri → Snowtrace linki
- App-Chain tx'leri → (custom explorer varsa) veya raw tx hash göster
- BountyCard ve detay sayfasında kullanılacak

#### 3.3 — Empty States ve Loading Skeletonlar
- Dashboard'lar için "Henüz bounty oluşturmadınız" empty state
- Liste yüklenirken skeleton card animasyonu
- Wallet bağlı değilken "Cüzdanınızı bağlayın" CTA

#### 3.4 — Responsive Detay İyileştirmeleri
- Bounty detay sayfasında mobile layout iyileştirmesi
- Dashboard'lar için mobile tab navigation

---

### FAZ 4: Opsiyonel İyileştirmeler (Zaman Kalırsa)

#### 4.1 — Bounty Durumuna Göre Timeline
- Bounty'nin yaşam döngüsünü görsel timeline olarak göster:
  Oluşturuldu → ICM İletildi → Teklif Alındı → Kabul Edildi → İş Teslim Edildi → Ödeme Yapıldı

#### 4.2 — Pagination
- useAllBounties hook'unda sayfalama (performance iyileştirme)
- "Daha fazla yükle" butonu veya infinite scroll

#### 4.3 — Gelişmiş Filtreler
- Ödül aralığı slider (min-max AVAX)
- Tarih aralığı filtresi
- Tag bazlı filtreleme (chip selector)

#### 4.4 — IPFS Entegrasyonu (Gerçek)
- Şu an ipfsDocHash alanına "Title | Description" yazılıyor (hackathon workaround)
- Gerçek IPFS upload (Pinata veya nft.storage) + hash kayıt

---

## Uygulama Sırası ve Tahmini Süreler

| Sıra | İş | Dosyalar | Süre |
|---|---|---|---|
| 1 | CrossChainStatus componenti | CrossChainStatus.tsx | ~45dk |
| 2 | TimelockCountdown componenti | TimelockCountdown.tsx | ~30dk |
| 3 | AutoReleaseCountdown componenti | AutoReleaseCountdown.tsx | ~30dk |
| 4 | Bounty detay sayfası entegrasyonu | page.tsx güncelle | ~1sa |
| 5 | TransactionToast sistemi | TransactionToast.tsx | ~30dk |
| 6 | ExplorerLink componenti | ExplorerLink.tsx | ~15dk |
| 7 | Employer Dashboard | dashboard/employer/page.tsx | ~1.5sa |
| 8 | Developer Dashboard | dashboard/developer/page.tsx | ~1.5sa |
| 9 | Dashboard layout + navbar güncelle | layout.tsx, Navbar.tsx | ~30dk |
| 10 | Empty states + skeletonlar | Çeşitli componentler | ~45dk |

**Toplam tahmini: ~8 saat**

---

## Antigravity'ye Verilecek Direktif Sırası

Her faz için ayrı bir prompt ver. Tüm fazları tek seferde verme — incremental ilerle.

**Faz 1 Prompt'u**:
```
.claude/skills/frontend-web3.md dosyasını oku. Sonra şu 4 component'i oluştur:

1. components/CrossChainStatus.tsx — İşlem durumu step-by-step gösterimi
   (tx-pending → tx-confirming → icm-relaying → icm-delivered)
   Skill dosyasındaki CrossChainStatus type'ını ve polling pattern'ini kullan.

2. components/TimelockCountdown.tsx — 24 saat force settle geri sayımı
   useSettleIntent hook'unu kullan. canExecuteAt'e kadar countdown göster.

3. components/AutoReleaseCountdown.tsx — 72 saat anti-ghosting geri sayımı
   useWorkDeliveredAt hook'unu kullan. autoReleaseAt'e kadar countdown göster.

4. app/bounties/[id]/page.tsx — Yukarıdaki 3 componenti bounty detay sayfasına entegre et.
   - Developer: "İşi Teslim Et" butonu + AutoReleaseCountdown
   - Employer: "Manuel Ödeme" butonu + TimelockCountdown
   - Her write işleminde CrossChainStatus göster

Her component "use client" direktifi kullanmalı. Tailwind ile stil ver.
npm run lint && npm run build ile doğrula.
```

**Faz 2 Prompt'u**: (Faz 1 tamamlandıktan sonra ver)
```
Dashboard sayfalarını oluştur:

1. app/dashboard/layout.tsx — Sidebar + tab yapısı (Employer / Developer)
2. app/dashboard/employer/page.tsx — Employer'ın oluşturduğu bounty'ler
3. app/dashboard/developer/page.tsx — Developer'ın verdiği teklifler
4. components/Navbar.tsx — "Dashboard" linkini ekle (wallet bağlıysa göster)

Veri kaynağı: useAllBounties() ve useBountySubmissions() hook'larını kullan,
connected wallet adresine göre filtrele.
npm run lint && npm run build ile doğrula.
```
