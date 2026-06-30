import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  const publicRoutes = [
    '/admin',
    '/admin/forgot-password',
    '/admin/reset-password',
  ]
  const isPublic = publicRoutes.some(r => path === r)
  const isProtected = path.startsWith('/admin') && !isPublic

  if (!isProtected) return NextResponse.next()

  // Supabase's actual cookie name is deterministic: sb-<project-ref>-auth-token
  // (optionally chunked as sb-<ref>-auth-token.0, .1, etc for large sessions).
  // Matching ONLY this exact pattern avoids false positives from unrelated
  // cookies that happen to contain generic substrings like "auth-token".
  const cookies = req.cookies.getAll()
  const hasSession = cookies.some(c =>
    /^sb-[a-z0-9]+-auth-token(\.\d+)?$/.test(c.name) && c.value && c.value.length > 10
  )

  // PKCE flow cookie — user is actively mid-login, let them through
  const isMidAuth = cookies.some(c => /^sb-[a-z0-9]+-auth-token-code-verifier$/.test(c.name))

  if (!hasSession && !isMidAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}