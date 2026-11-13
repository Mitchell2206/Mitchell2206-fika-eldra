import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getShop } from '@/lib/store';
import { ProductCard } from '@/components/product-card';
import { ProductView } from './product-view';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = (await getShop()).products.find((x) => x.id === id);
  if (!p) return { title: 'Producto no disponible' };
  return { title: p.name, description: p.brief, openGraph: { images: p.images.slice(0, 1) }, alternates: { canonical: `/productos/${p.id}` } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (id === 'vela-fehu') permanentRedirect('/productos/vela-ritual');
  const { products, settings } = await getShop();
  const p = products.find((x) => x.id === id);
  if (!p) notFound();
  const related = products.filter((x) => x.id !== p.id && (p.related || '').split(',').includes(x.id));
  const others = related.length ? related : products.filter((x) => x.id !== p.id).slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.brief,
    image: p.images,
    brand: { '@type': 'Brand', name: 'FIKA ELDRA' },
    offers: { '@type': 'Offer', priceCurrency: 'ARS', price: p.promo > 0 ? p.promo : p.price, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductView p={p} settings={settings} />
      <section className="wrap border-t border-[var(--line)] py-20">
        <span className="eyebrow">Mejor en compañía</span>
        <h2 className="h2 mt-5 mb-12">Completá tu <em>momento.</em></h2>
        <div className="grid-products">{others.map((x) => <ProductCard key={x.id} p={x} />)}</div>
      </section>
    </>
  );
}
