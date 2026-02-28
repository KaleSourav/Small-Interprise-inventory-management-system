'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SaleRecord {
  id: string;
  customer_name: string;
  product_name: string;
  category_name: string;
  final_price: number;
  discount_amount: number;
  sale_date: string;
}

interface User {
  role: string;
  store_id: string;
  store_name: string;
}

export default function StoreDashboardPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [sales,   setSales]   = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Verify auth
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData);

      // 2. Fetch today's sales
      const today = new Date().toISOString().split('T')[0];
      const salesRes = await fetch(`/api/sales?from=${today}&to=${today}`);
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  // Computed stats
  const todayCount   = sales.length;
  const todayRevenue = sales.reduce((sum, s) => sum + (s.final_price || 0), 0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#fef3c7'
      }}>
        <p style={{ color: '#92400e', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf5' }}>

      {/* ── HEADER BAR ─────────────────────────────────────────────────── */}
      <header style={{
        background:     'linear-gradient(90deg, #92400e, #b45309)',
        color:          '#fff',
        padding:        '1rem 1.5rem',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        boxShadow:      '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🌸 {user?.store_name ?? 'Store'}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.1rem' }}>
            Store Dashboard
          </div>
        </div>
        <Button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '0.5rem',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Logout
        </Button>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>

        {/* ── STAT CARDS ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.25rem' }}>
              <CardTitle style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                Today's Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', lineHeight: 1 }}>
                {todayCount}
              </p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.25rem' }}>
              <CardTitle style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                Today's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#16a34a', lineHeight: 1 }}>
                ₹{todayRevenue.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── ACTION CARDS ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

          <Card
            onClick={() => router.push('/store/new-sale')}
            style={{
              borderRadius: '0.75rem',
              boxShadow:    '0 2px 8px rgba(0,0,0,0.07)',
              cursor:       'pointer',
              transition:   'transform 0.15s, box-shadow 0.15s',
              background:   'linear-gradient(135deg, #fffbeb, #fef3c7)'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
            }}
          >
            <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
              <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1f2937' }}>New Sale</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Record a customer purchase
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => router.push('/store/sales-history')}
            style={{
              borderRadius: '0.75rem',
              boxShadow:    '0 2px 8px rgba(0,0,0,0.07)',
              cursor:       'pointer',
              transition:   'transform 0.15s, box-shadow 0.15s',
              background:   'linear-gradient(135deg, #f0fdf4, #dcfce7)'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
            }}
          >
            <CardContent style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
              <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1f2937' }}>Sales History</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                View past records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── RECENT TRANSACTIONS ───────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '1rem', color: '#374151' }}>
              Today's Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0', fontSize: '0.95rem' }}>
                No sales yet today
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sales.slice(0, 5).map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      padding:        '0.6rem 0',
                      borderBottom:   '1px solid #f3f4f6'
                    }}
                  >
                    {/* Left: customer + product */}
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1f2937', margin: 0 }}>
                        {sale.customer_name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                        {sale.product_name} · {sale.category_name}
                      </p>
                    </div>

                    {/* Right: price + discount */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', color: '#16a34a', fontSize: '0.95rem', margin: 0 }}>
                        ₹{sale.final_price.toLocaleString('en-IN')}
                      </p>
                      {sale.discount_amount > 0 && (
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>
                          -{sale.discount_amount} disc
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
