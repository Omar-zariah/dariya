import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const ROLE_HOME: Record<string, string> = {
  admin:    '/admin/dashboard',
  agent:    '/agent/dashboard',
  provider: '/provider/dashboard',
  owner:    '/owner/dashboard',
};

// Routes that belong exclusively to one role — deny all others
const ROLE_PREFIXES: Array<{ prefix: string; role: string }> = [
  { prefix: '/owner',    role: 'owner' },
  { prefix: '/admin',    role: 'admin' },
  { prefix: '/agent',    role: 'agent' },
  { prefix: '/provider', role: 'provider' },
];

// Public paths that never need auth
const PUBLIC = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/pricing', '/services', '/contact', '/auth'];

function isPublic(pathname: string) {
  return PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith('/auth/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // 1. Check for local development session cookie first
  const devCookie = request.cookies.get('dariya_dev_session')?.value;
  if (devCookie) {
    try {
      const devSession = JSON.parse(devCookie);
      if (devSession && devSession.role) {
        const role: string = devSession.role;
        const home = ROLE_HOME[role] ?? '/owner/dashboard';

        if (pathname === '/login' || pathname === '/signup' || pathname === '/app' || pathname.startsWith('/app/')) {
          return NextResponse.redirect(new URL(home, request.url));
        }

        for (const { prefix, role: required } of ROLE_PREFIXES) {
          if (pathname.startsWith(prefix) && role !== required) {
            return NextResponse.redirect(new URL(home, request.url));
          }
        }

        return response;
      }
    } catch {
      // Invalid cookie, proceed with normal auth
    }
  }

  // 2. Supabase auth flow with error boundary
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    if (!isPublic(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  let user = null;
  let supabase = null;

  try {
    supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(items: { name: string; value: string; options: CookieOptions }[]) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const res = await supabase.auth.getUser();
    user = res.data?.user;
  } catch (err) {
    // Supabase remote fetch failed (e.g. offline, ENOTFOUND, network down)
    user = null;
  }

  // ── Unauthenticated visitors ──────────────────────────────────────────────
  if (!user) {
    if (!isPublic(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // ── Authenticated user ────────────────────────────────────────────────────
  let role = 'owner';
  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role) role = profile.role;
    } catch {
      // Keep default role on DB read failure
    }
  }

  const home = ROLE_HOME[role] ?? '/owner/dashboard';

  // Redirect from login/signup → correct portal
  if (pathname === '/login' || pathname === '/signup') {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Redirect legacy /app → correct portal
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Enforce role isolation for portal prefixes
  for (const { prefix, role: required } of ROLE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      if (role !== required) {
        return NextResponse.redirect(new URL(home, request.url));
      }
      break;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
