// Cliente server-only de la API de KAPSO.
// NUNCA importar desde componentes cliente: usa la API key del entorno.

import "server-only"
import type { WhatsappTemplate } from "./types"

const BASE = "https://api.kapso.ai"
const META_VERSION = "v24.0"

function apiKey(): string {
  const key = process.env.KAPSO_API_KEY
  if (!key) throw new Error("Falta KAPSO_API_KEY en el entorno")
  return key
}

function businessAccountId(): string {
  const id = process.env.KAPSO_BUSINESS_ACCOUNT_ID
  if (!id) throw new Error("Falta KAPSO_BUSINESS_ACCOUNT_ID en el entorno")
  return id
}

export function phoneNumberId(): string {
  const id = process.env.KAPSO_PHONE_NUMBER_ID
  if (!id) throw new Error("Falta KAPSO_PHONE_NUMBER_ID en el entorno")
  return id
}

async function kapso<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`KAPSO ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
  return (text ? JSON.parse(text) : {}) as T
}

/** Lista plantillas. Por defecto solo las APPROVED. */
export async function listTemplates(onlyApproved = true): Promise<WhatsappTemplate[]> {
  const ba = businessAccountId()
  const q = onlyApproved ? "?status=APPROVED&limit=100" : "?limit=100"
  const data = await kapso<{ data: WhatsappTemplate[] }>(
    `/meta/whatsapp/${META_VERSION}/${ba}/message_templates${q}`,
  )
  return data.data ?? []
}

export type Broadcast = {
  id: string
  name: string
  status: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  pending_count: number
  responded_count: number
}

export async function createBroadcast(args: {
  name: string
  templateId: string
}): Promise<Broadcast> {
  const data = await kapso<{ data: Broadcast }>("/platform/v1/whatsapp/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      whatsapp_broadcast: {
        name: args.name,
        phone_number_id: phoneNumberId(),
        whatsapp_template_id: args.templateId,
      },
    }),
  })
  return data.data
}

export type Recipient = {
  phone_number: string
  components: Array<Record<string, unknown>>
}

export async function addRecipients(
  broadcastId: string,
  recipients: Recipient[],
): Promise<{ added: number; duplicates: number; errors: unknown[] }> {
  // KAPSO admite hasta 1000 destinatarios por request.
  const CHUNK = 1000
  let added = 0
  let duplicates = 0
  const errors: unknown[] = []
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK)
    const data = await kapso<{ data: { added: number; duplicates: number; errors: unknown[] } }>(
      `/platform/v1/whatsapp/broadcasts/${broadcastId}/recipients`,
      { method: "POST", body: JSON.stringify({ whatsapp_broadcast: { recipients: chunk } }) },
    )
    added += data.data?.added ?? 0
    duplicates += data.data?.duplicates ?? 0
    if (data.data?.errors?.length) errors.push(...data.data.errors)
  }
  return { added, duplicates, errors }
}

export async function sendBroadcast(broadcastId: string): Promise<void> {
  await kapso(`/platform/v1/whatsapp/broadcasts/${broadcastId}/send`, { method: "POST" })
}

export async function getBroadcast(broadcastId: string): Promise<Broadcast> {
  const data = await kapso<{ data: Broadcast }>(`/platform/v1/whatsapp/broadcasts/${broadcastId}`)
  return data.data
}
