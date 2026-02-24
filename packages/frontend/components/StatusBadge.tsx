"use client";

import type { BountyStatus } from "@/lib/mock-data";

const badgeClasses: Record<BountyStatus, string> = {
    Open:       "badge badge-open",
    InProgress: "badge badge-progress",
    Completed:  "badge badge-completed",
    Disputed:   "badge badge-disputed",
    Cancelled:  "badge badge-cancelled",
    Expired:    "badge badge-expired",
};

const labels: Record<BountyStatus, string> = {
    Open:       "Open",
    InProgress: "In Progress",
    Completed:  "Completed",
    Disputed:   "Disputed",
    Cancelled:  "Cancelled",
    Expired:    "Expired",
};

export default function StatusBadge({ status }: { status: BountyStatus }) {
    return (
        <span className={badgeClasses[status]}>
            {labels[status]}
        </span>
    );
}
