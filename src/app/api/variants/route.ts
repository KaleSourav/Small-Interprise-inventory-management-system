import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// ── GET /api/variants?product_id=<uuid> ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json(
      { error: 'product_id query parameter is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('product_variants')
    .select('id, size_ml, price')
    .eq('product_id', productId)
    .order('size_ml', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
