import { NextResponse } from "next/server"
import { duplicateTool } from "@/lib/db"

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const tool = await duplicateTool(id)
    if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ tool })
  } catch (e) {
    console.error("[v0] POST duplicate failed", e)
    return NextResponse.json({ error: "Failed to duplicate tool" }, { status: 500 })
  }
}
