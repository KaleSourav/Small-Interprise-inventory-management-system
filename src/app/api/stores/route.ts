import { getUserFromToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcryptjs from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// ── GET /api/stores ───────────────────────────────────────────────────────
export async function GET() {
  const user = await getUserFromToken();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('stores')
    // Never return password_hash
    .select('id, name, location, username, is_active, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ── POST /api/stores ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, location, username, password } = await req.json();

  if (!name || !username || !password) {
    return NextResponse.json(
      { error: 'name, username and password are required' },
      { status: 400 }
    );
  }

  // Hash password before storing
  const password_hash = bcryptjs.hashSync(password, 10);

  const { data, error } = await supabase
    .from('stores')
    .insert({ name, location, username, password_hash })
    // Only return safe columns — no password_hash
    .select('id, name, location, username, is_active, created_at')
    .single();

  if (error) {
    // Unique constraint violation on username
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
