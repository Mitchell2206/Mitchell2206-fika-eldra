import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getShop } from '@/lib/store';
import { Reveal } from '@/components/chrome';

export const metadata: Metadata = { title: 'Nuestra historia', description: 'FIKA ELDRA nació de una búsqueda personal: transformar una vela en una experiencia que nos invite a detenernos.' };

export default async function Page() {
  const { settings: s } = await getShop();
  const steps = [['ᚨ', 'Aroma', 'Algo que sentís.'], ['ᚱ', 'Runa', 'Un símbolo que te invita.'], ['ᛗ', 'Mensaje', 'Una mirada hacia adentro.'], ['ᛏ', 'Ritual', 'Un gesto con intención.'], ['ᛞ', 'Presente', 'Un momento que es tuyo.']];
  return (
    <>
      <section className="wrap grid items-center gap-12 pt-10 pb-20 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal><span className="eyebrow">Nuestra historia</span></Reveal>
          <Reveal delay={80}><h1 className="display mt-6 !text-[clamp(44px,6vw,88px)]">A veces, volver a vos empieza <em>con una llama.</em></h1></Reveal>
          <Reveal delay={160}><p className="lead mt-8 !max-w-[56ch] whitespace-pre-line">{s.story}</p></Reveal>
        </div>
        <Reveal delay={120} className="relative aspect-[4/5] overflow-hidden rounded-[220px_220px_14px_14px]">
          <Image src="/images/vela-incognito.webp" alt="La experiencia FIKA ELDRA: vela, runa y ritual" fill sizes="(min-width: 1024px) 40vw, 92vw" className="object-cover" priority />
        </Reveal>
      </section>
      <section className="border-y border-[var(--line)] bg-[#0b0e0b]">
        <div className="wrap grid grid-cols-2 gap-px py-0 md:grid-cols-5">
          {steps.map(([r, t, d], i) => (
            <Reveal key={t} delay={i * 70} className="py-12 text-center md:py-16">
              <span className="font-serif text-5xl text-[var(--gold)]">{r}</span>
              <p className="mt-4 text-[11px] tracking-[.25em] text-[var(--muted-foreground)]">0{i + 1}</p>
              <h3 className="mt-2 font-serif text-3xl">{t}</h3>
              <p className="mt-2 text-sm">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="wrap section text-center">
        <h2 className="h2">Fika: <em>la pausa compartida.</em></h2>
        <p className="lead mx-auto mt-6">Una vela, un aroma y una runa para regalarte ese momento, cada día.</p>
        <Link href="/catalogo" className="btn mt-10">Elegí tu aroma <ArrowRight size={18} /></Link>
      </section>
    </>
  );
}
