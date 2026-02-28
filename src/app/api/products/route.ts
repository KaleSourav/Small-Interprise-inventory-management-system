import { getUserFromToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Default variants for Perfume category (15ml, 30ml, 50ml, 100ml)
const PERFUME_DEFAULT_VARIANTS = [
  { size_ml: 15,  price: 300  },
  { size_ml: 30,  price: 550  },
  { size_ml: 50,  price: 750  },
  { size_ml: 100, price: 1300 }
];

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
      categories ( name ),
      product_variants (
        id,
        size_ml,
        price
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort each product's variants by size_ml ascending
  const products = (data ?? []).map(p => ({
    ...p,
    product_variants: Array.isArray(p.product_variants)
      ? [...p.product_variants].sort((a, b) => a.size_ml - b.size_ml)
      : []
  }));

  return NextResponse.json(products);
}

// ── POST /api/products ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Only superadmin can create products
  const user = await getUserFromToken();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, category_id, variants } = await req.json();

  if (!name || !category_id) {
    return NextResponse.json(
      { error: 'name and category_id are required' },
      { status: 400 }
    );
  }

  // ── 1. Insert the product ────────────────────────────────────────────────
  // mrp is set to 0 as a placeholder; real prices live in product_variants
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({ name, category_id, mrp: 0 })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // ── 2. Determine which variants to create ────────────────────────────────
  let variantsToInsert: { product_id: string; size_ml: number; price: number }[] = [];

  if (Array.isArray(variants) && variants.length > 0) {
    // Use provided variants
    variantsToInsert = variants.map((v: { size_ml: number; price: number }) => ({
      product_id: product.id,
      size_ml:    v.size_ml,
      price:      v.price
    }));
  } else {
    // Check if category is "Perfume" by looking up the category name
    const { data: categoryData } = await supabase
      .from('categories')
      .select('name')
      .eq('id', category_id)
      .single();

    if (categoryData?.name?.toLowerCase() === 'perfume') {
      variantsToInsert = PERFUME_DEFAULT_VARIANTS.map(v => ({
        product_id: product.id,
        ...v
      }));
    }
  }

  // ── 3. Insert variants if any ────────────────────────────────────────────
  let insertedVariants: { id: string; size_ml: number; price: number }[] = [];
  if (variantsToInsert.length > 0) {
    const { data: variantData, error: variantError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select('id, size_ml, price');

    if (variantError) {
      // Product was created — return it with a warning rather than failing hard
      return NextResponse.json(
        { ...product, product_variants: [], warning: variantError.message },
        { status: 201 }
      );
    }

    insertedVariants = (variantData ?? []).sort((a, b) => a.size_ml - b.size_ml);
  }

  return NextResponse.json(
    { ...product, product_variants: insertedVariants },
    { status: 201 }
  );
}
