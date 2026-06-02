// Detección y resolución de variables {{...}} en plantillas de KAPSO/Meta.

import type {
  TemplateButton,
  TemplateButtonInfo,
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
 * Devuelve el valor de ejemplo de una variable.
 * - Posicional ({{2}}): se indexa por el NÚMERO (2 → posición 1), no por el
 *   orden de aparición en el texto. Así "{{2}} … {{1}}" no mezcla los ejemplos.
 * - Nombrada ({{nombre}}): se busca por nombre en *_named_params.
 */
function pickExample(
  token: string,
  kind: "positional" | "named",
  appearanceIdx: number,
  positional: string[],
  named?: { param_name: string; example: string }[],
): string | undefined {
  if (kind === "named") {
    return named?.find((p) => p.param_name === token)?.example ?? positional[appearanceIdx]
  }
  return positional[Number(token) - 1]
}

/**
 * Ordena las variables de un componente para el envío. Los parámetros
 * POSICIONALES deben ir en orden numérico ({{1}}, {{2}}, {{3}}…) porque Meta
 * los empareja por POSICIÓN en el array, no por el número. Los NOMBRADOS se
 * emparejan por `parameter_name`, así que su orden es indiferente.
 */
function orderForOutput(list: TemplateVariable[]): TemplateVariable[] {
  const allPositional = list.length > 0 && list.every((v) => v.kind === "positional")
  if (!allPositional) return list
  return [...list].sort((a, b) => Number(a.token) - Number(b.token))
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
    const positional = header.example?.header_text ?? []
    const named = header.example?.header_text_named_params
    findTokens(header.text).forEach((v, i) => {
      const key = `header:${v.token}`
      if (seen.has(key)) return
      seen.add(key)
      vars.push({ ...v, key, component: "header", example: pickExample(v.token, v.kind, i, positional, named) })
    })
  }

  const body = getComponent(t, "BODY")
  if (body?.text) {
    const positional = body.example?.body_text?.[0] ?? []
    const named = body.example?.body_text_named_params
    findTokens(body.text).forEach((v, i) => {
      const key = `body:${v.token}`
      if (seen.has(key)) return
      seen.add(key)
      vars.push({ ...v, key, component: "body", example: pickExample(v.token, v.kind, i, positional, named) })
    })
  }

  // Botones con URL dinámica: cada botón URL puede llevar {{1}} en su `url`.
  // El índice del botón (0-based) es el de su posición en el array `buttons`.
  const buttonsComp = getComponent(t, "BUTTONS")
  buttonsComp?.buttons?.forEach((btn, index) => {
    if ((btn.type ?? "").toUpperCase() !== "URL" || !btn.url) return
    const examples = btn.example ?? []
    findTokens(btn.url).forEach((v, i) => {
      const key = `button:${index}:${v.token}`
      if (seen.has(key)) return
      seen.add(key)
      vars.push({
        ...v,
        key,
        component: "button",
        buttonIndex: index,
        buttonLabel: btn.text,
        // El ejemplo de Meta es la URL completa; mostramos eso como pista.
        example: examples[i],
      })
    })
  })

  return vars
}

/** Botones de la plantilla, para la vista previa en la UI. */
export function getButtons(t: WhatsappTemplate): TemplateButtonInfo[] {
  const comp = getComponent(t, "BUTTONS")
  if (!comp?.buttons) return []
  return comp.buttons.map((btn: TemplateButton, index) => ({
    index,
    type: (btn.type ?? "").toUpperCase(),
    text: btn.text ?? "",
    url: btn.url,
  }))
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
    const map = mapping[v.key]
    if (!map) return v.example ?? ""
    if (map.source === "static") return map.value ?? ""
    if (map.source === "column" && map.columnKey) {
      const raw = row[map.columnKey] ?? ""
      return transform ? transform(map.columnKey, raw) : raw
    }
    return ""
  }

  // Named → incluye parameter_name; posicional → solo {type,text} en orden.
  // Los parámetros de botón URL son siempre posicionales (sin parameter_name).
  const paramFor = (v: TemplateVariable, allowNamed = true) => {
    const text = resolve(v)
    return allowNamed && v.kind === "named"
      ? { type: "text", parameter_name: v.token, text }
      : { type: "text", text }
  }

  const components: Array<Record<string, unknown>> = []

  const headerVars = vars.filter((v) => v.component === "header")
  if (headerVars.length) {
    components.push({ type: "header", parameters: orderForOutput(headerVars).map((v) => paramFor(v)) })
  }

  const bodyVars = vars.filter((v) => v.component === "body")
  if (bodyVars.length) {
    components.push({ type: "body", parameters: orderForOutput(bodyVars).map((v) => paramFor(v)) })
  }

  // Un componente "button" (sub_type url) por cada botón con variables, en orden.
  const buttonVars = vars.filter((v) => v.component === "button")
  const byIndex = new Map<number, TemplateVariable[]>()
  for (const v of buttonVars) {
    const idx = v.buttonIndex ?? 0
    if (!byIndex.has(idx)) byIndex.set(idx, [])
    byIndex.get(idx)!.push(v)
  }
  for (const idx of Array.from(byIndex.keys()).sort((a, b) => a - b)) {
    components.push({
      type: "button",
      sub_type: "url",
      index: idx,
      parameters: orderForOutput(byIndex.get(idx)!).map((v) => paramFor(v, false)),
    })
  }

  return components
}
