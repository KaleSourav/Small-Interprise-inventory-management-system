'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SaleRecord {
  id: string;
  sale_date: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  category_name: string;
  mrp_at_sale: number;
  discount_amount: number;
  final_price: number;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function SalesHistoryPage() {
  const router = useRouter();

  const [sales,   setSales]   = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [from,    setFrom]    = useState(getToday());
  const [to,      setTo]      = useState(getToday());

  async function fetchSales(fromDate = from, toDate = to) {
    setLoading(true);
    const res = await fetch(`/api/sales?from=${fromDate}&to=${toDate}`);
    const data = await res.json();
    setSales(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  // On mount
  useEffect(() => { fetchSales(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Preset handlers
  function setPreset(preset: 'today' | 'last7' | 'month') {
    let f = getToday(), t = getToday();
    if (preset === 'last7')  f = daysAgo(7);
    if (preset === 'month')  f = firstOfMonth();
    setFrom(f);
    setTo(t);
    fetchSales(f, t);
  }

  // Computed
  const totalRevenue  = sales.reduce((s, r) => s + (r.final_price    || 0), 0);
  const totalDiscount = sales.reduce((s, r) => s + (r.discount_amount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf5' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(90deg, #92400e, #b45309)',
        color: '#fff', padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', borderRadius: '0.4rem', padding: '0.3rem 0.75rem',
            cursor: 'pointer', fontWeight: '600'
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Sales History</h1>
      </header>

      <main style={{ padding: '1.25rem', maxWidth: '1100px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── FILTER CARD ─────────────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <CardContent style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Preset buttons row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Today',       key: 'today' as const },
                { label: 'Last 7 Days', key: 'last7' as const },
                { label: 'This Month',  key: 'month' as const },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  style={{
                    padding: '0.35rem 0.9rem',
                    borderRadius: '999px',
                    border: '1px solid #d97706',
                    background: '#fff',
                    color: '#92400e',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fef3c7';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date range + Search row */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '500' }}>From:</label>
                <Input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '500' }}>To:</label>
                <Input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>
              <Button
                onClick={() => fetchSales()}
                style={{
                  background: '#b45309', color: '#fff',
                  border: 'none', borderRadius: '0.5rem',
                  padding: '0.45rem 1.25rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── SUMMARY CARDS ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>

          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.25rem' }}>
              <CardTitle style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', lineHeight: 1 }}>
                {sales.length}
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.25rem' }}>
              <CardTitle style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', lineHeight: 1 }}>
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.25rem' }}>
              <CardTitle style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>
                Total Discounts Given
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#dc2626', lineHeight: 1 }}>
                ₹{totalDiscount.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── DATA TABLE ──────────────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '1rem', color: '#374151' }}>
              Records
              {sales.length > 0 && (
                <span style={{ fontWeight: '400', fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                  ({sales.length} found)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading...</p>
            ) : sales.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                No records found for this period
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#fef3c7', borderBottom: '2px solid #fde68a' }}>
                      {['Date', 'Customer', 'Phone', 'Product', 'Category', 'MRP', 'Discount', 'Final Price'].map(h => (
                        <th key={h} style={{
                          padding: '0.65rem 0.85rem', textAlign: 'left',
                          fontWeight: '600', color: '#92400e', whiteSpace: 'nowrap'
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, i) => (
                      <tr
                        key={sale.id}
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: i % 2 === 0 ? '#fff' : '#fafaf5'
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fef9ec'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafaf5'}
                      >
                        <td style={{ padding: '0.6rem 0.85rem', color: '#374151', whiteSpace: 'nowrap' }}>
                          {sale.sale_date}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', fontWeight: '500', color: '#1f2937' }}>
                          {sale.customer_name}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#6b7280' }}>
                          {sale.customer_phone || '—'}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#374151' }}>
                          {sale.product_name}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#6b7280' }}>
                          {sale.category_name}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#374151' }}>
                          ₹{sale.mrp_at_sale}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#dc2626', fontWeight: '500' }}>
                          {sale.discount_amount > 0 ? `-₹${sale.discount_amount}` : '—'}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#16a34a', fontWeight: '700' }}>
                          ₹{sale.final_price.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
