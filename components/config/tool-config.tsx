"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import type { DictionaryEntry, FilenameToken, PipelineStep, Tool, ToolConfigData } from "@/lib/types"
import { Bento, Kicker } from "@/components/bento"
import { Icon } from "@/components/icon"

const STEP_LIBRARY = [
  { id: "unlock", title: "Decrypt PDF", icon: "lock", desc: "desbloquea con clave" },
  { id: "extract_text", title: "Extract Text", icon: "eye", desc: "OCR de páginas" },
  { id: "variable_mapper", title: "Variable Mapper", icon: "brain", desc: "cruza diccionario" },
  { id: "split_pdf", title: "Split por página", icon: "scissors", desc: "parte el PDF" },
  { id: "merge", title: "Merge", icon: "layers", desc: "une archivos" },
  { id: "rename", title: "Rename", icon: "type", desc: "aplica plantilla" },
  { id: "compress", title: "Zip", icon: "archive", desc: "comprime resultado" },
  { id: "webhook", title: "Webhook", icon: "globe", desc: "envía a URL" },
]

export function ToolConfigView({ tool }: { tool: Tool }) {
  const router = useRouter()
  const [config, setConfig] = useState<ToolConfigData>(tool.config)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

  const updateConfig = (patch: Partial<ToolConfigData>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
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

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 1480, margin: "0 auto" }}>
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => router.push("/")}
            style={{ padding: "6px 10px", fontSize: 12, marginBottom: 16 }}
          >
            <Icon name="arrowLeft" size={13} />
            Volver al dashboard
          </button>
          <div className="row" style={{ gap: 16, marginBottom: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: tool.iconBg,
                color: tool.iconColor,
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--border)",
              }}
            >
              <Icon name={tool.icon} size={26} stroke={1.7} />
            </div>
            <div>
              <Kicker style={{ marginBottom: 6 }}>Configuración · interior del motor</Kicker>
              <h1 className="t-display" style={{ fontSize: "clamp(40px, 5vw, 56px)", margin: 0, lineHeight: 0.95 }}>
                {tool.name}
              </h1>
            </div>
          </div>
          <p className="italic-serif muted" style={{ fontSize: 18, margin: 0, maxWidth: 600 }}>
            {tool.tagline}. Modifica cualquier paso sin tocar código.
          </p>
        </div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {savedAt && !saving && (
            <span className="chip chip-accent">
              <Icon name="check" size={11} /> guardado
            </span>
          )}
          <button className="btn" onClick={save} disabled={saving} style={{ fontSize: 13 }}>
            <Icon name="check" size={14} /> {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            className="btn btn-primary"
            onClick={runTest}
            disabled={saving}
            style={{ fontSize: 14, padding: "12px 20px" }}
          >
            <Icon name="play" size={14} /> Ejecutar prueba
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
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

      <div
        className="row"
        style={{
          gap: 0,
          marginBottom: 20,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          padding: 6,
          borderRadius: 999,
          width: "fit-content",
        }}
      >
        {["Identidad", "Variables", "Lógica", "Output"].map((s, i) => (
          <div
            key={s}
            className="row"
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: i === 2 ? "var(--text)" : "transparent",
              color: i === 2 ? "var(--bg)" : "var(--text-2)",
              fontSize: 13,
              fontWeight: 600,
              gap: 8,
              cursor: "default",
            }}
          >
            <span className="t-mono" style={{ fontSize: 10, opacity: 0.6 }}>
              0{i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 18, alignItems: "start" }}>
        <InputColumn config={config} onChange={updateConfig} />
        <LogicColumn config={config} onChange={updateConfig} showCode={showCode} setShowCode={setShowCode} toolId={tool.id} />
        <OutputColumn config={config} onChange={updateConfig} />
      </div>

      <DictionaryPanel config={config} onChange={updateConfig} />
    </div>
  )
}

function InputColumn({ config, onChange }: { config: ToolConfigData; onChange: (p: Partial<ToolConfigData>) => void }) {
  const addVar = () =>
    onChange({
      userVars: [
        ...config.userVars,
        { key: "nueva_var", label: "Nueva variable", type: "text", icon: "type", default: "" },
      ],
    })
  const removeVar = (i: number) => onChange({ userVars: config.userVars.filter((_, j) => j !== i) })

  return (
    <div className="col" style={{ gap: 18 }}>
      <Bento style={{ padding: 24 }}>
        <ColumnHeader number="A" title="La Entrada" subtitle="qué necesita para despertar" />

        <Field label="Tipo de trigger">
          <Segmented
            options={["File Drop", "URL", "Texto", "Schedule"]}
            value={config.trigger}
            onChange={(v) => onChange({ trigger: v })}
          />
        </Field>

        <Field label="Formato aceptado">
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            {[".pdf", ".zip"].map((f) => (
              <span key={f} className="chip chip-accent">
                <Icon name="check" size={10} /> {f}
              </span>
            ))}
            <button className="chip" style={{ cursor: "pointer" }}>
              <Icon name="plus" size={10} /> añadir
            </button>
          </div>
        </Field>

        <Field label="Variables que pide al usuario">
          <div className="col" style={{ gap: 8 }}>
            {config.userVars.map((v, i) => (
              <div
                key={i}
                className="row"
                style={{
                  padding: "10px 12px",
                  background: "var(--surface-2)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  gap: 10,
                }}
              >
                <Icon name="grip" size={14} className="muted-3" />
                <Icon name={v.icon} size={14} className="muted-2" />
                <div className="col" style={{ gap: 0, flex: 1, alignItems: "flex-start" }}>
                  <input
                    value={v.label}
                    onChange={(e) => {
                      const nv = [...config.userVars]
                      nv[i] = { ...v, label: e.target.value }
                      onChange({ userVars: nv })
                    }}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--text)",
                      padding: 0,
                      width: "100%",
                    }}
                  />
                  <div className="row" style={{ gap: 6, marginTop: 2 }}>
                    <input
                      value={v.key}
                      onChange={(e) => {
                        const nv = [...config.userVars]
                        nv[i] = { ...v, key: e.target.value }
                        onChange({ userVars: nv })
                      }}
                      className="t-mono muted-3"
                      style={{
                        fontSize: 10,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-3)",
                        padding: 0,
                        width: 80,
                      }}
                    />
                    <span className="t-mono muted-3" style={{ fontSize: 10 }}>
                      · {v.type}
                    </span>
                  </div>
                </div>
                <input
                  value={v.default}
                  onChange={(e) => {
                    const nv = [...config.userVars]
                    nv[i] = { ...v, default: e.target.value }
                    onChange({ userVars: nv })
                  }}
                  className="chip"
                  style={{
                    fontSize: 10,
                    border: "1px solid var(--border)",
                    outline: "none",
                    width: 90,
                    cursor: "text",
                  }}
                />
                <button
                  className="btn btn-ghost"
                  onClick={() => removeVar(i)}
                  style={{ padding: 4, justifyContent: "center" }}
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
            <button
              className="btn btn-ghost"
              onClick={addVar}
              style={{
                justifyContent: "center",
                fontSize: 12,
                padding: "10px 12px",
                border: "1px dashed var(--border-strong)",
              }}
            >
              <Icon name="plus" size={13} /> añadir variable
            </button>
          </div>
        </Field>

        <Field label="Secret · clave de desbloqueo PDF" hint="se guarda cifrada">
          <div className="row" style={{ gap: 8 }}>
            <div className="input row" style={{ justifyContent: "space-between" }}>
              <span className="t-mono muted-2" style={{ letterSpacing: "0.2em" }}>
                {"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              </span>
              <Icon name="lock" size={14} className="muted-2" />
            </div>
            <button className="btn" style={{ padding: "10px 12px", fontSize: 12 }}>
              Editar
            </button>
          </div>
          <div className="t-mono muted-3" style={{ fontSize: 10, marginTop: 6 }}>
            $.secret.AJMCM_KEY · cargada hace 14 días
          </div>
        </Field>
      </Bento>
    </div>
  )
}

function LogicColumn({
  config,
  onChange,
  showCode,
  setShowCode,
  toolId,
}: {
  config: ToolConfigData
  onChange: (p: Partial<ToolConfigData>) => void
  showCode: boolean
  setShowCode: (b: boolean) => void
  toolId: string
}) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <Bento style={{ padding: 24, position: "relative" }}>
        <ColumnHeader
          number="B"
          title="El Procesador"
          subtitle="los pasos que ejecuta, en orden"
          rightAction={
            <button
              className="btn"
              onClick={() => setShowCode(!showCode)}
              style={{ padding: "6px 12px", fontSize: 11 }}
            >
              <Icon name="code" size={12} />
              {showCode ? "Vista visual" : "Ver código"}
            </button>
          }
        />

        {!showCode ? <StepsList config={config} onChange={onChange} /> : <CodeView config={config} toolId={toolId} />}

        <div
          className="row"
          style={{
            marginTop: 16,
            padding: 14,
            background: "var(--surface-2)",
            borderRadius: 16,
            border: "1px dashed var(--border-strong)",
            gap: 12,
          }}
        >
          <Icon name="sparkle" size={16} className="muted-2" />
          <div className="col" style={{ gap: 2, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sugerencia del motor</div>
            <div className="italic-serif muted-2" style={{ fontSize: 12 }}>
              Detectamos que tus archivos tienen estructura constante. ¿Activar split automático por página?
            </div>
          </div>
          <button className="btn btn-accent" style={{ fontSize: 11, padding: "6px 12px" }}>
            Activar
          </button>
        </div>
      </Bento>
    </div>
  )
}

function StepsList({ config, onChange }: { config: ToolConfigData; onChange: (p: Partial<ToolConfigData>) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)

  const moveStep = (from: number, to: number) => {
    if (from === to) return
    const arr = [...config.steps]
    const [m] = arr.splice(from, 1)
    arr.splice(to, 0, m)
    onChange({ steps: arr })
  }
  const removeStep = (i: number) => onChange({ steps: config.steps.filter((_, j) => j !== i) })
  const addStep = (lib: { id: string; title: string; icon: string; desc: string }) => {
    const ns: PipelineStep = {
      id: lib.id,
      title: lib.title,
      icon: lib.icon,
      color: "#C7B8FF",
      summary: lib.desc,
      tag: "core",
      params: [{ label: "auto", value: "configurar" }],
    }
    onChange({ steps: [...config.steps, ns] })
    setShowLibrary(false)
  }

  return (
    <div className="col" style={{ gap: 0, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 19,
          top: 24,
          bottom: 24,
          width: 1,
          background: "var(--border)",
          zIndex: 0,
        }}
      />
      {config.steps.map((step, i) => (
        <Step
          key={i}
          step={step}
          index={i}
          isDragging={dragIdx === i}
          isOver={overIdx === i && dragIdx !== null && dragIdx !== i}
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
          onRemove={() => removeStep(i)}
        />
      ))}
      <button
        className="btn btn-ghost"
        onClick={() => setShowLibrary(!showLibrary)}
        style={{
          marginTop: 8,
          justifyContent: "flex-start",
          padding: "10px 14px",
          fontSize: 12,
          gap: 12,
          color: "var(--text)",
          border: "1px dashed var(--border-strong)",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            border: "1px dashed var(--border-strong)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="plus" size={12} />
        </div>
        {showLibrary ? "Cerrar biblioteca" : "Añadir paso desde biblioteca"}
      </button>

      {showLibrary && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {STEP_LIBRARY.map((s) => (
            <button
              key={s.id}
              onClick={() => addStep(s)}
              className="row"
              style={{
                padding: 10,
                gap: 10,
                cursor: "pointer",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                color: "var(--text)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <Icon name={s.icon} size={13} />
              <div className="col" style={{ gap: 0, alignItems: "flex-start", flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.title}</div>
                <div className="italic-serif" style={{ fontSize: 10, color: "var(--text-3)" }}>
                  {s.desc}
                </div>
              </div>
              <Icon name="plus" size={12} className="muted-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Step({
  step,
  index,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onRemove,
}: {
  step: PipelineStep
  index: number
  isDragging: boolean
  isOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(step.expanded || false)
  return (
    <div
      style={{ position: "relative", zIndex: 1 }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <div
        className="row"
        style={{
          padding: 14,
          background: "var(--surface-2)",
          borderRadius: 16,
          border: "1px solid " + (isOver ? "var(--accent)" : "var(--border)"),
          gap: 12,
          cursor: "grab",
          marginBottom: 8,
          opacity: isDragging ? 0.4 : 1,
          transition: "all 0.15s ease",
        }}
        onClick={() => setOpen(!open)}
      >
        <Icon name="grip" size={14} className="muted-3" />
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "var(--text)",
          }}
        >
          <Icon name={step.icon} size={15} />
        </div>
        <div className="col" style={{ gap: 2, flex: 1, alignItems: "flex-start" }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="t-mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{step.title}</div>
            {step.tag && (
              <span className="chip" style={{ fontSize: 10 }}>
                {step.tag}
              </span>
            )}
          </div>
          {step.summary && (
            <div className="italic-serif" style={{ fontSize: 12, color: "var(--text-2)" }}>
              {step.summary}
            </div>
          )}
        </div>
        <button
          className="btn btn-ghost"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          style={{ padding: 6 }}
        >
          <Icon name="x" size={13} />
        </button>
        <Icon name={open ? "chevDown" : "chevRight"} size={14} className="muted-2" />
      </div>

      {open && step.params && step.params.length > 0 && (
        <div
          style={{
            marginLeft: 48,
            marginBottom: 8,
            padding: 14,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
          }}
        >
          {step.params.map((p, j) => (
            <div key={j} style={{ marginBottom: j === (step.params?.length ?? 0) - 1 ? 0 : 10 }}>
              <div className="t-mono" style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>
                {p.label}
              </div>
              <div className="t-mono" style={{ fontSize: 12, color: "var(--text)" }}>
                {p.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CodeView({ config, toolId }: { config: ToolConfigData; toolId: string }) {
  return (
    <div
      style={{
        background: "#0A0A0A",
        color: "#E8E5DD",
        borderRadius: 16,
        padding: 18,
        fontFamily: "JetBrains Mono",
        fontSize: 12,
        lineHeight: 1.65,
        border: "1px solid var(--border)",
        overflow: "auto",
      }}
    >
      <div style={{ color: "#7C7669", marginBottom: 8 }}># auto-generado · solo lectura</div>
      <div>
        <span style={{ color: "#C7B8FF" }}>tool_id</span>:{" "}
        <span style={{ color: "#A8FF60" }}>&quot;{toolId}&quot;</span>
      </div>
      <div>
        <span style={{ color: "#C7B8FF" }}>steps</span>: [
      </div>
      {config.steps.map((s, i) => (
        <div key={s.id + i} style={{ paddingLeft: 16 }}>
          <span style={{ color: "#A8FF60" }}>&quot;{s.id}&quot;</span>
          {i < config.steps.length - 1 ? "," : ""}
          <span style={{ color: "#7C7669" }}> // {s.title.toLowerCase()}</span>
        </div>
      ))}
      <div>]</div>
      {config.dictionary.length > 0 && (
        <>
          <div>
            <span style={{ color: "#C7B8FF" }}>dictionary</span>: {"{"}
          </div>
          {config.dictionary.map((d, i) => (
            <div key={d.sigla + i} style={{ paddingLeft: 16 }}>
              <span style={{ color: "#A8FF60" }}>&quot;{d.sigla}&quot;</span>:{" "}
              [<span style={{ color: "#A8FF60" }}>&quot;{d.fullName}&quot;</span>,{" "}
              <span style={{ color: "#A8FF60" }}>&quot;{d.dni}&quot;</span>]
              {i < config.dictionary.length - 1 ? "," : ""}
            </div>
          ))}
          <div>{"}"}</div>
        </>
      )}
    </div>
  )
}

function OutputColumn({
  config,
  onChange,
}: {
  config: ToolConfigData
  onChange: (p: Partial<ToolConfigData>) => void
}) {
  const [hovering, setHovering] = useState<number | null>(null)
  const exampleSigla = config.dictionary[0]?.sigla ?? "AAA"
  const exampleSigla2 = config.dictionary[1]?.sigla ?? "BBB"
  const exampleName = config.dictionary[0]?.fullName ?? "Ejemplo Uno"
  const exampleName2 = config.dictionary[1]?.fullName ?? "Ejemplo Dos"
  const exampleColor = config.dictionary[0]?.color ?? "#C7B8FF"
  const exampleColor2 = config.dictionary[1]?.color ?? "#A8FF60"

  return (
    <div className="col" style={{ gap: 18 }}>
      <Bento style={{ padding: 24 }}>
        <ColumnHeader number="C" title="El Output" subtitle="qué se descarga al final" />

        <Field label="Tipo de salida">
          <Segmented
            options={["Archivo", ".zip", "Tabla", "Webhook"]}
            value={config.outputType}
            onChange={(v) => onChange({ outputType: v })}
          />
        </Field>

        <Field label="Plantilla del nombre" hint="píldoras = variables o texto fijo">
          <div className="col" style={{ gap: 10 }}>
            <div
              style={{
                padding: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                alignItems: "center",
                minHeight: 48,
              }}
            >
              {config.filenameTokens.length === 0 && (
                <span className="italic-serif muted-3" style={{ fontSize: 12 }}>
                  añade píldoras desde abajo →
                </span>
              )}
              {config.filenameTokens.map((tok, i) => (
                <FilenameTokenView
                  key={i}
                  token={tok}
                  active={hovering === i}
                  onHover={() => setHovering(i)}
                  onLeave={() => setHovering(null)}
                  onRemove={() => onChange({ filenameTokens: config.filenameTokens.filter((_, j) => j !== i) })}
                />
              ))}
            </div>

            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <span className="t-kicker" style={{ width: "100%", marginBottom: 4 }}>
                Píldoras disponibles · clic para añadir
              </span>
              {[
                { icon: "sparkle", label: "#correlativo", kind: "var" },
                { icon: "type", label: "sigla detectada", kind: "var" },
                { icon: "type", label: "mes", kind: "var" },
                { icon: "type", label: "año", kind: "var" },
                { icon: "type", label: "nombre completo", kind: "var" },
                { icon: "type", label: "texto fijo", kind: "static" },
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() =>
                    onChange({
                      filenameTokens: [
                        ...config.filenameTokens,
                        { kind: p.kind as "var" | "static", label: p.label },
                      ],
                    })
                  }
                  className="chip"
                  style={{ cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono" }}
                >
                  <Icon name={p.icon} size={10} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </Field>

        <Field label="Vista previa en vivo">
          <div
            style={{
              padding: 16,
              background: "var(--bg)",
              border: "1px solid var(--border-strong)",
              borderRadius: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="grain" style={{ opacity: 0.04 }} />
            <div
              className="t-mono muted-3"
              style={{ fontSize: 9, marginBottom: 6, letterSpacing: "0.16em" }}
            >
              {`EJEMPLO · ${exampleName.toUpperCase()}`}
            </div>
            <div
              className="t-mono"
              style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, wordBreak: "break-all" }}
            >
              <span style={{ color: "var(--accent)" }}>19</span>
              <span className="muted-3">.</span>
              <span>Nomina</span>
              <span style={{ color: exampleColor }}> {exampleSigla}</span>
              <span> Marzo</span>
              <span> 2026</span>
              <span className="muted">.pdf</span>
            </div>
            <div
              className="t-mono muted-3"
              style={{ fontSize: 9, marginTop: 12, letterSpacing: "0.16em" }}
            >
              {`EJEMPLO · ${exampleName2.toUpperCase()}`}
            </div>
            <div
              className="t-mono"
              style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, wordBreak: "break-all" }}
            >
              <span style={{ color: "var(--accent)" }}>20</span>
              <span className="muted-3">.</span>
              <span>Nomina</span>
              <span style={{ color: exampleColor2 }}> {exampleSigla2}</span>
              <span> Marzo</span>
              <span> 2026</span>
              <span className="muted">.pdf</span>
            </div>
          </div>
        </Field>

        <Field label="Auto-incremento del correlativo">
          <div
            className="row"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--accent-soft)",
              border: "1px solid oklch(0.78 0.12 290 / 0.3)",
              gap: 10,
            }}
          >
            <Icon name="zap" size={14} style={{ color: "var(--accent)" }} />
            <div className="col" style={{ gap: 2, flex: 1, alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Activado</div>
              <div className="italic-serif muted-2" style={{ fontSize: 11 }}>
                último: #18 · próximo: #19
              </div>
            </div>
            <Toggle on={true} />
          </div>
        </Field>
      </Bento>
    </div>
  )
}

function FilenameTokenView({
  token,
  onHover,
  onLeave,
  onRemove,
  active,
}: {
  token: FilenameToken
  onHover: () => void
  onLeave: () => void
  onRemove: () => void
  active: boolean
}) {
  const isVar = token.kind === "var"
  return (
    <span
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 10,
        background: isVar ? "var(--accent-soft)" : "var(--surface-3)",
        border: "1px solid " + (isVar ? "oklch(0.78 0.12 290 / 0.4)" : "var(--border)"),
        fontSize: 12,
        fontFamily: isVar ? "JetBrains Mono" : "Syne",
        fontWeight: isVar ? 500 : 600,
        color: isVar ? "var(--accent)" : "var(--text)",
        cursor: "grab",
        transform: active ? "translateY(-1px)" : "none",
        transition: "transform 0.15s ease",
      }}
    >
      {isVar && <Icon name="sparkle" size={10} />}
      {token.label}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          marginLeft: 2,
          opacity: 0.6,
          display: "inline-flex",
        }}
      >
        <Icon name="x" size={10} />
      </button>
    </span>
  )
}

function DictionaryPanel({
  config,
  onChange,
}: {
  config: ToolConfigData
  onChange: (p: Partial<ToolConfigData>) => void
}) {
  const addEntry = () => {
    onChange({
      dictionary: [
        ...config.dictionary,
        {
          sigla: "NEW",
          fullName: "Nueva entrada",
          dni: "00000000-X",
          keywords: ["NUEVA"],
          color: "#7AD7FF",
        },
      ],
    })
  }
  const removeEntry = (i: number) => onChange({ dictionary: config.dictionary.filter((_, j) => j !== i) })
  const updateEntry = (i: number, patch: Partial<DictionaryEntry>) => {
    const arr = [...config.dictionary]
    arr[i] = { ...arr[i], ...patch }
    onChange({ dictionary: arr })
  }

  return (
    <div style={{ marginTop: 32 }}>
      <Bento style={{ padding: 28 }}>
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            marginBottom: 18,
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <Kicker style={{ marginBottom: 6 }}>Variable Mapper · diccionario de detección</Kicker>
            <h3 className="t-display" style={{ fontSize: 28, margin: 0, fontWeight: 600 }}>
              Si detecta <span className="italic-serif">esto</span>, asigna{" "}
              <span className="italic-serif">esto otro</span>.
            </h3>
          </div>
          <button className="btn btn-accent" onClick={addEntry} style={{ fontSize: 13 }}>
            <Icon name="plus" size={14} /> Añadir entrada
          </button>
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: 20,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.6fr 0.8fr 1.4fr 60px",
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-2)",
            }}
          >
            <div className="t-kicker">Sigla</div>
            <div className="t-kicker">Nombre completo</div>
            <div className="t-kicker">DNI / NIE</div>
            <div className="t-kicker">Keywords detectables</div>
            <div></div>
          </div>
          {config.dictionary.length === 0 && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--text-3)",
                fontFamily: "Instrument Serif",
                fontStyle: "italic",
                fontSize: 14,
              }}
            >
              Sin entradas todavía — añade la primera para empezar a detectar.
            </div>
          )}
          {config.dictionary.map((d, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.6fr 0.8fr 1.4fr 60px",
                padding: "18px 20px",
                borderBottom: i === config.dictionary.length - 1 ? "none" : "1px solid var(--border)",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <input
                  value={d.sigla}
                  onChange={(e) => updateEntry(i, { sigla: e.target.value.toUpperCase() })}
                  style={{
                    width: 56,
                    height: 36,
                    borderRadius: 10,
                    background: d.color,
                    color: "#0A0A0A",
                    textAlign: "center",
                    fontFamily: "Syne",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "1px solid var(--border)",
                    outline: "none",
                  }}
                />
                <Icon name="arrowRight" size={12} className="muted-3" />
              </div>
              <input
                value={d.fullName}
                onChange={(e) => updateEntry(i, { fullName: e.target.value })}
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  fontFamily: "Syne",
                }}
              />
              <input
                value={d.dni}
                onChange={(e) => updateEntry(i, { dni: e.target.value })}
                className="t-mono muted-2"
                style={{
                  fontSize: 12,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-2)",
                }}
              />
              <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                {d.keywords.map((k, ki) => (
                  <span key={k + ki} className="chip" style={{ fontSize: 10 }}>
                    {k}
                    <button
                      onClick={() => updateEntry(i, { keywords: d.keywords.filter((_, j) => j !== ki) })}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-3)",
                        cursor: "pointer",
                        padding: 0,
                        marginLeft: 2,
                        display: "inline-flex",
                      }}
                    >
                      <Icon name="x" size={9} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    const k = window.prompt("Nueva keyword (mayúsculas):")
                    if (k) updateEntry(i, { keywords: [...d.keywords, k.trim().toUpperCase()] })
                  }}
                  className="chip"
                  style={{ cursor: "pointer", fontSize: 10, opacity: 0.6 }}
                >
                  <Icon name="plus" size={9} />
                </button>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => removeEntry(i)}
                style={{ padding: "6px 8px", justifyContent: "center" }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: "wrap" }}>
          <span className="chip">
            <Icon name="check" size={11} /> Match case-insensitive
          </span>
          <span className="chip">
            <Icon name="check" size={11} /> Tolera tildes
          </span>
          <span className="chip">
            <Icon name="check" size={11} /> Reemplaza guiones por espacios
          </span>
        </div>
      </Bento>
    </div>
  )
}

function ColumnHeader({
  number,
  title,
  subtitle,
  rightAction,
}: {
  number: string
  title: string
  subtitle: string
  rightAction?: ReactNode
}) {
  return (
    <div
      className="row"
      style={{ justifyContent: "space-between", marginBottom: 18, alignItems: "flex-start" }}
    >
      <div className="row" style={{ gap: 12 }}>
        <div
          style={{
            fontFamily: "Instrument Serif",
            fontStyle: "italic",
            fontSize: 36,
            lineHeight: 1,
            color: "var(--text-3)",
          }}
        >
          {number}
        </div>
        <div>
          <div className="t-display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
            {title}
          </div>
          <div className="italic-serif muted-2" style={{ fontSize: 13 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {rightAction}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div className="t-kicker">{label}</div>
        {hint && (
          <div className="italic-serif muted-3" style={{ fontSize: 11 }}>
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        background: "var(--surface-2)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        width: "100%",
      }}
    >
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            flex: 1,
            padding: "8px 10px",
            background: value === o ? "var(--text)" : "transparent",
            color: value === o ? "var(--bg)" : "var(--text-2)",
            border: "none",
            borderRadius: 9,
            fontFamily: "Syne",
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.2s",
          } as CSSProperties}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange?: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36,
        height: 22,
        borderRadius: 999,
        background: on ? "var(--accent)" : "var(--surface-3)",
        border: "1px solid var(--border)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 16 : 2,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: "#0A0A0A",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  )
}
