"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Tool, ToolStats } from "@/lib/types"
import { Bento, Kicker } from "@/components/bento"
import { Icon } from "@/components/icon"
import { useAdmin } from "../admin-context"

type Detected = {
  sigla: string
  name: string
  dni: string
  page: number
  color: string
}

type Phase = "idle" | "dropping" | "processing" | "preview"

const FALLBACK_PIPELINE = [
  { title: "Decrypt PDF", icon: "lock", idle: "esperando…", doing: "aplicando clave", done: "desbloqueado", duration: "0.3s" },
  { title: "Extract Text", icon: "eye", idle: "esperando…", doing: "OCR de las páginas", done: "páginas leídas", duration: "0.8s" },
  { title: "Variable Mapper", icon: "brain", idle: "esperando…", doing: "cruzando con diccionario", done: "firmantes detectados", duration: "0.4s" },
  { title: "Split by Page", icon: "scissors", idle: "esperando…", doing: "partiendo el archivo", done: "archivos creados", duration: "0.6s" },
  { title: "Rename Output", icon: "type", idle: "esperando…", doing: "aplicando plantilla", done: "nombres aplicados", duration: "0.7s" },
]

export function ToolRun({ tool, stats }: { tool: Tool; stats: ToolStats }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("idle")
  const [activeStep, setActiveStep] = useState(-1)
  const [detected, setDetected] = useState<Detected[]>([])
  const [runOutput, setRunOutput] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const { isAdmin } = useAdmin()
  const dragCounter = useRef(0)
  const startedAt = useRef<number>(0)

  const userVarsInit: Record<string, string> = {}
  for (const v of tool.config.userVars) userVarsInit[v.key] = v.default
  const [vars, setVars] = useState<Record<string, string>>(userVarsInit)

  const pipelineSrc = tool.config.steps.length > 0
    ? tool.config.steps.map((s) => ({
      title: s.title,
      icon: s.icon,
      idle: "esperando…",
      doing: s.summary || "ejecutando…",
      done: "listo",
      duration: "0.5s",
    }))
    : FALLBACK_PIPELINE

  // Animate pipeline steps while real execution happens in the background
  useEffect(() => {
    if (phase !== "processing") return
    startedAt.current = performance.now()
    const stepCount = pipelineSrc.length
    const seq: { delay: number; action: () => void }[] = []
    pipelineSrc.forEach((_, i) => {
      seq.push({ delay: 500 + i * 600, action: () => setActiveStep(i) })
    })
    const timers = seq.map((s) => setTimeout(s.action, s.delay))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Real execution: send file + vars to backend
  useEffect(() => {
    if (phase !== "processing") return
    setRunError(null)
    setRunOutput(null)
    setDownloadUrl(null)

    const execute = async () => {
      try {
        const formData = new FormData()
        if (droppedFile) formData.append("file", droppedFile)
        formData.append("userVars", JSON.stringify(vars))

        const res = await fetch(`/api/tools/${tool.id}/run`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Error desconocido" }))
          setRunError(errData.error || "Error en la ejecución")
          setPhase("preview")
          return
        }

        const contentType = res.headers.get("content-type") || ""
        if (contentType.includes("application/zip") || contentType.includes("application/octet-stream")) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          setDownloadUrl(url)
        } else {
          const data = await res.json()
          if (data.stdout) setRunOutput(data.stdout.trim())
          if (data.error) setRunError(data.error)
        }

        setPhase("preview")
      } catch (e: any) {
        setRunError(e.message || "Error de red")
        setPhase("preview")
      }
    }

    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tool.id])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDetected([])
    setActiveStep(-1)
    const file = e.dataTransfer.files?.[0] ?? null
    setDroppedFile(file)
    setPhase("processing")
  }
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (phase === "idle") setPhase("dropping")
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current <= 0 && phase === "dropping") setPhase("idle")
  }
  const handleManualRun = () => {
    if (phase !== "idle") return
    setDetected([])
    setActiveStep(-1)
    setPhase("processing")
  }
  const reset = () => {
    setPhase("idle")
    setActiveStep(-1)
    setDetected([])
    setDroppedFile(null)
    setRunOutput(null)
    setRunError(null)
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl(null)
  }

  const month = vars.mes || "Marzo"
  const year = vars.ano || "2026"

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => router.push("/")}
            style={{ padding: "6px 10px", fontSize: 12, marginBottom: 14 }}
          >
            <Icon name="arrowLeft" size={13} />
            Volver
          </button>
          <Kicker style={{ marginBottom: 8 }}>Ejecutar tool · estado en vivo</Kicker>
          <h1 className="t-display" style={{ fontSize: "clamp(40px, 5vw, 56px)", margin: 0, lineHeight: 0.95 }}>
            {tool.name}
          </h1>
          <p className="italic-serif muted" style={{ fontSize: 17, marginTop: 6 }}>
            {tool.tagline}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {phase !== "idle" && (
            <button className="btn" onClick={reset}>
              <Icon name="x" size={13} /> Reiniciar
            </button>
          )}
          {isAdmin && (
            <button className="btn" onClick={() => router.push(`/tools/${tool.id}/config`)}>
              <Icon name="settings" size={13} /> Configurar
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }}>
        <div className="col" style={{ gap: 18 }}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleManualRun}
            style={{ position: "relative" }}
          >
            <Bento
              className={`${phase === "dropping" ? "drop-active" : ""} ${phase === "processing" ? "aura" : ""}`}
              style={{
                padding: 32,
                minHeight: 280,
                cursor: phase === "idle" ? "pointer" : "default",
                background: phase === "dropping" ? "var(--accent-soft)" : undefined,
                transition: "background 0.3s ease",
              }}
            >
              {phase === "idle" && <DropIdle tool={tool} vars={vars} setVars={setVars} />}
              {phase === "dropping" && <DropActive />}
              {phase === "processing" && <DropProcessing />}
              {phase === "preview" && <DropPreview detected={detected} month={month} year={year} runOutput={runOutput} runError={runError} />}
            </Bento>
          </div>

          {(phase === "processing" || phase === "preview") && (
            <Bento style={{ padding: 24 }}>
              <div className="t-kicker" style={{ marginBottom: 14 }}>
                Pipeline · ejecutando
              </div>
              <div className="col" style={{ gap: 8, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 19,
                    top: 24,
                    bottom: 24,
                    width: 1,
                    background: "var(--border)",
                  }}
                />
                {pipelineSrc.map((s, i) => (
                  <div
                    key={i}
                    className="row"
                    style={{
                      padding: 12,
                      background: i === activeStep ? "var(--accent-soft)" : "transparent",
                      borderRadius: 12,
                      gap: 12,
                      border: "1px solid " + (i === activeStep ? "oklch(0.78 0.12 290 / 0.4)" : "transparent"),
                      transition: "all 0.3s ease",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: i < activeStep ? "var(--accent)" : i === activeStep ? "var(--bg)" : "var(--surface-2)",
                        color: i < activeStep ? "#0A0A0A" : "var(--text-2)",
                        border: "1px solid " + (i === activeStep ? "var(--accent)" : "var(--border)"),
                        display: "grid",
                        placeItems: "center",
                        animation: i === activeStep ? "aura-pulse 1.5s ease-in-out infinite" : "none",
                      }}
                    >
                      {i < activeStep ? <Icon name="check" size={13} /> : <Icon name={s.icon} size={13} />}
                    </div>
                    <div className="col" style={{ gap: 0, flex: 1, alignItems: "flex-start" }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="t-mono muted-3" style={{ fontSize: 10 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                      </div>
                      <div className="italic-serif muted-2" style={{ fontSize: 12 }}>
                        {i < activeStep ? s.done : i === activeStep ? s.doing : s.idle}
                      </div>
                    </div>
                    {i < activeStep && (
                      <span className="t-mono muted-2" style={{ fontSize: 10 }}>
                        {s.duration}
                      </span>
                    )}
                    {i === activeStep && (
                      <span className="chip chip-accent" style={{ fontSize: 10 }}>
                        {"\u25CF running"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Bento>
          )}
        </div>

        <div className="col" style={{ gap: 18 }}>
          <Bento style={{ padding: 22 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <div className="t-kicker">Detecciones</div>
              <span className="italic-serif muted-2" style={{ fontSize: 12 }}>
                en vivo
              </span>
            </div>

            {detected.length === 0 && (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  background: "var(--surface-2)",
                  borderRadius: 14,
                  border: "1px dashed var(--border)",
                }}
              >
                <Icon name="search" size={20} className="muted-3" style={{ marginBottom: 8 }} />
                <div className="italic-serif muted-2" style={{ fontSize: 13 }}>
                  Esperando archivo…
                </div>
              </div>
            )}

            <div className="col" style={{ gap: 10 }}>
              {detected.map((d, i) => (
                <DetectionCard key={i} d={d} month={month} year={year} index={stats.runs * 2 + i + 1} />
              ))}
            </div>
          </Bento>

          {phase === "preview" && (
            <Bento
              style={{ padding: 22, background: runError ? "rgba(255,107,74,0.06)" : "linear-gradient(160deg, var(--accent-soft) 0%, var(--surface) 60%)" }}
            >
              {runError ? (
                <>
                  <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                    <Icon name="x" size={16} style={{ color: "#FF6B4A" }} />
                    <div className="t-display" style={{ fontSize: 18, fontWeight: 600, color: "#FF6B4A" }}>
                      Error en la ejecución
                    </div>
                  </div>
                  <pre style={{
                    background: "#0A0A0A",
                    color: "#FF6B4A",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: "JetBrains Mono, monospace",
                    overflowX: "auto",
                    marginBottom: 12,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}>
                    {runError}
                  </pre>
                </>
              ) : (
                <>
                  <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                    <Icon name="check" size={16} style={{ color: "var(--accent)" }} />
                    <div className="t-display" style={{ fontSize: 18, fontWeight: 600 }}>
                      {downloadUrl ? "Listo para descargar" : "Ejecución completada"}
                    </div>
                  </div>
                  {runOutput && (
                    <pre style={{
                      background: "var(--surface-2)",
                      color: "var(--text)",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "JetBrains Mono, monospace",
                      marginBottom: 12,
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}>
                      {runOutput}
                    </pre>
                  )}
                </>
              )}
              <div className="row" style={{ gap: 8 }}>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`mcmtools_${tool.id}_${Date.now()}.zip`}
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
                  >
                    <Icon name="download" size={13} /> Descargar .zip
                  </a>
                )}
                <button className="btn" onClick={reset}>
                  <Icon name="x" size={13} /> Reiniciar
                </button>
              </div>
              <div className="t-mono muted-3" style={{ fontSize: 10, marginTop: 14, textAlign: "center" }}>
                {`histórico: ${stats.runs + 1} ejecuciones`}
              </div>
            </Bento>
          )}


          <Bento style={{ padding: 22 }}>
            <div className="t-kicker" style={{ marginBottom: 12 }}>
              Histórico
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stat n={String(stats.runs)} label="ejecuciones" />
              <Stat n={String(stats.generated)} label="archivos generados" />
              <Stat n={String(stats.errors)} label="errores" />
              <Stat n={stats.avgDuration} label="media de proceso" />
            </div>
          </Bento>
        </div>
      </div>
    </div>
  )
}

function DropIdle({
  tool,
  vars,
  setVars,
}: {
  tool: Tool
  vars: Record<string, string>
  setVars: (v: Record<string, string>) => void
}) {
  return (
    <div
      className="col"
      style={{ gap: 24, alignItems: "center", justifyContent: "center", minHeight: 240 }}
    >
      <div className="col" style={{ gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: tool.iconBg,
            color: tool.iconColor,
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--border)",
          }}
        >
          <Icon name="upload" size={26} stroke={1.7} />
        </div>
        <div className="t-display" style={{ fontSize: 26, fontWeight: 600, textAlign: "center" }}>
          Arrastra el archivo aquí
        </div>
        <div className="italic-serif muted" style={{ fontSize: 14, textAlign: "center" }}>
          o haz clic para simular · acepta {tool.inputType}
        </div>
      </div>

      {tool.config.userVars.length > 0 && (
        <div
          className="row"
          style={{
            gap: 10,
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {tool.config.userVars.map((v) => (
            <div key={v.key} className="col" style={{ gap: 4, alignItems: "flex-start" }}>
              <div className="t-kicker">{v.label}</div>
              <input
                className="input input-mono"
                value={vars[v.key] ?? ""}
                onChange={(e) => setVars({ ...vars, [v.key]: e.target.value })}
                style={{ width: 130 }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DropActive() {
  return (
    <div
      className="col"
      style={{ gap: 12, alignItems: "center", justifyContent: "center", minHeight: 240 }}
    >
      <Icon name="filePdf" size={48} style={{ color: "var(--accent)" }} />
      <div className="t-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--accent)" }}>
        Suelta para procesar
      </div>
      <div className="italic-serif muted" style={{ fontSize: 14 }}>
        el motor está despierto
      </div>
    </div>
  )
}

function DropProcessing() {
  return (
    <div
      className="col"
      style={{
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 100,
          height: 130,
          background: "var(--surface-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 10 }}>
          {[8, 5, 7, 4, 6, 3, 7, 5, 6, 4].map((w, i) => (
            <div
              key={i}
              style={{
                height: 4,
                background: "var(--border-strong)",
                borderRadius: 2,
                marginBottom: 6,
                width: `${w * 10}%`,
              }}
            />
          ))}
        </div>
        <div className="scan-line" />
      </div>
      <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>
        Escaneando…
      </div>
      <div className="italic-serif muted" style={{ fontSize: 13 }}>
        buscando keywords del diccionario
      </div>
    </div>
  )
}

function DropPreview({
  detected,
  month,
  year,
}: {
  detected: Detected[]
  month: string
  year: string
}) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="t-kicker" style={{ marginBottom: 4 }}>
            Resultado
          </div>
          <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>
            {detected.length} archivos generados
          </div>
        </div>
        <span className="chip chip-accent">
          <Icon name="check" size={11} /> listo
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {detected.map((d, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: d.color }} />
            <Icon name="filePdf" size={22} className="muted-2" style={{ marginBottom: 10 }} />
            <div
              className="t-mono"
              style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.5, wordBreak: "break-all" }}
            >
              <span style={{ color: "var(--accent)" }}>{19 + i}</span>.Nomina{" "}
              <span style={{ color: d.color }}>{d.sigla}</span> {month} {year}
              <span className="muted-2">.pdf</span>
            </div>
            <div className="italic-serif muted-2" style={{ fontSize: 11, marginTop: 8 }}>
              página {d.page} · detectado: {d.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetectionCard({
  d,
  month,
  year,
  index,
}: {
  d: Detected
  month: string
  year: string
  index: number
}) {
  return (
    <div
      style={{
        padding: 14,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        animation: "page-in 0.4s ease",
      }}
    >
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: d.color,
            color: "#0A0A0A",
            display: "grid",
            placeItems: "center",
            fontFamily: "Syne",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {d.sigla}
        </div>
        <div className="col" style={{ gap: 0, alignItems: "flex-start", flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
          <div className="t-mono muted-3" style={{ fontSize: 10 }}>
            {d.dni} · pág. {d.page}
          </div>
        </div>
        <Icon name="check" size={14} style={{ color: "var(--accent)" }} />
      </div>
      <div
        className="t-mono"
        style={{
          fontSize: 11,
          padding: 8,
          background: "var(--bg)",
          borderRadius: 8,
          wordBreak: "break-all",
        }}
      >
        <span style={{ color: "var(--accent)" }}>{index}</span>.Nomina{" "}
        <span style={{ color: d.color }}>{d.sigla}</span> {month} {year}
        <span className="muted-2">.pdf</span>
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="t-display" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>
        {n}
      </div>
      <div className="italic-serif muted-2" style={{ fontSize: 12, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}
