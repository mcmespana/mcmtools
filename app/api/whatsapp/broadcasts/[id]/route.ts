import { NextResponse } from "next/server"
import { getBroadcast } from "@/lib/whatsapp/kapso"

export const dynamic = "force-dynamic"

// GET /api/whatsapp/broadcasts/[id] → estado/métricas del broadcast (polling).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const broadcast = await getBroadcast(id)
    return NextResponse.json({ broadcast })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[whatsapp] GET /broadcasts/[id] failed", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
