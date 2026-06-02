// Sustituye {{token}} en el texto de una plantilla con los valores mapeados,
// para la vista previa en cliente. Aplica etiquetas de Sinergia cuando procede.

import { toDisplayValue } from "@/lib/sinergia/fields"
import type { TemplateInfo, VariableMapping } from "@/lib/whatsapp/types"

export function resolveValue(
  key: string,
  mapping: Record<string, VariableMapping>,
  row: Record<string, string>,
  fallback: string,
): string {
  const map = mapping[key]
  if (!map) return fallback
  if (map.source === "static") return map.value || fallback
  if (map.source === "column" && map.columnKey) {
    return toDisplayValue(map.columnKey, row[map.columnKey] ?? "")
  }
  return fallback
}

/**
 * Renderiza el texto de un componente (body/header/botón) sustituyendo los
 * {{token}} por sus valores mapeados. `component` define el prefijo de la clave
 * de mapeo y `buttonIndex` lo afina para botones (button:<idx>:<token>).
 */
export function buildBodyPreview(
  text: string,
  component: "body" | "header" | "button",
  template: TemplateInfo,
  mapping: Record<string, VariableMapping>,
  row: Record<string, string>,
  buttonIndex?: number,
): string {
  const prefix = component === "button" ? `button:${buttonIndex ?? 0}` : component
  const examples = new Map(template.variables.map((v) => [v.key, v.example]))
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, tk) => {
    const token = String(tk).trim()
    const key = `${prefix}:${token}`
    return resolveValue(key, mapping, row, examples.get(key) ?? `{{${token}}}`)
  })
}
