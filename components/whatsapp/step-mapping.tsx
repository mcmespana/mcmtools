"use client"

import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import { buildBodyPreview } from "./preview"
import type { DataSourceResult, TemplateInfo, VariableMapping } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"

export function StepMapping({
  template,
  data,
  mapping,
  setMapping,
  phoneColumnKey,
  setPhoneColumnKey,
}: {
  template: TemplateInfo
  data: DataSourceResult
  mapping: Record<string, VariableMapping>
  setMapping: (m: Record<string, VariableMapping>) => void
  phoneColumnKey: string
  setPhoneColumnKey: (k: string) => void
}) {
  const setVar = (token: string, patch: Partial<VariableMapping>) =>
    setMapping({ ...mapping, [token]: { ...(mapping[token] ?? { source: "column" }), ...patch } })

  const firstRow = data.rows[0] ?? {}

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* Columna de teléfono */}
      <Bento style={{ padding: 18 }}>
        <div className="t-kicker" style={{ marginBottom: 8 }}>Columna del teléfono (WhatsApp)</div>
        <select className="input" value={phoneColumnKey} onChange={(e) => setPhoneColumnKey(e.target.value)} style={{ maxWidth: 360 }}>
          <option value="" disabled>Selecciona la columna…</option>
          {data.columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {phoneColumnKey && firstRow[phoneColumnKey] != null && (
          <div className="muted-3" style={{ fontSize: 12, marginTop: 6 }}>Ej.: {firstRow[phoneColumnKey] || "—"}</div>
        )}
      </Bento>

      {/* Variables de la plantilla */}
      {template.variables.length === 0 ? (
        <Bento style={{ padding: 18 }}>
          <div className="row" style={{ gap: 8, fontSize: 14 }}>
            <Icon name="check" size={15} style={{ color: ACCENT }} />
            Esta plantilla no tiene variables que rellenar.
          </div>
        </Bento>
      ) : (
        <Bento style={{ padding: 18 }}>
          <div className="t-kicker" style={{ marginBottom: 12 }}>Mapeo de variables</div>
          <div className="col" style={{ gap: 14 }}>
            {template.variables.map((v) => {
              const map = mapping[v.token] ?? { source: "column" as const }
              return (
                <div key={`${v.component}:${v.token}`} className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: `${ACCENT}30`, borderRadius: 6, padding: "2px 8px", fontWeight: 600, fontSize: 13, minWidth: 70, textAlign: "center" }}>
                    {`{{${v.token}}}`}
                  </span>
                  <span className="muted-3" style={{ fontSize: 11 }}>{v.component === "header" ? "encabezado" : "cuerpo"}</span>
                  <select
                    className="input"
                    style={{ width: 130 }}
                    value={map.source}
                    onChange={(e) => setVar(v.token, { source: e.target.value as "column" | "static" })}
                  >
                    <option value="column">Columna</option>
                    <option value="static">Texto fijo</option>
                  </select>
                  {map.source === "column" ? (
                    <select className="input" style={{ flex: "1 1 220px" }} value={map.columnKey ?? ""} onChange={(e) => setVar(v.token, { columnKey: e.target.value })}>
                      <option value="" disabled>Elige columna…</option>
                      {data.columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  ) : (
                    <input className="input" style={{ flex: "1 1 220px" }} placeholder={v.example || "Valor fijo"} value={map.value ?? ""} onChange={(e) => setVar(v.token, { value: e.target.value })} />
                  )}
                </div>
              )
            })}
          </div>
        </Bento>
      )}

      {/* Vista previa con la primera fila */}
      <Bento style={{ padding: 18, background: `${ACCENT}08` }}>
        <div className="t-kicker" style={{ marginBottom: 8 }}>Vista previa (primera fila)</div>
        {template.headerText && (
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
            {buildBodyPreview(template.headerText, template, mapping, firstRow)}
          </div>
        )}
        <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {buildBodyPreview(template.bodyText, template, mapping, firstRow)}
        </div>
      </Bento>
    </div>
  )
}
