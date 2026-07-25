import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type Role = 'superadmin' | 'main_admin' | 'branch_admin' | 'member'

const protectedRouteRoles: Array<{ prefix: string; allowedRoles: Role[] }> = [
  { prefix: '/superadmin', allowedRoles: ['superadmin'] },
  { prefix: '/main-admin', allowedRoles: ['superadmin', 'main_admin'] },
  { prefix: '/branch-admin', allowedRoles: ['superadmin', 'main_admin', 'branch_admin'] },
  { prefix: '/member', allowedRoles: ['member'] },
]

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function findProtectedRoute(pathname: string) {
  return protectedRouteRoles.find((route) => matchesPrefix(pathname, route.prefix))
}

function roleHome(role: Role | null | undefined) {
  if (role === 'superadmin') return '/superadmin'
  if (role === 'main_admin') return '/main-admin'
  if (role === 'branch_admin') return '/branch-admin'
  if (role === 'member') return '/member'
  return '/'
}

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

  const pathname = request.nextUrl.pathname
  const protectedRoute = findProtectedRoute(pathname)

  if (protectedRoute && !user) {
    const redirectTo = `${pathname}${request.nextUrl.search}`
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', redirectTo)
    return NextResponse.redirect(loginUrl)
  }

  let role: Role | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    role = (profile?.role as Role | undefined) ?? null
  }

  if (user && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  if (user && protectedRoute) {
    const allowed = role ? protectedRoute.allowedRoles.includes(role) : false
    if (!allowed) {
      return NextResponse.redirect(new URL(roleHome(role), request.url))
    }
  }

  if (user && role === 'member' && matchesPrefix(pathname, '/member')) {
    const { data: member } = await supabase
      .from('members')
      .select('must_change_password')
      .eq('auth_id', user.id)
      .single()

    const mustChangePassword = member?.must_change_password === true
    const isChangePasswordPath = pathname === '/member/change-password'

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
