import { createClient } from '@/lib/supabase/client'
import { memberIdToEmail } from '@/lib/auth/shared'

/**
 * Single login entry point for the homepage login form.
 * - Members type their member_id (e.g. UGY-KIS-0042) + phone/chosen password.
 * - Admins (branch/main/superadmin) log in with a real email + password.
 * We detect which one it is by checking the format of the identifier.
 */
export async function login(identifier: string, password: string) {
  const supabase = createClient()

  const isMemberId = /^UAE\d{3,}$/i.test(identifier.trim())
  const email = isMemberId
    ? memberIdToEmail(identifier.trim())
    : identifier.trim()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Fetch role to decide where to redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, branch_id')
    .eq('id', data.user.id)
    .single()

  return { session: data.session, profile }
}

/**
 * Call after a member successfully sets a new password for the first time.
 * Flips must_change_password so they're not nagged again.
 */
export async function clearMustChangePassword(memberAuthId: string) {
  const supabase = createClient()
  await supabase
    .from('members')
    .update({ must_change_password: false })
    .eq('auth_id', memberAuthId)
}
