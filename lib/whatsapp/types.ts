// Tipos compartidos de la tool de envío masivo de WhatsApp (KAPSO).

/** Una columna disponible para mapear (de Excel o de SinergiaCRM). */
export type SourceColumn = {
  key: string
  label: string
  sample?: string
}

/** Resultado unificado de cualquier fuente de datos (Excel/CSV o Sinergia). */
export type DataSourceResult = {
  columns: SourceColumn[]
  rows: Record<string, string>[]
}

export type SourceKind = "excel" | "sinergia"

/** Un botón de una plantilla de KAPSO/Meta. */
export type TemplateButton = {
  type: "URL" | "QUICK_REPLY" | "PHONE_NUMBER" | "COPY_CODE" | "FLOW" | string
  text?: string
  /** URL del botón (puede contener {{1}} para la parte dinámica). */
  url?: string
  phone_number?: string
  /** Ejemplos de URL completa (Meta los devuelve como array). */
  example?: string[]
}

/** Componente de una plantilla de KAPSO/Meta. */
export type TemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | string
  format?: string
  text?: string
  example?: {
    body_text?: string[][]
    header_text?: string[]
    /** Ejemplos para plantillas con parámetros NOMBRADOS ({{nombre}}). */
    body_text_named_params?: { param_name: string; example: string }[]
    header_text_named_params?: { param_name: string; example: string }[]
    [k: string]: unknown
  }
  buttons?: TemplateButton[]
}

/** Plantilla de mensaje tal y como la devuelve KAPSO. */
export type WhatsappTemplate = {
  id: string
  name: string
  language: string
  status: string
  category?: string
  components: TemplateComponent[]
}

/**
 * Una variable detectada en una plantilla.
 * - `positional` → placeholder {{1}}, {{2}}… (token = "1", "2"…)
 * - `named`      → placeholder {{nombre}} (token = "nombre")
 */
export type TemplateVariable = {
  /**
   * Clave única de la variable (para el mapeo). Combina componente y token,
   * p.ej. "body:1", "header:nombre", "button:0:1". Evita colisiones entre
   * un {{1}} del cuerpo y un {{1}} de un botón.
   */
  key: string
  /** Token tal cual aparece dentro de las llaves: "1", "nombre"… */
  token: string
  /** Componente donde aparece. Soporta header (texto), body y botón URL. */
  component: "header" | "body" | "button"
  /** Estilo de la variable. */
  kind: "positional" | "named"
  /** Valor de ejemplo de la plantilla, si lo hay. */
  example?: string
  /** Índice del botón (0-based) cuando component = "button". */
  buttonIndex?: number
  /** Texto del botón (para mostrar en la UI) cuando component = "button". */
  buttonLabel?: string
}

/** Cómo se rellena cada variable de la plantilla. */
export type VariableMapping = {
  /** "column" → toma el valor de una columna; "static" → valor fijo. */
  source: "column" | "static"
  /** key de la columna (si source = column). */
  columnKey?: string
  /** valor literal (si source = static). */
  value?: string
}

/** Cuerpo del POST a /api/whatsapp/send. */
export type SendRequest = {
  campaignName: string
  templateId: string
  templateName: string
  templateLanguage: string
  /** token de variable → mapping. */
  mapping: Record<string, VariableMapping>
  /** key de la columna que contiene el teléfono. */
  phoneColumnKey: string
  rows: Record<string, string>[]
  /** Si se indica, ignora `rows` y envía solo a este número (envío de prueba). */
  testPhone?: string
}

export type SendResponse = {
  broadcastId: string
  totalRecipients: number
  invalid: { row: number; reason: string }[]
}

/** Un botón tal como se muestra en la UI (vista previa). */
export type TemplateButtonInfo = {
  index: number
  type: string
  text: string
  /** URL con su parte dinámica ({{1}}) si la tiene. */
  url?: string
}

/** Plantilla tal como la sirve GET /api/whatsapp/templates (con variables ya detectadas). */
export type TemplateInfo = {
  id: string
  name: string
  language: string
  status: string
  category?: string
  headerText: string | null
  bodyText: string
  variables: TemplateVariable[]
  buttons: TemplateButtonInfo[]
}
