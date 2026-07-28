import { createAdminClient, createClient } from '@/lib/supabase/server'
import { memberIdToEmail, normalizePhone, toLocalPhoneFormat } from '@/lib/auth/shared'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rateLimit'

// SQL audit note: no raw SQL string execution is used here; data access is via Supabase query builder.
// The only RPC call uses a fixed function name and named parameters.

interface CreateMemberInput {
  fullName: string
  phone: string
  idNumber?: string
  branchId: string
}

const MAX_FULL_NAME_LENGTH = 120
const MAX_PHONE_LENGTH = 20
const MAX_ID_NUMBER_LENGTH = 20
const MAX_BRANCH_ID_LENGTH = 80

function getClientIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = headerStore.get('x-real-ip')?.trim()
  return realIp || 'unknown'
}

function validateRequiredText(value: string, fieldName: string, maxLength: number) {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`${fieldName} is required.`)
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`)
  }
  return normalized
}

function validateOptionalText(value: string | undefined, fieldName: string, maxLength: number) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return undefined
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`)
  }
  return normalized
}

/**
 * Called from a server action / route handler when a main_admin
 * or superadmin adds a new member.
 * The caller's own Supabase session (via createClient) is used first
 * to enforce RLS + confirm the caller is allowed to write to this branch.
 * The admin client is only used for the auth.users insert, which RLS can't cover.
 */
export async function createMember(input: CreateMemberInput) {
  const requestHeaders = await headers()
  const ip = getClientIpFromHeaders(requestHeaders)
  const rateLimitResult = checkRateLimit(ip, 'create_member', 20)
  if (!rateLimitResult.allowed) {
    throw new Error('Too many member creation attempts. Please try again in 15 minutes.')
  }

  const fullName = validateRequiredText(input.fullName, 'Full Name', MAX_FULL_NAME_LENGTH)
  const phone = validateRequiredText(input.phone, 'Phone', MAX_PHONE_LENGTH)
  const branchId = validateRequiredText(input.branchId, 'Branch', MAX_BRANCH_ID_LENGTH)
  const idNumber = validateOptionalText(input.idNumber, 'ID Number', MAX_ID_NUMBER_LENGTH)

  const supabase = await createClient()

  // 1. Generate the branch-scoped member ID via the DB function
  // SAFE: parameterized via Supabase client (fixed RPC name + named argument payload)
  const { data: memberIdData, error: idError } = await supabase.rpc(
    'generate_member_id',
    { p_branch_id: branchId }
  )
  if (idError) throw idError
  const memberId: string = memberIdData

  const normalizedPhone = normalizePhone(phone)
  const initialPassword = toLocalPhoneFormat(normalizedPhone)
  const email = memberIdToEmail(memberId)

  // 2. Create the auth user with phone number as initial password
  const admin = createAdminClient()
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true, // skip email verification, it's a synthetic address
  })
  if (authError) throw authError

  // 3. Insert the member row (RLS on `members` enforces the caller's branch scope)
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      member_id: memberId,
      auth_id: authUser.user.id,
      branch_id: branchId,
      full_name: fullName,
      phone: normalizedPhone,
      id_number: idNumber ?? null,
      must_change_password: true,
    })
    .select()
    .single()

  if (memberError) throw memberError

  // 4. Give them a 'member' profile row too - must use the admin client,
  // since RLS only allows superadmin to write to profiles directly, but
  // any admin role needs to be able to create members.
  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id,
    role: 'member',
    branch_id: branchId,
    full_name: fullName,
  })

  if (profileError) {
    throw profileError
  }

  return { memberId, initialPassword, member }
}
