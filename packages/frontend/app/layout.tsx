import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

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
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
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
