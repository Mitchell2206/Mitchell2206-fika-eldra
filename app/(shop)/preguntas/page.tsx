import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { getShop } from '@/lib/store';

export const metadata: Metadata = { title: 'Preguntas frecuentes', description: 'Cómo funcionan las runas, medios de pago, envíos, refill y cuidados de tu vela.' };

export default async function Page() {
  const { faqs, settings: s } = await getShop();
  const jsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f: any) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) };
  return (
    <section className="wrap grid gap-14 pt-10 pb-24 md:pt-16 lg:grid-cols-[0.8fr_1.2fr]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="lg:sticky lg:top-28 lg:self-start">
        <span className="eyebrow">Te acompañamos</span>
        <h1 className="display mt-5 !text-[clamp(44px,5.5vw,80px)]">Antes de encender <em>tu ritual.</em></h1>
        <p className="lead mt-6">¿No encontrás lo que buscás? Escribinos, respondemos personalmente.</p>
        <a className="btn btn-wa mt-8" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Hablemos por WhatsApp</a>
      </div>
      <div>
        {faqs.map((f: any, i: number) => (
          <details key={f.id} className="acc" open={i === 0}><summary>{f.question}</summary><p>{f.answer}</p></details>
        ))}
      </div>
    </section>
  );
}
