"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bento, Kicker } from "@/components/bento"
import { Icon } from "@/components/icon"
import type { PipelineStep, UserVar } from "@/lib/types"

type Draft = {
  name: string
  tagline: string
  icon: string
  color: string
  inputType: string
  outputType: string
  variables: UserVar[]
  steps: { id: string; title: string; icon: string }[]
}

const STEP_LIBRARY = [
  { id: "unlock", title: "Decrypt PDF", icon: "lock", desc: "desbloquea con la secret key" },
  { id: "extract_text", title: "Extract Text", icon: "eye", desc: "OCR de las páginas" },
  { id: "split_by_keyword", title: "Split by Keyword", icon: "scissors", desc: "separa por palabra clave" },
  { id: "variable_mapper", title: "Variable Mapper", icon: "brain", desc: "cruza con diccionario" },
  { id: "merge", title: "Merge", icon: "layers", desc: "une múltiples archivos" },
  { id: "rename", title: "Rename", icon: "type", desc: "aplica plantilla de nombre" },
  { id: "compress", title: "Zip", icon: "archive", desc: "comprime el resultado" },
  { id: "webhook", title: "Webhook", icon: "globe", desc: "envía a una URL externa" },
]

export function ToolBuilder() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({
    name: "",
    tagline: "",
    icon: "fileText",
    color: "#C7B8FF",
    inputType: "File Drop",
    outputType: "Archivo",
    variables: [
      { key: "mes", label: "Mes", type: "text", icon: "type", default: "Marzo" },
      { key: "ano", label: "Año", type: "text", icon: "type", default: "2026" },
    ],
    steps: [
      { id: "unlock", title: "Decrypt PDF", icon: "lock" },
      { id: "extract_text", title: "Extract Text (OCR)", icon: "eye" },
      { id: "split_by_keyword", title: "Split by Keyword", icon: "scissors" },
      { id: "rename", title: "Rename Output", icon: "type" },
    ],
  })

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const pipelineSteps: PipelineStep[] = draft.steps.map((s) => ({
        id: s.id,
        title: s.title,
        icon: s.icon,
        color: draft.color,
        summary: STEP_LIBRARY.find((l) => l.id === s.id)?.desc ?? "",
        tag: "core",
        params: [],
      }))
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name || "Nueva tool",
          tagline: draft.tagline || "sin descripción",
          description: draft.tagline,
          icon: draft.icon,
          iconBg: draft.color,
          iconColor: "#0A0A0A",
          inputType: draft.inputType,
          inputIcon: "upload",
          outputType: draft.outputType,
          outputIcon: "download",
          config: {
            trigger: draft.inputType,
            outputType: draft.outputType,
            userVars: draft.variables,
            steps: pipelineSteps,
            filenameTokens: [],
            dictionary: [],
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.tool) throw new Error(data.error || "No se pudo crear")
      router.push(`/tools/${data.tool.id}/config`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear la tool"
      setError(msg)
      setCreating(false)
    }
  }

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/")}
          style={{ padding: "6px 10px", fontSize: 12, marginBottom: 16 }}
        >
          <Icon name="arrowLeft" size={13} />
          Cancelar
        </button>
        <Kicker style={{ marginBottom: 12 }}>Tool Builder · 3 pasos</Kicker>
        <h1
          className="t-display"
          style={{ fontSize: "clamp(40px, 5vw, 60px)", margin: 0, lineHeight: 1.05, color: "var(--text)" }}
        >
          Construye una <span className="italic-serif">nueva</span> tool.
        </h1>
        <p style={{ fontSize: 16, marginTop: 16, maxWidth: 520, color: "var(--text-2)" }}>
          Cada herramienta es un pequeño motor. Defínelo aquí — luego procesará archivos por ti, sin que toques código.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { n: 1, title: "Identidad", sub: "nombre, icono, color" },
          { n: 2, title: "Variables", sub: "qué pide al usuario" },
          { n: 3, title: "Lógica", sub: "qué hace, en orden" },
        ].map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n)}
            style={{
              border: "none",
              textAlign: "left",
              padding: 18,
              cursor: "pointer",
              borderRadius: 18,
              background: step === s.n ? "var(--surface)" : "var(--surface-2)",
              color: "var(--text)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: step === s.n ? "var(--accent)" : "var(--border)",
              transition: "all 0.2s ease",
            }}
          >
            <div className="row" style={{ gap: 10, marginBottom: 4 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: step >= s.n ? "var(--accent)" : "var(--surface-3)",
                  color: step >= s.n ? "#0A0A0A" : "var(--text-3)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "Syne",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {step > s.n ? <Icon name="check" size={12} /> : s.n}
              </div>
              <div className="t-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
                {s.title}
              </div>
            </div>
            <div className="italic-serif" style={{ fontSize: 13, marginLeft: 36, color: "var(--text-2)" }}>
              {s.sub}
            </div>
          </button>
        ))}
      </div>

      {step === 1 && <BuilderIdentity draft={draft} update={update} />}
      {step === 2 && <BuilderVariables draft={draft} update={update} />}
      {step === 3 && <BuilderLogic draft={draft} update={update} />}

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "rgba(255,107,74,0.1)",
            border: "1px solid rgba(255,107,74,0.4)",
            borderRadius: 12,
            color: "#FF6B4A",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="row" style={{ justifyContent: "space-between", marginTop: 28 }}>
        <button
          className="btn"
          onClick={() => (step > 1 ? setStep(step - 1) : router.push("/"))}
          disabled={creating}
        >
          <Icon name="arrowLeft" size={13} />
          {step === 1 ? "Cancelar" : "Atrás"}
        </button>
        <div className="row" style={{ gap: 10 }}>
          <span className="italic-serif muted-2" style={{ fontSize: 13 }}>
            paso {step} de 3
          </span>
          <button
            className="btn btn-primary"
            onClick={() => (step < 3 ? setStep(step + 1) : handleCreate())}
            disabled={creating}
          >
            {creating ? "Creando…" : step === 3 ? "Crear tool" : "Continuar"}
            <Icon name="arrowRight" size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function BuilderIdentity({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  const ICON_OPTIONS = ["fileText", "scissors", "image", "table", "receipt", "archive", "globe", "flask", "brain", "zap"]
  const COLOR_OPTIONS = ["#C7B8FF", "#A8FF60", "#FF9B6B", "#FFD84A", "#7AD7FF", "#FF8FB1", "#E8E5DD", "#1A1A1A"]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "start" }}>
      <Bento style={{ padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 8 }}>
            Nombre de la herramienta
          </div>
          <input
            className="input"
            placeholder="ej. Separador de Nóminas"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            style={{ fontSize: 22, fontWeight: 600, padding: "14px 18px" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 8 }}>
            Tagline · una frase corta
          </div>
          <input
            className="input"
            placeholder="qué hace, en 6 palabras"
            value={draft.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 16, fontWeight: 400 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="t-kicker" style={{ marginBottom: 10 }}>
            Icono
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
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
                }}
              >
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="t-kicker" style={{ marginBottom: 10 }}>
            Color de la card
          </div>
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
                  border: draft.color === c ? "2px solid var(--text)" : "1px solid var(--border)",
                  outline: draft.color === c ? "2px solid var(--bg)" : "none",
                  outlineOffset: -3,
                }}
              />
            ))}
          </div>
        </div>
      </Bento>

      <div>
        <Kicker style={{ marginBottom: 10 }}>Vista previa en vivo</Kicker>
        <Bento
          style={{
            padding: 26,
            background: `linear-gradient(160deg, ${draft.color}22 0%, var(--surface) 60%)`,
          }}
        >
          <div className="row" style={{ gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: draft.color,
                color: "#0A0A0A",
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--border)",
              }}
            >
              <Icon name={draft.icon} size={20} />
            </div>
            <span className="chip">DRAFT</span>
          </div>
          <div className="t-display" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.05 }}>
            {draft.name || "Sin nombre"}
          </div>
          <div className="italic-serif muted" style={{ fontSize: 14, marginTop: 4 }}>
            {draft.tagline || "sin descripción"}
          </div>
          <div className="row" style={{ marginTop: 18, gap: 6 }}>
            <span className="chip">
              <Icon name="upload" size={11} />
              {draft.inputType}
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

function BuilderVariables({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  const addVar = () =>
    update({
      variables: [
        ...draft.variables,
        { key: "nueva_var", label: "Nueva variable", type: "text", icon: "type", default: "" },
      ],
    })
  const removeVar = (i: number) => update({ variables: draft.variables.filter((_, j) => j !== i) })

  return (
    <Bento style={{ padding: 28 }}>
      <div
        className="row"
        style={{ justifyContent: "space-between", marginBottom: 20, alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}
      >
        <div>
          <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>
            Variables que pide al usuario
          </div>
          <div className="italic-serif muted" style={{ fontSize: 14 }}>
            cada vez que ejecute la tool, se le pedirán estos valores
          </div>
        </div>
        <button className="btn btn-accent" onClick={addVar}>
          <Icon name="plus" size={13} /> Añadir
        </button>
      </div>

      <div className="col" style={{ gap: 10 }}>
        {draft.variables.map((v, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 1fr 1fr 1fr 40px",
              alignItems: "center",
              gap: 10,
              padding: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 14,
            }}
          >
            <Icon name="grip" size={14} className="muted-3" />
            <div>
              <div className="t-kicker" style={{ marginBottom: 4 }}>
                Nombre
              </div>
              <input
                className="input"
                value={v.label}
                onChange={(e) => {
                  const nv = [...draft.variables]
                  nv[i] = { ...v, label: e.target.value }
                  update({ variables: nv })
                }}
              />
            </div>
            <div>
              <div className="t-kicker" style={{ marginBottom: 4 }}>
                Key
              </div>
              <input
                className="input input-mono"
                value={v.key}
                onChange={(e) => {
                  const nv = [...draft.variables]
                  nv[i] = { ...v, key: e.target.value }
                  update({ variables: nv })
                }}
              />
            </div>
            <div>
              <div className="t-kicker" style={{ marginBottom: 4 }}>
                Tipo
              </div>
              <select
                className="input"
                value={v.type}
                onChange={(e) => {
                  const nv = [...draft.variables]
                  nv[i] = { ...v, type: e.target.value as UserVar["type"] }
                  update({ variables: nv })
                }}
              >
                <option value="text">texto</option>
                <option value="number">número</option>
                <option value="date">fecha</option>
                <option value="select">opciones</option>
              </select>
            </div>
            <div>
              <div className="t-kicker" style={{ marginBottom: 4 }}>
                Valor por defecto
              </div>
              <input
                className="input"
                value={v.default}
                onChange={(e) => {
                  const nv = [...draft.variables]
                  nv[i] = { ...v, default: e.target.value }
                  update({ variables: nv })
                }}
              />
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => removeVar(i)}
              style={{ padding: 6, justifyContent: "center" }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>

      <div
        className="row"
        style={{
          marginTop: 18,
          padding: 14,
          background: "var(--accent-soft)",
          borderRadius: 14,
          gap: 12,
          border: "1px solid oklch(0.78 0.12 290 / 0.3)",
        }}
      >
        <Icon name="sparkle" size={16} style={{ color: "var(--accent)" }} />
        <div className="italic-serif" style={{ fontSize: 13, color: "var(--text-2)", flex: 1 }}>
          Las variables aparecerán como pequeños inputs en la pantalla de ejecución. Si pones un valor por defecto, ya
          vienen rellenas.
        </div>
      </div>
    </Bento>
  )
}

function BuilderLogic({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const addStep = (libStep: { id: string; title: string; icon: string }) => {
    update({ steps: [...draft.steps, { ...libStep }] })
  }
  const removeStep = (i: number) => update({ steps: draft.steps.filter((_, j) => j !== i) })
  const moveStep = (from: number, to: number) => {
    if (from === to) return
    const arr = [...draft.steps]
    const [m] = arr.splice(from, 1)
    arr.splice(to, 0, m)
    update({ steps: arr })
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
      <Bento style={{ padding: 28 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", marginBottom: 18, alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}
        >
          <div>
            <div className="t-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>
              Pipeline de la tool
            </div>
            <div className="italic-serif" style={{ fontSize: 14, color: "var(--text-2)" }}>
              arrastra para reordenar · clic en + para añadir desde la biblioteca
            </div>
          </div>
          <span className="chip">{draft.steps.length} pasos</span>
        </div>

        {draft.steps.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              background: "var(--surface-2)",
              borderRadius: 16,
              border: "1px dashed var(--border-strong)",
            }}
          >
            <Icon name="layers" size={24} className="muted-3" style={{ marginBottom: 10 }} />
            <div className="italic-serif" style={{ color: "var(--text-2)", fontSize: 13 }}>
              Pipeline vacía — añade pasos desde la biblioteca →
            </div>
          </div>
        ) : (
          <div className="col" style={{ gap: 6, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 25,
                top: 24,
                bottom: 24,
                width: 1,
                background: "var(--border)",
              }}
            />
            {draft.steps.map((s, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverIdx(i)
                }}
                onDragEnd={() => {
                  setDragIdx(null)
                  setOverIdx(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragIdx !== null) moveStep(dragIdx, i)
                  setDragIdx(null)
                  setOverIdx(null)
                }}
                className="row"
                style={{
                  padding: 14,
                  background: "var(--surface-2)",
                  border: "1px solid " + (overIdx === i && dragIdx !== null && dragIdx !== i ? "var(--accent)" : "var(--border)"),
                  borderRadius: 16,
                  gap: 14,
                  position: "relative",
                  zIndex: 1,
                  cursor: "grab",
                  opacity: dragIdx === i ? 0.4 : 1,
                  transition: "all 0.15s ease",
                  color: "var(--text)",
                }}
              >
                <Icon name="grip" size={14} className="muted-3" />
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--text)",
                  }}
                >
                  <Icon name={s.icon} size={14} />
                </div>
                <div className="col" style={{ gap: 0, flex: 1, alignItems: "flex-start" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="t-mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{s.title}</div>
                  </div>
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                    {s.id}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeStep(i)
                  }}
                  style={{ padding: 6 }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Bento>

      <div>
        <Kicker style={{ marginBottom: 10 }}>Biblioteca de pasos</Kicker>
        <div className="italic-serif" style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 12 }}>
          clic para añadir al final
        </div>
        <div className="col" style={{ gap: 8 }}>
          {STEP_LIBRARY.map((s) => (
            <button
              key={s.id}
              onClick={() => addStep(s)}
              className="bento"
              style={{
                padding: 14,
                cursor: "pointer",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                textAlign: "left",
                color: "var(--text)",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div className="row" style={{ gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--surface-3)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--text)",
                  }}
                >
                  <Icon name={s.icon} size={13} />
                </div>
                <div className="col" style={{ gap: 0, alignItems: "flex-start", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.title}</div>
                  <div className="italic-serif" style={{ fontSize: 11, color: "var(--text-2)" }}>
                    {s.desc}
                  </div>
                </div>
                <Icon name="plus" size={14} className="muted-2" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
