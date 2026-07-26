import { createAdminClient, createClient } from '@/lib/supabase/server'
import { memberIdToEmail, normalizePhone, toLocalPhoneFormat } from '@/lib/auth/shared'

interface CreateMemberInput {
  fullName: string
  phone: string
  idNumber?: string
  branchId: string
}

/**
 * Called from a server action / route handler when a branch_admin,
 * main_admin, or superadmin adds a new member.
 * The caller's own Supabase session (via createClient) is used first
 * to enforce RLS + confirm the caller is allowed to write to this branch.
 * The admin client is only used for the auth.users insert, which RLS can't cover.
 */
export async function createMember(input: CreateMemberInput) {
  const supabase = await createClient()

  // 1. Generate the branch-scoped member ID via the DB function
  const { data: memberIdData, error: idError } = await supabase.rpc(
    'generate_member_id',
    { p_branch_id: input.branchId }
  )
  if (idError) throw idError
  const memberId: string = memberIdData

  const normalizedPhone = normalizePhone(input.phone)
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
      branch_id: input.branchId,
      full_name: input.fullName,
      phone: normalizedPhone,
      id_number: input.idNumber ?? null,
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
    branch_id: input.branchId,
    full_name: input.fullName,
  })

  if (profileError) {
    throw profileError
  }

  return { memberId, initialPassword, member }
}
