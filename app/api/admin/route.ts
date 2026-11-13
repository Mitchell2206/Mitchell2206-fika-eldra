import { revalidatePath } from 'next/cache';
import { normalizeFragranceStock } from '@/lib/commerce';
import { ensureDb, inventoryRows, sql } from '@/lib/db';
import { all, restoreStock, sendOrder, whatsapp } from '@/lib/store';
import { fail, isAdmin, sameOrigin } from '@/lib/auth';

const STATES = ['nuevo', 'contactado', 'confirmado', 'pagado', 'en preparación', 'enviado', 'entregado', 'cancelado'];

function shapeOrder(r: any, s: any) {
  return { ...r.data, id: r.id, status: r.status, notes: r.notes, demo: r.demo, email_status: r.email_status, created: new Date(r.created).toISOString(), whatsappUrl: whatsapp(r.data, s).url };
}

export async function GET() {
  if (!(await isAdmin())) return fail('Acceso restringido', 403);
  try {
    const entries = await all(false);
    const s = entries.find((x) => x.kind === 'settings');
    const db = sql();
    const [orders, events] = (await db.transaction([
      db`SELECT * FROM orders ORDER BY created DESC`,
      db`SELECT type, target, visitor, source, created FROM events ORDER BY created DESC LIMIT 50000`,
    ])) as any[][];
    return Response.json(
      {
        entries,
        orders: orders.map((r) => shapeOrder(r, s)),
        events: events.map((e) => ({ ...e, created: new Date(e.created).toISOString() })),
        mailReady: !!process.env.RESEND_API_KEY,
        blobReady: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return fail('No pudimos cargar la administración. ' + (e?.message || ''), 503);
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req) || !(await isAdmin())) return fail('Acceso restringido', 403);
  const db = sql();
  try {
    await ensureDb();
    const b: any = await req.json();
    if (b.action === 'save') {
      const x = b.entry;
      if (!x?.id || !['product', 'rune', 'faq', 'testimonial', 'settings'].includes(x.kind) || JSON.stringify(x).length > 50000) return fail('Datos inválidos');
      if (x.kind === 'product' && (!x.name?.trim() || !Number.isFinite(x.price) || x.price < 0 || !Number.isInteger(x.stock) || x.stock < 0)) return fail('Revisá nombre, precio y stock');
      if (x.kind === 'product' && x.fragrances && (!Array.isArray(x.fragrances) || x.fragrances.length > 100 || x.fragrances.some((f: any) => typeof f !== 'string' || !f.trim() || f.length > 100) || new Set(x.fragrances).size !== x.fragrances.length))
        return fail('Revisá las fragancias: no pueden estar vacías ni repetidas.');
      if (x.kind === 'product') {
        if (x.bundleComponents?.length) {
          x.stock = 0;
          delete x.fragranceStock;
          delete x.fragrances;
        }
        try { normalizeFragranceStock(x); } catch (e: any) { return fail(e.message); }
      }
      if (x.kind === 'settings' && (x.shipping < 0 || x.freeAbove < 0 || x.refillPercent < 0 || x.refillPercent > 100 || x.transferDiscount < 0 || x.transferDiscount > 100 || !Number.isFinite(x.cashDiscount) || x.cashDiscount < 0 || x.cashDiscount > 100))
        return fail('Revisá costos y descuentos');
      if (x.kind === 'settings' && !/^\d{8,15}$/.test(x.whatsapp || '')) return fail('Ingresá el WhatsApp con código de país, solo números.');
      if (x.kind === 'product') {
        const current = (await all(false)).find((p) => p.id === x.id);
        if (current && x.inventorySnapshot !== JSON.stringify([current.stock, current.fragranceStock || null]))
          return fail('El stock cambió mientras editabas (entró un pedido). Cerrá el editor y volvé a abrirlo.', 409);
      }
      delete x.inventorySnapshot;
      const { stock, fragranceStock, ...data } = x;
      await db.transaction([
        db`INSERT INTO entries (id, kind, data) VALUES (${x.id}, ${x.kind}, ${JSON.stringify(data)}::jsonb) ON CONFLICT (id) DO UPDATE SET data = excluded.data, kind = excluded.kind, updated_at = now()`,
        ...(x.kind === 'product'
          ? [db`DELETE FROM inventory WHERE product_id = ${x.id}`, ...inventoryRows(x).map(([id, a, q]) => db`INSERT INTO inventory (product_id, aroma, qty) VALUES (${id}, ${a}, ${q})`)]
          : []),
      ]);
    } else if (b.action === 'delete') {
      const [used] = (await db`SELECT 1 FROM order_lines WHERE product_id = ${b.id} LIMIT 1`) as any[];
      if (used) return fail('Este producto tiene pedidos: archivalo en lugar de eliminarlo.', 409);
      await db.transaction([db`DELETE FROM entries WHERE id = ${b.id} AND kind <> 'settings'`, db`DELETE FROM inventory WHERE product_id = ${b.id}`]);
    } else if (b.action === 'order') {
      if (!STATES.includes(b.status)) return fail('Estado inválido');
      const [old] = (await db`SELECT status, data FROM orders WHERE id = ${b.id}`) as any[];
      if (!old) return fail('Pedido no encontrado', 404);
      if (old.status === 'cancelado' && b.status !== 'cancelado') return fail('Un pedido cancelado no puede reabrirse. Creá uno nuevo.');
      const restore = b.status === 'cancelado' && old.status !== 'cancelado' ? restoreStock(old.data, await all(false)) : [];
      await db.transaction([...restore, db`UPDATE orders SET status = ${b.status}, notes = ${String(b.notes || '').slice(0, 4000)} WHERE id = ${b.id}`]);
    } else if (b.action === 'resend') {
      const [row] = (await db`SELECT data FROM orders WHERE id = ${b.id}`) as any[];
      if (!row) return fail('Pedido no encontrado');
      const s = (await all(false)).find((x) => x.kind === 'settings');
      const sent = await sendOrder(row.data, s);
      return Response.json({ ok: sent, error: sent ? undefined : 'Correo pendiente: revisá el servicio de envío.' });
    } else if (b.action === 'clean-demo') {
      const entries = await all(false);
      const trials = (await db`SELECT data FROM orders WHERE demo AND status <> 'cancelado'`) as any[];
      await db.transaction([
        ...trials.flatMap((r) => restoreStock(r.data, entries)),
        db`DELETE FROM orders WHERE demo`,
        db`DELETE FROM entries WHERE kind = 'product' AND (data->>'demo')::boolean IS TRUE AND id NOT IN (SELECT product_id FROM order_lines)`,
      ]);
    } else if (b.action === 'import') {
      // Restores orders, order lines and events from a backup file. Existing rows are kept.
      const d = b.data || {};
      const orders = Array.isArray(d.orders) ? d.orders : [];
      const lines = Array.isArray(d.order_lines) ? d.order_lines : [];
      const events = Array.isArray(d.events) ? d.events : [];
      const stmts = [
        ...orders.map((o: any) => {
          const data = typeof o.data === 'string' ? JSON.parse(o.data) : o.data;
          return db`INSERT INTO orders (id, key, data, status, created, email_status, notes, demo) VALUES (${o.id}, ${o.key}, ${JSON.stringify(data)}::jsonb, ${o.status || 'nuevo'}, ${o.created}, ${o.email_status || 'not_required'}, ${o.notes || ''}, ${!!o.demo}) ON CONFLICT (id) DO NOTHING`;
        }),
        ...lines.map((l: any) => db`INSERT INTO order_lines (id, order_id, product_id, qty) VALUES (${l.id}, ${l.order_id}, ${l.product_id}, ${l.qty}) ON CONFLICT (id) DO NOTHING`),
        ...events.map((e: any) => db`INSERT INTO events (id, type, target, visitor, source, created) VALUES (${e.id}, ${e.type}, ${e.target || ''}, ${e.visitor}, ${e.source || 'directo'}, ${e.created}) ON CONFLICT (id) DO NOTHING`),
      ];
      // Secret aroma → rune mapping (admin only), kept out of the public repository.
      if (d.fragranceRunes && typeof d.fragranceRunes === 'object')
        for (const [id, map] of Object.entries(d.fragranceRunes))
          if (map && typeof map === 'object') stmts.push(db`UPDATE entries SET data = jsonb_set(data, '{fragranceRunes}', ${JSON.stringify(map)}::jsonb) WHERE id = ${id} AND kind = 'product'`);
      for (let i = 0; i < stmts.length; i += 200) await db.transaction(stmts.slice(i, i + 200));
      return Response.json({ ok: true, imported: { orders: orders.length, lines: lines.length, events: events.length } });
    } else return fail('Acción inválida');
    revalidatePath('/', 'layout');
    return Response.json({ ok: true });
  } catch (e: any) {
    return fail('No se guardaron los cambios. ' + (e?.message || ''), 409);
  }
}
