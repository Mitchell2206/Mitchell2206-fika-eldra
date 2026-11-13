import 'server-only';
import { cache } from 'react';
import { ensureDb, sql } from './db';
import { hasFragranceStock, orderItems, resolveBundles, totals } from './commerce';
import { money } from './data';

export type Shop = { products: any[]; faqs: any[]; testimonials: any[]; settings: any };

/** Every entry with its live stock merged in. */
export async function all(derived = true): Promise<any[]> {
  await ensureDb();
  const db = sql();
  const [rows, inv] = (await db.transaction([
    db`SELECT id, kind, data FROM entries`,
    db`SELECT product_id, aroma, qty FROM inventory`,
  ])) as any[][];
  const entries = rows.map((r) => {
    const x = { ...r.data, id: r.id, kind: r.kind };
    if (r.kind === 'product') {
      const mine = inv.filter((i) => i.product_id === r.id);
      const perAroma = mine.filter((i) => i.aroma !== '');
      if (perAroma.length) {
        x.fragranceStock = Object.fromEntries((x.fragrances || []).map((a: string) => [a, perAroma.find((i) => i.aroma === a)?.qty || 0]));
        x.stock = perAroma.reduce((n, i) => n + i.qty, 0);
      } else {
        delete x.fragranceStock;
        x.stock = mine.find((i) => i.aroma === '')?.qty || 0;
      }
    }
    return x;
  });
  return derived ? resolveBundles(entries) : entries;
}

/** Public catalog: hides the secret rune mapping and bank details. */
export const getShop = cache(async (): Promise<Shop> => {
  const a = await all();
  const settings = { ...a.find((x) => x.kind === 'settings') };
  delete settings.bank;
  const order = (p: any) => (p.bundleComponents?.length ? 2 : p.category === 'Velas con runas' ? 0 : 1);
  return {
    products: a
      .filter((x) => x.kind === 'product' && x.active)
      .map(({ rune, fragranceRunes, ...p }) => p)
      .sort((x, y) => order(x) - order(y)),
    faqs: a.filter((x) => x.kind === 'faq' && x.active).sort((x, y) => x.id.localeCompare(y.id, 'es', { numeric: true })),
    testimonials: a.filter((x) => x.kind === 'testimonial' && x.active),
    settings,
  };
});

export function whatsapp(o: any, s: any) {
  const c = o.customer;
  const text = `${o.demo ? 'PEDIDO DE PRUEBA · No realizar pagos.\n\n' : ''}Hola, FIKA ELDRA. Quiero confirmar mi pedido Nº ${o.id}.\n\nNombre: ${c.name}\nTeléfono: ${c.phone}${c.email ? '\nCorreo: ' + c.email : ''}\n\nProductos:\n\n${o.items
    .map((x: any) => `- ${x.qty} x ${x.name}\n- Aroma o variante: ${x.aroma}${x.refill ? ' · Refill' : ''}\n- Precio: ${money(x.price)}\n- Subtotal: ${money(x.subtotal)}`)
    .join('\n\n')}\n\nEntrega: ${c.delivery}\nDirección: ${c.delivery === 'Retiro' ? s.address : [c.address, c.extra, c.locality, c.postal].filter(Boolean).join(', ')}\nFranja horaria: ${c.time}\nMétodo de pago: ${c.payment}\nCosto de envío: ${money(o.shipping)}\nDescuento: ${money(o.discount)}\nTotal: ${money(o.total)}\nObservaciones: ${c.notes || 'Sin observaciones'}\n\nQuedo a la espera de la confirmación. Gracias.`;
  return { text, url: `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(text)}` };
}

/** Optional e-mail copy through Resend (RESEND_API_KEY + MAIL_FROM). */
export async function sendOrder(o: any, s: any) {
  const key = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM;
  if (!key || !from) return false;
  const body = whatsapp(o, s).text;
  const targets: [string, string][] = process.env.ORDER_EMAIL ? [['brand', process.env.ORDER_EMAIL]] : [];
  if (o.customer.email) targets.push(['customer', o.customer.email]);
  for (const [kind, to] of targets) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `${o.id}-${kind}` },
      body: JSON.stringify({ from, to: [to], subject: `FIKA ELDRA · Pedido ${o.id}${o.demo ? ' · DEMOSTRACIÓN' : ''}`, text: `${body}\n\nTu pedido está registrado, pendiente de coordinación. No se realizó ningún cobro.` }),
    });
    if (!res.ok) return false;
  }
  await sql()`UPDATE orders SET email_status = 'sent' WHERE id = ${o.id}`;
  return true;
}

const PHONE = /^\+?[\d\s()-]{8,25}$/;
const EMAIL = /^\S+@\S+\.\S+$/;

export class UserError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function createOrder(b: any, ip: string) {
  if (b.website || !b.accept || typeof b.key !== 'string' || !/^[-a-zA-Z0-9]{16,80}$/.test(b.key)) throw new UserError('Revisá los datos del pedido.');
  const c = b.customer || {};
  for (const k of Object.keys(c)) if (typeof c[k] !== 'string') delete c[k];
  if (!c.name?.trim() || !PHONE.test(c.phone || '') || (c.email && !EMAIL.test(c.email)) || !c.time?.trim())
    throw new UserError('Completá nombre, teléfono y franja horaria. Si ingresás un correo, revisá que sea válido.');
  if (JSON.stringify(c).length > 6000) throw new UserError('Los datos son demasiado extensos.');
  const a = await all();
  const s = a.find((x) => x.kind === 'settings');
  if (!s.payments.includes(c.payment) || !s.deliveries.includes(c.delivery)) throw new UserError('Elegí entrega y medio de pago.');
  if (c.delivery === 'Envío' && (!c.address?.trim() || !c.locality?.trim() || !c.postal?.trim())) throw new UserError('Completá tu dirección, localidad y código postal.');
  const db = sql();
  const [old] = (await db`SELECT data, email_status FROM orders WHERE key = ${b.key}`) as any[];
  if (old) {
    const o = old.data;
    if ((o.customer.email || '') !== (c.email || '') || o.customer.phone !== c.phone) throw new UserError('El pedido ya existe.', 409);
    return { order: o, whatsapp: whatsapp(o, s).url, bank: c.payment === 'Transferencia' ? s.bank : '' };
  }
  const [{ n }] = (await db`SELECT count(*)::int AS n FROM orders WHERE created > now() - interval '1 minute' AND ip = ${ip}`) as any[];
  if (n >= 4) throw new UserError('Esperá un minuto antes de volver a enviar.', 429);
  const products = a.filter((x) => x.kind === 'product');
  const items = orderItems(products, b.items, s);
  const subtotal = items.reduce((n: number, x: any) => n + x.price * x.qty, 0);
  const refillDiscount = items.reduce((n: number, x: any) => n + x.refillDiscount, 0);
  const amounts = totals(subtotal, refillDiscount, c.payment, c.delivery, s);
  const id = `FE-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const o = { id, customer: c, items, ...amounts, demo: !!s.demo, created: new Date().toISOString() };
  const byId = (pid: string) => products.find((p) => p.id === pid);
  const parts = items.flatMap((x: any) => x.inventoryItems || [x]);
  try {
    await db.transaction([
      db`INSERT INTO orders (id, key, data, created, demo, ip) VALUES (${id}, ${b.key}, ${JSON.stringify(o)}::jsonb, ${o.created}, ${o.demo}, ${ip})`,
      ...parts.map((x: any) => {
        const aroma = hasFragranceStock(byId(x.id) || {}) ? x.aroma : '';
        return db`UPDATE inventory SET qty = qty - ${x.qty} WHERE product_id = ${x.id} AND aroma = ${aroma}`;
      }),
      ...items
        .flatMap((x: any) => (x.inventoryItems?.length > 1 ? [x, ...x.inventoryItems] : [x]))
        .map((x: any) => db`INSERT INTO order_lines (id, order_id, product_id, qty) VALUES (${crypto.randomUUID()}, ${id}, ${x.id}, ${x.qty})`),
    ]);
  } catch {
    throw new UserError('Alguien acaba de llevarse las últimas unidades. Revisá tu pedido e intentá nuevamente.', 409);
  }
  sendOrder(o, s).catch(() => {});
  return { order: o, whatsapp: whatsapp(o, s).url, bank: c.payment === 'Transferencia' ? s.bank : '' };
}

/** Statements that return an order's units to stock. */
export function restoreStock(order: any, products: any[]) {
  const db = sql();
  return order.items.flatMap((x: any) => x.inventoryItems || [x]).map((x: any) => {
    const p = products.find((p) => p.id === x.id);
    const aroma = p && hasFragranceStock(p) ? x.aroma : '';
    return db`UPDATE inventory SET qty = qty + ${x.qty} WHERE product_id = ${x.id} AND aroma = ${aroma}`;
  });
}
