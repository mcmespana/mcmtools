"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Tool, ToolConfigData, UserVar, SystemVar } from "@/lib/types"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import { CodeEditor } from "@/components/builder/code-editor"

export function ToolConfigView({ tool }: { tool: Tool }) {
  const router = useRouter()
  const [config, setConfig] = useState<ToolConfigData>(tool.config)
  const [toolMeta, setToolMeta] = useState({ name: tool.name, tagline: tool.tagline, description: tool.description, icon: tool.icon, iconBg: tool.iconBg })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"identity" | "variables" | "code">("code")

  const updateConfig = (patch: Partial<ToolConfigData>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    
    // Validar que no haya variables repetidas
    const allKeys = [
      ...config.userVars.map(v => v.key),
      ...(config.systemVars || []).map(v => v.key)
    ]
    const uniqueKeys = new Set(allKeys)
    if (uniqueKeys.size !== allKeys.length) {
      setError("Error: Tienes variables con la misma 'clave'. Las claves deben ser únicas para que no se sobrescriban.")
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: toolMeta.name,
          tagline: toolMeta.tagline,
          description: toolMeta.description,
          icon: toolMeta.icon,
          iconBg: toolMeta.iconBg,
          config,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar")
      setSavedAt(Date.now())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const runTest = async () => {
    await save()
    router.push(`/tools/${tool.id}`)
  }

  const tabs = [
    { key: "identity" as const, label: "Identidad", icon: "sparkle" },
    { key: "variables" as const, label: "Variables", icon: "type" },
    { key: "code" as const, label: "Código", icon: "code" },
  ]

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => router.push("/")}
            style={{ padding: "6px 10px", fontSize: 12, marginBottom: 16 }}
          >
            <Icon name="arrowLeft" size={13} />
            Dashboard
          </button>
          <div className="row" style={{ gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: toolMeta.iconBg,
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
            }}>
              <Icon name={toolMeta.icon} size={22} />
            </div>
            <div>
              <div className="t-kicker" style={{ marginBottom: 4 }}>Configuración</div>
              <h1 className="t-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", margin: 0 }}>
                {toolMeta.name}
              </h1>
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {savedAt && !saving && (
            <span className="chip chip-accent">
              <Icon name="check" size={11} /> guardado
            </span>
          )}
          <button className="btn" onClick={save} disabled={saving} style={{ fontSize: 13 }}>
            <Icon name="check" size={14} /> {saving ? "Guardando…" : "Guardar"}
          </button>
          <button className="btn btn-primary" onClick={runTest} disabled={saving} style={{ padding: "12px 20px" }}>
            <Icon name="zap" size={14} /> Probar
          </button>
        </div>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Identity tab */}
      {activeTab === "identity" && (
        <Bento style={{ padding: 28, maxWidth: 600 }}>
          <div className="col" style={{ gap: 20 }}>
            <div>
              <div className="t-kicker" style={{ marginBottom: 8 }}>Nombre</div>
              <input
                className="input"
                value={toolMeta.name}
                onChange={(e) => setToolMeta({ ...toolMeta, name: e.target.value })}
                style={{ fontSize: 18, fontWeight: 600, padding: "12px 16px" }}
              />
            </div>
            <div>
              <div className="t-kicker" style={{ marginBottom: 8 }}>Descripción corta</div>
              <input
                className="input"
                value={toolMeta.tagline}
                onChange={(e) => setToolMeta({ ...toolMeta, tagline: e.target.value })}
                style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 15 }}
              />
            </div>
            <div>
              <div className="t-kicker" style={{ marginBottom: 8 }}>Descripción detallada</div>
              <textarea
                className="input"
                value={toolMeta.description || ""}
                onChange={(e) => setToolMeta({ ...toolMeta, description: e.target.value })}
                style={{ minHeight: 80, resize: "vertical" }}
                placeholder="Explica qué hace la herramienta y cómo se usa..."
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div className="t-kicker" style={{ marginBottom: 8 }}>¿Requiere archivo?</div>
                <div className="row" style={{ gap: 8 }}>
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      className={`btn ${config.requiresFile === v ? "btn-accent" : ""}`}
                      onClick={() => updateConfig({ requiresFile: v })}
                      style={{ fontSize: 12, padding: "8px 14px", flex: 1, justifyContent: "center" }}
                    >
                      {v ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="t-kicker" style={{ marginBottom: 8 }}>Tipo de salida</div>
                <select
                  className="input"
                  value={config.outputType}
                  onChange={(e) => updateConfig({ outputType: e.target.value as ToolConfigData["outputType"] })}
                  style={{ fontSize: 13 }}
                >
                  <option value="file">Archivo</option>
                  <option value="zip">.zip</option>
                  <option value="text">Texto</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </div>
        </Bento>
      )}

      {/* Variables tab */}
      {activeTab === "variables" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          {/* User vars */}
          <Bento style={{ padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Variables del usuario</div>
                <div className="italic-serif muted" style={{ fontSize: 12 }}>Formulario público</div>
              </div>
              <button className="btn btn-accent" onClick={() => updateConfig({
                userVars: [...config.userVars, { key: "nueva_var", label: "Nueva variable", type: "text", icon: "type", default: "" }]
              })} style={{ fontSize: 12 }}>
                <Icon name="plus" size={12} /> Añadir
              </button>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {config.userVars.map((v, i) => (
                <div key={i} className="row" style={{
                  padding: 12,
                  background: "var(--surface-2)",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  gap: 8,
                }}>
                  <div className="col" style={{ gap: 4, flex: 1 }}>
                    <input
                      className="input"
                      value={v.label}
                      onChange={(e) => {
                        const nv = [...config.userVars]
                        nv[i] = { ...v, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }
                        updateConfig({ userVars: nv })
                      }}
                      style={{ fontSize: 13, fontWeight: 500 }}
                      placeholder="Nombre"
                    />
                    <input
                      className="input"
                      value={v.default}
                      onChange={(e) => {
                        const nv = [...config.userVars]
                        nv[i] = { ...v, default: e.target.value }
                        updateConfig({ userVars: nv })
                      }}
                      style={{ fontSize: 12 }}
                      placeholder="Valor por defecto"
                    />
                  </div>
                  <button className="btn btn-ghost" onClick={() => updateConfig({
                    userVars: config.userVars.filter((_, j) => j !== i)
                  })} style={{ padding: 6 }}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Bento>

          {/* System vars */}
          <Bento style={{ padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Variables del sistema</div>
                <div className="italic-serif muted" style={{ fontSize: 12 }}>Ocultas al usuario</div>
              </div>
              <button className="btn btn-accent" onClick={() => updateConfig({
                systemVars: [...(config.systemVars || []), { key: "nueva_key", label: "Nueva", value: "" }]
              })} style={{ fontSize: 12 }}>
                <Icon name="plus" size={12} /> Añadir
              </button>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {(config.systemVars || []).map((v, i) => (
                <div key={i} className="row" style={{
                  padding: 12,
                  background: "var(--surface-2)",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  gap: 8,
                }}>
                  <div className="col" style={{ gap: 4, flex: 1 }}>
                    <input
                      className="input input-mono"
                      value={v.key}
                      onChange={(e) => {
                        const nv = [...(config.systemVars || [])]
                        nv[i] = { ...v, key: e.target.value }
                        updateConfig({ systemVars: nv })
                      }}
                      style={{ fontSize: 12 }}
                      placeholder="clave"
                    />
                    <input
                      className="input input-mono"
                      value={v.value}
                      onChange={(e) => {
                        const nv = [...(config.systemVars || [])]
                        nv[i] = { ...v, value: e.target.value }
                        updateConfig({ systemVars: nv })
                      }}
                      style={{ fontSize: 12 }}
                      placeholder="valor"
                    />
                  </div>
                  <button className="btn btn-ghost" onClick={() => updateConfig({
                    systemVars: (config.systemVars || []).filter((_, j) => j !== i)
                  })} style={{ padding: 6 }}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Bento>
        </div>
      )}

      {/* Code tab */}
      {activeTab === "code" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 24, alignItems: "start" }}>
          <Bento style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div className="row" style={{ gap: 10 }}>
                <Icon name="code" size={15} className="muted" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Python</span>
              </div>
              <span className="chip" style={{ fontSize: 10 }}>
                <Icon name="zap" size={10} />
                Ejecuta en servidor
              </span>
            </div>
            <CodeEditor
              value={config.code || ""}
              onChange={(code) => updateConfig({ code })}
              height={520}
            />
          </Bento>

          {/* Reference */}
          <div className="col" style={{ gap: 14 }}>
            <Bento style={{ padding: 18 }}>
              <div className="t-kicker" style={{ marginBottom: 10 }}>Variables</div>
              <div className="col" style={{ gap: 4 }}>
                {[...config.userVars.map(v => v.key), ...(config.systemVars || []).map(v => v.key)].map((k) => (
                  <div key={k} className="t-mono" style={{
                    fontSize: 11,
                    padding: "5px 8px",
                    background: "var(--surface-2)",
                    borderRadius: 6,
                  }}>
                    variables[<span style={{ color: "var(--accent)" }}>"{k}"</span>]
                  </div>
                ))}
                {config.userVars.length === 0 && (config.systemVars || []).length === 0 && (
                  <div className="muted-2 italic-serif" style={{ fontSize: 11 }}>Sin variables definidas</div>
                )}
              </div>
            </Bento>
            <Bento style={{ padding: 18 }}>
              <div className="t-kicker" style={{ marginBottom: 10 }}>API</div>
              <div className="col" style={{ gap: 6 }}>
                {[
                  { k: "input_bytes", d: "Bytes del primer archivo" },
                  { k: "input_files", d: "Dict {nombre: bytes}" },
                  { k: "output_file", d: "Bytes para descargar" },
                  { k: "output_filename", d: "Nombre del archivo" },
                  { k: "variables", d: "Dict de variables" },
                ].map((r) => (
                  <div key={r.k}>
                    <div className="t-mono" style={{ fontSize: 11, color: "var(--accent)" }}>{r.k}</div>
                    <div className="muted-2" style={{ fontSize: 10 }}>{r.d}</div>
                  </div>
                ))}
              </div>
            </Bento>
          </div>
        </div>
      )}
    </div>
  )
}
