"use client";


import type { BountyStatus } from "@/lib/mock-data";

const statusConfig: Record<BountyStatus, { color: string; bg: string; borderColor: string; label: string }> = {
    Open: { 
        color: "text-emerald-400", 
        bg: "bg-emerald-400/10", 
        borderColor: "border-emerald-400/20",
        label: "Open" 
    },
    InProgress: { 
        color: "text-amber-400", 
        bg: "bg-amber-400/10", 
        borderColor: "border-amber-400/20",
        label: "In Progress" 
    },
    Completed: { 
        color: "text-blue-400", 
        bg: "bg-blue-400/10", 
        borderColor: "border-blue-400/20",
        label: "Completed" 
    },
    Cancelled: { 
        color: "text-red-400", 
        bg: "bg-red-400/10", 
        borderColor: "border-red-400/20",
        label: "Cancelled" 
    },
    Disputed: { 
        color: "text-orange-400", 
        bg: "bg-orange-400/10", 
        borderColor: "border-orange-400/20",
        label: "Disputed" 
    },
    Expired: { 
        color: "text-gray-400", 
        bg: "bg-gray-400/10", 
        borderColor: "border-gray-400/20",
        label: "Expired" 
    }
};

export default function StatusBadge({ status }: { status: BountyStatus }) {
    const config = statusConfig[status];

    return (
        <span 
            className={`
                px-3 py-1 text-xs font-semibold tracking-wide uppercase
                border ${config.borderColor} ${config.bg} ${config.color}
                font-outfit backdrop-blur-md
            `}
        >
            {config.label}
        </span>
    );
}
