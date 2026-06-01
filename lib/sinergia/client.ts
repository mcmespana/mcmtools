// Cliente server-only de SinergiaCRM (SuiteCRM REST v4.1).
// Adaptado de la guía de integración de MCM (mcmvotaciones) a un Route Handler de Next.js:
// mismo origen → sin CORS, credenciales en process.env, sin Supabase.

import "server-only"
import { SINERGIA_SELECT_FIELDS, toDisplayValue } from "./fields"

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Falta ${name} en el entorno`)
  return v
}

/** Llamada genérica a la API REST del CRM. */
async function crmCall(method: string, params: unknown): Promise<Record<string, unknown> | null> {
  const url = env("SINERGIA_URL")
  const body = new URLSearchParams()
  body.set("method", method)
  body.set("input_type", "JSON")
  body.set("response_type", "JSON")
  body.set("rest_data", JSON.stringify(params))

  const res = await fetch(url, { method: "POST", body, cache: "no-store" })
  const text = await res.text()
  if (!res.ok) throw new Error(`CRM ${method} HTTP ${res.status}: ${text.slice(0, 200)}`)
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(`CRM ${method} devolvió JSON inválido: ${text.slice(0, 200)}`)
  }
}

async function crmLogin(): Promise<string> {
  const res = await crmCall("login", {
    user_auth: { user_name: env("SINERGIA_USER"), password: env("SINERGIA_PASS"), encryption: "PLAIN" },
    application: "mcmtools",
  })
  if (!res?.id || typeof res.id !== "string") {
    throw new Error(`Login CRM fallido: ${JSON.stringify(res)}`)
  }
  return res.id
}

function decodeHTML(s: string | undefined): string {
  if (!s) return ""
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

/** "^grupo^,^monitor^" → "grupo, monitor" */
function parseRelationshipTypes(raw: string | undefined): string {
  if (!raw?.trim()) return ""
  return raw
    .split(",")
    .map((s) => s.replace(/\^/g, "").trim())
    .filter(Boolean)
    .join(", ")
}

interface CRMEntryList {
  entry_list?: Array<{ id: string; name_value_list?: Record<string, { name: string; value: string }> }>
}

export type SinergiaFilters = {
  /** assigned_user_name exacto, p.ej. "MCM Castellón". */
  mcmLocal?: string
  /** ajmcm_etapa_c, p.ej. "MIC". */
  etapa?: string
}

/** Construye el `query` SQL-like para get_entry_list a partir de los filtros. */
function buildQuery(f: SinergiaFilters): string {
  const parts: string[] = []
  if (f.etapa) parts.push(`contacts_cstm.ajmcm_etapa_c = '${f.etapa.replace(/'/g, "''")}'`)
  // mcmLocal (assigned_user_name) se filtra en memoria: es un campo "link", no de columna directa.
  return parts.join(" AND ")
}

/**
 * Lista contactos del CRM, paginando, normalizando y aplicando filtros.
 * Devuelve filas planas listas para el wizard (claves = SINERGIA_FIELDS).
 */
export async function listContacts(filters: SinergiaFilters = {}): Promise<{
  rows: Record<string, string>[]
  total: number
}> {
  const session = await crmLogin()
  try {
    const query = buildQuery(filters)
    const all: Record<string, string>[] = []
    let offset = 0
    const maxResults = 200

    while (true) {
      const res = (await crmCall("get_entry_list", {
        session,
        module_name: "Contacts",
        query,
        order_by: "last_name",
        offset,
        select_fields: SINERGIA_SELECT_FIELDS,
        link_name_to_fields_array: [],
        max_results: maxResults,
        deleted: 0,
        favorites: "",
      })) as CRMEntryList

      const list = res?.entry_list ?? []
      if (!list.length) break

      for (const entry of list) {
        const flat: Record<string, string> = {}
        for (const [key, obj] of Object.entries(entry.name_value_list ?? {})) {
          flat[key] = decodeHTML(obj?.value ?? "")
        }
        // Derivados / normalizados
        flat["full_name"] = `${flat["first_name"] ?? ""} ${flat["last_name"] ?? ""}`.trim()
        flat["stic_relationship_type_c"] = parseRelationshipTypes(flat["stic_relationship_type_c"])
        all.push(flat)
      }

      offset += list.length
      if (list.length < maxResults) break
    }

    // Filtro en memoria por MCM Local + descartes (do_not_call / sin móvil)
    let rows = all.filter((r) => r["do_not_call"] !== "1" && (r["phone_mobile"] ?? "").trim() !== "")
    if (filters.mcmLocal) {
      rows = rows.filter((r) => (r["assigned_user_name"] ?? "") === filters.mcmLocal)
    }

    // Aplicar etiquetas visibles a los desplegables (para que el preview sea legible)
    for (const r of rows) {
      for (const key of Object.keys(r)) {
        r[key] = toDisplayValue(key, r[key])
      }
    }

    return { rows, total: rows.length }
  } finally {
    crmCall("logout", { session }).catch(() => {})
  }
}

/** Lista de MCM Locales presentes (para el desplegable de filtro). */
export function uniqueMcmLocales(rows: Record<string, string>[]): string[] {
  return Array.from(new Set(rows.map((r) => r["assigned_user_name"]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es"),
  )
}
