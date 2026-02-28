'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Category   { id: string; name: string; }
interface RawProduct { id: string; name: string; mrp: number; category_id: string; categories?: { name: string } | null; category_name?: string; }
interface Product    { id: string; name: string; mrp: number; category_id: string; category_name: string; }
interface Form       { name: string; mrp: string; category_id: string; }

export default function ProductCatalogPage() {
  const router = useRouter();

  const [products,     setProducts]     = useState<Product[]>([]);
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [form,         setForm]         = useState<Form>({ name: '', mrp: '', category_id: '' });
  const [activeFilter, setActiveFilter] = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([cats, rawProds]: [Category[], RawProduct[]]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      // Normalise nested categories.name → flat category_name
      const normalised: Product[] = (Array.isArray(rawProds) ? rawProds : []).map(p => ({
        ...p,
        category_name: p.category_name ?? p.categories?.name ?? '',
      }));
      setProducts(normalised);
      setLoading(false);
    });
  }, []);

  // ── Add product ───────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!form.name.trim() || !form.mrp || !form.category_id) {
      setError('Please fill in all fields'); return;
    }
    setError('');
    const res  = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), mrp: parseFloat(form.mrp), category_id: form.category_id })
    });
    const data = await res.json();
    if (res.ok) {
      // attach category_name for display
      const cat = categories.find(c => c.id === form.category_id);
      setProducts(p => [...p, { ...data, category_name: cat?.name ?? '' }]);
      setForm({ name: '', mrp: '', category_id: '' });
      setSuccessMsg('Product added!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } else {
      setError(data.error || 'Failed to add product');
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const filteredProducts = activeFilter
    ? products.filter(p => p.category_id === activeFilter)
    : products;

  const activeCat = categories.find(c => c.id === activeFilter);

  // ── Shared pill btn style ─────────────────────────────────────────────────
  const pill = (active: boolean): React.CSSProperties => ({
    padding:      '0.35rem 0.9rem',
    borderRadius: '999px',
    border:       active ? 'none' : '1px solid #d1d5db',
    background:   active ? '#111827' : '#fff',
    color:        active ? '#fff' : '#374151',
    fontWeight:   '600',
    fontSize:     '0.82rem',
    cursor:       'pointer',
    whiteSpace:   'nowrap' as const,
    transition:   'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        background: '#111827', color: '#fff',
        padding: '1rem 1.75rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: '0.4rem', padding: '0.35rem 0.8rem',
            cursor: 'pointer', fontWeight: '600'
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Product Catalog</h1>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Success toast ─────────────────────────────────────────────── */}
        {successMsg && (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac',
            color: '#16a34a', borderRadius:'0.5rem',
            padding: '0.65rem 1rem', fontWeight: '600', fontSize: '0.9rem'
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* ── ADD PRODUCT CARD ─────────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <CardHeader style={{ paddingBottom: '0.25rem' }}>
            <CardTitle style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
              Add New Product
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* 3 inputs in a row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

              {/* Category select */}
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151',
                  display: 'block', marginBottom: '0.3rem' }}>
                  Category *
                </label>
                <select
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.45rem 0.65rem',
                    border: '1px solid #d1d5db', borderRadius: '0.45rem',
                    fontSize: '0.875rem', color: form.category_id ? '#111827' : '#9ca3af',
                    background: '#fff', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Select category…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Product name */}
              <div style={{ flex: '2 1 220px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151',
                  display: 'block', marginBottom: '0.3rem' }}>
                  Product Name *
                </label>
                <Input
                  placeholder="e.g. Bella Vita Luxe"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>

              {/* MRP with ₹ prefix */}
              <div style={{ flex: '1 1 130px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151',
                  display: 'block', marginBottom: '0.3rem' }}>
                  MRP *
                </label>
                <div style={{ display: 'flex', alignItems: 'center',
                  border: '1px solid #d1d5db', borderRadius: '0.45rem', overflow: 'hidden' }}>
                  <span style={{ padding: '0.45rem 0.6rem', background: '#f3f4f6',
                    fontSize: '0.9rem', fontWeight: '700', color: '#374151',
                    borderRight: '1px solid #d1d5db' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.mrp}
                    onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    style={{
                      flex: 1, padding: '0.45rem 0.6rem',
                      border: 'none', outline: 'none',
                      fontSize: '0.875rem', color: '#111827'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Add button + error */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                onClick={handleAdd}
                style={{
                  background: '#111827', color: '#fff',
                  border: 'none', borderRadius: '0.5rem',
                  padding: '0.5rem 1.4rem', fontWeight: '700', cursor: 'pointer'
                }}
              >
                Add Product
              </Button>
              {error && (
                <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
                  ⚠️ {error}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── FILTER TABS ──────────────────────────────────────────────── */}
        {!loading && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveFilter('')} style={pill(activeFilter === '')}>
              All ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  style={pill(activeFilter === cat.id)}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* ── PRODUCT LIST ─────────────────────────────────────────────── */}
        <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <CardHeader style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Showing <strong style={{ color: '#111827' }}>{filteredProducts.length}</strong> product{filteredProducts.length !== 1 ? 's' : ''}
              {activeCat ? ` in ${activeCat.name}` : ''}
            </p>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {loading ? (
              <p style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>Loading...</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>
                No products in this category yet
              </p>
            ) : (
              <div>
                {filteredProducts.map((product, i) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.8rem 1.25rem',
                      borderBottom: i < filteredProducts.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f0f9ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                  >
                    {/* Left */}
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>
                        {product.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                        {product.category_name}
                      </p>
                    </div>

                    {/* Right — MRP */}
                    <span style={{
                      fontWeight: '700', color: '#d97706',
                      fontSize: '1rem', whiteSpace: 'nowrap'
                    }}>
                      ₹{product.mrp.toLocaleString('en-IN')}
                    </span>
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
