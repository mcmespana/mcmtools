export type ToolStatus = "active" | "draft" | "idle" | "archived"

export type ToolSpan = { col: number; row: number }

// Variables que ve el usuario (generan formulario público)
export type UserVar = {
  key: string
  label: string
  type: "text" | "number" | "date" | "select"
  icon: string
  default: string
  options?: string[]  // Para type: "select"
  required?: boolean  // Si true, el usuario DEBE rellenar este campo antes de ejecutar
}

// Variables estáticas del sistema (ocultas al usuario, las usa el código)
export type SystemVar = {
  key: string
  label: string
  value: string
}

export type ToolConfigData = {
  userVars: UserVar[]
  systemVars: SystemVar[]
  code: string
  requiresFile: boolean
  outputType: "file" | "zip" | "text" | "json"
}

export type Tool = {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
  status: ToolStatus
  featured: boolean
  span: ToolSpan
  tint: string | null
  glow: string | null
  inputType: string
  inputIcon: string
  outputType: string
  outputIcon: string
  position: number
  config: ToolConfigData
  createdAt: string
  updatedAt: string
}

export type ToolStats = {
  runs: number
  generated: number
  errors: number
  avgDuration: string
}
