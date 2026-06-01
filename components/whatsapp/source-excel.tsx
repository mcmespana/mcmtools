"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Bento } from "@/components/bento"
import { Icon } from "@/components/icon"
import type { DataSourceResult, SourceColumn } from "@/lib/whatsapp/types"

const ACCENT = "#25D366"

// Parsea un XLSX/CSV: fila 1 = cabeceras, datos desde la fila 2.
function parseSheet(buf: ArrayBuffer): DataSourceResult {
  const wb = XLSX.read(buf, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, defval: "" })
  if (!matrix.length) return { columns: [], rows: [] }

  const headers = (matrix[0] as unknown[]).map((h, i) => String(h ?? "").trim() || `Columna ${i + 1}`)
  const dataRows = matrix.slice(1) as unknown[][]

  const columns: SourceColumn[] = headers.map((label, i) => ({
    key: label,
    label,
    sample: dataRows.length ? String(dataRows[0][i] ?? "") : undefined,
  }))

  const rows = dataRows
    .filter((r) => r.some((c) => String(c ?? "").trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = String(r[i] ?? "").trim() })
      return obj
    })

  return { columns, rows }
}

export function SourceExcel({ onLoaded }: { onLoaded: (data: DataSourceResult, name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<DataSourceResult | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    try {
      const buf = await file.arrayBuffer()
      const data = parseSheet(buf)
      if (!data.columns.length) {
        setError("El archivo no tiene cabeceras en la primera fila.")
        return
      }
      if (!data.rows.length) {
        setError("El archivo no tiene filas de datos (a partir de la fila 2).")
        return
      }
      setFileName(file.name)
      setPreview(data)
      onLoaded(data, file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.")
    }
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <Bento
        style={{ padding: 0, cursor: "pointer" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
        />
        <div
          className="col"
          style={{
            gap: 12, alignItems: "center", justifyContent: "center", padding: "44px 24px",
            borderRadius: "var(--radius-card)",
            border: preview ? `2px solid ${ACCENT}` : "2px dashed var(--border-strong)",
            background: preview ? `${ACCENT}10` : "transparent",
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, background: preview ? ACCENT : "var(--surface-2)", color: preview ? "#fff" : "var(--text-3)", display: "grid", placeItems: "center" }}>
            <Icon name={preview ? "check" : "table"} size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {fileName ?? "Arrastra un Excel o CSV aquí"}
          </div>
          <div className="muted-2" style={{ fontSize: 13 }}>
            {preview ? `${preview.columns.length} columnas · ${preview.rows.length} filas` : "o haz clic para seleccionar · .xlsx, .xls, .csv"}
          </div>
        </div>
      </Bento>

      {error && (
        <div className="row" style={{ gap: 8, color: "#E74C3C", fontSize: 13 }}>
          <Icon name="x" size={14} /> {error}
        </div>
      )}

      {preview && <PreviewTable data={preview} />}
    </div>
  )
}

function PreviewTable({ data }: { data: DataSourceResult }) {
  const rows = data.rows.slice(0, 5)
  return (
    <Bento style={{ padding: 16, overflowX: "auto" }}>
      <div className="t-kicker" style={{ marginBottom: 12 }}>Vista previa</div>
      <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
        <thead>
          <tr>
            {data.columns.map((c) => (
              <th key={c.key} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", color: "var(--text-2)", fontWeight: 600 }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {data.columns.map((c) => (
                <td key={c.key} style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.rows.length > rows.length && (
        <div className="muted-3" style={{ fontSize: 11, marginTop: 8 }}>… y {data.rows.length - rows.length} filas más</div>
      )}
    </Bento>
  )
}
