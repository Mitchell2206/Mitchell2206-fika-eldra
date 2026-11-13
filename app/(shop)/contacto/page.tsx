import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Camera, MapPin, MessageCircle } from 'lucide-react';
import { getShop } from '@/lib/store';

export const metadata: Metadata = { title: 'Contacto', description: 'Escribinos por WhatsApp o Instagram, o retirá tu pedido en Villa Urquiza.' };

export default async function Page() {
  const { settings: s } = await getShop();
  const phone = s.whatsapp.replace(/^549?(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3');
  const cards = [
    [MessageCircle, 'WhatsApp', phone, 'Hablemos de tu ritual', `https://wa.me/${s.whatsapp}`],
    [Camera, 'Instagram', '@' + s.instagram, 'Pequeños momentos, cada día', `https://instagram.com/${s.instagram}`],
    [MapPin, 'Retirá tu pedido', s.address, s.hours, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address.replace('·', ','))}`],
  ];
  return (
    <section className="wrap pt-10 pb-24 md:pt-16">
      <span className="eyebrow">Conversemos</span>
      <h1 className="display mt-5 !text-[clamp(44px,6vw,88px)]">Estamos del <em>otro lado.</em></h1>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {cards.map(([Icon, t, v, d, href]: any) => (
          <a key={t} href={href} target="_blank" rel="noreferrer" className="panel group flex min-h-64 flex-col transition hover:border-[rgba(201,173,120,.5)]">
            <Icon size={26} className="text-[var(--gold)]" />
            <h2 className="mt-auto pt-10 font-serif text-3xl">{t}</h2>
            <p className="mt-2 text-[var(--foreground)]">{v}</p>
            <p className="mt-1 flex items-center justify-between text-sm">{d}<ArrowUpRight size={18} className="text-[var(--gold)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></p>
          </a>
        ))}
      </div>
      <Link href="/preguntas" className="link mt-12">Ver preguntas frecuentes <ArrowUpRight size={15} /></Link>
    </section>
  );
}
