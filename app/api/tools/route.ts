import { NextResponse } from "next/server"
import { listTools, createTool, slugify } from "@/lib/db"

export async function GET() {
  try {
    const tools = await listTools()
    return NextResponse.json({ tools })
  } catch (e) {
    console.error("[v0] GET /api/tools failed", e)
    return NextResponse.json({ error: "Failed to list tools" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const baseId = slugify(body.name ?? "tool")
    const id = `${baseId}_${Date.now().toString(36)}`
    const tool = await createTool({
      id,
      name: body.name || "Nueva tool",
      tagline: body.tagline || "sin descripción",
      description: body.description || body.tagline || "",
      icon: body.icon || "fileText",
      iconBg: body.iconBg || body.color || "#C7B8FF",
      iconColor: body.iconColor || "#0A0A0A",
      inputType: body.inputType || "Archivo",
      inputIcon: body.inputIcon || "upload",
      outputType: body.outputType || "Archivo",
      outputIcon: body.outputIcon || "download",
      status: "draft",
      config: body.config,
    })
    return NextResponse.json({ tool })
  } catch (e) {
    console.error("[v0] POST /api/tools failed", e)
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 })
  }
}
