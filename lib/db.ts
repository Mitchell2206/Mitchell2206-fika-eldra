import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import seed from './seed.json';
import { hasFragranceStock } from './commerce';

let client: any = null;
let ready: Promise<void> | null = null;

export function sql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL;
  if (!url) throw new Error('Falta configurar DATABASE_URL (Neon) en Vercel.');
  if (!client) client = url.startsWith('pglite:') ? localClient(url.slice(7)) : neon(url);
  return client;
}

/** Development only: an in-process Postgres (PGlite) that mimics the Neon HTTP driver. */
function localClient(dir: string): any {
  const g = globalThis as any;
  g.__pglite ??= import('@electric-sql/pglite').then(({ PGlite }) => new PGlite(dir || undefined));
  const run = async (q: { text: string; params: any[] }, db?: any) => ((await (db || (await g.__pglite)).query(q.text, q.params)) as any).rows;
  const tag: any = (strings: TemplateStringsArray, ...params: any[]) => {
    const q = { text: strings.reduce((a, s, i) => a + '$' + i + s), params };
    return { ...q, then: (ok: any, ko: any) => run(q).then(ok, ko) };
  };
  tag.transaction = async (qs: any[]) => (await g.__pglite).transaction(async (tx: any) => {
    const out: any[] = [];
    for (const q of qs) out.push(await run(q, tx));
    return out;
  });
  return tag;
}

/** Inventory rows for a product: one row per aroma, or a single '' row for general stock. */
export function inventoryRows(p: any): [string, string, number][] {
  if (p.bundleComponents?.length) return [];
  if (hasFragranceStock(p)) return Object.entries(p.fragranceStock).map(([a, q]) => [p.id, a, Number(q) || 0]);
  return [[p.id, '', Number(p.stock) || 0]];
}

async function init() {
  const db = sql();
  await db.transaction([
    // Serializes the first boot when several instances start at once.
    db`SELECT pg_advisory_xact_lock(4217001)`,
    db`CREATE TABLE IF NOT EXISTS entries (id text PRIMARY KEY, kind text NOT NULL, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
    db`CREATE INDEX IF NOT EXISTS entries_kind ON entries(kind)`,
    db`CREATE TABLE IF NOT EXISTS inventory (product_id text NOT NULL, aroma text NOT NULL DEFAULT '', qty integer NOT NULL CHECK (qty >= 0), PRIMARY KEY (product_id, aroma))`,
    db`CREATE TABLE IF NOT EXISTS orders (id text PRIMARY KEY, key text NOT NULL UNIQUE, data jsonb NOT NULL, status text NOT NULL DEFAULT 'nuevo', created timestamptz NOT NULL, email_status text NOT NULL DEFAULT 'not_required', notes text NOT NULL DEFAULT '', demo boolean NOT NULL DEFAULT false, ip text NOT NULL DEFAULT '')`,
    db`CREATE INDEX IF NOT EXISTS orders_created ON orders(created)`,
    db`CREATE TABLE IF NOT EXISTS order_lines (id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id text NOT NULL, qty integer NOT NULL)`,
    db`CREATE TABLE IF NOT EXISTS events (id text PRIMARY KEY, type text NOT NULL, target text NOT NULL, visitor text NOT NULL, source text NOT NULL, created timestamptz NOT NULL DEFAULT now())`,
    db`CREATE INDEX IF NOT EXISTS events_created ON events(created)`,
  ]);
  const [{ n }] = (await db`SELECT count(*)::int AS n FROM entries`) as any[];
  if (n > 0) return;
  const rows = seed as any[];
  await db.transaction([
    db`SELECT pg_advisory_xact_lock(4217001)`,
    ...rows.map((x) => {
      const { stock, ...data } = x;
      return db`INSERT INTO entries (id, kind, data) VALUES (${x.id}, ${x.kind}, ${JSON.stringify(data)}::jsonb) ON CONFLICT (id) DO NOTHING`;
    }),
    ...rows.filter((x) => x.kind === 'product').flatMap(inventoryRows).map(
      ([id, a, q]) => db`INSERT INTO inventory (product_id, aroma, qty) VALUES (${id}, ${a}, ${q}) ON CONFLICT DO NOTHING`,
    ),
  ]);
}

export function ensureDb() {
  if (!ready) ready = init().catch((e) => { ready = null; throw e; });
  return ready;
}
