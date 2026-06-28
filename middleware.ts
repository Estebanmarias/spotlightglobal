import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Pages always accessible without login
  const publicRoutes = [
    '/admin',
    '/admin/forgot-password',
    '/admin/reset-password',
  ]
  const isPublic = publicRoutes.includes(path)
  const isProtected = path.startsWith('/admin') && !isPublic

  if (!isProtected) return NextResponse.next()

  // Supabase sets a cookie starting with 'sb-' when a session exists.
  // Checking for this is lightweight, edge-compatible, and reliable.
  const hasSession = req.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}