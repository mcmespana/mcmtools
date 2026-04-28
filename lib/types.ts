export type ToolStatus = "active" | "draft" | "idle" | "archived"

export type ToolSpan = { col: number; row: number }

export type UserVar = {
  key: string
  label: string
  type: "text" | "number" | "date" | "select"
  icon: string
  default: string
}

export type StepParam = { label: string; value: string }

export type PipelineStep = {
  id: string
  title: string
  icon: string
  color?: string
  summary?: string
  tag?: string
  params?: StepParam[]
  expanded?: boolean
}

export type FilenameToken = {
  kind: "var" | "static"
  label: string
}

export type DictionaryEntry = {
  sigla: string
  fullName: string
  dni: string
  keywords: string[]
  color: string
}

export type ToolConfigData = {
  trigger: string
  outputType: string
  userVars: UserVar[]
  steps: PipelineStep[]
  filenameTokens: FilenameToken[]
  dictionary: DictionaryEntry[]
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
