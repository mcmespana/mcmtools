import { NextResponse } from "next/server"
import { listContacts, uniqueMcmLocales } from "@/lib/sinergia/client"
import { SINERGIA_FIELDS } from "@/lib/sinergia/fields"

export const dynamic = "force-dynamic"

// POST /api/sinergia → proxy server-side de SinergiaCRM.
// body: { action: "list-contacts", mcmLocal?, etapa? }
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string
      mcmLocal?: string
      etapa?: string
    }

    if (body.action !== "list-contacts") {
      return NextResponse.json({ error: `Acción desconocida: ${body.action}` }, { status: 400 })
    }

    const { rows, total } = await listContacts({ mcmLocal: body.mcmLocal, etapa: body.etapa })

    return NextResponse.json({
      ok: true,
      total,
      rows,
      columns: SINERGIA_FIELDS.map((f) => ({ key: f.key, label: f.label })),
      mcmLocales: uniqueMcmLocales(rows),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[sinergia] POST failed", msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
