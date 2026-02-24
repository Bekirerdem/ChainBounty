"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cookieStorage, createStorage } from "wagmi";
import { avalancheFuji, bountyAppChain } from "./chains";

// ============================================================
// Wagmi Configuration — Multi-Chain (RainbowKit v2)
// getDefaultConfig bundles MetaMask, WalletConnect, Coinbase
// Wallet connectors automatically.
//
// cookieStorage: wallet connection state is persisted in an
// HTTP cookie so that the server can read it on every request
// and pass it as `initialState` to WagmiProvider — this
// prevents the "Connect Wallet" flash on client-side navigation.
// ============================================================
export const config = getDefaultConfig({
    appName: "ChainBounty",
    projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
    chains: [avalancheFuji, bountyAppChain],
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
});
