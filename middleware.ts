import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const loginPage = '/login'

const publicRoutes = [
  '/',
  '/plasmic-host',

  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/user-invite',
  '/reset-password/[recovery_token]',
  '/register',
  '/register-candidat',
  '/register-company',
  '/accueil-employeur',
  '/mentions-legales',
  '/cgu',

  '/auth/oauth-callback',
  '/auth/auth-code-error',
  '/auth/after-login-ok',

  '/first-install',
  '/plasmic-library',
  '/libellule',
  
  '/api/save-data',
  '/api/lib-ellule/update',
  '/api/lib-ellule/files',
  '/api/lib-ellule/listComponents',
  '/api/lib-ellule/generate-components',
  '/api/lib-ellule/save-infos',
  '/api/lib-ellule/get-infos',
]

export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/sw.js")
  ) {
    return NextResponse.next();
  }

    const supabaseResponse = NextResponse.next({
      request,
    })
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              if (name === 'session_id' && isOldCookie(value)) {
                supabaseResponse.cookies.set(name, '', { maxAge: 0, path: '/' });
                continue;
              }            
  
              const cookieOptions = {
                path: '/',
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                // sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'None',
                secure: true,
                sameSite: 'Lax',
                maxAge: 60 * 60,
                ...options,
              }
  
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, cookieOptions)
            }
          }
        },
      }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
      
    const isPublicRoute = publicRoutes.some(route => {
      if (route.includes('[recovery_token]')) {
          const regex = new RegExp(`^${route.replace('[recovery_token]', '(.*)')}$`)
          return regex.test(request.nextUrl.pathname)
      }
      return route === request.nextUrl.pathname
    })
  
    if (!isPublicRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = loginPage
        return NextResponse.redirect(url)
    }
  }
  
  function isOldCookie(cookieValue: string): boolean {
    try {
      const parts = cookieValue.split('.');
      if (parts.length !== 3) return true;
  
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (e) {
      return true;
    }
  }
    
  export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
  }