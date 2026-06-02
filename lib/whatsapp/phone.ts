// Normalización de teléfonos a formato E.164 (+34XXXXXXXXX).
// WhatsApp/KAPSO espera el número en formato internacional con prefijo "+".

const DEFAULT_CC = process.env.KAPSO_DEFAULT_COUNTRY_CODE?.trim() || "34"

export type NormalizedPhone =
  | { ok: true; e164: string }
  | { ok: false; reason: string }

/**
 * Normaliza un teléfono a E.164.
 * - Limpia espacios, guiones, paréntesis y puntos.
 * - "00" inicial → "+".
 * - Si no trae prefijo de país, aplica `defaultCountryCode` (def. env KAPSO_DEFAULT_COUNTRY_CODE o 34).
 */
export function normalizePhone(raw: string, defaultCountryCode = DEFAULT_CC): NormalizedPhone {
  if (!raw || !raw.trim()) return { ok: false, reason: "vacío" }

  let s = raw.trim().replace(/[\s\-().]/g, "")

  // Prefijo internacional "00" → "+"
  if (s.startsWith("00")) s = "+" + s.slice(2)

  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, "")
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, reason: `longitud inválida (${digits.length} dígitos)` }
    }
    return { ok: true, e164: "+" + digits }
  }

  // Sin prefijo: deben ser solo dígitos
  const digits = s.replace(/\D/g, "")
  if (!digits) return { ok: false, reason: "sin dígitos" }
  if (digits.length < 6) return { ok: false, reason: "demasiado corto" }

  // Número nacional → anteponer prefijo de país por defecto
  const e164 = "+" + defaultCountryCode + digits
  const total = e164.slice(1).length
  if (total < 8 || total > 15) {
    return { ok: false, reason: `longitud inválida (${total} dígitos)` }
  }
  return { ok: true, e164 }
}
