"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface DemoContextType {
    isDemoMode: boolean;
    toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(true); // Default to true for MVP

    // Optional: Persist to localStorage
    useEffect(() => {
        const stored = localStorage.getItem("chainbounty_demo_mode");
        if (stored !== null) {
            setIsDemoMode(stored === "true");
        }
    }, []);

    const toggleDemoMode = () => {
        setIsDemoMode((prev) => {
            const next = !prev;
            localStorage.setItem("chainbounty_demo_mode", String(next));
            return next;
        });
    };

    return (
        <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
            {children}
        </DemoContext.Provider>
    );
}

export function useDemo() {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error("useDemo must be used within a DemoProvider");
    }
    return context;
}
