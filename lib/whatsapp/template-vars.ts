// Detección y resolución de variables {{...}} en plantillas de KAPSO/Meta.

import type {
  TemplateComponent,
  TemplateVariable,
  VariableMapping,
  WhatsappTemplate,
} from "./types"

const VAR_RE = /\{\{\s*([^}]+?)\s*\}\}/g

function findTokens(text: string): { token: string; kind: "positional" | "named" }[] {
  const out: { token: string; kind: "positional" | "named" }[] = []
  let m: RegExpExecArray | null
  VAR_RE.lastIndex = 0
  while ((m = VAR_RE.exec(text)) !== null) {
    const token = m[1].trim()
    out.push({ token, kind: /^\d+$/.test(token) ? "positional" : "named" })
  }
  return out
}

function getComponent(t: WhatsappTemplate, type: string): TemplateComponent | undefined {
  return t.components?.find((c) => c.type?.toUpperCase() === type)
}

/**
 * Extrae las variables de una plantilla (header de texto + body), sin duplicados,
 * en orden de aparición. Adjunta valores de ejemplo de `example` cuando existen.
 */
export function detectTemplateVariables(t: WhatsappTemplate): TemplateVariable[] {
  const vars: TemplateVariable[] = []
  const seen = new Set<string>()

  const header = getComponent(t, "HEADER")
  if (header?.format === "TEXT" && header.text) {
    const examples = header.example?.header_text ?? []
    findTokens(header.text).forEach((v, i) => {
      const id = `header:${v.token}`
      if (seen.has(id)) return
      seen.add(id)
      vars.push({ ...v, component: "header", example: examples[i] })
    })
  }

  const body = getComponent(t, "BODY")
  if (body?.text) {
    const examples = body.example?.body_text?.[0] ?? []
    findTokens(body.text).forEach((v, i) => {
      const id = `body:${v.token}`
      if (seen.has(id)) return
      seen.add(id)
      vars.push({ ...v, component: "body", example: examples[i] })
    })
  }

  return vars
}

/** Texto del body para previsualización. */
export function getBodyText(t: WhatsappTemplate): string {
  return getComponent(t, "BODY")?.text ?? ""
}

/** Texto del header (solo si es de tipo TEXT). */
export function getHeaderText(t: WhatsappTemplate): string | null {
  const h = getComponent(t, "HEADER")
  return h?.format === "TEXT" ? h.text ?? null : null
}

/**
 * Construye el array `components` (formato Meta) para un destinatario,
 * resolviendo cada variable con el `mapping` y la `row`.
 * `transform` permite convertir códigos a etiquetas (p.ej. desplegables de Sinergia).
 */
export function buildComponents(
  vars: TemplateVariable[],
  mapping: Record<string, VariableMapping>,
  row: Record<string, string>,
  transform?: (columnKey: string, value: string) => string,
): Array<Record<string, unknown>> {
  const resolve = (v: TemplateVariable): string => {
    const map = mapping[v.token]
    if (!map) return v.example ?? ""
    if (map.source === "static") return map.value ?? ""
    if (map.source === "column" && map.columnKey) {
      const raw = row[map.columnKey] ?? ""
      return transform ? transform(map.columnKey, raw) : raw
    }
    return ""
  }

  const paramFor = (v: TemplateVariable) => {
    const text = resolve(v)
    // Named → incluye parameter_name; posicional → solo {type,text} en orden.
    return v.kind === "named"
      ? { type: "text", parameter_name: v.token, text }
      : { type: "text", text }
  }

  const components: Array<Record<string, unknown>> = []

  const headerVars = vars.filter((v) => v.component === "header")
  if (headerVars.length) {
    components.push({ type: "header", parameters: headerVars.map(paramFor) })
  }

  const bodyVars = vars.filter((v) => v.component === "body")
  if (bodyVars.length) {
    components.push({ type: "body", parameters: bodyVars.map(paramFor) })
  }

  return components
}
