'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; }

interface Variant {
  id:     string;
  size_ml: number;
  price:  number;
}

interface Product {
  id:               string;
  name:             string;
  mrp:              number;
  category_id:      string;
  product_variants: Variant[];
}

interface SelectedVariant {
  variant_id:      string;
  size_ml:         number;
  price:           number;
  quantity:        number;
  discount:        number;
}

interface CartItem {
  product_id:      string;
  product_name:    string;
  category_name:   string;
  variant_id:      string;
  size_ml:         number;
  mrp:             number;
  quantity:        number;
  discount_amount: number;
  final_price:     number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString('en-IN');

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewSalePage() {
  const router = useRouter();

  // Customer
  const [customerName,  setCustomerName]  = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Catalogue
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [products,        setProducts]        = useState<Product[]>([]);
  const [selectedCatId,   setSelectedCatId]   = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch,   setProductSearch]   = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Variant selection (multi-select)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant>>({});

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Submit
  const [submitting,    setSubmitting]    = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [successItems,  setSuccessItems]  = useState<CartItem[]>([]);

  // ── Fetch categories ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  // ── Fetch products when category changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedCatId) { setProducts([]); return; }
    setSelectedProduct(null);
    setSelectedVariants({});
    setProductSearch('');
    setLoadingProducts(true);
    fetch(`/api/products?category_id=${selectedCatId}`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoadingProducts(false));
  }, [selectedCatId]);

  // ── Success redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push('/store/dashboard'), 2000);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const filteredProducts = productSearch.trim()
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const selectedVariantList = Object.values(selectedVariants);
  const variantSubtotal = selectedVariantList.reduce(
    (s, v) => s + (v.price - v.discount) * v.quantity, 0
  );
  const hasSelectedVariants = selectedVariantList.length > 0;

  // Cart aggregates
  const cartTotal     = cartItems.reduce((s, i) => s + i.final_price, 0);
  const cartQtyTotal  = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartDiscTotal = cartItems.reduce((s, i) => s + i.discount_amount, 0);
  const uniqueProducts = cartItems.reduce<string[]>((acc, i) => acc.includes(i.product_id) ? acc : [...acc, i.product_id], []).length;

  // Group cart by product
  const cartByProduct = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.product_id]) acc[item.product_id] = [];
    acc[item.product_id].push(item);
    return acc;
  }, {});

  // ── Variant toggle / update ───────────────────────────────────────────────────
  function toggleVariant(v: Variant) {
    setSelectedVariants(prev => {
      if (prev[v.id]) {
        const next = { ...prev };
        delete next[v.id];
        return next;
      }
      return { ...prev, [v.id]: { variant_id: v.id, size_ml: v.size_ml, price: v.price, quantity: 1, discount: 0 } };
    });
  }

  function updateVariantField(variantId: string, field: 'quantity' | 'discount', value: number) {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: { ...prev[variantId], [field]: Math.max(0, value) }
    }));
  }

  // ── Add all selected variants to cart ─────────────────────────────────────────
  function addToCart() {
    if (!selectedProduct || !hasSelectedVariants) return;
    const catName = categories.find(c => c.id === selectedCatId)?.name ?? '';
    const newItems: CartItem[] = selectedVariantList.map(sv => ({
      product_id:      selectedProduct.id,
      product_name:    selectedProduct.name,
      category_name:   catName,
      variant_id:      sv.variant_id,
      size_ml:         sv.size_ml,
      mrp:             sv.price,
      quantity:        Math.max(1, sv.quantity),
      discount_amount: sv.discount * Math.max(1, sv.quantity),
      final_price:     (sv.price - sv.discount) * Math.max(1, sv.quantity)
    }));
    setCartItems(prev => [...prev, ...newItems]);
    setSelectedProduct(null);
    setSelectedVariants({});
    setProductSearch('');
  }

  function removeFromCart(idx: number) {
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) { alert('Please enter customer name'); return; }
    if (cartItems.length === 0) { alert('Cart is empty'); return; }

    setSubmitting(true);
    try {
      const results = await Promise.all(
        cartItems.map(item =>
          fetch('/api/sales', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name:   customerName,
              customer_phone:  customerPhone,
              customer_email:  customerEmail,
              product_id:      item.product_id,
              product_name:    item.product_name,
              category_name:   item.category_name,
              variant_id:      item.variant_id,
              size_ml:         item.size_ml,
              mrp_at_sale:     item.mrp,
              quantity:        item.quantity,
              discount_amount: item.discount_amount,
              final_price:     item.final_price
            })
          })
        )
      );
      if (results.every(r => r.ok)) {
        setSuccessItems([...cartItems]);
        setSuccess(true);
      } else {
        const failed = results.filter(r => !r.ok).length;
        alert(`${failed} of ${cartItems.length} item(s) failed. Please try again.`);
      }
    } catch {
      alert('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem' }}>
        <div style={{ fontSize: '4rem' }}>✅</div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', margin: 0 }}>Sale Complete!</h2>
        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1.25rem 1.75rem', maxWidth: '400px', width: '100%' }}>
          {successItems.map((item, i) => (
            <p key={i} style={{ margin: '0.3rem 0', fontSize: '0.9rem', color: '#374151' }}>
              • <strong>{item.product_name}</strong> {item.size_ml}ml × {item.quantity}
              &nbsp;= <span style={{ color: '#16a34a', fontWeight: '700' }}>₹{fmt(item.final_price)}</span>
            </p>
          ))}
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Redirecting to dashboard…</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN FORM
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf5', paddingBottom: '4rem' }}>

      {/* ── STICKY HEADER ── */}
      <header style={{
        background: 'linear-gradient(90deg,#92400e,#b45309)', color: '#fff',
        padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 50
      }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '0.4rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontWeight: '600' }}>← Back</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>New Sale</h1>
        {cartItems.length > 0 && (
          <span style={{ marginLeft: 'auto', background: '#fff', color: '#b45309', borderRadius: '999px', padding: '0.2rem 0.9rem', fontSize: '0.85rem', fontWeight: '700' }}>
            🛒 {cartItems.length} line{cartItems.length !== 1 ? 's' : ''} · ₹{fmtInt(Math.round(cartTotal))}
          </span>
        )}
      </header>

      <main style={{ padding: '1.25rem', maxWidth: '660px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 1 — Customer Details
          ══════════════════════════════════════════════════════════════ */}
          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.5rem' }}>
              <CardTitle style={{ fontSize: '1rem', color: '#374151' }}>👤 Customer Details</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <Label htmlFor="cname">Customer Name *</Label>
                <Input id="cname" placeholder="Full name" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={{ marginTop: '0.3rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <Label htmlFor="cphone">Phone (optional)</Label>
                  <Input id="cphone" type="tel" placeholder="Mobile number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ marginTop: '0.3rem' }} />
                </div>
                <div>
                  <Label htmlFor="cemail">Email (optional)</Label>
                  <Input id="cemail" type="email" placeholder="email@example.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={{ marginTop: '0.3rem' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2 — Product & Variant Picker
          ══════════════════════════════════════════════════════════════ */}
          <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardHeader style={{ paddingBottom: '0.5rem' }}>
              <CardTitle style={{ fontSize: '1rem', color: '#374151' }}>🛍️ Add Product to Cart</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <Select onValueChange={val => setSelectedCatId(val)}>
                  <SelectTrigger style={{ marginTop: '0.3rem' }}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product list / search */}
              {selectedCatId && !selectedProduct && (
                <div>
                  <Label>Search Product</Label>
                  <Input
                    type="text" placeholder="Type to filter…"
                    value={productSearch} onChange={e => setProductSearch(e.target.value)}
                    autoComplete="off" style={{ marginTop: '0.3rem' }}
                  />
                  <div style={{ marginTop: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '0.6rem', maxHeight: '220px', overflowY: 'auto', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    {loadingProducts ? (
                      <div style={{ padding: '1.2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Loading products…</div>
                    ) : filteredProducts.length === 0 ? (
                      <div style={{ padding: '1.2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                        {productSearch ? 'No products match your search' : 'No products in this category'}
                      </div>
                    ) : filteredProducts.map((p, i) => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setSelectedVariants({}); }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: i < filteredProducts.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fef9ec')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>{p.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {p.product_variants?.length ?? 0} size{(p.product_variants?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!loadingProducts && products.length > 0 && (
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: 'right' }}>
                      {filteredProducts.length} of {products.length} product{products.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* ── Variant selection (shown after product chosen) ── */}
              {selectedProduct && (
                <div>
                  {/* Product badge + deselect */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: '#111827' }}>
                      Select Size & Quantity for <span style={{ color: '#b45309' }}>{selectedProduct.name}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSelectedProduct(null); setSelectedVariants({}); }}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: '0.4rem', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', color: '#dc2626' }}
                    >
                      ✕ Change product
                    </button>
                  </div>

                  {/* Variant cards — 2×2 grid or single row */}
                  {(!selectedProduct.product_variants || selectedProduct.product_variants.length === 0) ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No sizes available for this product.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
                      {selectedProduct.product_variants.map(v => {
                        const sv = selectedVariants[v.id];
                        const isSelected = !!sv;
                        const itemSubtotal = sv ? (sv.price - sv.discount) * sv.quantity : 0;
                        return (
                          <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Card */}
                            <div
                              onClick={() => toggleVariant(v)}
                              style={{
                                border: isSelected ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                                borderRadius: '0.65rem', padding: '0.75rem 0.6rem', cursor: 'pointer',
                                background: isSelected ? '#fffbeb' : '#fff',
                                textAlign: 'center', transition: 'all 0.15s', position: 'relative',
                                boxShadow: isSelected ? '0 2px 8px rgba(245,158,11,0.2)' : 'none'
                              }}
                            >
                              {isSelected && (
                                <span style={{ position: 'absolute', top: '0.35rem', right: '0.4rem', background: '#f59e0b', color: '#fff', borderRadius: '50%', width: '1.1rem', height: '1.1rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>✓</span>
                              )}
                              <p style={{ fontWeight: '800', fontSize: '1.1rem', color: '#111827', margin: '0 0 0.2rem' }}>{v.size_ml} ml</p>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>₹{fmtInt(v.price)}</p>
                              <p style={{ fontSize: '0.7rem', color: isSelected ? '#b45309' : '#d1d5db', marginTop: '0.35rem', fontWeight: '700' }}>
                                {isSelected ? '✓ Selected' : 'Tap to select'}
                              </p>
                            </div>

                            {/* Expanded controls when selected */}
                            {isSelected && sv && (
                              <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.6rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {/* Quantity */}
                                <div>
                                  <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: '0 0 0.2rem', fontWeight: '600', textTransform: 'uppercase' }}>Qty</p>
                                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '0.4rem', overflow: 'hidden' }}>
                                    <button type="button" onClick={() => updateVariantField(v.id, 'quantity', sv.quantity - 1)}
                                      style={{ width: '1.8rem', height: '1.8rem', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                    <input type="number" min={1} value={sv.quantity}
                                      onChange={e => updateVariantField(v.id, 'quantity', parseInt(e.target.value) || 1)}
                                      style={{ width: '2rem', textAlign: 'center', border: 'none', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontSize: '0.85rem', fontWeight: '700', color: '#111827', outline: 'none', background: '#fff', height: '1.8rem' }} />
                                    <button type="button" onClick={() => updateVariantField(v.id, 'quantity', sv.quantity + 1)}
                                      style={{ width: '1.8rem', height: '1.8rem', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                </div>
                                {/* Discount */}
                                <div>
                                  <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: '0 0 0.2rem', fontWeight: '600', textTransform: 'uppercase' }}>Disc/item ₹</p>
                                  <input type="number" min={0} max={v.price} value={sv.discount}
                                    onChange={e => updateVariantField(v.id, 'discount', Number(e.target.value))}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '0.4rem', padding: '0.2rem 0.4rem', fontSize: '0.85rem', outline: 'none', background: '#fff', height: '1.8rem' }} />
                                </div>
                                {/* Subtotal */}
                                <p style={{ margin: 0, fontWeight: '700', color: '#16a34a', fontSize: '0.8rem', textAlign: 'right' }}>
                                  = ₹{fmt(itemSubtotal)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected sizes subtotal */}
                  {hasSelectedVariants && (
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                        Selected sizes subtotal ({selectedVariantList.length} size{selectedVariantList.length !== 1 ? 's' : ''})
                      </span>
                      <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '1rem' }}>₹{fmt(variantSubtotal)}</span>
                    </div>
                  )}

                  {/* Add to cart */}
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={!hasSelectedVariants}
                    style={{
                      marginTop: '0.85rem', width: '100%', padding: '0.75rem',
                      background: hasSelectedVariants ? 'linear-gradient(90deg,#d97706,#b45309)' : '#e5e7eb',
                      color: hasSelectedVariants ? '#fff' : '#9ca3af',
                      border: 'none', borderRadius: '0.6rem',
                      fontSize: '1rem', fontWeight: '700',
                      cursor: hasSelectedVariants ? 'pointer' : 'not-allowed',
                      boxShadow: hasSelectedVariants ? '0 2px 6px rgba(180,83,9,0.25)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {hasSelectedVariants
                      ? `Add ${selectedProduct.name} to Cart (${selectedVariantList.length} size${selectedVariantList.length !== 1 ? 's' : ''})`
                      : 'Select at least one size'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 3 — Cart Summary
          ══════════════════════════════════════════════════════════════ */}
          {cartItems.length > 0 && (
            <Card style={{ borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '2px solid #fbbf24' }}>
              <CardHeader style={{ paddingBottom: '0.4rem' }}>
                <CardTitle style={{ fontSize: '1rem', color: '#374151' }}>
                  🛒 Cart ({cartItems.length} line{cartItems.length !== 1 ? 's' : ''})
                </CardTitle>
              </CardHeader>
              <CardContent style={{ paddingTop: '0.25rem' }}>

                {/* Grouped by product */}
                {Object.entries(cartByProduct).map(([productId, items]) => {
                  const productSubtotal = items.reduce((s, i) => s + i.final_price, 0);
                  return (
                    <div key={productId} style={{ marginBottom: '1rem', background: '#fafaf5', border: '1px solid #e5e7eb', borderRadius: '0.6rem', overflow: 'hidden' }}>
                      {/* Product group header */}
                      <div style={{ background: '#f3f4f6', padding: '0.45rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.875rem', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {items[0].product_name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{items[0].category_name}</span>
                      </div>
                      {/* Variant rows */}
                      {items.map((item, idx) => {
                        const globalIdx = cartItems.indexOf(item);
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem', borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <span style={{ fontSize: '0.8rem', color: '#374151', minWidth: '45px', fontWeight: '600' }}>{item.size_ml}ml</span>
                            <span style={{ fontSize: '0.78rem', color: '#6b7280', flex: 1 }}>× {item.quantity} @ ₹{fmtInt(item.mrp)}</span>
                            {item.discount_amount > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>−₹{fmtInt(item.discount_amount)}</span>
                            )}
                            <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '0.875rem', minWidth: '70px', textAlign: 'right' }}>₹{fmt(item.final_price)}</span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(globalIdx)}
                              style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '1.4rem', height: '1.4rem', cursor: 'pointer', color: '#dc2626', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >✕</button>
                          </div>
                        );
                      })}
                      {/* Product subtotal */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.4rem 0.85rem', background: '#f9fafb', borderTop: '1px dashed #e5e7eb' }}>
                        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Product subtotal:&nbsp;</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>₹{fmt(productSubtotal)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Grand total */}
                <div style={{ borderTop: '2px dashed #fbbf24', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>Total Products</span><span style={{ fontWeight: '600', color: '#374151' }}>{uniqueProducts}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <span>Total Quantities</span><span style={{ fontWeight: '600', color: '#374151' }}>{cartQtyTotal}</span>
                  </div>
                  {cartDiscTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>Total Discount</span><span style={{ fontWeight: '600' }}>−₹{fmt(cartDiscTotal)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '800', fontSize: '1.25rem', marginTop: '0.3rem' }}>
                    <span>Grand Total</span><span>₹{fmt(cartTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SECTION 4 — Submit
          ══════════════════════════════════════════════════════════════ */}
          <Button
            type="submit"
            disabled={submitting || cartItems.length === 0 || !customerName.trim()}
            style={{
              width: '100%', padding: '0.95rem',
              fontSize: '1.05rem', fontWeight: '700',
              background: (!submitting && cartItems.length > 0 && customerName.trim()) ? 'linear-gradient(90deg,#16a34a,#15803d)' : '#d6d3d1',
              color: (!submitting && cartItems.length > 0 && customerName.trim()) ? '#fff' : '#78716c',
              border: 'none', borderRadius: '0.6rem',
              cursor: (!submitting && cartItems.length > 0 && customerName.trim()) ? 'pointer' : 'not-allowed',
              boxShadow: (!submitting && cartItems.length > 0 && customerName.trim()) ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {submitting ? 'Processing…' : cartItems.length === 0 ? 'Add products to cart first' : 'Complete Sale ✓'}
          </Button>

        </form>
      </main>
    </div>
  );
}
