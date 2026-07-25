/**
 * Turns a member_id into the synthetic email Supabase Auth needs internally.
 * Members never see or type this - they only ever use their member_id.
 */
export function memberIdToEmail(memberId: string) {
  return `${memberId.toLowerCase()}@members.ugenyaassociation.internal`
}

/**
 * Normalizes a Kenyan phone number to a consistent format before
 * using it as the initial password, e.g. "0712345678" -> "254712345678"
 */
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '254' + digits.slice(1)
  if (digits.startsWith('254')) return digits
  return digits
}