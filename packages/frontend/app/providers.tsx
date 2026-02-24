"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";
import { WagmiProvider, cookieToInitialState, type State } from "wagmi";
import { RainbowKitProvider, darkTheme, type Theme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { DemoProvider } from "@/contexts/DemoContext";

import "@rainbow-me/rainbowkit/styles.css";

// QueryClient is instantiated once outside the component to avoid
// re-creation on every render in the React tree.
const queryClient = new QueryClient();

// Build the base theme with borderRadius set to 'none' for sharp, angular aesthetics.
const _base = darkTheme({
    accentColor: "#E84142",          // --avax-red
    accentColorForeground: "white",
    borderRadius: "none",            // Sharp corners everywhere
    fontStack: "system",
    overlayBlur: "small",
});

// Deep-merge site palette on top of the base RainbowKit dark theme.
const chainBountyTheme: Theme = {
    ..._base,
    colors: {
        ..._base.colors,
        // Modal surfaces — match --bg-primary / --bg-elevated
        modalBackground: "#0d0d0d",
        modalBorder: "rgba(255, 255, 255, 0.06)",
        // Profile / dropdown panel
        profileForeground: "#111111",
        menuItemBackground: "#181818",
        // ConnectButton in Navbar (controlled separately via Navbar hydration guard)
        connectButtonBackground: "#111111",
        connectButtonInnerBackground: "#181818",
        connectButtonText: "#f5f5f5",
        // Action buttons inside the modal
        actionButtonSecondaryBackground: "#181818",
        // Selected wallet highlight
        selectedOptionBorder: "rgba(232, 65, 66, 0.4)",
        // General borders
        generalBorder: "rgba(255, 255, 255, 0.06)",
        generalBorderDim: "rgba(255, 255, 255, 0.03)",
    },
    radii: {
        ..._base.radii,
        actionButton: "2px",
        connectButton: "2px",
        menuButton: "2px",
        modal: "4px",
        modalMobile: "4px",
    },
};

export function Providers({
    children,
    cookie,
}: {
    children: React.ReactNode;
    cookie?: string | null;
}) {
    // Freeze initialState to the value at first mount via useRef.
    // Without this, cookieToInitialState() would re-run whenever the cookie
    // prop changes (Next.js re-renders the layout server component on every
    // navigation), causing wagmi to receive a new initialState and potentially
    // triggering a reconnect cycle that flashes "Connect Wallet".
    const initialState = useRef<State | undefined>(
        cookieToInitialState(config, cookie ?? undefined)
    );
    return (
        <WagmiProvider config={config} initialState={initialState.current}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={chainBountyTheme}
                    initialChain={43113} // Default to Avalanche Fuji
                    locale="en-US"
                >
                    <DemoProvider>
                        {children}
                    </DemoProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
