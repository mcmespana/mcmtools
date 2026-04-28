import { neon } from "@neondatabase/serverless"
import type { Tool, ToolConfigData, ToolStats } from "./types"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

const DEFAULT_CONFIG: ToolConfigData = {
  trigger: "File Drop",
  outputType: "Archivo",
  userVars: [],
  steps: [],
  filenameTokens: [],
  dictionary: [],
}

type ToolRow = {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  icon_bg: string
  icon_color: string
  status: string
  featured: boolean
  span_col: number
  span_row: number
  tint: string | null
  glow: string | null
  input_type: string
  input_icon: string
  output_type: string
  output_icon: string
  position: number
  config: ToolConfigData | null
  created_at: string | Date
  updated_at: string | Date
}

function rowToTool(r: ToolRow): Tool {
  return {
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    icon: r.icon,
    iconBg: r.icon_bg,
    iconColor: r.icon_color,
    status: (r.status as Tool["status"]) ?? "draft",
    featured: r.featured,
    span: { col: r.span_col, row: r.span_row },
    tint: r.tint,
    glow: r.glow,
    inputType: r.input_type,
    inputIcon: r.input_icon,
    outputType: r.output_type,
    outputIcon: r.output_icon,
    position: r.position,
    config: { ...DEFAULT_CONFIG, ...(r.config ?? {}) },
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

export async function listTools(): Promise<Tool[]> {
  const rows = (await sql`
    SELECT * FROM tools
    ORDER BY position ASC, created_at ASC
  `) as ToolRow[]
  return rows.map(rowToTool)
}

export async function getTool(id: string): Promise<Tool | null> {
  const rows = (await sql`SELECT * FROM tools WHERE id = ${id} LIMIT 1`) as ToolRow[]
  if (rows.length === 0) return null
  return rowToTool(rows[0])
}

export async function getToolStats(toolId: string): Promise<ToolStats> {
  const rows = (await sql`
    SELECT
      COUNT(*)::int            AS runs,
      COALESCE(SUM(detected_count), 0)::int AS generated,
      COALESCE(SUM(errors), 0)::int         AS errors,
      COALESCE(AVG(duration_ms), 0)::float  AS avg_ms
    FROM tool_runs
    WHERE tool_id = ${toolId}
  `) as Array<{ runs: number; generated: number; errors: number; avg_ms: number }>
  const r = rows[0] ?? { runs: 0, generated: 0, errors: 0, avg_ms: 0 }
  return {
    runs: r.runs,
    generated: r.generated,
    errors: r.errors,
    avgDuration: r.avg_ms > 0 ? `${(r.avg_ms / 1000).toFixed(1)}s` : "—",
  }
}

export type CreateToolInput = {
  id: string
  name: string
  tagline: string
  description?: string
  icon: string
  iconBg: string
  iconColor?: string
  inputType: string
  inputIcon?: string
  outputType: string
  outputIcon?: string
  config?: ToolConfigData
  status?: Tool["status"]
}

export async function createTool(input: CreateToolInput): Promise<Tool> {
  const positionRow = (await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM tools`) as Array<{ next: number }>
  const position = positionRow[0]?.next ?? 0
  const config = input.config ?? DEFAULT_CONFIG

  const rows = (await sql`
    INSERT INTO tools (
      id, name, tagline, description, icon, icon_bg, icon_color,
      status, featured, span_col, span_row,
      input_type, input_icon, output_type, output_icon,
      position, config
    ) VALUES (
      ${input.id}, ${input.name}, ${input.tagline}, ${input.description ?? ""},
      ${input.icon}, ${input.iconBg}, ${input.iconColor ?? "#0A0A0A"},
      ${input.status ?? "draft"}, FALSE, 4, 1,
      ${input.inputType}, ${input.inputIcon ?? "upload"},
      ${input.outputType}, ${input.outputIcon ?? "download"},
      ${position}, ${JSON.stringify(config)}::jsonb
    )
    RETURNING *
  `) as ToolRow[]
  return rowToTool(rows[0])
}

export type UpdateToolInput = Partial<{
  name: string
  tagline: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
  status: Tool["status"]
  featured: boolean
  span: { col: number; row: number }
  inputType: string
  inputIcon: string
  outputType: string
  outputIcon: string
  config: ToolConfigData
}>

export async function updateTool(id: string, patch: UpdateToolInput): Promise<Tool | null> {
  const current = await getTool(id)
  if (!current) return null

  const next = {
    name: patch.name ?? current.name,
    tagline: patch.tagline ?? current.tagline,
    description: patch.description ?? current.description,
    icon: patch.icon ?? current.icon,
    icon_bg: patch.iconBg ?? current.iconBg,
    icon_color: patch.iconColor ?? current.iconColor,
    status: patch.status ?? current.status,
    featured: patch.featured ?? current.featured,
    span_col: patch.span?.col ?? current.span.col,
    span_row: patch.span?.row ?? current.span.row,
    input_type: patch.inputType ?? current.inputType,
    input_icon: patch.inputIcon ?? current.inputIcon,
    output_type: patch.outputType ?? current.outputType,
    output_icon: patch.outputIcon ?? current.outputIcon,
    config: patch.config ?? current.config,
  }

  const rows = (await sql`
    UPDATE tools SET
      name = ${next.name},
      tagline = ${next.tagline},
      description = ${next.description},
      icon = ${next.icon},
      icon_bg = ${next.icon_bg},
      icon_color = ${next.icon_color},
      status = ${next.status},
      featured = ${next.featured},
      span_col = ${next.span_col},
      span_row = ${next.span_row},
      input_type = ${next.input_type},
      input_icon = ${next.input_icon},
      output_type = ${next.output_type},
      output_icon = ${next.output_icon},
      config = ${JSON.stringify(next.config)}::jsonb,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as ToolRow[]
  return rows[0] ? rowToTool(rows[0]) : null
}

export async function deleteTool(id: string): Promise<boolean> {
  const rows = (await sql`DELETE FROM tools WHERE id = ${id} RETURNING id`) as Array<{ id: string }>
  return rows.length > 0
}

export async function duplicateTool(id: string): Promise<Tool | null> {
  const original = await getTool(id)
  if (!original) return null
  const newId = `${original.id}_copy_${Date.now()}`
  return createTool({
    id: newId,
    name: `${original.name} (copia)`,
    tagline: original.tagline,
    description: original.description,
    icon: original.icon,
    iconBg: original.iconBg,
    iconColor: original.iconColor,
    inputType: original.inputType,
    inputIcon: original.inputIcon,
    outputType: original.outputType,
    outputIcon: original.outputIcon,
    config: original.config,
    status: "draft",
  })
}

export async function recordRun(toolId: string, durationMs: number, detected: number, errors = 0) {
  await sql`
    INSERT INTO tool_runs (tool_id, duration_ms, detected_count, errors)
    VALUES (${toolId}, ${durationMs}, ${detected}, ${errors})
  `
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "tool"
}
