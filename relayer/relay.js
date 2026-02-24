#!/usr/bin/env node
/**
 * ChainBounty — Hackathon Demo Relayer
 *
 * AWM Relayer olmadan cross-chain ödemeyi köprüler:
 *   App-Chain'de `PaymentTriggered` event'ini dinler
 *   → C-Chain'de `forceSettleByEmployer()` çağırır.
 *
 * ÖNEMLI: Bu script employer'ın private key'i ile çalışır,
 *          çünkü forceSettleByEmployer() sadece employer tarafından çağrılabilir.
 *
 * Kullanım:
 *   cd relayer && npm install && node relay.js
 */

require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");

// ─── Yapılandırma ─────────────────────────────────────────────────────────────

const CONFIG = {
  appChain: {
    rpcUrl:
      process.env.APP_CHAIN_RPC_URL ||
      "http://127.0.0.1:9650/ext/bc/YOUR_BLOCKCHAIN_ID/rpc",
    executorAddress: process.env.BOUNTY_EXECUTOR_ADDRESS,
  },
  cChain: {
    rpcUrl:
      process.env.C_CHAIN_RPC_URL ||
      "https://api.avax-test.network/ext/bc/C/rpc",
    managerAddress: process.env.BOUNTY_MANAGER_ADDRESS,
  },
  privateKey: process.env.PRIVATE_KEY,
  // Geçmişten kaç blok geriye bakılsın (demo için yeterli)
  lookbackBlocks: Number(process.env.RELAYER_LOOKBACK_BLOCKS || 500),
};

// ─── Minimal ABI'lar ──────────────────────────────────────────────────────────

const EXECUTOR_ABI = [
  "event PaymentTriggered(uint256 indexed bountyId, address indexed developer)",
];

const MANAGER_ABI = [
  // Demo fallback — employer'ın çağırabileceği direkt ödeme fonksiyonu
  "function forceSettleByEmployer(uint256 _bountyId, address _developer) external",
  // Bounty durumunu kontrol etmek için
  "function bounties(uint256) external view returns (uint256 bountyId, address employer, uint256 budget, string ipfsDocHash, bool isActive, bool isCompleted)",
  "event BountyCompleted(uint256 indexed bountyId, address indexed developer)",
];

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function log(tag, msg) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] [${tag}] ${msg}`);
}

function validateConfig() {
  const missing = [];
  if (!CONFIG.appChain.rpcUrl || CONFIG.appChain.rpcUrl.includes("YOUR_BLOCKCHAIN_ID"))
    missing.push("APP_CHAIN_RPC_URL");
  if (!CONFIG.appChain.executorAddress) missing.push("BOUNTY_EXECUTOR_ADDRESS");
  if (!CONFIG.cChain.managerAddress) missing.push("BOUNTY_MANAGER_ADDRESS");
  if (!CONFIG.privateKey || CONFIG.privateKey === "0x_your_private_key_here")
    missing.push("PRIVATE_KEY");

  if (missing.length > 0) {
    console.error("\n❌ Eksik environment variable(lar):");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error("\n📝 Kök dizindeki .env dosyasını kontrol edin (.env.example'a bakın).\n");
    process.exit(1);
  }
}

// ─── Ana mantık ───────────────────────────────────────────────────────────────

async function handlePaymentEvent(bountyId, developer, txHash, bountyManager) {
  log("RELAY", `PaymentTriggered! bountyId=${bountyId} developer=${developer}`);
  if (txHash) log("RELAY", `  Kaynak tx: ${txHash}`);

  // Önce bounty'nin zaten tamamlanıp tamamlanmadığını kontrol et
  try {
    const b = await bountyManager.bounties(bountyId);
    if (b.isCompleted) {
      log("SKIP ", `bountyId=${bountyId} zaten tamamlanmış, atlanıyor.`);
      return;
    }
    if (!b.isActive) {
      log("SKIP ", `bountyId=${bountyId} aktif değil (iptal edilmiş olabilir).`);
      return;
    }
    log("INFO ", `Bounty bütçesi: ${ethers.formatEther(b.budget)} AVAX`);
  } catch (err) {
    log("WARN ", `Bounty durumu okunamadı: ${err.message}`);
  }

  // C-Chain'de ödemeyi tetikle
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      log("TX   ", `C-Chain'e forceSettleByEmployer gönderiliyor... (deneme ${attempt}/3)`);

      const tx = await bountyManager.forceSettleByEmployer(bountyId, developer, {
        gasLimit: 200_000,
      });
      log("TX   ", `Tx gönderildi: ${tx.hash}`);

      const receipt = await tx.wait();
      log("OK   ", `✅ Ödeme serbest bırakıldı! Blok: ${receipt.blockNumber}`);
      log("OK   ", `   Developer ${developer} AVAX aldı.`);
      return;
    } catch (err) {
      const reason = err?.reason || err?.message || String(err);
      log("ERR  ", `Deneme ${attempt} başarısız: ${reason}`);

      if (
        reason.includes("BountyNotActive") ||
        reason.includes("BountyNotFound")
      ) {
        log("SKIP ", "Kontrat hatası — bounty zaten tamamlanmış veya bulunamadı.");
        return;
      }

      if (attempt < 3) {
        log("WAIT ", `5 saniye bekleniyor...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  log("ERR  ", `❌ bountyId=${bountyId} için ödeme 3 denemeden sonra başarısız.`);
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   ChainBounty — Hackathon Demo Relayer   ║");
  console.log("╚══════════════════════════════════════════╝\n");

  validateConfig();

  // Provider'lar
  const appChainProvider = new ethers.JsonRpcProvider(CONFIG.appChain.rpcUrl);
  const cChainProvider = new ethers.JsonRpcProvider(CONFIG.cChain.rpcUrl);
  const cChainSigner = new ethers.Wallet(CONFIG.privateKey, cChainProvider);

  // Bağlantı kontrolleri
  try {
    const appBlock = await appChainProvider.getBlockNumber();
    log("INIT ", `App-Chain bağlandı. Güncel blok: ${appBlock}`);
  } catch (err) {
    console.error(`❌ App-Chain'e bağlanılamadı (${CONFIG.appChain.rpcUrl}): ${err.message}`);
    process.exit(1);
  }

  try {
    const cBlock = await cChainProvider.getBlockNumber();
    log("INIT ", `C-Chain (Fuji) bağlandı. Güncel blok: ${cBlock}`);
  } catch (err) {
    console.error(`❌ C-Chain'e bağlanılamadı (${CONFIG.cChain.rpcUrl}): ${err.message}`);
    process.exit(1);
  }

  const signerAddress = await cChainSigner.getAddress();
  log("INIT ", `Cüzdan (employer): ${signerAddress}`);

  // Kontratlar
  const bountyExecutor = new ethers.Contract(
    CONFIG.appChain.executorAddress,
    EXECUTOR_ABI,
    appChainProvider
  );
  const bountyManager = new ethers.Contract(
    CONFIG.cChain.managerAddress,
    MANAGER_ABI,
    cChainSigner
  );

  log("INIT ", `BountyExecutor (App-Chain): ${CONFIG.appChain.executorAddress}`);
  log("INIT ", `BountyManager  (C-Chain):   ${CONFIG.cChain.managerAddress}`);

  // ── Geçmiş event'leri tara ──────────────────────────────────────────────────
  try {
    const currentBlock = await appChainProvider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - CONFIG.lookbackBlocks);
    log("SCAN ", `Son ${CONFIG.lookbackBlocks} blok taranıyor (${fromBlock} → ${currentBlock})...`);

    const pastEvents = await bountyExecutor.queryFilter(
      bountyExecutor.filters.PaymentTriggered(),
      fromBlock,
      currentBlock
    );

    if (pastEvents.length === 0) {
      log("SCAN ", "Geçmişte işlenmemiş event bulunamadı.");
    } else {
      log("SCAN ", `${pastEvents.length} geçmiş event bulundu, işleniyor...`);
      for (const event of pastEvents) {
        await handlePaymentEvent(
          event.args.bountyId,
          event.args.developer,
          event.transactionHash,
          bountyManager
        );
      }
    }
  } catch (err) {
    log("WARN ", `Geçmiş event taraması başarısız (devam ediliyor): ${err.message}`);
  }

  // ── Canlı event dinleyicisi ─────────────────────────────────────────────────
  log("LISTEN", "Canlı PaymentTriggered event'leri dinleniyor... (Ctrl+C ile durdur)\n");

  bountyExecutor.on("PaymentTriggered", async (bountyId, developer, event) => {
    await handlePaymentEvent(
      bountyId,
      developer,
      event.log?.transactionHash,
      bountyManager
    );
  });

  // Hata yönetimi — provider bağlantısı kesilirse
  appChainProvider.on("error", (err) => {
    log("ERR  ", `App-Chain provider hatası: ${err.message}`);
  });
}

main().catch((err) => {
  console.error("\n💥 Kritik hata:", err.message);
  process.exit(1);
});
