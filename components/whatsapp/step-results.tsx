"use client"

import { useEffect, useState } from "react"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import type { Broadcast } from "@/lib/whatsapp/kapso"
import type { SendResponse } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"

export function StepResults({ result, onReset }: { result: SendResponse; onReset: () => void }) {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const poll = async () => {
      try {
        const r = await fetch(`/api/whatsapp/broadcasts/${result.broadcastId}`, { cache: "no-store" })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || "Error al consultar estado")
        if (alive) setBroadcast(d.broadcast as Broadcast)
        const status = d.broadcast?.status
        if (status === "completed" || status === "failed" || status === "sent") return true
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
      return false
    }
    let timer: ReturnType<typeof setTimeout>
    const loop = async () => { const done = await poll(); if (!done && alive) timer = setTimeout(loop, 4000) }
    void loop()
    return () => { alive = false; clearTimeout(timer) }
  }, [result.broadcastId])

  return (
    <div className="col" style={{ gap: 16 }}>
      <Bento className="aura" style={{ padding: 28, textAlign: "center" }}>
        <div className="col" style={{ gap: 12, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: ACCENT, color: "#fff", display: "grid", placeItems: "center" }}>
            <Icon name="whatsapp" size={26} />
          </div>
          <div className="t-display" style={{ fontSize: 24 }}>Campaña enviada</div>
          <div className="italic-serif muted" style={{ fontSize: 14 }}>
            {result.totalRecipients} destinatario{result.totalRecipients !== 1 ? "s" : ""} en cola · KAPSO entrega de forma asíncrona
          </div>
        </div>
      </Bento>

      <Bento style={{ padding: 18 }}>
        <div className="t-kicker" style={{ marginBottom: 12 }}>Estado {broadcast ? `· ${broadcast.status}` : "· consultando…"}</div>
        <div className="row" style={{ gap: 22, flexWrap: "wrap" }}>
          <Metric label="Enviados" value={broadcast?.sent_count} />
          <Metric label="Entregados" value={broadcast?.delivered_count} />
          <Metric label="Leídos" value={broadcast?.read_count} />
          <Metric label="Pendientes" value={broadcast?.pending_count} />
          <Metric label="Fallidos" value={broadcast?.failed_count} warn />
        </div>
      </Bento>

      {result.invalid.length > 0 && (
        <Bento style={{ padding: 18 }}>
          <div className="t-kicker" style={{ marginBottom: 8 }}>Filas descartadas ({result.invalid.length})</div>
          <div className="muted-2" style={{ fontSize: 13, maxHeight: 160, overflowY: "auto" }}>
            {result.invalid.slice(0, 50).map((iv, i) => <div key={i}>Fila {iv.row}: {iv.reason}</div>)}
            {result.invalid.length > 50 && <div>… y {result.invalid.length - 50} más</div>}
          </div>
        </Bento>
      )}

      {error && <div className="row" style={{ gap: 8, color: "#E74C3C", fontSize: 13 }}><Icon name="x" size={14} /> {error}</div>}

      <button className="btn" onClick={onReset} style={{ justifyContent: "center", padding: "14px 20px" }}>
        <Icon name="refresh" size={14} /> Nueva campaña
      </button>
    </div>
  )
}

function Metric({ label, value, warn }: { label: string; value?: number; warn?: boolean }) {
  return (
    <div className="col" style={{ gap: 2 }}>
      <span className="t-kicker">{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: warn && value ? "#E74C3C" : "var(--text)" }}>{value ?? "—"}</span>
    </div>
  )
}
