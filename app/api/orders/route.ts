import { revalidatePath } from 'next/cache';
import { createOrder, UserError } from '@/lib/store';
import { fail, sameOrigin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Origen no permitido', 403);
  try {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
    const result = await createOrder(await req.json(), ip);
    revalidatePath('/', 'layout');
    return Response.json(result);
  } catch (e: any) {
    if (e instanceof UserError) return fail(e.message, e.status);
    const msg = String(e?.message || '');
    return fail(/stock|fragancia|variante|cantidades|Agregá|Precio/.test(msg) ? msg : 'No pudimos completar el pedido. Intentá nuevamente.', 409);
  }
}
