import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// ── DELETE /api/products/[id] ─────────────────────────────────────────────────
// Superadmin only. Deletes the product; variants are cascade-deleted by the DB.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Confirm the product exists first
  const { data: existing, error: findError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .single();

  if (findError || !existing) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Product deleted' });
}

// ── PATCH /api/products/[id] ──────────────────────────────────────────────────
// Superadmin only. Accepts optional { name, is_active } fields.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Only allow safe fields to be patched
  const updates: Record<string, unknown> = {};
  if (body.name      !== undefined) updates.name      = body.name;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields provided to update' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
