"use client"

import { useMemo, useState } from "react"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import { normalizePhone } from "@/lib/whatsapp/phone"
import type { DataSourceResult, SendRequest, SendResponse, TemplateInfo, VariableMapping } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"

export function StepReview({
  template,
  data,
  mapping,
  phoneColumnKey,
  campaignName,
  setCampaignName,
  onSent,
}: {
  template: TemplateInfo
  data: DataSourceResult
  mapping: Record<string, VariableMapping>
  phoneColumnKey: string
  campaignName: string
  setCampaignName: (s: string) => void
  onSent: (r: SendResponse) => void
}) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testPhone, setTestPhone] = useState("")
  const [testOk, setTestOk] = useState<string | null>(null)

  const { valid, invalid } = useMemo(() => {
    let valid = 0; let invalid = 0
    const seen = new Set<string>()
    for (const r of data.rows) {
      const n = normalizePhone(r[phoneColumnKey] ?? "")
      if (!n.ok || seen.has(n.e164)) { invalid++; continue }
      seen.add(n.e164); valid++
    }
    return { valid, invalid }
  }, [data.rows, phoneColumnKey])

  const body = (extra: Partial<SendRequest>): SendRequest => ({
    campaignName: campaignName.trim(),
    templateId: template.id,
    templateName: template.name,
    templateLanguage: template.language,
    mapping,
    phoneColumnKey,
    rows: data.rows,
    ...extra,
  })

  const post = async (payload: SendRequest) => {
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || "Error al enviar")
    return d as SendResponse
  }

  const sendTest = async () => {
    setError(null); setTestOk(null)
    if (!campaignName.trim()) { setError("Pon un nombre de campaña primero."); return }
    const n = normalizePhone(testPhone)
    if (!n.ok) { setError(`Teléfono de prueba inválido: ${n.reason}`); return }
    setSending(true)
    try {
      await post(body({ testPhone, campaignName: `${campaignName.trim()} (prueba)` }))
      setTestOk(`Prueba enviada a ${n.e164}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  const sendAll = async () => {
    setError(null)
    if (!campaignName.trim()) { setError("Pon un nombre de campaña."); return }
    if (valid === 0) { setError("No hay teléfonos válidos."); return }
    setSending(true)
    try {
      onSent(await post(body({})))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSending(false)
    }
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <Bento style={{ padding: 18 }}>
        <div className="t-kicker" style={{ marginBottom: 8 }}>Nombre de la campaña</div>
        <input className="input" placeholder="Ej.: Recordatorio campamento 2026" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
      </Bento>

      <Bento style={{ padding: 18 }}>
        <div className="row" style={{ gap: 24, flexWrap: "wrap" }}>
          <Stat label="Plantilla" value={template.name} />
          <Stat label="Destinatarios válidos" value={String(valid)} accent />
          {invalid > 0 && <Stat label="Descartados (inválidos/duplicados)" value={String(invalid)} warn />}
        </div>
      </Bento>

      <Bento style={{ padding: 18 }}>
        <div className="t-kicker" style={{ marginBottom: 8 }}>Envío de prueba</div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <input className="input" style={{ flex: "1 1 220px" }} placeholder="+34 600 000 000" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
          <button className="btn" onClick={sendTest} disabled={sending}><Icon name="send" size={14} /> Enviar prueba a mí</button>
        </div>
        {testOk && <div className="row" style={{ gap: 6, color: ACCENT, fontSize: 13, marginTop: 8 }}><Icon name="check" size={14} /> {testOk}</div>}
      </Bento>

      {error && <div className="row" style={{ gap: 8, color: "#E74C3C", fontSize: 13 }}><Icon name="x" size={14} /> {error}</div>}

      <button className="btn btn-accent" onClick={sendAll} disabled={sending || valid === 0} style={{ justifyContent: "center", padding: "16px 24px", fontSize: 16, fontWeight: 600, borderRadius: 16, opacity: sending || valid === 0 ? 0.6 : 1, background: ACCENT, color: "#fff", borderColor: ACCENT }}>
        <Icon name="whatsapp" size={18} /> {sending ? "Enviando…" : `Enviar a ${valid} destinatario${valid !== 1 ? "s" : ""}`}
      </button>
    </div>
  )
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="col" style={{ gap: 2 }}>
      <span className="t-kicker">{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: accent ? ACCENT : warn ? "#E08600" : "var(--text)" }}>{value}</span>
    </div>
  )
}
