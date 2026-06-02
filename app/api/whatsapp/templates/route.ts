import { NextResponse } from "next/server"
import { listTemplates } from "@/lib/whatsapp/kapso"
import { detectTemplateVariables, getBodyText, getButtons, getHeaderText } from "@/lib/whatsapp/template-vars"

export const dynamic = "force-dynamic"

// GET /api/whatsapp/templates → plantillas APPROVED con sus variables detectadas.
export async function GET() {
  try {
    const templates = await listTemplates(true)
    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      language: t.language,
      status: t.status,
      category: t.category,
      headerText: getHeaderText(t),
      bodyText: getBodyText(t),
      variables: detectTemplateVariables(t),
      buttons: getButtons(t),
    }))
    return NextResponse.json({ templates: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[whatsapp] GET /templates failed", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
