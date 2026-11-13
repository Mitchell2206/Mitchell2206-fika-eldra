'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { aromaStock, lineKey, orderItems } from '@/lib/commerce';
import { clientId } from '@/lib/client-id';

export type Line = { id: string; aroma: string; refill: boolean; qty: number };
type Ctx = {
  products: any[];
  settings: any;
  cart: Line[];
  lines: (Line & { p: any })[];
  count: number;
  subtotal: number;
  refillDiscount: number;
  add: (p: any, aroma: string | undefined, qty?: number, refill?: boolean) => boolean;
  change: (line: Line, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  consent: string | null;
  setConsent: (v: string | null) => void;
  track: (type: string, target?: string) => void;
  ready: boolean;
};

const ShopCtx = createContext<Ctx | null>(null);
export const useShop = () => useContext(ShopCtx)!;
export const unitPrice = (p: any) => (p.promo > 0 ? p.promo : p.price);

const CART = 'fika-cart-v2';

export function ShopProvider({ products, settings, children }: { products: any[]; settings: any; children: React.ReactNode }) {
  const [cart, setCart] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [consent, setConsentState] = useState<string | null>('pending');
  const path = usePathname();
  const tracked = useRef('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART) || '[]');
      if (Array.isArray(saved)) setCart(saved.filter((x) => x && typeof x.id === 'string' && Number.isInteger(x.qty)));
      setConsentState(localStorage.getItem('fika-consent'));
    } catch {
      setConsentState(null);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(CART, JSON.stringify(cart)); } catch {}
  }, [cart, ready]);

  const setConsent = (v: string | null) => {
    try { v ? localStorage.setItem('fika-consent', v) : localStorage.removeItem('fika-consent'); } catch {}
    setConsentState(v);
  };

  const track = useCallback((type: string, target = '') => {
    try {
      if (localStorage.getItem('fika-consent') !== 'yes') return;
      let visitor = localStorage.getItem('fika-visitor');
      if (!visitor) { visitor = clientId(); localStorage.setItem('fika-visitor', visitor); }
      let source = sessionStorage.getItem('fika-source');
      if (!source) {
        const u = new URL(location.href);
        source = u.searchParams.get('utm_source') || u.searchParams.get('source') || (document.referrer && !document.referrer.startsWith(location.origin) ? new URL(document.referrer).hostname : 'directo');
        sessionStorage.setItem('fika-source', source);
      }
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, target, visitor, source, consent: true }), keepalive: true }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!ready || tracked.current === path) return;
    tracked.current = path;
    setOpen(false);
    track('page', path);
    if (path.startsWith('/productos/')) track('product', path.split('/')[2]);
    if (path === '/pedido') track('start');
  }, [path, ready, track]);

  const lines = useMemo(() => cart.map((x) => ({ ...x, p: products.find((p) => p.id === x.id) })).filter((x) => x.p), [cart, products]);
  const count = lines.reduce((n, x) => n + x.qty, 0);
  const subtotal = lines.reduce((n, x) => n + unitPrice(x.p) * x.qty, 0);
  const refillDiscount = lines.reduce((n, x) => n + (x.refill ? Math.round(unitPrice(x.p) * x.qty * (x.p.refillPercent ?? settings.refillPercent) / 100) : 0), 0);

  function add(p: any, aroma?: string, n = 1, refill = false) {
    const chosen = p.fragrances?.length ? aroma : p.aroma;
    if (p.fragrances?.length && !p.fragrances.includes(chosen)) { toast.error('Elegí una fragancia antes de agregar.'); return false; }
    const line: Line = { id: p.id, aroma: chosen!, refill: !!refill, qty: n };
    const aromaUsed = cart.filter((x) => x.id === p.id && x.aroma === chosen).reduce((s, x) => s + x.qty, 0);
    if (aromaUsed + n > aromaStock(p, chosen!)) { toast.error(`No hay más stock de ${chosen}.`); return false; }
    const used = cart.filter((x) => x.id === p.id).reduce((s, x) => s + x.qty, 0);
    if (used + n > p.stock) { toast.error('No hay stock suficiente.'); return false; }
    const existing = cart.find((x) => lineKey(x) === lineKey(line));
    const next = existing ? cart.map((x) => (lineKey(x) === lineKey(line) ? { ...x, qty: x.qty + n } : x)) : [...cart, line];
    try { orderItems(products, next, settings); } catch (e: any) { toast.error(e.message); return false; }
    setCart(next);
    track('add', p.id);
    setOpen(true);
    return true;
  }

  function change(line: Line, n: number) {
    const p = products.find((x) => x.id === line.id);
    const others = cart.filter((x) => x.id === line.id && lineKey(x) !== lineKey(line)).reduce((s, x) => s + x.qty, 0);
    const aromaOthers = cart.filter((x) => x.id === line.id && x.aroma === line.aroma && lineKey(x) !== lineKey(line)).reduce((s, x) => s + x.qty, 0);
    const max = p ? Math.max(0, Math.min(p.stock - others, aromaStock(p, line.aroma) - aromaOthers)) : 0;
    if (n > max) toast.error('Llegaste al stock disponible.');
    const next = cart.map((x) => (lineKey(x) === lineKey(line) ? { ...x, qty: Math.max(0, Math.min(n, max)) } : x)).filter((x) => x.qty > 0);
    if (n > line.qty && next.length) { try { orderItems(products, next, settings); } catch (e: any) { toast.error(e.message); return; } }
    setCart(next);
  }

  return (
    <ShopCtx.Provider value={{ products, settings, cart, lines, count, subtotal, refillDiscount, add, change, clear: () => setCart([]), open, setOpen, consent, setConsent, track, ready }}>
      {children}
    </ShopCtx.Provider>
  );
}
