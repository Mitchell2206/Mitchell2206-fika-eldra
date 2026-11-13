import type { Metadata } from 'next';
import { Catalog } from './catalog';

export const metadata: Metadata = {
  title: 'Colección',
  description: 'Velas aromáticas con runa sorpresa, brumas textiles y rituales completos. Elegí entre 22 fragancias.',
};

export default function Page() {
  return (
    <section className="wrap pt-10 pb-24 md:pt-16">
      <span className="eyebrow">La colección</span>
      <h1 className="display mt-5 !text-[clamp(44px,6vw,84px)]">Encontrá tu <em>ritual.</em></h1>
      <p className="lead mt-5">Un aroma, un símbolo, un momento que es tuyo.</p>
      <Catalog />
    </section>
  );
}
