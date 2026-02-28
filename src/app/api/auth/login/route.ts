import { createToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcryptjs from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  // ── STEP 1: Check admins table ────────────────────────────────────────────
  const { data: admin } = await supabase
    .from('admins')
    .select('id, username, password_hash')
    .eq('username', username)
    .single();

  if (admin && bcryptjs.compareSync(password, admin.password_hash)) {
    const token = createToken({ role: 'superadmin', id: admin.id });
    const response = NextResponse.json({ success: true, role: 'superadmin' });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      maxAge: 86400,
      path: '/'
    });
    return response;
  }

  // ── STEP 2: Check stores table ────────────────────────────────────────────
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, username, password_hash')
    .eq('username', username)
    .eq('is_active', true)
    .single();

  if (store && bcryptjs.compareSync(password, store.password_hash)) {
    const token = createToken({
      role: 'store',
      store_id: store.id,
      store_name: store.name
    });
    const response = NextResponse.json({ success: true, role: 'store' });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      maxAge: 86400,
      path: '/'
    });
    return response;
  }

  // ── STEP 3: No match ──────────────────────────────────────────────────────
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
