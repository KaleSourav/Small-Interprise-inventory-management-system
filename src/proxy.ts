import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Public routes — allow through with no checks ──────────────────────
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ── 2. No auth_token cookie → redirect to /login ─────────────────────────
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ── 3. Verify token with jose (edge-compatible) ───────────────────────────
  let payload: { role?: string } = {};
  try {
    const { payload: decoded } = await jwtVerify(token, JWT_SECRET);
    payload = decoded as { role?: string };
  } catch {
    // Invalid or expired token → redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const role = payload.role;

  // ── 4. Role-based access control ─────────────────────────────────────────

  // Admin routes: only superadmin allowed
  if (pathname.startsWith('/admin') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/store/dashboard', req.url));
  }

  // Store routes: only store role allowed
  if (pathname.startsWith('/store') && role !== 'store') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // ── 5. All checks passed — allow through ─────────────────────────────────
  return NextResponse.next();
}

// ── Matcher: protect only admin and store paths ───────────────────────────
export const config = {
  matcher: ['/admin/:path*', '/store/:path*']
};
