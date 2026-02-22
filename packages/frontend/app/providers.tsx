"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { DemoProvider } from "@/contexts/DemoContext";

import "@rainbow-me/rainbowkit/styles.css";

// QueryClient is instantiated once outside the component to avoid
// re-creation on every render in the React tree.
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: "#E84142",
                        accentColorForeground: "white",
                        borderRadius: "medium",
                        fontStack: "system",
                    })}
                    initialChain={43113} // Default to Avalanche Fuji
                >
                    <DemoProvider>
                        {children}
                    </DemoProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
