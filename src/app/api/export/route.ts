import { getUserFromToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Parser } from 'json2csv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Only superadmin can export
  const user = await getUserFromToken();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('store_id');
  const from    = searchParams.get('from');
  const to      = searchParams.get('to');

  // Query sales_records joined with stores for store name
  let query = supabase
    .from('sales_records')
    .select(`
      sale_date,
      customer_name,
      customer_phone,
      customer_email,
      product_name,
      category_name,
      mrp_at_sale,
      discount_amount,
      final_price,
      created_at,
      stores ( name )
    `)
    .order('created_at', { ascending: false });

  if (storeId) query = query.eq('store_id', storeId);
  if (from)    query = query.gte('sale_date', from);
  if (to)      query = query.lte('sale_date', to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map to flat objects with readable column names for CSV
  const rows = (data ?? []).map((row: any) => ({
    'Date':          row.sale_date,
    'Store Name':    row.stores?.name ?? '',
    'Customer Name': row.customer_name,
    'Phone':         row.customer_phone  ?? '',
    'Email':         row.customer_email  ?? '',
    'Product':       row.product_name,
    'Category':      row.category_name,
    'MRP':           row.mrp_at_sale,
    'Discount':      row.discount_amount,
    'Final Price':   row.final_price
  }));

  const fields = [
    'Date', 'Store Name', 'Customer Name', 'Phone', 'Email',
    'Product', 'Category', 'MRP', 'Discount', 'Final Price'
  ];

  const parser = new Parser({ fields });
  const csv    = parser.parse(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="sales-export.csv"'
    }
  });
}
