import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollManager from "@/components/ScrollManager";
import { Providers } from "./providers";

// NOTE: lib/wagmi.ts uses getDefaultConfig() which is client-only (RainbowKit).
// We do NOT import config here. Instead we only read the raw cookie string from
// the incoming request and pass it as a plain prop to the Providers client
// component, which calls cookieToInitialState() itself with the config.

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

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookie = (await headers()).get("cookie");

    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Providers cookie={cookie}>
                    <ScrollManager />
                    <Navbar />
                    <div style={{ flex: 1 }}>{children}</div>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
