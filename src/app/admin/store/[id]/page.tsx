'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SaleRecord {
  id: string;
  sale_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_name: string;
  category_name: string;
  mrp_at_sale: number;
  discount_amount: number;
  final_price: number;
}

interface Store {
  id: string;
  name: string;
  location: string;
  username: string;
  is_active: boolean;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function firstOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

export default function AdminStoreViewPage() {
  const params = useParams();
  const id     = params.id as string;
  const router = useRouter();

  const [sales,   setSales]   = useState<SaleRecord[]>([]);
  const [stores,  setStores]  = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [from,    setFrom]    = useState(firstOfMonth());
  const [to,      setTo]      = useState(getToday());

  // ── Fetch sales for this store ────────────────────────────────────────────
  async function fetchSales(fromDate = from, toDate = to) {
    setLoading(true);
    const res  = await fetch(`/api/sales?store_id=${id}&from=${fromDate}&to=${toDate}`);
    const data = await res.json();
    setSales(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data : []));
    fetchSales();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preset handlers ───────────────────────────────────────────────────────
  function setPreset(preset: 'today' | 'last7' | 'month' | 'year') {
    const t = getToday();
    const f = preset === 'today' ? t
            : preset === 'last7' ? daysAgo(7)
            : preset === 'month' ? firstOfMonth()
            :                      firstOfYear();
    setFrom(f);
    setTo(t);
    fetchSales(f, t);
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function downloadCSV() {
    window.open(`/api/export?store_id=${id}&from=${from}&to=${to}`, '_blank');
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const currentStore = stores.find(s => s.id === id);
  const totalRevenue = sales.reduce((sum, s) => sum + (s.final_price || 0), 0);
  const avgSale      = sales.length > 0 ? totalRevenue / sales.length : 0;

  // ── Shared button style ───────────────────────────────────────────────────
  const presetStyle = (active = false): React.CSSProperties => ({
    padding: '0.35rem 0.85rem',
    borderRadius: '999px',
    border: '1px solid #374151',
    background: active ? '#111827' : '#f9fafb',
    color: active ? '#fff' : '#374151',
    fontWeight: '600',
    fontSize: '0.83rem',
    cursor: 'pointer',
    transition: 'all 0.15s'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        background: '#111827', color: '#fff',
        padding: '1rem 1.75rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        flexWrap: 'wrap',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: '0.4rem', padding: '0.35rem 0.8rem',
            cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap'
          }}
        >
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1.15rem' }}>
            {currentStore?.name ?? 'Store Sales'}
          </div>
          {currentStore?.location && (
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.1rem' }}>
              📍 {currentStore.location}
            </div>
          )}
        </div>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── FILTER CARD ──────────────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <CardContent style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Preset buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Today',       key: 'today' as const },
                { label: 'Last 7 Days', key: 'last7' as const },
                { label: 'This Month',  key: 'month' as const },
                { label: 'This Year',   key: 'year'  as const },
              ].map(p => (
                <button key={p.key} onClick={() => setPreset(p.key)} style={presetStyle()}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date range + action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '500' }}>From:</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: '160px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '500' }}>To:</label>
                <Input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={{ width: '160px' }} />
              </div>
              <Button
                onClick={() => fetchSales()}
                style={{
                  background: '#111827', color: '#fff',
                  border: 'none', borderRadius: '0.5rem',
                  padding: '0.45rem 1.25rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Filter
              </Button>
              <button
                onClick={downloadCSV}
                style={{
                  background: 'transparent', color: '#16a34a',
                  border: '2px solid #16a34a', borderRadius: '0.5rem',
                  padding: '0.4rem 1rem', fontWeight: '700',
                  cursor: 'pointer', fontSize: '0.875rem'
                }}
              >
                ⬇ Export CSV
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── SUMMARY CARDS ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>

          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.25rem' }}>
              <CardTitle style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '500' }}>
                Total Transactions
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
                Average Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb', lineHeight: 1 }}>
                ₹{avgSale.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── DATA TABLE ───────────────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '1rem', color: '#374151' }}>
              Sales Records
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
                No sales found for this period
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      {['Date', 'Customer', 'Contact', 'Product', 'Category', 'MRP', 'Discount', 'Final Price'].map(h => (
                        <th key={h} style={{
                          padding: '0.65rem 0.85rem', textAlign: 'left',
                          fontWeight: '600', color: '#374151', whiteSpace: 'nowrap'
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
                          background: i % 2 === 0 ? '#fff' : '#f8fafc'
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#f8fafc'}
                      >
                        <td style={{ padding: '0.6rem 0.85rem', color: '#374151', whiteSpace: 'nowrap' }}>
                          {sale.sale_date}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', fontWeight: '600', color: '#111827' }}>
                          {sale.customer_name}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#6b7280', fontSize: '0.82rem' }}>
                          {sale.customer_phone || sale.customer_email || '—'}
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
