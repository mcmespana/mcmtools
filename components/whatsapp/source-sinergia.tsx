"use client"

import { useMemo, useState } from "react"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import type { DataSourceResult, SourceColumn } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"

type ApiResponse = {
  ok: boolean
  rows: Record<string, string>[]
  columns: SourceColumn[]
  mcmLocales: string[]
  error?: string
}

export function SourceSinergia({ onLoaded }: { onLoaded: (data: DataSourceResult, name: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [all, setAll] = useState<ApiResponse | null>(null)
  const [mcmLocal, setMcmLocal] = useState("")
  const [etapa, setEtapa] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/sinergia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list-contacts" }),
      })
      const data = (await res.json()) as ApiResponse
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al cargar contactos")
      setAll(data)
      setSelected(new Set(data.rows.map((r) => r.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!all) return []
    const q = search.trim().toLowerCase()
    return all.rows.filter((r) => {
      if (mcmLocal && r.assigned_user_name !== mcmLocal) return false
      if (etapa && r.ajmcm_etapa_c !== etapa) return false
      if (q && !`${r.full_name} ${r.phone_mobile}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [all, mcmLocal, etapa, search])

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selectAllFiltered = (on: boolean) =>
    setSelected((s) => {
      const n = new Set(s)
      filtered.forEach((r) => (on ? n.add(r.id) : n.delete(r.id)))
      return n
    })

  const confirm = () => {
    if (!all) return
    const rows = all.rows.filter((r) => selected.has(r.id))
    onLoaded({ columns: all.columns, rows }, `SinergiaCRM (${rows.length} contactos)`)
  }

  if (!all) {
    return (
      <Bento style={{ padding: 28 }}>
        <div className="col" style={{ gap: 14, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--surface-2)", color: "var(--text-3)", display: "grid", placeItems: "center" }}>
            <Icon name="users" size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Contactos de SinergiaCRM</div>
          <div className="muted-2" style={{ fontSize: 13, maxWidth: 420 }}>
            Se cargarán los contactos con móvil y sin marca de “no llamar”. Luego podrás filtrar y elegir destinatarios.
          </div>
          <button className="btn btn-accent" onClick={load} disabled={loading} style={{ padding: "12px 22px" }}>
            <Icon name={loading ? "refresh" : "globe"} size={15} /> {loading ? "Cargando…" : "Cargar contactos"}
          </button>
          {error && <div className="row" style={{ gap: 8, color: "#E74C3C", fontSize: 13 }}><Icon name="x" size={14} /> {error}</div>}
        </div>
      </Bento>
    )
  }

  const etapas = Array.from(new Set(all.rows.map((r) => r.ajmcm_etapa_c).filter(Boolean))).sort()

  return (
    <div className="col" style={{ gap: 16 }}>
      <Bento style={{ padding: 16 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="col" style={{ gap: 4 }}>
            <label className="t-kicker">MCM Local</label>
            <select className="input" value={mcmLocal} onChange={(e) => setMcmLocal(e.target.value)}>
              <option value="">Todas</option>
              {all.mcmLocales.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col" style={{ gap: 4 }}>
            <label className="t-kicker">Etapa</label>
            <select className="input" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
              <option value="">Todas</option>
              {etapas.map((et) => <option key={et} value={et}>{et}</option>)}
            </select>
          </div>
          <div className="col" style={{ gap: 4, flex: "1 1 200px" }}>
            <label className="t-kicker">Buscar</label>
            <input className="input" placeholder="Nombre o teléfono…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ gap: 12, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted-2" style={{ fontSize: 13 }}>
            {selected.size} seleccionados · {filtered.length} visibles · {all.rows.length} totales
          </span>
          <button className="btn" style={{ fontSize: 12 }} onClick={() => selectAllFiltered(true)}>Seleccionar visibles</button>
          <button className="btn" style={{ fontSize: 12 }} onClick={() => selectAllFiltered(false)}>Quitar visibles</button>
        </div>
      </Bento>

      <Bento style={{ padding: 0, maxHeight: 340, overflowY: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--surface)" }}>
            <tr>
              <th style={th}></th>
              <th style={th}>Nombre</th>
              <th style={th}>Móvil</th>
              <th style={th}>MCM Local</th>
              <th style={th}>Etapa</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => toggle(r.id)} style={{ cursor: "pointer" }}>
                <td style={td}><input type="checkbox" checked={selected.has(r.id)} readOnly /></td>
                <td style={td}>{r.full_name}</td>
                <td style={td}>{r.phone_mobile}</td>
                <td style={td}>{r.assigned_user_name}</td>
                <td style={td}>{r.ajmcm_etapa_c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bento>

      <button className="btn btn-accent" onClick={confirm} disabled={selected.size === 0} style={{ justifyContent: "center", padding: "12px 22px", opacity: selected.size ? 1 : 0.5 }}>
        <Icon name="check" size={15} /> Usar {selected.size} contacto{selected.size !== 1 ? "s" : ""}
      </button>
    </div>
  )
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-2)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }
const td: React.CSSProperties = { padding: "7px 12px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }
