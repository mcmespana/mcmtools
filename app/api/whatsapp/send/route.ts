import { NextResponse } from "next/server"
import { addRecipients, createBroadcast, listTemplates, sendBroadcast, type Recipient } from "@/lib/whatsapp/kapso"
import { buildComponents, detectTemplateVariables } from "@/lib/whatsapp/template-vars"
import { normalizePhone } from "@/lib/whatsapp/phone"
import { toDisplayValue } from "@/lib/sinergia/fields"
import type { SendRequest, SendResponse } from "@/lib/whatsapp/types"

export const dynamic = "force-dynamic"

// POST /api/whatsapp/send → crea broadcast, añade destinatarios y lo envía.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendRequest

    if (!body.templateId || !body.campaignName?.trim()) {
      return NextResponse.json({ error: "Faltan campaignName o templateId" }, { status: 400 })
    }

    // Recuperamos la plantilla server-side (fuente de verdad de las variables).
    const templates = await listTemplates(false)
    const template = templates.find((t) => t.id === body.templateId)
    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
    }
    const vars = detectTemplateVariables(template)

    const invalid: SendResponse["invalid"] = []
    const recipients: Recipient[] = []

    // El transform convierte códigos de Sinergia → etiqueta visible (no-op en Excel).
    const transform = (key: string, value: string) => toDisplayValue(key, value)

    if (body.testPhone) {
      // Envío de prueba: un único destinatario, usando la 1ª fila como datos (o vacío).
      const sampleRow = body.rows?.[0] ?? {}
      const norm = normalizePhone(body.testPhone)
      if (!norm.ok) {
        return NextResponse.json({ error: `Teléfono de prueba inválido: ${norm.reason}` }, { status: 400 })
      }
      recipients.push({
        phone_number: norm.e164,
        components: buildComponents(vars, body.mapping ?? {}, sampleRow, transform),
      })
    } else {
      if (!body.phoneColumnKey) {
        return NextResponse.json({ error: "Falta phoneColumnKey" }, { status: 400 })
      }
      if (!Array.isArray(body.rows) || body.rows.length === 0) {
        return NextResponse.json({ error: "No hay destinatarios" }, { status: 400 })
      }

      const seen = new Set<string>()
      body.rows.forEach((row, i) => {
        const norm = normalizePhone(row[body.phoneColumnKey] ?? "")
        if (!norm.ok) {
          invalid.push({ row: i + 2, reason: `teléfono ${norm.reason}` }) // +2: fila 1 = cabecera
          return
        }
        if (seen.has(norm.e164)) {
          invalid.push({ row: i + 2, reason: "duplicado" })
          return
        }
        seen.add(norm.e164)
        recipients.push({
          phone_number: norm.e164,
          components: buildComponents(vars, body.mapping ?? {}, row, transform),
        })
      })

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "Ningún teléfono válido tras la validación", invalid },
          { status: 400 },
        )
      }
    }

    const broadcast = await createBroadcast({ name: body.campaignName.trim(), templateId: body.templateId })
    await addRecipients(broadcast.id, recipients)
    await sendBroadcast(broadcast.id)

    const result: SendResponse = {
      broadcastId: broadcast.id,
      totalRecipients: recipients.length,
      invalid,
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[whatsapp] POST /send failed", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
