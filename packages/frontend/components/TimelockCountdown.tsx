"use client";

import { useState, useEffect } from "react";
import { useSettleIntent, useExecuteForceSettle } from "@/hooks/useBounty";

interface TimelockCountdownProps {
  bountyId: number;
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "Hazır";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}s ${m.toString().padStart(2, "0")}d ${s.toString().padStart(2, "0")}s`;
}

export default function TimelockCountdown({ bountyId }: TimelockCountdownProps) {
  const { developer, requestedAt, canExecuteAt, isLoading, refetch } = useSettleIntent(bountyId);
  const { executeForceSettle, isPending: isExecuting } = useExecuteForceSettle();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // No intent recorded
  if (isLoading || requestedAt === 0) return null;

  const remaining = Math.max(0, canExecuteAt - now);
  const totalDuration = 86400; // 24h
  const elapsed = totalDuration - remaining;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);
  const canExecute = remaining <= 0;

  const handleExecute = async () => {
    try {
      await executeForceSettle(bountyId);
      refetch();
    } catch (err) {
      console.error("Execute force settle error:", err);
    }
  };

  const shortDev = developer
    ? `${developer.slice(0, 6)}...${developer.slice(-4)}`
    : "";

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: canExecute
          ? "rgba(74,222,128,0.04)"
          : "rgba(251,191,36,0.04)",
        border: `1px solid ${
          canExecute ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"
        }`,
        marginTop: "0.75rem",
      }}
    >
      {/* Header */}
      <p
        style={{
          fontSize: "0.62rem",
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: canExecute ? "var(--status-open)" : "var(--status-progress)",
          marginBottom: "0.6rem",
        }}
      >
        {canExecute ? "✓ Timelock Tamamlandı" : "⏳ Force Settle Timelock"}
      </p>

      {/* Countdown */}
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: canExecute ? "var(--status-open)" : "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {formatRemaining(remaining)}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.06)",
          marginBottom: "0.6rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: canExecute
              ? "var(--status-open)"
              : "var(--status-progress)",
            transition: "width 1s linear",
          }}
        />
      </div>

      {/* Developer info */}
      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
        Developer: <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{shortDev}</span>
      </p>

      {/* Execute button */}
      {canExecute && (
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="btn-avax"
          style={{
            width: "100%",
            justifyContent: "center",
            background: "rgba(74,222,128,0.12)",
            borderColor: "rgba(74,222,128,0.3)",
            color: "var(--status-open)",
            fontSize: "0.75rem",
            padding: "10px",
          }}
        >
          {isExecuting ? "İşleniyor..." : "Ödemeyi Onayla →"}
        </button>
      )}
    </div>
  );
}
