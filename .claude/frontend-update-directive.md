# Frontend Hook Güncelleme Direktifi (Post-Security Fix)

Güvenlik fix'leri sonrası kontrat ABI'leri değişti. Frontend hook'ları güncellenmelidir.

---

## Adım 1: ABI Yeniden Extract

```bash
cd packages/contracts
forge build
```

Sonra `out/BountyManager.sol/BountyManager.json` ve `out/BountyExecutor.sol/BountyExecutor.json` dosyalarından ABI'leri `packages/frontend/lib/contracts.ts`'e taşı.

Değişen ABI'ler:
- **BountyManager**: `forceSettleByEmployer()` kaldırıldı → `requestForceSettle()`, `executeForceSettle()`, `settleIntents()` eklendi. `cancelBounty()` gas artışı (ICM mesajı eklendiği için).
- **BountyExecutor**: `claimEmployer()` kaldırıldı. `deliverWork()`, `autoReleasePayment()`, `workDeliveredAt()` eklendi. `FraudulentClaimOverridden`, `BountyCancelled`, `WorkDelivered`, `AutoReleaseTriggered` event'leri eklendi.

---

## Adım 2: Hook Güncellemeleri (hooks/useBounty.ts)

### SİL: useClaimEmployer (satır 362-388)
Fonksiyon tamamen kaldırıldı. Frontend'de bu hook'u kullanan component'ler varsa kaldır.

### DEĞİŞTİR: useForceSettle → useRequestForceSettle + useExecuteForceSettle

```typescript
/**
 * Adım 1: Employer force settle intent kaydeder. 24 saat timelock başlar.
 */
export function useRequestForceSettle() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const requestForceSettle = async (bountyId: number, developerAddress: string) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== avalancheFuji.id && switchChainAsync) {
      await switchChainAsync({ chainId: avalancheFuji.id });
    }

    return await writeContractAsync({
      address: BOUNTY_MANAGER_ADDRESS,
      abi: BOUNTY_MANAGER_ABI,
      functionName: "requestForceSettle",
      args: [BigInt(bountyId), developerAddress as `0x${string}`],
      chainId: avalancheFuji.id,
    });
  };

  return { requestForceSettle, isPending, isSuccess, error };
}

/**
 * Adım 2: 24 saat sonra employer execute eder.
 */
export function useExecuteForceSettle() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const executeForceSettle = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== avalancheFuji.id && switchChainAsync) {
      await switchChainAsync({ chainId: avalancheFuji.id });
    }

    return await writeContractAsync({
      address: BOUNTY_MANAGER_ADDRESS,
      abi: BOUNTY_MANAGER_ABI,
      functionName: "executeForceSettle",
      args: [BigInt(bountyId)],
      chainId: avalancheFuji.id,
    });
  };

  return { executeForceSettle, isPending, isSuccess, error };
}

/**
 * Read: Settle intent durumunu kontrol et (timelock countdown için)
 */
export function useSettleIntent(bountyId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: BOUNTY_MANAGER_ADDRESS,
    abi: BOUNTY_MANAGER_ABI,
    functionName: "settleIntents",
    args: [BigInt(bountyId)],
    chainId: avalancheFuji.id,
    query: { enabled: bountyId > 0 },
  });

  const intent = data as unknown as [string, bigint] | undefined;

  return {
    developer: intent?.[0] ?? "0x0000000000000000000000000000000000000000",
    requestedAt: intent ? Number(intent[1]) : 0,
    canExecuteAt: intent ? Number(intent[1]) + 86400 : 0, // +24h
    isLoading,
    refetch,
  };
}
```

### EKLE: useDeliverWork

```typescript
/**
 * Developer, kabul edilmiş bounty için işi teslim eder.
 * 72 saat sonra auto-release tetiklenebilir.
 */
export function useDeliverWork() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const deliverWork = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== bountyAppChain.id && switchChainAsync) {
      await switchChainAsync({ chainId: bountyAppChain.id });
    }

    return await writeContractAsync({
      address: BOUNTY_EXECUTOR_ADDRESS,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: "deliverWork",
      args: [BigInt(bountyId)],
      chainId: bountyAppChain.id,
    });
  };

  return { deliverWork, isPending, isSuccess, error };
}
```

### EKLE: useAutoReleasePayment

```typescript
/**
 * 72 saat sonra developer veya herhangi biri ödemeyi tetikler.
 */
export function useAutoReleasePayment() {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract();

  const autoRelease = async (bountyId: number) => {
    if (!address) throw new Error("Wallet not connected");

    if (chain?.id !== bountyAppChain.id && switchChainAsync) {
      await switchChainAsync({ chainId: bountyAppChain.id });
    }

    return await writeContractAsync({
      address: BOUNTY_EXECUTOR_ADDRESS,
      abi: BOUNTY_EXECUTOR_ABI,
      functionName: "autoReleasePayment",
      args: [BigInt(bountyId)],
      chainId: bountyAppChain.id,
    });
  };

  return { autoRelease, isPending, isSuccess, error };
}
```

### EKLE: useWorkDeliveredAt (Read)

```typescript
/**
 * Developer'ın iş teslim zamanını okur (auto-release countdown için)
 */
export function useWorkDeliveredAt(bountyId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: BOUNTY_EXECUTOR_ADDRESS,
    abi: BOUNTY_EXECUTOR_ABI,
    functionName: "workDeliveredAt",
    args: [BigInt(bountyId)],
    chainId: bountyAppChain.id,
    query: { enabled: bountyId > 0 },
  });

  const deliveredAt = data ? Number(data) : 0;

  return {
    deliveredAt,
    isDelivered: deliveredAt > 0,
    autoReleaseAt: deliveredAt > 0 ? deliveredAt + 259200 : 0, // +72h (259200 saniye)
    isLoading,
    refetch,
  };
}
```

---

## Adım 3: Component Güncellemeleri

Hook'ları kullanan component'lerde şu değişiklikler yapılmalı:

1. **useClaimEmployer** referanslarını kaldır — ICM mesajını bekle, retry yok
2. **useForceSettle** → `useRequestForceSettle` + `useExecuteForceSettle` + `useSettleIntent` ile countdown UI ekle
3. Bounty detay sayfasına **"İşi Teslim Et"** butonu ekle (useDeliverWork) — sadece kabul edilmiş developer görür
4. Bounty detay sayfasına **"Otomatik Ödeme"** butonu ekle (useAutoReleasePayment) — workDeliveredAt + 72h sonra aktif

---

## Adım 4: Doğrulama

```bash
cd packages/frontend
npm run lint
npm run build
```

Hata yoksa frontend güncelleme tamamdır.
