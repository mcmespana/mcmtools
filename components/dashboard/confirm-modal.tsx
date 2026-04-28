"use client"

import { Icon } from "@/components/icon"

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        padding: 20,
        animation: "page-in 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 24,
          padding: 32,
          maxWidth: 460,
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="grain" />
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(255,107,74,0.1)",
            color: "#FF6B4A",
            display: "grid",
            placeItems: "center",
            marginBottom: 16,
          }}
        >
          <Icon name="x" size={22} />
        </div>
        <div
          className="t-display"
          style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}
        >
          {title}
        </div>
        <p className="italic-serif" style={{ fontSize: 15, color: "var(--text-2)", margin: 0, marginBottom: 24 }}>
          {message}
        </p>
        <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{ background: "#FF6B4A", color: "#0A0A0A", borderColor: "#FF6B4A" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
