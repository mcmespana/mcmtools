import { NextResponse } from "next/server"
import { deleteTool, getTool, updateTool } from "@/lib/db"

type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteCtx) {
  const { id } = await params
  const tool = await getTool(id)
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ tool })
}

export async function PATCH(req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const body = await req.json()
    const tool = await updateTool(id, body)
    if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ tool })
  } catch (e) {
    console.error("[v0] PATCH /api/tools/[id] failed", e)
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const ok = await deleteTool(id)
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[v0] DELETE /api/tools/[id] failed", e)
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 })
  }
}
