import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "ChainBounty — Cross-Chain Bounty Platform",
    description:
        "Create bounties on Avalanche C-Chain, execute on App-Chain, settle payments via ICM. Trustless, gas-efficient Web3 freelancing.",
    keywords: [
        "Avalanche",
        "cross-chain",
        "bounty",
        "freelance",
        "Teleporter",
        "ICM",
        "Web3",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Navbar />
                <div style={{ flex: 1 }}>{children}</div>
                <Footer />
            </body>
        </html>
    );
}

// TODO: Hafta 3 — Web3 Provider wrapper eklenecek:
// - WagmiProvider
// - RainbowKitProvider
// - QueryClientProvider
