"use client";

import { useState, useEffect, useCallback } from "react";

// ── State Machine (skill dosyasından) ──
export type CrossChainStatusType =
  | "idle"
  | "tx-pending"
  | "tx-confirming"
  | "icm-relaying"
  | "icm-delivered"
  | "failed"
  | "timeout";

interface Step {
  label: string;
  status: "done" | "active" | "pending";
}

interface CrossChainStatusProps {
  status: CrossChainStatusType;
  txHash?: string;
  error?: string;
  sourceChain?: string;
  targetChain?: string;
  onDismiss?: () => void;
}

const SNOWTRACE_TX = "https://testnet.snowtrace.io/tx/";

function getSteps(
  status: CrossChainStatusType,
  sourceChain: string,
  targetChain: string
): Step[] {
  const steps: Step[] = [
    { label: "İşlem cüzdana gönderildi", status: "pending" },
    { label: `${sourceChain}'de onaylandı`, status: "pending" },
    { label: `ICM mesajı ${targetChain}'e iletiliyor...`, status: "pending" },
    { label: `${targetChain}'de kaydedildi`, status: "pending" },
  ];

  const activeIndex: Record<CrossChainStatusType, number> = {
    idle: -1,
    "tx-pending": 0,
    "tx-confirming": 1,
    "icm-relaying": 2,
    "icm-delivered": 3,
    failed: -1,
    timeout: 2,
  };

  const idx = activeIndex[status];

  return steps.map((step, i) => {
    if (status === "failed") return { ...step, status: "pending" as const };
    if (status === "timeout" && i === 2) return { ...step, status: "active" as const, label: "ICM mesajı zaman aşımına uğradı" };
    if (i < idx) return { ...step, status: "done" as const };
    if (i === idx) return { ...step, status: status === "icm-delivered" ? "done" as const : "active" as const };
    return step;
  });
}

export default function CrossChainStatus({
  status,
  txHash,
  error,
  sourceChain = "C-Chain",
  targetChain = "App-Chain",
  onDismiss,
}: CrossChainStatusProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(status !== "idle");
  }, [status]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) return null;

  const steps = getSteps(status, sourceChain, targetChain);
  const isFinal = status === "icm-delivered" || status === "failed" || status === "timeout";

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: status === "failed" || status === "timeout"
          ? "rgba(248,113,113,0.04)"
          : "rgba(232,65,66,0.03)",
        border: `1px solid ${
          status === "failed" || status === "timeout"
            ? "rgba(248,113,113,0.2)"
            : status === "icm-delivered"
            ? "rgba(74,222,128,0.2)"
            : "rgba(232,65,66,0.15)"
        }`,
        marginBottom: "0.75rem",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "0.75rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: status === "icm-delivered" ? "var(--status-open)" : "var(--avax-red)",
          }}
        >
          {status === "icm-delivered"
            ? "✓ Cross-Chain İşlem Tamamlandı"
            : status === "failed"
            ? "✗ İşlem Başarısız"
            : status === "timeout"
            ? "⏱ ICM Zaman Aşımı"
            : "⛓ Cross-Chain İşlem"}
        </p>
        {isFinal && (
          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
              padding: "2px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Icon */}
            <div
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                flexShrink: 0,
              }}
            >
              {step.status === "done" ? (
                <span style={{ color: "var(--status-open)" }}>✓</span>
              ) : step.status === "active" ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: status === "timeout" ? "var(--status-progress)" : "var(--avax-red)",
                    animation: "pulse-dot 1.5s ease-in-out infinite",
                  }}
                />
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "1px solid var(--border-hover)",
                  }}
                />
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: "0.72rem",
                color:
                  step.status === "done"
                    ? "var(--status-open)"
                    : step.status === "active"
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                fontFamily: "var(--font-heading)",
                fontWeight: step.status === "active" ? 700 : 500,
                letterSpacing: "0.03em",
              }}
            >
              {step.label}
              {/* TxHash link on step 2 */}
              {i === 1 && txHash && step.status === "done" && (
                <a
                  href={`${SNOWTRACE_TX}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "6px",
                    fontSize: "0.65rem",
                    color: "var(--avax-red)",
                    textDecoration: "none",
                  }}
                >
                  (tx↗)
                </a>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p style={{ fontSize: "0.7rem", color: "var(--status-disputed)", marginTop: "0.5rem", lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </div>
  );
}
