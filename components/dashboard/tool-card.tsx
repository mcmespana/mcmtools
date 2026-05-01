"use client"

import { useEffect, useState } from "react"
import type { Tool } from "@/lib/types"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"

export function ToolCard({
  tool,
  index,
  adminMode,
  renaming,
  onStartRename,
  onFinishRename,
  onOpen,
  onConfigure,
  onDelete,
  onDuplicate,
  onToggleStatus,
  isDragged,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  tool: Tool
  index: number
  adminMode: boolean
  renaming: boolean
  onStartRename: () => void
  onFinishRename: (name: string) => void
  onOpen: () => void
  onConfigure: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleStatus: () => void
  isDragged?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnter?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
}) {
  const [hover, setHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(tool.name)
  const span = tool.span ?? { col: 4, row: 1 }

  useEffect(() => {
    setNameDraft(tool.name)
  }, [tool.name])

  return (
    <Bento
      hoverLift={!adminMode}
      draggable={adminMode}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        padding: 26,
        minHeight: 200,
        cursor: adminMode ? "grab" : "pointer",
        position: "relative",
        background: `linear-gradient(160deg, ${tool.tint || tool.iconBg + "1A"} 0%, var(--surface) 60%)`,
        outline: isDragOver ? "2px dashed var(--accent)" : adminMode ? "1px solid var(--border-strong)" : "none",
        overflow: menuOpen ? "visible" : "hidden",
        zIndex: menuOpen ? 30 : isDragOver ? 20 : 1,
        opacity: isDragged ? 0.3 : 1,
        transform: isDragOver ? "scale(1.02)" : "scale(1)",
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setMenuOpen(false)
      }}
      onClick={onOpen}
    >
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 22,
          fontFamily: "Instrument Serif",
          fontStyle: "italic",
          color: "var(--text-4)",
          fontSize: 22,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="col" style={{ height: "100%", justifyContent: "space-between", gap: 16 }}>
        <div className="col" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: tool.iconBg || "var(--surface-3)",
                color: tool.iconColor || "var(--text)",
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--border)",
              }}
            >
              <Icon name={tool.icon} size={20} stroke={1.7} />
            </div>
            {tool.status === "active" && <span className="chip chip-accent">{"\u25CF ACTIVE"}</span>}
            {tool.status === "draft" && <span className="chip">DRAFT</span>}
            {tool.status === "idle" && <span className="chip">IDLE</span>}
            {tool.status === "archived" && (
              <span className="chip" style={{ opacity: 0.6 }}>
                ARCHIVED
              </span>
            )}
          </div>

          <div>
            {renaming ? (
              <input
                className="input"
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => onFinishRename(nameDraft || tool.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onFinishRename(nameDraft || tool.name)
                  if (e.key === "Escape") {
                    setNameDraft(tool.name)
                    onFinishRename(tool.name)
                  }
                }}
                style={{ fontSize: 20, fontWeight: 600, fontFamily: "Syne" }}
              />
            ) : (
              <div
                className="t-display"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  color: "var(--text)",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {tool.name}
              </div>
            )}
            <div className="italic-serif" style={{ fontSize: 14, marginTop: 4, color: "var(--text-2)" }}>
              {tool.tagline}
            </div>
          </div>

          {span.col >= 6 && tool.description && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                maxWidth: 460,
                margin: 0,
                color: "var(--text-2)",
              }}
            >
              {tool.description}
            </p>
          )}
        </div>

        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
          <div className="row" style={{ gap: 6 }}>
            <span className="chip">
              <Icon name={tool.inputIcon} size={11} />
              {tool.inputType}
            </span>
            <Icon name="arrowRight" size={11} className="muted-3" />
            <span className="chip">
              <Icon name={tool.outputIcon} size={11} />
              {tool.outputType}
            </span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {adminMode && (
              <div style={{ position: "relative" }}>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(!menuOpen)
                  }}
                  style={{ padding: "6px 10px", fontSize: 12 }}
                >
                  <Icon name="more" size={13} />
                  Acciones
                </button>
                {menuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: "calc(100% + 6px)",
                      background: "var(--surface)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 14,
                      padding: 6,
                      minWidth: 200,
                      boxShadow: "0 24px 40px -10px rgba(0,0,0,0.4)",
                      zIndex: 20,
                    }}
                  >
                    <MenuItem
                      icon="settings"
                      label="Configurar"
                      onClick={() => {
                        setMenuOpen(false)
                        onConfigure()
                      }}
                    />
                    <MenuItem
                      icon="type"
                      label="Renombrar"
                      onClick={() => {
                        setMenuOpen(false)
                        onStartRename()
                      }}
                    />
                    <MenuItem
                      icon="layers"
                      label="Duplicar"
                      onClick={() => {
                        setMenuOpen(false)
                        onDuplicate()
                      }}
                    />
                    <MenuItem
                      icon={tool.status === "archived" ? "sparkle" : "archive"}
                      label={tool.status === "archived" ? "Reactivar" : "Archivar"}
                      onClick={() => {
                        setMenuOpen(false)
                        onToggleStatus()
                      }}
                    />
                    <div className="divider" style={{ margin: "4px 0" }} />
                    <MenuItem
                      icon="x"
                      label="Eliminar"
                      danger
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete()
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {hover && !adminMode && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "var(--radius-card)",
            pointerEvents: "none",
            background: `radial-gradient(circle at ${tool.featured ? "70% 30%" : "50% 0%"}, ${tool.glow || "oklch(0.78 0.14 290 / 0.18)"}, transparent 50%)`,
            transition: "opacity 0.4s",
          }}
        />
      )}
    </Bento>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="row"
      style={{
        width: "100%",
        padding: "8px 10px",
        gap: 10,
        background: "transparent",
        border: "none",
        borderRadius: 9,
        cursor: "pointer",
        textAlign: "left",
        color: danger ? "#E74C3C" : "var(--text)",
        fontFamily: "Syne",
        fontWeight: 500,
        fontSize: 13,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  )
}
