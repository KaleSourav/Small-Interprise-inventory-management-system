'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Store {
  id: string;
  name: string;
  username: string;
  location: string;
  is_active: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stores,  setStores]  = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Auth check
      const meRes = await fetch('/api/auth/me');
      const me    = await meRes.json();
      if (!meRes.ok || me.role !== 'superadmin') {
        router.push('/login');
        return;
      }

      // 2. Fetch stores
      const storesRes = await fetch('/api/stores');
      if (storesRes.ok) {
        const data = await storesRes.json();
        setStores(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const activeCount   = stores.filter(s => s.is_active).length;
  const inactiveCount = stores.filter(s => !s.is_active).length;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#111827'
      }}>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        background:     '#111827',
        color:          '#fff',
        padding:        '1rem 1.75rem',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            '0.75rem',
        boxShadow:      '0 2px 12px rgba(0,0,0,0.4)'
      }}>
        {/* Left */}
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
            ⚡ Super Admin
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.1rem' }}>
            Brand Management Portal
          </div>
        </div>

        {/* Right — nav buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/admin/stores')}
            style={{
              background: '#1f2937', color: '#e5e7eb',
              border: '1px solid #374151', borderRadius: '0.45rem',
              padding: '0.4rem 0.9rem', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.875rem'
            }}
          >
            Manage Stores
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            style={{
              background: '#1f2937', color: '#e5e7eb',
              border: '1px solid #374151', borderRadius: '0.45rem',
              padding: '0.4rem 0.9rem', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.875rem'
            }}
          >
            Product Catalog
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: '0.45rem',
              padding: '0.4rem 0.9rem', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.875rem'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <main style={{ padding: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Section title */}
        <h2 style={{
          fontSize: '1.25rem', fontWeight: '700',
          color: '#111827', marginBottom: '1.25rem'
        }}>
          All Stores ({stores.length})
        </h2>

        {/* Store cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          {stores.length === 0 ? (
            <p style={{ color: '#6b7280', gridColumn: '1/-1' }}>No stores found.</p>
          ) : (
            stores.map(store => (
              <Card
                key={store.id}
                style={{
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  opacity: store.is_active ? 1 : 0.5,
                  transition: 'opacity 0.2s'
                }}
              >
                <CardContent style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                  {/* Name + badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>
                      {store.name}
                    </span>
                    {store.is_active ? (
                      <Badge style={{
                        background: '#dcfce7', color: '#16a34a',
                        border: '1px solid #86efac', fontWeight: '600',
                        fontSize: '0.72rem'
                      }}>
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" style={{ fontWeight: '600', fontSize: '0.72rem' }}>
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {/* Location */}
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                    📍 {store.location || 'No location set'}
                  </p>

                  {/* Username */}
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
                    @{store.username}
                  </p>

                  {/* View Sales button */}
                  <Button
                    onClick={() => router.push(`/admin/store/${store.id}`)}
                    style={{
                      width: '100%',
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '0.25rem'
                    }}
                  >
                    View Sales →
                  </Button>

                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary line */}
        {stores.length > 0 && (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <span style={{ color: '#16a34a', fontWeight: '600' }}>{activeCount} active</span>
            {' '}store{activeCount !== 1 ? 's' : ''},&nbsp;
            <span style={{ color: '#9ca3af', fontWeight: '600' }}>{inactiveCount} inactive</span>
            {' '}store{inactiveCount !== 1 ? 's' : ''}
          </p>
        )}

      </main>
    </div>
  );
}
