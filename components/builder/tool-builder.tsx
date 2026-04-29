"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bento, Kicker } from "@/components/bento"
import { Icon } from "@/components/icon"
import { CodeEditor } from "./code-editor"
import type { UserVar, SystemVar } from "@/lib/types"

const DEFAULT_CODE = `# Escribe tu lógica en Python aquí.
#
# Variables disponibles (inyectadas automáticamente):
#   variables        → dict con todas las variables (usuario + sistema)
#   input_bytes      → bytes del archivo subido (o None si no hay archivo)
#
# Para devolver un archivo al usuario:
#   output_file      = bytes_del_resultado
#   output_filename  = "nombre_del_archivo.ext"
#
# Ejemplo: devolver el mismo archivo renombrado
# output_file = input_bytes
# output_filename = f"procesado_{variables.get('mes', 'enero')}.pdf"

print("¡Hola desde MCM Tools!")
`

type Draft = {
  name: string
  tagline: string
  icon: string
  color: string
  requiresFile: boolean
  outputType: "file" | "zip" | "text" | "json"
  userVars: UserVar[]
  systemVars: SystemVar[]
  code: string
}

const ICON_OPTIONS = [
  "fileText", "scissors", "image", "table", "receipt", "archive",
  "globe", "flask", "brain", "zap", "eye", "lock", "type", "layers",
]

const COLOR_OPTIONS = [
  "#6C5CE7", "#00B894", "#E17055", "#FDCB6E",
  "#74B9FF", "#FD79A8", "#A29BFE", "#2D3436",
]

export function ToolBuilder() {
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({
    name: "",
    tagline: "",
    icon: "fileText",
    color: "#6C5CE7",
    requiresFile: true,
    outputType: "file",
    userVars: [],
    systemVars: [],
    code: DEFAULT_CODE,
  })

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      setError("Pon un nombre a la herramienta")
      setTab(0)
      return
    }
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          tagline: draft.tagline || "sin descripción",
          description: draft.tagline,
          icon: draft.icon,
          iconBg: draft.color,
          iconColor: "#FFFFFF",
          inputType: draft.requiresFile ? "Archivo" : "Solo variables",
          inputIcon: draft.requiresFile ? "upload" : "type",
          outputType: draft.outputType,
          outputIcon: "download",
          config: {
            userVars: draft.userVars,
            systemVars: draft.systemVars,
            code: draft.code,
            requiresFile: draft.requiresFile,
            outputType: draft.outputType,
          },
          status: "active",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.tool) throw new Error(data.error || "No se pudo crear")
      router.push("/")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear la tool")
      setCreating(false)
    }
  }

  const tabs = [
    { label: "Identidad", icon: "sparkle" },
    { label: "Variables", icon: "type" },
    { label: "Código Python", icon: "code" },
  ]

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/")}
          style={{ padding: "6px 10px", fontSize: 12, marginBottom: 16 }}
        >
          <Icon name="arrowLeft" size={13} />
          Cancelar
        </button>
        <h1 className="t-display" style={{ fontSize: "clamp(36px, 5vw, 52px)", margin: 0 }}>
          Construir <span className="t-editorial">herramienta</span>
        </h1>
        <p className="muted" style={{ fontSize: 15, marginTop: 10, maxWidth: 500 }}>
          Define la identidad, los campos del formulario y el código Python que procesará los datos.
        </p>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: 28 }}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            className={`tab-item ${tab === i ? "active" : ""}`}
            onClick={() => setTab(i)}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <TabIdentity draft={draft} update={update} />}
      {tab === 1 && <TabVariables draft={draft} update={update} />}
      {tab === 2 && <TabCode draft={draft} update={update} />}

      {/* Error */}
      {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

      {/* Bottom bar */}
      <div className="row" style={{ justifyContent: "space-between", marginTop: 28 }}>
        <button className="btn" onClick={() => tab > 0 ? setTab(tab - 1) : router.push("/")} disabled={creating}>
          <Icon name="arrowLeft" size={13} />
          {tab === 0 ? "Cancelar" : "Atrás"}
        </button>
        <div className="row" style={{ gap: 10 }}>
          <span className="italic-serif muted-2" style={{ fontSize: 13 }}>
            {tab + 1} de 3
          </span>
          <button
            className="btn btn-primary"
            onClick={() => tab < 2 ? setTab(tab + 1) : handleCreate()}
            disabled={creating}
            style={{ padding: "12px 24px" }}
          >
            {creating ? "Creando…" : tab === 2 ? "Crear herramienta" : "Siguiente"}
            <Icon name="arrowRight" size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab A: Identidad ─── */
function TabIdentity({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, alignItems: "start" }}>
      <Bento style={{ padding: 28 }}>
        {/* Nombre */}
        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 8 }}>Nombre de la herramienta</div>
          <input
            className="input"
            placeholder="ej. Separador de Nóminas"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            style={{ fontSize: 20, fontWeight: 600, padding: "14px 18px" }}
          />
        </div>

        {/* Tagline */}
        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 8 }}>Descripción corta</div>
          <input
            className="input"
            placeholder="qué hace, en pocas palabras"
            value={draft.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 15, fontWeight: 400 }}
          />
        </div>

        {/* Icono */}
        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 10 }}>Icono</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                onClick={() => update({ icon: ic })}
                style={{
                  aspectRatio: "1",
                  background: draft.icon === ic ? "var(--text)" : "var(--surface-2)",
                  color: draft.icon === ic ? "var(--bg)" : "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon name={ic} size={17} />
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 10 }}>Color de acento</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => update({ color: c })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: c,
                  cursor: "pointer",
                  border: draft.color === c ? "2.5px solid var(--text)" : "1px solid var(--border)",
                  outline: draft.color === c ? "2px solid var(--bg)" : "none",
                  outlineOffset: -4,
                  transition: "all 0.15s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div className="t-kicker" style={{ marginBottom: 8 }}>¿Requiere archivo?</div>
            <div className="row" style={{ gap: 8 }}>
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  className={`btn ${draft.requiresFile === v ? "btn-accent" : ""}`}
                  onClick={() => update({ requiresFile: v })}
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
              value={draft.outputType}
              onChange={(e) => update({ outputType: e.target.value as Draft["outputType"] })}
              style={{ fontSize: 13 }}
            >
              <option value="file">Archivo</option>
              <option value="zip">.zip</option>
              <option value="text">Texto</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
      </Bento>

      {/* Preview card */}
      <div>
        <div className="t-kicker" style={{ marginBottom: 10 }}>Vista previa</div>
        <Bento
          style={{
            padding: 26,
            background: `linear-gradient(160deg, ${draft.color}12 0%, var(--surface) 60%)`,
          }}
        >
          <div className="row" style={{ gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: draft.color,
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--border)",
              }}
            >
              <Icon name={draft.icon} size={22} />
            </div>
            <span className="chip">NUEVA</span>
          </div>
          <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1 }}>
            {draft.name || "Sin nombre"}
          </div>
          <div className="italic-serif muted" style={{ fontSize: 14, marginTop: 6 }}>
            {draft.tagline || "sin descripción"}
          </div>
          <div className="row" style={{ marginTop: 18, gap: 6 }}>
            <span className="chip">
              <Icon name={draft.requiresFile ? "upload" : "type"} size={11} />
              {draft.requiresFile ? "Archivo" : "Variables"}
            </span>
            <Icon name="arrowRight" size={11} className="muted-3" />
            <span className="chip">
              <Icon name="download" size={11} />
              {draft.outputType}
            </span>
          </div>
        </Bento>
        <div className="italic-serif muted-2" style={{ fontSize: 12, marginTop: 12, padding: "0 4px" }}>
          Así se verá tu herramienta en el dashboard.
        </div>
      </div>
    </div>
  )
}

/* ─── Tab B: Variables ─── */
function TabVariables({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  // User vars
  const addUserVar = () =>
    update({
      userVars: [
        ...draft.userVars,
        { key: "nueva_var", label: "Nueva variable", type: "text", icon: "type", default: "" },
      ],
    })
  const removeUserVar = (i: number) => update({ userVars: draft.userVars.filter((_, j) => j !== i) })

  // System vars
  const addSystemVar = () =>
    update({
      systemVars: [
        ...draft.systemVars,
        { key: "nueva_key", label: "Nueva variable", value: "" },
      ],
    })
  const removeSystemVar = (i: number) => update({ systemVars: draft.systemVars.filter((_, j) => j !== i) })

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* User vars */}
      <Bento style={{ padding: 28 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div className="t-display" style={{ fontSize: 20 }}>Variables del usuario</div>
            <div className="italic-serif muted" style={{ fontSize: 13 }}>
              Campos que rellenará quien use la tool
            </div>
          </div>
          <button className="btn btn-accent" onClick={addUserVar} style={{ fontSize: 12 }}>
            <Icon name="plus" size={13} /> Añadir
          </button>
        </div>

        {draft.userVars.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: "center",
            background: "var(--surface-2)",
            borderRadius: 16,
            border: "1px dashed var(--border-strong)",
          }}>
            <Icon name="type" size={20} className="muted-3" style={{ marginBottom: 8 }} />
            <div className="italic-serif muted-2" style={{ fontSize: 13 }}>
              Sin variables de usuario — la tool no pedirá datos
            </div>
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {draft.userVars.map((v, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 100px 40px",
                  alignItems: "end",
                  gap: 10,
                  padding: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                }}
              >
                <div>
                  <div className="t-kicker" style={{ marginBottom: 4 }}>Nombre</div>
                  <input
                    className="input"
                    value={v.label}
                    onChange={(e) => {
                      const nv = [...draft.userVars]
                      nv[i] = { ...v, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }
                      update({ userVars: nv })
                    }}
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <div className="t-kicker" style={{ marginBottom: 4 }}>Valor por defecto</div>
                  <input
                    className="input"
                    value={v.default}
                    placeholder="opcional"
                    onChange={(e) => {
                      const nv = [...draft.userVars]
                      nv[i] = { ...v, default: e.target.value }
                      update({ userVars: nv })
                    }}
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <div className="t-kicker" style={{ marginBottom: 4 }}>Tipo</div>
                  <select
                    className="input"
                    value={v.type}
                    onChange={(e) => {
                      const nv = [...draft.userVars]
                      nv[i] = { ...v, type: e.target.value as UserVar["type"] }
                      update({ userVars: nv })
                    }}
                    style={{ fontSize: 12 }}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="select">Opciones</option>
                  </select>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => removeUserVar(i)}
                  style={{ padding: 6, justifyContent: "center" }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="success-banner" style={{ marginTop: 16 }}>
          <div className="row" style={{ gap: 8 }}>
            <Icon name="sparkle" size={14} />
            <span style={{ fontSize: 12 }}>
              Las variables aparecerán como inputs en el formulario público. Accede a ellas en el código como <code style={{ fontFamily: "JetBrains Mono", background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 4 }}>variables["mes"]</code>
            </span>
          </div>
        </div>
      </Bento>

      {/* System vars */}
      <Bento style={{ padding: 28 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div className="t-display" style={{ fontSize: 20 }}>Variables del sistema</div>
            <div className="italic-serif muted" style={{ fontSize: 13 }}>
              Valores ocultos que el código necesita
            </div>
          </div>
          <button className="btn btn-accent" onClick={addSystemVar} style={{ fontSize: 12 }}>
            <Icon name="plus" size={13} /> Añadir
          </button>
        </div>

        {draft.systemVars.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: "center",
            background: "var(--surface-2)",
            borderRadius: 16,
            border: "1px dashed var(--border-strong)",
          }}>
            <Icon name="lock" size={20} className="muted-3" style={{ marginBottom: 8 }} />
            <div className="italic-serif muted-2" style={{ fontSize: 13 }}>
              Sin variables de sistema — contraseñas, rutas, etc.
            </div>
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {draft.systemVars.map((v, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 40px",
                  alignItems: "end",
                  gap: 10,
                  padding: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                }}
              >
                <div>
                  <div className="t-kicker" style={{ marginBottom: 4 }}>Clave</div>
                  <input
                    className="input input-mono"
                    value={v.key}
                    onChange={(e) => {
                      const nv = [...draft.systemVars]
                      nv[i] = { ...v, key: e.target.value }
                      update({ systemVars: nv })
                    }}
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <div className="t-kicker" style={{ marginBottom: 4 }}>Valor</div>
                  <input
                    className="input input-mono"
                    value={v.value}
                    onChange={(e) => {
                      const nv = [...draft.systemVars]
                      nv[i] = { ...v, value: e.target.value }
                      update({ systemVars: nv })
                    }}
                    style={{ fontSize: 12 }}
                    placeholder="ej. AJMCM"
                  />
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => removeSystemVar(i)}
                  style={{ padding: 6, justifyContent: "center" }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: 16,
          padding: "12px 14px",
          background: "var(--surface-2)",
          borderRadius: 14,
          border: "1px solid var(--border)",
        }}>
          <div className="row" style={{ gap: 8 }}>
            <Icon name="lock" size={14} className="muted-2" />
            <span className="muted-2" style={{ fontSize: 12 }}>
              El usuario nunca verá estas variables. Se inyectan en el código junto con las de usuario.
            </span>
          </div>
        </div>
      </Bento>
    </div>
  )
}

/* ─── Tab C: Código Python ─── */
function TabCode({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  const allVarKeys = [
    ...draft.userVars.map((v) => v.key),
    ...draft.systemVars.map((v) => v.key),
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
      <Bento style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div className="row" style={{ gap: 10 }}>
            <Icon name="code" size={15} className="muted" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Editor de Python</span>
          </div>
          <span className="chip" style={{ fontSize: 10 }}>
            <Icon name="zap" size={10} />
            Se ejecuta en el servidor
          </span>
        </div>
        <CodeEditor
          value={draft.code}
          onChange={(code) => update({ code })}
          height={480}
        />
      </Bento>

      {/* Reference panel */}
      <div className="col" style={{ gap: 16 }}>
        <Bento style={{ padding: 20 }}>
          <div className="t-kicker" style={{ marginBottom: 12 }}>Variables disponibles</div>
          <div className="col" style={{ gap: 6 }}>
            {allVarKeys.length === 0 ? (
              <div className="italic-serif muted-2" style={{ fontSize: 12 }}>
                Añade variables en la pestaña anterior
              </div>
            ) : (
              allVarKeys.map((k) => (
                <div
                  key={k}
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    padding: "6px 10px",
                    background: "var(--surface-2)",
                    borderRadius: 8,
                    color: "var(--text)",
                  }}
                >
                  variables[<span style={{ color: "var(--accent)" }}>"{k}"</span>]
                </div>
              ))
            )}
          </div>
        </Bento>

        <Bento style={{ padding: 20 }}>
          <div className="t-kicker" style={{ marginBottom: 12 }}>Referencia rápida</div>
          <div className="col" style={{ gap: 8 }}>
            {[
              { code: "input_bytes", desc: "Bytes del archivo subido" },
              { code: "output_file", desc: "Asigna bytes para descargar" },
              { code: "output_filename", desc: "Nombre del archivo de salida" },
              { code: "variables", desc: "Dict con todas las variables" },
            ].map((r) => (
              <div key={r.code}>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--accent)" }}>{r.code}</div>
                <div className="muted-2" style={{ fontSize: 11 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </Bento>

        <Bento style={{ padding: 20 }}>
          <div className="t-kicker" style={{ marginBottom: 12 }}>Ejemplo: Nóminas</div>
          <pre className="t-mono" style={{
            fontSize: 10,
            lineHeight: 1.6,
            color: "var(--text-2)",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}>
{`import pypdf, io

mes = variables['mes']
pwd = variables['password_pdf']

reader = pypdf.PdfReader(
  io.BytesIO(input_bytes)
)
if reader.is_encrypted:
    reader.decrypt(pwd)

writer = pypdf.PdfWriter()
writer.add_page(reader.pages[0])

out = io.BytesIO()
writer.write(out)

output_file = out.getvalue()
output_filename = f"Nomina {mes}.pdf"`}
          </pre>
        </Bento>
      </div>
    </div>
  )
}
