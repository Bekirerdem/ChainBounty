"use client";

import type { BountyStatus } from "@/lib/mock-data";

const statusConfig: Record<BountyStatus, { color: string; bg: string; label: string }> = {
    Open: { color: "var(--status-open)", bg: "rgba(74, 222, 128, 0.1)", label: "Open" },
    InProgress: { color: "var(--status-progress)", bg: "rgba(251, 191, 36, 0.1)", label: "In Progress" },
    Completed: { color: "var(--status-completed)", bg: "rgba(34, 211, 238, 0.1)", label: "Completed" },
    Disputed: { color: "var(--status-disputed)", bg: "rgba(248, 113, 113, 0.1)", label: "Disputed" },
    Cancelled: { color: "#9495a5", bg: "rgba(148, 149, 165, 0.1)", label: "Cancelled" },
    Expired: { color: "#5a5b6a", bg: "rgba(90, 91, 106, 0.1)", label: "Expired" },
};

interface StatusBadgeProps {
    status: BountyStatus;
    size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: size === "sm" ? "4px 12px" : "6px 16px",
                borderRadius: "999px",
                fontSize: size === "sm" ? "0.75rem" : "0.85rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: config.color,
                background: config.bg,
            }}
        >
            <span
                style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: config.color,
                    boxShadow: `0 0 6px ${config.color}`,
                }}
            />
            {config.label}
        </span>
    );
}
