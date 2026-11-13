import { fail, login, sameOrigin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Origen no permitido', 403);
  if (!process.env.ADMIN_PASSWORD) return fail('Falta configurar ADMIN_PASSWORD en Vercel.', 503);
  const { password } = await req.json().catch(() => ({}));
  if (await login(password)) return Response.json({ ok: true });
  await new Promise((r) => setTimeout(r, 800));
  return fail('Contraseña incorrecta.', 401);
}
