import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (path === '/login' && user) {
    return NextResponse.redirect(new URL('/member', request.url))
  }

  if (path.startsWith('/member')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'member') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const { data: member } = await supabase
      .from('members')
      .select('must_change_password')
      .eq('auth_id', user.id)
      .single()

    const mustChangePassword = member?.must_change_password === true
    const isChangePasswordPath = path === '/member/change-password'

    if (mustChangePassword && !isChangePasswordPath) {
      return NextResponse.redirect(new URL('/member/change-password', request.url))
    }

    if (!mustChangePassword && isChangePasswordPath) {
      return NextResponse.redirect(new URL('/member', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
