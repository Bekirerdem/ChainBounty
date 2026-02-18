import { http, createConfig } from "wagmi";
import { avalancheFuji, bountyAppChain } from "./chains";

// ============================================================
// Wagmi Configuration — Multi-Chain
// ============================================================
export const config = createConfig({
    chains: [avalancheFuji, bountyAppChain],
    transports: {
        [avalancheFuji.id]: http(),
        [bountyAppChain.id]: http(),
    },
    ssr: true, // Next.js SSR support
});
