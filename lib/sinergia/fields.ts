// Catálogo de campos de SinergiaCRM (Contacts) usados por MCM.
// Etiquetas amigables + dominios de desplegables (código → etiqueta visible),
// extraído de CAMPOS.md. Sirve para: (1) columnas seleccionables en el mapeo,
// (2) sustituir códigos internos por su etiqueta al rellenar variables.

export type SinergiaField = {
  key: string
  label: string
  /** Mapa código→etiqueta para campos desplegables. */
  domain?: Record<string, string>
}

const ETAPA = { MIC: "MIC", COM: "COM", LC: "LC" }
const MONITOR_DE = { MIC: "MIC", COM: "COM", LC: "LC", apoyo: "Apoyo", otros: "Otros" }
const NIVEL_COM = {
  conocimiento: "I - Conocimiento",
  incorporacion: "II - Incorporación",
  crecimiento: "III - Crecimiento",
  opcion_responsable: "IV - Opción Responsable",
}
const GENERO = { "": "—", Hombre: "Hombre", Mujer: "Mujer" }

/** Campos que se solicitan al CRM (get_entry_list) y se ofrecen para mapear. */
export const SINERGIA_FIELDS: SinergiaField[] = [
  { key: "first_name", label: "Nombre" },
  { key: "last_name", label: "Apellidos" },
  { key: "full_name", label: "Nombre completo" },
  { key: "phone_mobile", label: "Móvil (WhatsApp)" },
  { key: "email1", label: "Correo electrónico" },
  { key: "stic_age_c", label: "Edad" },
  { key: "birthdate", label: "Fecha de nacimiento" },
  { key: "assigned_user_name", label: "MCM Local" },
  { key: "ajmcm_etapa_c", label: "Etapa", domain: ETAPA },
  { key: "ajmcm_nivel_com_c", label: "Nivel COM", domain: NIVEL_COM },
  { key: "ajmcm_grupotemp_c", label: "Grupo MCM" },
  { key: "ajmcm_centro_educativo_c", label: "Centro educativo" },
  { key: "ajmcm_monitor_de_c", label: "Monitor/a de", domain: MONITOR_DE },
  { key: "ajmcm_monitor_desde_c", label: "Monitor/a desde" },
  { key: "stic_gender_c", label: "Género", domain: GENERO },
  { key: "stic_relationship_type_c", label: "Tipo de relación" },
]

/** Lista de claves para `select_fields` del CRM (incluye `id` y `do_not_call`). */
export const SINERGIA_SELECT_FIELDS: string[] = [
  "id",
  "do_not_call",
  ...SINERGIA_FIELDS.filter((f) => f.key !== "full_name").map((f) => f.key),
]

const BY_KEY = new Map(SINERGIA_FIELDS.map((f) => [f.key, f]))

/** Sustituye el código interno por su etiqueta visible si el campo es desplegable. */
export function toDisplayValue(key: string, value: string): string {
  const field = BY_KEY.get(key)
  if (field?.domain && value in field.domain) return field.domain[value]
  return value
}

export function fieldLabel(key: string): string {
  return BY_KEY.get(key)?.label ?? key
}
