"use client";

import { useState, useEffect } from "react";
import { useWorkDeliveredAt, useAutoReleasePayment } from "@/hooks/useBounty";

interface AutoReleaseCountdownProps {
  bountyId: number;
}

function formatRemaining(seconds: number): { text: string; short: string } {
  if (seconds <= 0) return { text: "Süre doldu — ödeme alınabilir", short: "Hazır" };
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (d > 0) return { text: `${d} gün ${h} saat kaldı`, short: `${d}g ${h}s` };
  if (h > 0) return { text: `${h} saat ${m} dakika kaldı`, short: `${h}s ${m}d` };
  return { text: `${m} dakika ${s} saniye kaldı`, short: `${m}d ${s}s` };
}

export default function AutoReleaseCountdown({ bountyId }: AutoReleaseCountdownProps) {
  const { deliveredAt, isDelivered, autoReleaseAt, isLoading, refetch } = useWorkDeliveredAt(bountyId);
  const { autoRelease, isPending: isReleasing } = useAutoReleasePayment();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Tick every second
  useEffect(() => {
    if (!isDelivered) return;
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isDelivered]);

  if (isLoading || !isDelivered || deliveredAt === 0) return null;

  const remaining = Math.max(0, autoReleaseAt - now);
  const totalDuration = 259200; // 72h
  const elapsed = totalDuration - remaining;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);
  const canRelease = remaining <= 0;
  const { text } = formatRemaining(remaining);

  const handleRelease = async () => {
    try {
      await autoRelease(bountyId);
      refetch();
    } catch (err) {
      console.error("Auto release error:", err);
    }
  };

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: canRelease
          ? "rgba(74,222,128,0.05)"
          : "rgba(74,222,128,0.02)",
        border: `1px solid ${
          canRelease ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.12)"
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
          color: "var(--status-open)",
          marginBottom: "0.5rem",
        }}
      >
        {canRelease ? "✓ Otomatik Ödeme Hazır" : "🛡 Anti-Ghosting Koruması"}
      </p>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.06)",
          marginBottom: "0.5rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "var(--status-open)",
            transition: "width 1s linear",
          }}
        />
      </div>

      {/* Remaining text */}
      <p
        style={{
          fontSize: "0.72rem",
          color: canRelease ? "var(--status-open)" : "var(--text-secondary)",
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          marginBottom: canRelease ? "0.6rem" : 0,
        }}
      >
        {text}
      </p>

      {/* Info text */}
      {!canRelease && (
        <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.5 }}>
          Employer yanıt vermezse, süre dolduğunda otomatik ödeme alabilirsiniz.
        </p>
      )}

      {/* Release button */}
      {canRelease && (
        <button
          onClick={handleRelease}
          disabled={isReleasing}
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
          {isReleasing ? "İşleniyor..." : "Otomatik Ödeme Al →"}
        </button>
      )}
    </div>
  );
}
