"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Tool, ToolStats } from "@/lib/types"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import { useAdmin } from "../admin-context"

type Phase = "idle" | "running" | "done"

export function ToolRun({ tool, stats }: { tool: Tool; stats: ToolStats }) {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [phase, setPhase] = useState<Phase>("idle")
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [runOutput, setRunOutput] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string>("resultado")
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Init user vars from config defaults
  const userVarsInit: Record<string, string> = {}
  for (const v of tool.config.userVars) userVarsInit[v.key] = v.default
  const [vars, setVars] = useState<Record<string, string>>(userVarsInit)

  const execute = async () => {
    setPhase("running")
    setRunError(null)
    setRunOutput(null)
    setDownloadUrl(null)

    try {
      const formData = new FormData()
      if (droppedFiles.length > 0) {
        droppedFiles.forEach((file) => formData.append("files", file))
      }
      formData.append("userVars", JSON.stringify(vars))

      const res = await fetch(`/api/tools/${tool.id}/run`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Error desconocido" }))
        setRunError(errData.error || "Error en la ejecución")
        setPhase("done")
        return
      }

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        const arrayBuffer = await res.arrayBuffer()
        const disposition = res.headers.get("content-disposition") || ""
        const match = disposition.match(/filename="?([^"]+)"?/)
        let filename = match ? match[1] : "resultado.zip"
        filename = filename.replace(/[/\\?%*:|"<>]/g, '-')
        
        // Determine proper MIME type from filename
        const mimeType = filename.endsWith(".zip") ? "application/zip" 
          : filename.endsWith(".pdf") ? "application/pdf" 
          : "application/octet-stream"
        
        // Create blob with correct MIME type
        const blob = new Blob([arrayBuffer], { type: mimeType })
        const url = window.URL.createObjectURL(blob)
        
        setDownloadName(filename)
        setDownloadUrl(url)

        // Auto-download using a hidden link
        triggerDownload(url, filename)
        
      } else {
        const data = await res.json()
        if (data.stdout) setRunOutput(data.stdout.trim())
        if (data.error) setRunError(data.error)
      }

      setPhase("done")
    } catch (e: any) {
      setRunError(e.message || "Error de red")
      setPhase("done")
    }
  }

  const reset = () => {
    setPhase("idle")
    setDroppedFiles([])
    setRunOutput(null)
    setRunError(null)
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl(null)
  }

  const triggerDownload = (blobUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename
    link.setAttribute("download", filename) // double-set for older browsers
    link.style.cssText = "position:fixed;left:-9999px;top:-9999px"
    document.body.appendChild(link)
    
    // Use setTimeout to ensure the DOM has registered the element
    setTimeout(() => {
      link.click()
      // Keep the element alive long enough for the download to start
      setTimeout(() => {
        document.body.removeChild(link)
      }, 2000)
    }, 100)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    if (e.dataTransfer.files) {
      setDroppedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDroppedFiles((prev) => [...prev, ...Array.from(e.target.files)])
    }
  }

  const canExecute = !tool.config.requiresFile || droppedFiles.length > 0

  return (
    <div className="page" style={{ padding: "32px 40px 80px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/")}
          style={{ padding: "6px 10px", fontSize: 12, marginBottom: 16 }}
        >
          <Icon name="arrowLeft" size={13} />
          Volver
        </button>
        <div className="row" style={{ gap: 16, marginBottom: 8 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: tool.iconBg,
              color: tool.iconColor || "#FFFFFF",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name={tool.icon} size={24} />
          </div>
          <div>
            <h1 className="t-display" style={{ fontSize: "clamp(32px, 4vw, 44px)", margin: 0 }}>
              {tool.name}
            </h1>
            <p className="italic-serif muted" style={{ fontSize: 15, margin: 0, marginTop: 4 }}>
              {tool.tagline}
            </p>
          </div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          {isAdmin && (
            <button className="btn" onClick={() => router.push(`/tools/${tool.id}/config`)} style={{ fontSize: 12 }}>
              <Icon name="settings" size={13} /> Configurar
            </button>
          )}
          {phase !== "idle" && (
            <button className="btn" onClick={reset} style={{ fontSize: 12 }}>
              <Icon name="x" size={13} /> Reiniciar
            </button>
          )}
        </div>
      </div>

      {phase === "idle" && (
        <div className="col" style={{ gap: 20 }}>
          {/* User variables form */}
          {tool.config.userVars.length > 0 && (
            <Bento style={{ padding: 28 }}>
              <div className="t-kicker" style={{ marginBottom: 16 }}>Datos de entrada</div>
              <div style={{
                display: "grid",
                gridTemplateColumns: tool.config.userVars.length > 2 ? "1fr 1fr" : "1fr",
                gap: 16,
              }}>
                {tool.config.userVars.map((v) => (
                  <div key={v.key}>
                    <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>
                      {v.label}
                    </label>
                    {v.type === "select" && v.options ? (
                      <select
                        className="input"
                        value={vars[v.key] ?? ""}
                        onChange={(e) => setVars({ ...vars, [v.key]: e.target.value })}
                      >
                        {v.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input"
                        type={v.type === "number" ? "number" : v.type === "date" ? "date" : "text"}
                        value={vars[v.key] ?? ""}
                        placeholder={v.default || `Introduce ${v.label.toLowerCase()}`}
                        onChange={(e) => setVars({ ...vars, [v.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Bento>
          )}

          {/* File drop zone */}
          {tool.config.requiresFile && (
            <Bento
              style={{ padding: 0, cursor: "pointer" }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              onDragEnter={(e: React.DragEvent) => { e.preventDefault(); dragCounter.current++ }}
              onDragLeave={(e: React.DragEvent) => { e.preventDefault(); dragCounter.current-- }}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                multiple
              />
              <div
                className="col"
                style={{
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 24px",
                  borderRadius: "var(--radius-card)",
                  border: droppedFiles.length > 0 ? `2px solid ${tool.iconBg}` : "2px dashed var(--border-strong)",
                  background: droppedFiles.length > 0 ? `${tool.iconBg}08` : "transparent",
                  transition: "all 0.3s ease",
                }}
              >
                {droppedFiles.length > 0 ? (
                  <div className="col" style={{ gap: 12, alignItems: "center", width: "100%" }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: tool.iconBg,
                      color: "#FFFFFF",
                      display: "grid",
                      placeItems: "center",
                    }}>
                      <Icon name="check" size={22} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, textAlign: "center" }}>
                      {droppedFiles.length} archivo{droppedFiles.length !== 1 ? 's' : ''} seleccionado{droppedFiles.length !== 1 ? 's' : ''}
                    </div>
                    <div className="muted-2" style={{ fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      {droppedFiles.slice(0, 3).map((f, i) => (
                        <span key={i}>{f.name}</span>
                      ))}
                      {droppedFiles.length > 3 && <span>y {droppedFiles.length - 3} más...</span>}
                      <span style={{ marginTop: 8 }}>Haz clic para añadir más</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: "var(--surface-2)",
                      color: "var(--text-3)",
                      display: "grid",
                      placeItems: "center",
                    }}>
                      <Icon name="upload" size={22} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      Arrastra archivos aquí
                    </div>
                    <div className="muted-2" style={{ fontSize: 13 }}>
                      o haz clic para seleccionar
                    </div>
                  </>
                )}
              </div>
            </Bento>
          )}

          {/* Execute button */}
          <button
            className="btn btn-accent"
            onClick={execute}
            disabled={!canExecute}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "16px 24px",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 18,
              opacity: canExecute ? 1 : 0.5,
            }}
          >
            <Icon name="zap" size={18} />
            Ejecutar
          </button>
        </div>
      )}

      {/* Running state */}
      {phase === "running" && (
        <Bento className="aura" style={{ padding: 48, textAlign: "center" }}>
          <div className="col" style={{ gap: 16, alignItems: "center" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: tool.iconBg,
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              animation: "aura-pulse 2s ease-in-out infinite",
            }}>
              <Icon name="zap" size={28} />
            </div>
            <div className="t-display" style={{ fontSize: 24 }}>Procesando…</div>
            <div className="italic-serif muted" style={{ fontSize: 14 }}>
              Ejecutando código Python en el servidor
            </div>
          </div>
        </Bento>
      )}

      {/* Result state */}
      {phase === "done" && (
        <div className="col" style={{ gap: 20 }}>
          <Bento style={{
            padding: 28,
            background: runError
              ? "rgba(231,76,60,0.04)"
              : `linear-gradient(160deg, ${tool.iconBg}10 0%, var(--surface) 60%)`,
          }}>
            {runError ? (
              <>
                <div className="row" style={{ gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(231,76,60,0.1)",
                    color: "#E74C3C",
                    display: "grid",
                    placeItems: "center",
                  }}>
                    <Icon name="x" size={18} />
                  </div>
                  <div className="t-display" style={{ fontSize: 20, color: "#E74C3C" }}>
                    Error en la ejecución
                  </div>
                </div>
                <pre style={{
                  background: "#1a1a1a",
                  color: "#E74C3C",
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  lineHeight: 1.6,
                }}>
                  {runError}
                </pre>
              </>
            ) : (
              <>
                <div className="row" style={{ gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${tool.iconBg}20`,
                    color: tool.iconBg,
                    display: "grid",
                    placeItems: "center",
                  }}>
                    <Icon name="check" size={18} />
                  </div>
                  <div className="t-display" style={{ fontSize: 20 }}>
                    {downloadUrl ? "Listo para descargar" : "Ejecución completada"}
                  </div>
                </div>

                {runOutput && (
                  <pre style={{
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}>
                    {runOutput}
                  </pre>
                )}
              </>
            )}

            <div className="row" style={{ gap: 10, marginTop: 8 }}>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadName}
                  className="btn btn-accent"
                  style={{ flex: 1, justifyContent: "center", textDecoration: "none", padding: "14px 20px" }}
                >
                  <Icon name="download" size={15} /> Descargar {downloadName}
                </a>
              )}
              <button className="btn" onClick={execute} style={{ padding: "14px 20px" }}>
                <Icon name="zap" size={13} /> Volver a ejecutar
              </button>
              <button className="btn" onClick={reset} style={{ padding: "14px 20px" }}>
                <Icon name="x" size={13} /> Nueva ejecución
              </button>
            </div>
          </Bento>

          {/* Stats */}
          <Bento style={{ padding: 22 }}>
            <div className="t-kicker" style={{ marginBottom: 12 }}>Histórico</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
              {[
                { n: String(stats.runs), label: "ejecuciones" },
                { n: String(stats.generated), label: "archivos" },
                { n: String(stats.errors), label: "errores" },
                { n: stats.avgDuration, label: "media" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="t-display" style={{ fontSize: 24, lineHeight: 1 }}>{s.n}</div>
                  <div className="italic-serif muted-2" style={{ fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Bento>
        </div>
      )}
    </div>
  )
}
