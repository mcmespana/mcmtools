"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Tool } from "@/lib/types"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import { ToolCard } from "./tool-card"
import { ConfirmModal } from "./confirm-modal"
import { useAdmin } from "../admin-context"

export function DashboardClient({ initialTools }: { initialTools: Tool[] }) {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>(initialTools)
  const { isAdmin } = useAdmin()
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
      console.error("rename failed", e)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const target = tools.find((t) => t.id === id)
    if (!target) return
    const next = target.status === "archived" ? "active" : "archived"
    optimisticUpdate(id, { status: next })
    try {
      await fetch(`/api/tools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      refresh()
    } catch (e) {
      console.error("toggle status failed", e)
    }
  }

  const handleDelete = async (id: string) => {
    setTools((curr) => curr.filter((t) => t.id !== id))
    try {
      await fetch(`/api/tools/${id}`, { method: "DELETE" })
      refresh()
    } catch (e) {
      console.error("delete failed", e)
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
      console.error("duplicate failed", e)
    }
  }

  // Public users only see active tools
  const visibleTools = isAdmin ? tools : tools.filter((t) => t.status === "active")

  return (
    <div className="page" style={{ padding: "48px 40px 80px", maxWidth: 1400, margin: "0 auto" }}>
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
          <h1
            className="t-display"
            style={{ fontSize: "clamp(44px, 6vw, 72px)", margin: 0, lineHeight: 0.95 }}
          >
            Tus{" "}
            <span className="t-editorial">
              herramientas
            </span>
          </h1>
          <p
            style={{
              maxWidth: 520,
              marginTop: 16,
              fontSize: 15,
              lineHeight: 1.6,
              fontWeight: 400,
              color: "var(--text-2)",
            }}
          >
            Cada bloque es una micro-herramienta que procesa datos por ti.
            Define qué entra, escribe el código, y deja que haga el trabajo.
          </p>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 10 }}>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
            {visibleTools.length} TOOLS · {visibleTools.filter((t) => t.status === "active").length} ACTIVE
          </span>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => router.push("/tools/new")}
              style={{ padding: "12px 22px", fontSize: 14 }}
            >
              <Icon name="plus" size={15} />
              Nueva herramienta
            </button>
          )}
        </div>
      </div>

      {/* Admin banner */}
      {isAdmin && (
        <div
          className="row"
          style={{
            padding: "12px 18px",
            marginBottom: 20,
            background: "var(--accent-soft)",
            border: "1px solid oklch(0.55 0.12 290 / 0.25)",
            borderRadius: 16,
            gap: 12,
          }}
        >
          <Icon name="sparkle" size={14} style={{ color: "var(--accent)" }} />
          <div className="italic-serif" style={{ fontSize: 13, color: "var(--text)", flex: 1 }}>
            Modo creador — puedes editar, duplicar y archivar herramientas.
          </div>
        </div>
      )}

      {/* Bento grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 18,
        }}
      >
        {visibleTools.map((t, i) => (
          <ToolCard
            key={t.id}
            tool={t}
            index={i}
            adminMode={isAdmin}
            renaming={renaming === t.id}
            onStartRename={() => setRenaming(t.id)}
            onFinishRename={(name) => handleRename(t.id, name || t.name)}
            onOpen={() => router.push(`/tools/${t.id}`)}
            onConfigure={() => router.push(`/tools/${t.id}/config`)}
            onDelete={() => setConfirmDelete(t)}
            onDuplicate={() => handleDuplicate(t.id)}
            onToggleStatus={() => handleToggleStatus(t.id)}
          />
        ))}

        {/* "Create" card — admin only */}
        {isAdmin && (
          <Bento
            hoverLift
            onClick={() => router.push("/tools/new")}
            style={{
              cursor: "pointer",
              border: "1.5px dashed var(--border-strong)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
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
              <div className="t-display" style={{ fontSize: 18 }}>
                Nueva herramienta
              </div>
              <div className="italic-serif muted-2" style={{ fontSize: 13 }}>
                3 pasos · ~2 minutos
              </div>
            </div>
          </Bento>
        )}
      </div>

      {/* Empty state for public users */}
      {!isAdmin && visibleTools.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
        }}>
          <Icon name="archive" size={40} className="muted-3" style={{ marginBottom: 16 }} />
          <div className="t-display" style={{ fontSize: 24, marginBottom: 8 }}>
            No hay herramientas disponibles
          </div>
          <div className="italic-serif muted" style={{ fontSize: 15 }}>
            El administrador aún no ha publicado ninguna herramienta.
          </div>
        </div>
      )}

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
