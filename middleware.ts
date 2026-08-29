import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type Role = 'superadmin' | 'main_admin' | 'member'

const protectedRouteRoles: Array<{ prefix: string; allowedRoles: Role[] }> = [
  { prefix: '/superadmin', allowedRoles: ['superadmin'] },
  { prefix: '/main-admin', allowedRoles: ['superadmin', 'main_admin'] },
  { prefix: '/branch-admin', allowedRoles: ['superadmin', 'main_admin'] },
  { prefix: '/member/constitution', allowedRoles: ['superadmin', 'main_admin', 'member'] },
  { prefix: '/member', allowedRoles: ['member'] },
  { prefix: '/settings', allowedRoles: ['superadmin', 'main_admin', 'member'] },
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
  if (role === 'member') return '/member'
  return '/'
}

function isSameLocation(request: NextRequest, target: URL) {
  return (
    target.pathname === request.nextUrl.pathname &&
    target.search === request.nextUrl.search
  )
}

function redirectIfDifferent(request: NextRequest, target: URL) {
  if (isSameLocation(request, target)) {
    return null
  }
  return NextResponse.redirect(target)
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const authCookieNames = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name.startsWith('sb-') && name.includes('auth-token'))

  authCookieNames.forEach((name) => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
      maxAge: 0,
    })
  })
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
    const redirectResponse = redirectIfDifferent(request, loginUrl)
    if (redirectResponse) {
      return redirectResponse
    }
    return response
  }

  let role: Role | null = null
  let profileLookupFailed = false

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    profileLookupFailed = Boolean(profileError)
    role = (profile?.role as Role | undefined) ?? null
  }

  if (user && (!role || profileLookupFailed)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'session_invalid')

    const redirectResponse = redirectIfDifferent(request, loginUrl)
    if (redirectResponse) {
      clearSupabaseAuthCookies(request, redirectResponse)
      return redirectResponse
    }
  }

  if (user && (pathname === '/login' || pathname === '/')) {
    const homeUrl = new URL(roleHome(role), request.url)
    const redirectResponse = redirectIfDifferent(request, homeUrl)
    if (redirectResponse) {
      return redirectResponse
    }
    return response
  }

  if (user && protectedRoute) {
    const allowed = role ? protectedRoute.allowedRoles.includes(role) : false
    if (!allowed) {
      const homeUrl = new URL(roleHome(role), request.url)
      const redirectResponse = redirectIfDifferent(request, homeUrl)
      if (redirectResponse) {
        return redirectResponse
      }
      return response
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
