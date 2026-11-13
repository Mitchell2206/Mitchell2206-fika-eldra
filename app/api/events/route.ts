import { ensureDb, sql } from '@/lib/db';
import { sameOrigin } from '@/lib/auth';

const TYPES = ['page', 'product', 'add', 'start', 'complete', 'whatsapp', 'rune'];

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  try {
    const x: any = await req.json();
    if (!x.consent || !TYPES.includes(x.type) || !/^[-a-z0-9]{16,80}$/i.test(x.visitor)) return new Response(null, { status: 400 });
    await ensureDb();
    await sql()`INSERT INTO events (id, type, target, visitor, source) VALUES (${crypto.randomUUID()}, ${x.type}, ${String(x.target || '').slice(0, 120)}, ${x.visitor}, ${String(x.source || 'directo').slice(0, 100)})`;
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
