// Sustituye {{token}} en el texto de una plantilla con los valores mapeados,
// para la vista previa en cliente. Aplica etiquetas de Sinergia cuando procede.

import { toDisplayValue } from "@/lib/sinergia/fields"
import type { TemplateInfo, VariableMapping } from "@/lib/whatsapp/types"

export function resolveValue(
  token: string,
  mapping: Record<string, VariableMapping>,
  row: Record<string, string>,
  fallback?: string,
): string {
  const map = mapping[token]
  if (!map) return fallback ?? `{{${token}}}`
  if (map.source === "static") return map.value || (fallback ?? "")
  if (map.source === "column" && map.columnKey) {
    return toDisplayValue(map.columnKey, row[map.columnKey] ?? "")
  }
  return fallback ?? `{{${token}}}`
}

export function buildBodyPreview(
  text: string,
  template: TemplateInfo,
  mapping: Record<string, VariableMapping>,
  row: Record<string, string>,
): string {
  const examples = new Map(template.variables.map((v) => [v.token, v.example]))
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, tk) => {
    const token = String(tk).trim()
    return resolveValue(token, mapping, row, examples.get(token) ?? `{{${token}}}`)
  })
}
