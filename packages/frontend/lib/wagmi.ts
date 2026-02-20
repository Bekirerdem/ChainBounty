import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalancheFuji, bountyAppChain } from "./chains";

// ============================================================
// Wagmi Configuration — Multi-Chain (RainbowKit v2)
// getDefaultConfig bundles MetaMask, WalletConnect, Coinbase
// Wallet connectors automatically.
// ============================================================
export const config = getDefaultConfig({
    appName: "ChainBounty",
    projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
    chains: [avalancheFuji, bountyAppChain],
    ssr: true, // Next.js App Router SSR support
});
