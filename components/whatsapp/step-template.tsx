"use client"

import { useEffect, useState } from "react"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import type { TemplateInfo } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"

export function StepTemplate({
  selected,
  onSelect,
}: {
  selected: TemplateInfo | null
  onSelect: (t: TemplateInfo) => void
}) {
  const [templates, setTemplates] = useState<TemplateInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/whatsapp/templates")
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || "Error al cargar plantillas")
        setTemplates(d.templates as TemplateInfo[])
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  if (error) return <div className="row" style={{ gap: 8, color: "#E74C3C", fontSize: 13 }}><Icon name="x" size={14} /> {error}</div>
  if (!templates) return <div className="muted-2" style={{ fontSize: 14 }}>Cargando plantillas aprobadas…</div>
  if (!templates.length) return <div className="muted-2" style={{ fontSize: 14 }}>No hay plantillas APPROVED en KAPSO.</div>

  return (
    <div className="col" style={{ gap: 12 }}>
      {templates.map((t) => {
        const active = selected?.id === t.id
        return (
          <Bento
            key={t.id}
            onClick={() => onSelect(t)}
            style={{ padding: 18, cursor: "pointer", border: active ? `2px solid ${ACCENT}` : "1px solid var(--border)", background: active ? `${ACCENT}0D` : undefined }}
          >
            <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
              <div className="row" style={{ gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</span>
                <span className="chip">{t.language}</span>
                <span className="chip">{t.category}</span>
                {t.variables.length > 0 && (
                  <span className="chip chip-accent">{t.variables.length} variable{t.variables.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {active && <Icon name="check" size={18} style={{ color: ACCENT }} />}
            </div>

            {active && (
              <div className="col" style={{ gap: 8, marginTop: 14 }}>
                {t.headerText && <PreviewLine label="Encabezado" text={t.headerText} />}
                <PreviewLine label="Mensaje" text={t.bodyText} />
                {t.buttons.length > 0 && (
                  <div>
                    <div className="t-kicker" style={{ marginBottom: 4 }}>Botones</div>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      {t.buttons.map((b) => (
                        <span key={b.index} className="chip" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {b.type === "URL" && <Icon name="globe" size={11} />}
                          {b.text || b.type}
                          {b.url && /\{\{[^}]+\}\}/.test(b.url) && (
                            <span style={{ background: `${ACCENT}30`, borderRadius: 4, padding: "0 4px", fontWeight: 600, fontSize: 11 }}>
                              URL dinámica
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Bento>
        )
      })}
    </div>
  )
}

// Resalta {{...}} dentro del texto de la plantilla.
function PreviewLine({ label, text }: { label: string; text: string }) {
  const parts = text.split(/(\{\{[^}]+\}\})/g)
  return (
    <div>
      <div className="t-kicker" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", background: "var(--surface-2)", padding: "10px 12px", borderRadius: 10 }}>
        {parts.map((p, i) =>
          /^\{\{[^}]+\}\}$/.test(p)
            ? <span key={i} style={{ background: `${ACCENT}30`, color: "var(--text)", borderRadius: 5, padding: "0 4px", fontWeight: 600 }}>{p}</span>
            : <span key={i}>{p}</span>,
        )}
      </div>
    </div>
  )
}
