import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';


// ── GET /api/products?category_id=<uuid>&name=<search> ────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId  = searchParams.get('category_id');
  const nameSearch  = searchParams.get('name');

  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      mrp,
      is_active,
      category_id,
      categories ( id, name ),
      product_variants (
        id,
        size_ml,
        size_label,
        price,
        is_active
      )
    `)
    .eq('is_active', true)
    .order('name');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (nameSearch) {
    query = query.ilike('name', `%${nameSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize and sort each product's variants by size_ml ascending
  const products = (data ?? []).map((p: any) => ({
    ...p,
    category_name: (p.categories as any)?.name ?? '',
    product_variants: Array.isArray(p.product_variants)
      ? [...p.product_variants]
          .filter((v: any) => v.is_active !== false)
          .sort((a: any, b: any) => (a.size_ml ?? 0) - (b.size_ml ?? 0))
      : []
  }));

  return NextResponse.json(products);
}

// ── POST /api/products ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Only superadmin can create products
  // Read token directly from req.cookies — more reliable than getUserFromToken() in POST handlers
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = verifyToken(token);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, category_id, variants, mrp } = await req.json();

  if (!name || !category_id) {
    return NextResponse.json(
      { error: 'name and category_id are required' },
      { status: 400 }
    );
  }

  // ── 1. Insert the product ────────────────────────────────────────────────
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({ name: name.trim(), category_id, mrp: mrp || 0, is_active: true })
    .select()
    .single();

  if (productError || !product) {
    console.error('Product insert error:', productError);
    return NextResponse.json(
      { error: productError?.message || 'Failed to create product' },
      { status: 500 }
    );
  }

  console.log('Product created:', product.id, product.name);

  // ── 2. Insert variants from the form (universal for ALL categories) ─────────
  let variantsToInsert: {
    product_id: string;
    size_ml: number | null;
    size_label: string;
    price: number;
    is_active: boolean;
  }[] = [];

  if (Array.isArray(variants) && variants.length > 0) {
    variantsToInsert = variants.map((v: any) => {
      const rawLabel = v.size_label?.trim() || v.size?.trim() || '';
      const computedLabel = rawLabel
        ? rawLabel
        : v.size_ml
          ? `${v.size_ml}ml`
          : `₹${Number(v.price) || 0}`;
      return {
        product_id: product.id,
        size_ml:    v.size_ml ?? null,
        size_label: computedLabel,
        price:      Number(v.price) || 0,
        is_active:  true
      };
    });
  }

  console.log('Variants to insert:', variantsToInsert.length);

  // ── 3. Insert variants if any ────────────────────────────────────────────
  let insertedVariants: { id: string; size_ml: number | null; size_label: string | null; price: number }[] = [];
  if (variantsToInsert.length > 0) {
    const { data: variantData, error: variantError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select('id, size_ml, size_label, price');

    if (variantError) {
      console.error('Variant insert error code:', variantError.code);
      console.error('Variant insert error message:', variantError.message);
      console.error('Variant insert error details:', variantError.details);
      console.error('Variant insert error hint:', variantError.hint);
      console.error('Variants attempted:', JSON.stringify(variantsToInsert));
      // Product was created — return it with a warning rather than failing hard
      return NextResponse.json(
        { ...product, product_variants: [], warning: 'Product created but variants failed: ' + variantError.message + ' | code: ' + variantError.code },
        { status: 201 }
      );
    }

    console.log('Variants inserted:', variantData?.length);
    insertedVariants = (variantData ?? []).sort((a: any, b: any) => (a.size_ml ?? 0) - (b.size_ml ?? 0));
  }

  return NextResponse.json(
    { ...product, product_variants: insertedVariants },
    { status: 201 }
  );
}
