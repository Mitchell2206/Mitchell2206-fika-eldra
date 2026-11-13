import type { MetadataRoute } from 'next';
import { getShop } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
  const paths = ['', '/catalogo', '/historia', '/preguntas', '/contacto', '/envios', '/cambios'];
  let products: any[] = [];
  try { products = (await getShop()).products; } catch {}
  return [...paths, ...products.map((p) => `/productos/${p.id}`)].map((p) => ({ url: base + p, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }));
}
