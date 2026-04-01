import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// ── DELETE /api/stock-status/[productId]?store_id=<uuid> ─────────────────────
// Superadmin or Store re-enables a product that was previously marked OOS for a store.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || !['superadmin', 'store'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  let storeId = '';

  if (user.role === 'superadmin') {
    storeId = new URL(req.url).searchParams.get('store_id') || '';
    if (!storeId) {
      return NextResponse.json({ error: 'store_id query param is required' }, { status: 400 });
    }
  } else {
    // For store users, they can only unmark their own store
    storeId = user.store_id;
  }

  const { error } = await supabase
    .from('store_product_status')
    .delete()
    .eq('store_id', storeId)
    .eq('product_id', productId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
