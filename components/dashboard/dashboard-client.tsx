"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Tool } from "@/lib/types"
import { Bento, Kicker } from "@/components/bento"
import { Icon } from "@/components/icon"
import { ToolCard } from "./tool-card"
import { ConfirmModal } from "./confirm-modal"

export function DashboardClient({ initialTools }: { initialTools: Tool[] }) {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>(initialTools)
  const [adminMode, setAdminMode] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Tool | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const refresh = () => {
    startTransition(() => router.refresh())
  }

  const optimisticUpdate = (id: string, patch: Partial<Tool>) => {
    setTools((curr) => curr.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const handleRename = async (id: string, name: string) => {
    optimisticUpdate(id, { name })
    setRenaming(null)
    try {
      await fetch(`/api/tools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      refresh()
    } catch (e) {
      console.error("[v0] rename failed", e)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const target = tools.find((t) => t.id === id)
    if (!target) return
    const next = target.status === "archived" ? "idle" : "archived"
    optimisticUpdate(id, { status: next })
    try {
      await fetch(`/api/tools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      refresh()
    } catch (e) {
      console.error("[v0] toggle status failed", e)
    }
  }

  const handleDelete = async (id: string) => {
    setTools((curr) => curr.filter((t) => t.id !== id))
    try {
      await fetch(`/api/tools/${id}`, { method: "DELETE" })
      refresh()
    } catch (e) {
      console.error("[v0] delete failed", e)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/tools/${id}/duplicate`, { method: "POST" })
      const data = await res.json()
      if (data.tool) {
        const idx = tools.findIndex((t) => t.id === id)
        const next = [...tools]
        next.splice(idx + 1, 0, data.tool as Tool)
        setTools(next)
      }
      refresh()
    } catch (e) {
      console.error("[v0] duplicate failed", e)
    }
  }

  return (
    <div className="page" style={{ padding: "40px 40px 80px", maxWidth: 1480, margin: "0 auto" }}>
      {/* Hero header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 48,
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 480px" }}>
          <Kicker style={{ marginBottom: 14 }}>Workspace · MCM Tools</Kicker>
          <h1
            className="t-display"
            style={{ fontSize: "clamp(48px, 7vw, 84px)", margin: 0, lineHeight: 0.92, color: "var(--text)" }}
          >
            Tus{" "}
            <span className="italic-serif" style={{ fontWeight: 400 }}>
              micro-utilidades
            </span>
            ,
            <br />
            ensambladas a mano.
          </h1>
          <p
            style={{
              maxWidth: 560,
              marginTop: 20,
              fontSize: 16,
              lineHeight: 1.5,
              fontWeight: 400,
              color: "var(--text-2)",
            }}
          >
            Cada bloque es una herramienta que tú diseñas: defines qué entra, qué hace, y qué sale. Sin código a la
            vista. Sin terminales.
          </p>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 10 }}>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
            {tools.length} TOOLS · {tools.filter((t) => t.status === "active").length} ACTIVE
          </span>
          <div className="row" style={{ gap: 10 }}>
            <button
              className={"btn " + (adminMode ? "btn-accent" : "")}
              onClick={() => setAdminMode(!adminMode)}
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              <Icon name={adminMode ? "check" : "settings"} size={14} />
              {adminMode ? "Salir de admin" : "Modo admin"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/tools/new")}
              style={{ padding: "12px 20px", fontSize: 14 }}
            >
              <Icon name="plus" size={15} />
              Nueva tool
            </button>
          </div>
        </div>
      </div>

      {adminMode && (
        <div
          className="row"
          style={{
            padding: "12px 18px",
            marginBottom: 18,
            background: "var(--accent-soft)",
            border: "1px solid oklch(0.78 0.12 290 / 0.4)",
            borderRadius: 16,
            gap: 12,
          }}
        >
          <Icon name="sparkle" size={14} style={{ color: "var(--accent)" }} />
          <div className="italic-serif" style={{ fontSize: 13, color: "var(--text)", flex: 1 }}>
            Modo admin activo — clic en cualquier card para abrir su menú: editar, duplicar, archivar, eliminar.
          </div>
        </div>
      )}

      {/* Bento grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: "minmax(180px, auto)",
          gap: 18,
        }}
      >
        {tools.map((t, i) => (
          <ToolCard
            key={t.id}
            tool={t}
            index={i}
            adminMode={adminMode}
            renaming={renaming === t.id}
            onStartRename={() => setRenaming(t.id)}
            onFinishRename={(name) => handleRename(t.id, name || t.name)}
            onOpen={() => !adminMode && router.push(`/tools/${t.id}`)}
            onConfigure={() => router.push(`/tools/${t.id}/config`)}
            onDelete={() => setConfirmDelete(t)}
            onDuplicate={() => handleDuplicate(t.id)}
            onToggleStatus={() => handleToggleStatus(t.id)}
          />
        ))}

        {/* "Crear nueva tool" card */}
        <Bento
          hoverLift
          onClick={() => router.push("/tools/new")}
          style={{
            gridColumn: "span 4",
            gridRow: "span 1",
            cursor: "pointer",
            border: "1.5px dashed var(--border-strong)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 180,
          }}
        >
          <div className="col" style={{ alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: "1.5px solid var(--border-strong)",
                display: "grid",
                placeItems: "center",
                color: "var(--text)",
              }}
            >
              <Icon name="plus" size={20} />
            </div>
            <div className="t-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>
              Nueva herramienta
            </div>
            <div className="italic-serif" style={{ fontSize: 14, color: "var(--text-3)" }}>
              3 pasos · ~2 minutos
            </div>
          </div>
        </Bento>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          color: "var(--text-3)",
          fontSize: 12,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span className="t-mono">MCM TOOLS ENGINE — v0.4.2</span>
        <span className="italic-serif" style={{ fontSize: 14 }}>
          {"\u201CUna herramienta por problema. No al revés.\u201D"}
        </span>
        <span className="t-mono">NEON · POSTGRES</span>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`¿Eliminar "${confirmDelete.name}"?`}
          message="Esta acción no se puede deshacer. Las ejecuciones asociadas también se borrarán."
          confirmLabel="Eliminar definitivamente"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            void handleDelete(confirmDelete.id)
            setConfirmDelete(null)
          }}
        />
      )}
    </div>
  )
}
