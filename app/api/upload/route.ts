import { put } from '@vercel/blob';
import { fail, isAdmin, sameOrigin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!sameOrigin(req) || !(await isAdmin())) return fail('Acceso restringido', 403);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fail('Falta conectar Vercel Blob al proyecto.', 503);
  try {
    const f = (await req.formData()).get('file') as File | null;
    if (!f || f.size > 5e6 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return fail('Usá JPG, PNG o WebP de hasta 5 MB.');
    const bytes = new Uint8Array(await f.arrayBuffer());
    const valid = f.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 : f.type === 'image/png' ? bytes[0] === 137 && bytes[1] === 80 : new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
    if (!valid) return fail('Archivo de imagen inválido');
    const ext = f.type.split('/')[1].replace('jpeg', 'jpg');
    const blob = await put(`productos/${crypto.randomUUID()}.${ext}`, Buffer.from(bytes), { access: 'public', contentType: f.type });
    return Response.json({ url: blob.url });
  } catch {
    return fail('No se pudo subir la imagen.', 503);
  }
}
