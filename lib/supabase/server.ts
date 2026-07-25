import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // called from a Server Component - middleware handles refresh instead
          }
        },
      },
    }
  )
}

// Admin client - service role key, SERVER ONLY, never expose to browser.
// Used for creating auth users when a branch admin adds a member.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // keep in .env, never NEXT_PUBLIC_
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
