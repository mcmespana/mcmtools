import { NextResponse } from "next/server"
import { recordRun } from "@/lib/db"

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const body = await req.json()
    const duration = Number(body.durationMs ?? 0)
    const detected = Number(body.detected ?? 0)
    const errors = Number(body.errors ?? 0)
    await recordRun(id, duration, detected, errors)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[v0] POST runs failed", e)
    return NextResponse.json({ error: "Failed to record run" }, { status: 500 })
  }
}
