import { defineChain } from "viem";

// ============================================================
// Avalanche C-Chain — Fuji Testnet
// ============================================================
export const avalancheFuji = defineChain({
    id: 43113,
    name: "Avalanche Fuji",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    rpcUrls: {
        default: {
            http: [
                process.env.NEXT_PUBLIC_C_CHAIN_RPC_URL ||
                "https://api.avax-test.network/ext/bc/C/rpc",
            ],
        },
    },
    blockExplorers: {
        default: { name: "Snowtrace", url: "https://testnet.snowtrace.io" },
    },
    testnet: true,
});

// ============================================================
// ChainBounty App-Chain — Custom Avalanche L1
// ============================================================
export const bountyAppChain = defineChain({
    id: Number(process.env.NEXT_PUBLIC_APP_CHAIN_CHAIN_ID) || 99999,
    name: "ChainBounty App-Chain",
    nativeCurrency: { name: "BOUNTY", symbol: "BNTY", decimals: 18 },
    rpcUrls: {
        default: {
            http: [
                process.env.NEXT_PUBLIC_APP_CHAIN_RPC_URL ||
                "http://127.0.0.1:9650/ext/bc/bountychain/rpc",
            ],
        },
    },
    testnet: true,
});
