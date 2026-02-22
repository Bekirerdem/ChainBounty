# ChainBounty: Otonom Çapraz Zincir (Cross-Chain) Serbest Çalışma Protokolü

## 1. Vizyon ve Çözülen Sorun

ChainBounty, geleneksel Web2 serbest çalışma (freelance) platformlarının hantal, yüksek komisyonlu ve merkezi güvene dayalı yapısını yıkan bir Web3 protokolüdür. İşveren ile geliştirici arasındaki güveni merkezi bir veritabanı veya müşteri hizmetleri yerine, tamamen kriptografik kanıtlara ve Avalanche'ın çapraz zincir iletişimine emanet eder.

**Temel Farklılıklar:**

- **Aracı Yok:** Komisyon oranları ve fonların tutulması merkezi bir şirketin inisiyatifinde değildir.
- **Sürtünmesiz İşlem:** Kullanıcılar operasyonel işlemler için gas ücreti ödemez (App-Chain sübvansiyonu).
- **Anında Mutabakat:** İş onaylandığı milisaniye ödeme gerçekleşir.

## 2. Sistem Mimarisi ve Teknoloji Yığını

Proje, Avalanche ekosisteminin sunduğu özel ağ ve mesajlaşma yeteneklerini maksimize edecek şekilde iki parçalı bir akıllı kontrat mimarisi üzerine kuruludur.

- **Geliştirme & Düzenleme Ortamı:** Antigravity & Claude.code
- **Değer Katmanı (Avalanche C-Chain):** Fonların (AVAX) kilitlendiği, yüksek güvenlikli Escrow (Kasa) kontratının bulunduğu ana ağ.
- **Operasyon Katmanı (Avalanche App-Chain / Subnet):** Geliştiricilerin teklif verdiği, iş teslim ettiği ve onayların gerçekleştiği, gas maliyeti optimize edilmiş özel ağ.
- **İletişim Katmanı (ICM Teleporter):** C-Chain ve App-Chain arasında köprü (bridge) platformlarına ihtiyaç duymadan, yerel ve güvenli iletişim sağlayan Avalanche Warp Messaging altyapısı.
- **Kullanıcı Arayüzü (Frontend):** React / viem / Ethers.js tabanlı, kullanıcıların cüzdan bağlayarak etkileşime girdiği istemci.

## 3. Protokol İş Akışı (Kriptografik El Sıkışma)

Sistem, insan iletişimini akıllı kontrat parametrelerine dönüştürerek çalışır.

1. **İlanın Oluşturulması (C-Chain):** İşveren, Vercel arayüzü üzerinden işin bütçesini (AVAX) ve IPFS'e yüklenmiş görev tanımı hash'ini belirleyerek C-Chain'deki kasaya (Escrow) fonları kilitler.
2. **On-Chain Teklif (App-Chain):** Geliştiriciler, App-Chain üzerinden işe başvurur. Teklifler; talep edilen ücret, teslimat süresi ve şifrelenmiş iletişim adresini (örneğin Telegram kulpları) içerir.
3. **Sözleşmenin Mühürlenmesi:** İşveren, gelen tekliflerden birini arayüz üzerinden onaylar. Bu işlem, şartları akıllı kontrata silinemez şekilde yazar.
4. **Otonom Ödeme Tetikleyicisi:** Geliştirici işi teslim eder ve işveren (veya gelecekteki merkeziyetsiz jüri) onaylar. App-Chain'deki kontrat, ICM Teleporter üzerinden C-Chain'e kriptografik bir mesaj gönderir ve fonlar saniyeler içinde geliştiricinin cüzdanına aktarılır.

## 5. İleriye Dönük Vizyon (Hackathon Sonrası Yol Haritası)

İlk prototip sonrasında sisteme entegre edilecek merkeziyetsiz güvenlik mekanizmaları:

- **Anti-Ghosting Zaman Kilidi:** İş teslim edildikten sonra işveren 72 saat boyunca yanıt vermezse, ödemenin otomatik olarak geliştiriciye aktarılmasını sağlayan otonom kilit sistemi.
- **Merkeziyetsiz Jüri Ağı:** Anlaşmazlık durumlarında (Dispute), platformda daha önce başarılı iş yapmış "Uzman Rozetli" (SBT) cüzdan sahiplerinin küçük bir stake (pay) karşılığında hakemlik yaptığı DAO tabanlı çözüm sistemi.
- **On-Chain Özgeçmiş (Reputation SBT):** Tamamlanan her işin, geliştiricinin cüzdanına devredilemez bir "Başarı Token'ı" (Soulbound Token) olarak işlenmesi.
