"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import { SourceExcel } from "./source-excel"
import { SourceSinergia } from "./source-sinergia"
import { StepTemplate } from "./step-template"
import { StepMapping } from "./step-mapping"
import { StepReview } from "./step-review"
import { StepResults } from "./step-results"
import type { DataSourceResult, SendResponse, SourceKind, TemplateInfo, VariableMapping } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"
const STEPS = ["Fuente", "Plantilla", "Variables", "Revisar", "Resultado"] as const

function guessPhoneColumn(data: DataSourceResult, kind: SourceKind): string {
  if (kind === "sinergia") return "phone_mobile"
  const m = data.columns.find((c) => /tel|phone|m[oó]vil|whats|celular/i.test(c.label))
  return m?.key ?? ""
}

export function WhatsappWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [sourceKind, setSourceKind] = useState<SourceKind | null>(null)
  const [data, setData] = useState<DataSourceResult | null>(null)
  const [sourceName, setSourceName] = useState("")
  const [template, setTemplate] = useState<TemplateInfo | null>(null)
  const [mapping, setMapping] = useState<Record<string, VariableMapping>>({})
  const [phoneColumnKey, setPhoneColumnKey] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [result, setResult] = useState<SendResponse | null>(null)

  const onLoaded = (d: DataSourceResult, name: string) => {
    setData(d); setSourceName(name)
    if (sourceKind) setPhoneColumnKey(guessPhoneColumn(d, sourceKind))
  }

  const reset = () => {
    setStep(0); setSourceKind(null); setData(null); setSourceName("")
    setTemplate(null); setMapping({}); setPhoneColumnKey(""); setCampaignName(""); setResult(null)
  }

  const mappingComplete = template
    ? template.variables.every((v) => {
        const m = mapping[v.token]
        return m && (m.source === "static" ? (m.value ?? "").trim() !== "" : !!m.columnKey)
      })
    : false

  const canNext =
    step === 0 ? !!data :
    step === 1 ? !!template :
    step === 2 ? !!phoneColumnKey && mappingComplete :
    false

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <button className="btn btn-ghost" onClick={() => router.push("/")} style={{ padding: "6px 10px", fontSize: 12, marginBottom: 16 }}>
        <Icon name="arrowLeft" size={13} /> Volver
      </button>
      <div className="row" style={{ gap: 16, marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: ACCENT, color: "#fff", display: "grid", placeItems: "center" }}>
          <Icon name="whatsapp" size={24} />
        </div>
        <div>
          <h1 className="t-display" style={{ fontSize: "clamp(30px, 4vw, 42px)", margin: 0 }}>WhatsApp MCM</h1>
          <p className="italic-serif muted" style={{ fontSize: 15, margin: "4px 0 0" }}>Envíos masivos con plantillas de KAPSO</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="row" style={{ gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {STEPS.map((label, i) => (
          <div key={label} className="row" style={{ gap: 8, opacity: i <= step ? 1 : 0.45 }}>
            <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, background: i < step ? ACCENT : i === step ? "var(--text)" : "var(--surface-2)", color: i <= step ? "#fff" : "var(--text-3)" }}>
              {i < step ? "✓" : i + 1}
            </span>
            <span className="t-mono" style={{ fontSize: 11 }}>{label}</span>
            {i < STEPS.length - 1 && <span className="muted-3" style={{ margin: "0 2px" }}>—</span>}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <div className="col" style={{ gap: 18 }}>
          <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
            <SourceCard kind="excel" active={sourceKind === "excel"} onClick={() => { setSourceKind("excel"); setData(null) }} icon="table" title="Excel / CSV" desc="Sube un archivo con teléfonos" />
            <SourceCard kind="sinergia" active={sourceKind === "sinergia"} onClick={() => { setSourceKind("sinergia"); setData(null) }} icon="users" title="SinergiaCRM" desc="Contactos del CRM de MCM" />
          </div>
          {sourceKind === "excel" && <SourceExcel onLoaded={onLoaded} />}
          {sourceKind === "sinergia" && <SourceSinergia onLoaded={onLoaded} />}
        </div>
      )}

      {step === 1 && <StepTemplate selected={template} onSelect={(t) => { setTemplate(t); setMapping({}) }} />}

      {step === 2 && template && data && (
        <StepMapping template={template} data={data} mapping={mapping} setMapping={setMapping} phoneColumnKey={phoneColumnKey} setPhoneColumnKey={setPhoneColumnKey} />
      )}

      {step === 3 && template && data && (
        <StepReview template={template} data={data} mapping={mapping} phoneColumnKey={phoneColumnKey} campaignName={campaignName} setCampaignName={setCampaignName} onSent={(r) => { setResult(r); setStep(4) }} />
      )}

      {step === 4 && result && <StepResults result={result} onReset={reset} />}

      {/* Nav */}
      {step < 3 && (
        <div className="row" style={{ gap: 10, marginTop: 24, justifyContent: "space-between" }}>
          <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ opacity: step === 0 ? 0.4 : 1 }}>
            <Icon name="arrowLeft" size={13} /> Atrás
          </button>
          {data && sourceName && step === 0 && <span className="muted-3" style={{ fontSize: 12, alignSelf: "center" }}>{sourceName}</span>}
          <button className="btn btn-accent" onClick={() => setStep((s) => s + 1)} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.5, background: "#25D366", color: "#fff", borderColor: "#25D366" }}>
            Continuar <Icon name="arrowRight" size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function SourceCard({ active, onClick, icon, title, desc }: { kind: SourceKind; active: boolean; onClick: () => void; icon: string; title: string; desc: string }) {
  return (
    <Bento onClick={onClick} hoverLift style={{ flex: "1 1 240px", padding: 20, cursor: "pointer", border: active ? `2px solid ${ACCENT}` : "1px solid var(--border)", background: active ? `${ACCENT}0D` : undefined }}>
      <div className="row" style={{ gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: active ? ACCENT : "var(--surface-2)", color: active ? "#fff" : "var(--text-2)", display: "grid", placeItems: "center" }}>
          <Icon name={icon} size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          <div className="muted-2" style={{ fontSize: 12 }}>{desc}</div>
        </div>
      </div>
    </Bento>
  )
}
