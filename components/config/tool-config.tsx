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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragEnabledIndex, setDragEnabledIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
    router.push(`/${tool.id}`)
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
                  <option value="text">Texto / Consola</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </div>
        </Bento>
      )}

      {/* Variables tab */}
      {activeTab === "variables" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "stretch" }}>
          {/* User vars */}
          <Bento style={{ padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Variables del usuario</div>
                <div className="italic-serif muted" style={{ fontSize: 12 }}>Formulario público</div>
              </div>
              <button className="btn btn-accent" onClick={() => updateConfig({
                userVars: [...config.userVars, { key: "nueva_var", label: "Nueva variable", type: "text", icon: "type", default: "", required: false }]
              })} style={{ fontSize: 12 }}>
                <Icon name="plus" size={12} /> Añadir
              </button>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {config.userVars.map((v, i) => (
                <div key={i} className="row"
                  draggable={dragEnabledIndex === i}
                  onDragStart={(e) => {
                    setDraggedIndex(i)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedIndex !== i) setDragOverIndex(i)
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverIndex(null)
                    if (draggedIndex === null || draggedIndex === i) return
                    const nv = [...config.userVars]
                    const item = nv.splice(draggedIndex, 1)[0]
                    nv.splice(i, 0, item)
                    updateConfig({ userVars: nv })
                    setDraggedIndex(null)
                    setDragEnabledIndex(null)
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null)
                    setDragEnabledIndex(null)
                    setDragOverIndex(null)
                  }}
                  style={{
                  padding: 16,
                  background: "var(--surface-2)",
                  borderRadius: 14,
                  border: v.required ? "1.5px solid var(--accent)" : dragOverIndex === i ? "2px dashed var(--accent)" : "1px solid var(--border)",
                  gap: 12,
                  alignItems: "flex-start",
                  opacity: draggedIndex === i ? 0.5 : 1,
                  cursor: dragEnabledIndex === i ? "grabbing" : "default",
                  flexWrap: "wrap",
                  transition: "all 0.15s ease",
                  transform: dragOverIndex === i ? "scale(1.01)" : "scale(1)",
                }}>
                  <div 
                    onMouseDown={() => setDragEnabledIndex(i)}
                    onMouseUp={() => setDragEnabledIndex(null)}
                    onMouseLeave={() => setDragEnabledIndex(null)}
                    style={{ display: "flex", alignItems: "center", alignSelf: "center", color: "var(--text-3)", cursor: "grab", marginRight: -4, marginTop: 14 }}
                  >
                    <Icon name="grip" size={16} />
                  </div>
                  
                  <div className="col" style={{ gap: 4, flex: "1 1 120px" }}>
                    <div className="t-kicker" style={{ marginBottom: 4, fontSize: 10 }}>CLAVE (PYTHON)</div>
                    <input
                      className="input input-mono"
                      value={v.key}
                      onChange={(e) => {
                        const nv = [...config.userVars]
                        nv[i] = { ...v, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }
                        updateConfig({ userVars: nv })
                      }}
                      style={{ fontSize: 12 }}
                      placeholder="clave_python"
                    />
                  </div>
                  
                  <div className="col" style={{ gap: 4, flex: "1 1 120px" }}>
                    <div className="t-kicker" style={{ marginBottom: 4, fontSize: 10 }}>ETIQUETA (PÚBLICA)</div>
                    <input
                      className="input"
                      value={v.label}
                      onChange={(e) => {
                        const nv = [...config.userVars]
                        nv[i] = { ...v, label: e.target.value }
                        updateConfig({ userVars: nv })
                      }}
                      style={{ fontSize: 13, fontWeight: 500 }}
                      placeholder={v.key || "Etiqueta"}
                    />
                  </div>
                  
                  <div className="col" style={{ gap: 4, flex: "1 1 120px" }}>
                    <div className="t-kicker" style={{ marginBottom: 4, fontSize: 10 }}>
                      {v.type === "select" ? "OPCIONES (OBLIGATORIO)" : "VALOR POR DEFECTO"}
                    </div>
                    {v.type === "select" ? (
                      <input
                        className="input"
                        value={(v.options || []).join(", ")}
                        onChange={(e) => {
                          const nv = [...config.userVars]
                          nv[i] = { ...v, options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }
                          updateConfig({ userVars: nv })
                        }}
                        style={{ fontSize: 13 }}
                        placeholder="separar con ,"
                        required
                      />
                    ) : (
                      <input
                        className="input"
                        value={v.default}
                        onChange={(e) => {
                          const nv = [...config.userVars]
                          nv[i] = { ...v, default: e.target.value }
                          updateConfig({ userVars: nv })
                        }}
                        style={{ fontSize: 13 }}
                        placeholder="opcional"
                      />
                    )}
                  </div>
                  
                  <div className="col" style={{ gap: 4, flex: "0 1 120px" }}>
                    <div className="t-kicker" style={{ marginBottom: 4, fontSize: 10 }}>TIPO</div>
                    <select
                      className="input"
                      value={v.type}
                      onChange={(e) => {
                        const newType = e.target.value as UserVar["type"]
                        const nv = [...config.userVars]
                        if (newType === "select" && (!v.options || v.options.length === 0) && v.default) {
                          nv[i] = { ...v, type: newType, options: [v.default] }
                        } else {
                          nv[i] = { ...v, type: newType }
                        }
                        updateConfig({ userVars: nv })
                      }}
                      style={{ fontSize: 13 }}
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                      <option value="select">Opciones</option>
                    </select>
                  </div>
                  
                  <div className="col" style={{ gap: 4, alignSelf: "center", marginTop: 14, flexDirection: "column", alignItems: "center" }}>
                    {/* Toggle obligatorio */}
                    <button
                      title={v.required ? "Campo obligatorio \u2014 click para hacer opcional" : "Campo opcional \u2014 click para hacer obligatorio"}
                      onClick={() => {
                        const nv = [...config.userVars]
                        nv[i] = { ...v, required: !v.required }
                        updateConfig({ userVars: nv })
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `1.5px solid ${v.required ? "var(--accent)" : "var(--border)"}`,
                        background: v.required ? "var(--accent)" : "var(--surface)",
                        color: v.required ? "#fff" : "var(--text-3)",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        transition: "all 0.15s ease",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      *
                    </button>
                    <span style={{ fontSize: 9, color: v.required ? "var(--accent)" : "var(--text-3)", fontWeight: 600, letterSpacing: "0.03em", whiteSpace: "nowrap", marginTop: 3 }}>
                      {v.required ? "OBLIG." : "OPCN."}
                    </span>
                  </div>
                  <div className="col" style={{ gap: 4, alignSelf: "center", marginTop: 14 }}>
                    <button className="btn btn-ghost" onClick={() => updateConfig({
                      userVars: config.userVars.filter((_, j) => j !== i)
                    })} style={{ padding: 6, color: "var(--red-11)" }}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
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
        <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "row", gap: 24, alignItems: "start" }}>
          <Bento style={{ padding: 0, overflow: "hidden", flex: "1 1 500px" }}>
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
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "4px 8px", fontSize: 11, background: "var(--surface-2)" }}
                  onClick={(e) => {
                    const requiredVars = config.userVars.filter(v => v.required)
                    const optionalVars = config.userVars.filter(v => !v.required)
                    const txt = `Crea un script de Python para una herramienta llamada "${toolMeta.name}".
Objetivo de la herramienta: [RELLENAR QUÉ DEBE HACER]

El script se ejecuta mediante \`exec()\`. Los datos introducidos por el usuario te llegan en un diccionario de Python llamado \`variables\`.
IMPORTANTE: Todos los valores del diccionario \`variables\` llegan como cadenas de texto (String). Si necesitas operar con números, conviértelos tú (ej: \`int(variables.get("clave") or 0)\`).

${requiredVars.length > 0 ? `Campos OBLIGATORIOS (el usuario siempre los rellena antes de ejecutar):
${requiredVars.map(v => `- variables["${v.key}"]: ${
  v.type === "select"
    ? `Llegará como texto. Solo puede contener uno de estos valores exactos: [${v.options?.map(o => `"${o}"`).join(', ')}]`
    : v.type === "number"
    ? "Llegará como texto, pero representará un número (ej: '5')."
    : "Llegará como texto libre."
}`).join("\n")}` : ""}

${optionalVars.length > 0 ? `Campos OPCIONALES (pueden llegar vacíos como '', comprueba antes de usar):
${optionalVars.map(v => `- variables["${v.key}"]: ${
  v.type === "select"
    ? `Llegará como texto o vacío. Si tiene valor, solo puede ser uno de: [${v.options?.map(o => `"${o}"`).join(', ')}]`
    : v.type === "number"
    ? "Llegará como texto numérico o vacío."
    : "Llegará como texto libre o vacío."
}`).join("\n")}` : ""}

${(config.systemVars || []).length > 0 ? `Variables del SISTEMA (ocultas al usuario, inyectadas automáticamente por el administrador — NO las muestres en pantalla ni en logs):
${(config.systemVars || []).map(v => `- variables["${v.key}"]: Variable interna del sistema. Trátala como un valor secreto.`).join("\n")}` : ""}

Para mostrar el resultado, simplemente usa \`print()\`. Puedes dar color al texto imprimiendo estas etiquetas alrededor de tus frases: [COLOR:RED], [COLOR:GREEN], [COLOR:BLUE], [COLOR:ORANGE], [COLOR:GRAY] y cerrándolas con [/COLOR].
La salida estándar se mostrará al usuario en pantalla. No uses input().${config.requiresFile ? "\nTienes disponible \`input_bytes\` (archivo subido)." : ""} Si quieres devolver un archivo, asigna \`output_file\` (bytes) y \`output_filename\` (str).`
                    
                    navigator.clipboard.writeText(txt)
                    const btn = e.currentTarget
                    const orig = btn.innerHTML
                    btn.innerHTML = '<span style="color:var(--accent)">✅ Copiado</span>'
                    setTimeout(() => { if (btn.isConnected) btn.innerHTML = orig }, 2000)
                  }}
                  title="Copiar prompt para IA"
                >
                  <Icon name="copy" size={12} /> Prompt IA
                </button>
                <span className="chip" style={{ fontSize: 10 }}>
                  <Icon name="zap" size={10} />
                  Ejecuta en servidor
                </span>
              </div>
            </div>
            <CodeEditor
              value={config.code || ""}
              onChange={(code) => updateConfig({ code })}
              height={520}
            />
          </Bento>

          {/* Reference */}
          <div className="col" style={{ gap: 14, flex: "0 1 260px", minWidth: 260 }}>
            <Bento style={{ padding: 18 }}>
              <div className="t-kicker" style={{ marginBottom: 10 }}>Variables</div>
              <div className="col" style={{ gap: 4 }}>
                {config.userVars.map(v => v.key).map((k) => (
                  <div key={k} className="t-mono" style={{
                    fontSize: 11,
                    padding: "5px 8px",
                    background: "var(--surface-2)",
                    borderRadius: 6,
                  }}>
                    variables[<span style={{ color: "var(--accent)" }}>"{k}"</span>]
                  </div>
                ))}
                {(config.systemVars || []).length > 0 && (
                  <div style={{
                    padding: "5px 8px",
                    background: "var(--surface-2)",
                    borderRadius: 6,
                    fontSize: 10,
                    color: "var(--text-3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 4,
                  }}>
                    <Icon name="lock" size={10} />
                    +{(config.systemVars || []).length} vars de sistema (ocultas)
                  </div>
                )}
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
            
            {/* Color Guide */}
            <Bento style={{ padding: 18 }}>
              <div className="t-kicker" style={{ marginBottom: 10 }}>Formato de Salida</div>
              <p style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 12, marginTop: 0 }}>
                Añade color a tus <code>print()</code> usando estas etiquetas:
              </p>
              <div className="col" style={{ gap: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                <div style={{ color: "#FF5F56" }}>[COLOR:RED]texto[/COLOR]</div>
                <div style={{ color: "#27C93F" }}>[COLOR:GREEN]texto[/COLOR]</div>
                <div style={{ color: "#3498db" }}>[COLOR:BLUE]texto[/COLOR]</div>
                <div style={{ color: "#FFBD2E" }}>[COLOR:ORANGE]texto[/COLOR]</div>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>[COLOR:GRAY]texto[/COLOR]</div>
              </div>
            </Bento>
          </div>
        </div>
      )}
    </div>
  )
}
