import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Flame, Gift, MessageCircle, Recycle, ScrollText, Sparkles } from 'lucide-react';
import { getShop } from '@/lib/store';
import { money, runeSymbols } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import { Reveal } from '@/components/chrome';

export default async function Home() {
  const { products, settings: s, faqs, testimonials } = await getShop();
  const featured = products.filter((p) => p.featured);
  const bundle = products.find((p) => p.bundleComponents?.length);
  const discount = Math.max(Number(s.cashDiscount || 0), Number(s.transferDiscount || 0));
  const headline = s.headline === 'Ritual con propósito' ? null : s.headline;

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="relative z-10">
            <Reveal><span className="eyebrow">El arte de volver a vos</span></Reveal>
            <Reveal delay={80}>
              <h1 className="display mt-6">
                {headline || <>Ritual con<br /><em>propósito.</em></>}
              </h1>
            </Reveal>
            <Reveal delay={160}><p className="lead mt-7">{s.intro}</p></Reveal>
            <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/catalogo" className="btn">Descubrí tu ritual <ArrowRight size={18} /></Link>
              <Link href="/historia" className="btn btn-ghost">Cómo funciona</Link>
            </Reveal>
            <Reveal delay={320} className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--line)] pt-6">
              {[['22', 'fragancias'], ['24', 'runas'], [discount ? discount + '%' : '∞', discount ? 'off efectivo' : 'momentos']].map(([n, l]) => (
                <div key={l}>
                  <p className="font-serif text-[38px] leading-none text-[var(--foreground)]">{n}</p>
                  <p className="mt-1 text-[12px] tracking-wide uppercase">{l}</p>
                </div>
              ))}
            </Reveal>
          </div>
          <Reveal delay={120} className="relative mx-auto w-full max-w-[520px]">
            <div className="hero-photo">
              <Image src={s.banner || '/images/vela-incognito.webp'} alt="Vela FIKA ELDRA con su runa en incógnita, pergamino y bolsa de lino" fill priority sizes="(min-width: 960px) 45vw, 92vw" />
            </div>
            <span className="flame" style={{ top: '9%', left: '18%' }} aria-hidden />
            <div className="hero-chip -left-2 bottom-[18%] sm:-left-10">
              <span className="rune">?</span>
              <span>Tu runa es una sorpresa<br /><small className="text-[var(--muted-foreground)]">La descubrís al recibirla</small></span>
            </div>
            <div className="hero-chip -right-2 top-[12%] sm:-right-8">
              <Flame size={18} className="text-[var(--gold)]" />
              <span>Pergamino, sahumerio<br /><small className="text-[var(--muted-foreground)]">y playlist de tu runa</small></span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* RUNES MARQUEE */}
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {['Aroma', 'Intención', 'Presente', 'Runa', 'Mensaje', 'Ritual'].map((w, i) => (
                <span key={w}><b>{['ᚠ','ᛉ','ᛟ','ᚨ','ᛞ','ᛒ'][(i + k * 3) % 6]}</b>{w}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="wrap">
          <Reveal className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">Cómo funciona</span>
              <h2 className="h2 mt-5">Tres gestos,<br /><em>un momento tuyo.</em></h2>
            </div>
            <p className="lead md:text-right">Cada vela guarda una runa en secreto. No elegís el símbolo: lo elige el aroma.</p>
          </Reveal>
          <div className="steps">
            {[
              [Sparkles, 'Elegí tu aroma', 'Entre 22 fragancias: miel, lavanda, café, frutos del bosque y más. Dejate guiar por lo que te gusta sentir.'],
              [Gift, 'Recibí tu runa', 'Cada aroma está unido a una runa nórdica. La descubrís —junto con su mensaje— cuando abrís tu vela.'],
              [ScrollText, 'Hacé tu ritual', 'Leé el pergamino, encendé la vela y escaneá el QR para escuchar la playlist de tu runa.'],
            ].map(([Icon, t, d]: any, i) => (
              <Reveal key={t} delay={i * 90} className="step">
                <span className="step-n">0{i + 1}</span>
                <div className="step-icon"><Icon size={22} /></div>
                <h3 className="h3">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="pb-[clamp(64px,9vw,128px)]">
        <div className="wrap">
          <Reveal className="mb-12 flex items-end justify-between gap-6">
            <div>
              <span className="eyebrow">La colección</span>
              <h2 className="h2 mt-5">Pequeños gestos.<br /><em>Algo más profundo.</em></h2>
            </div>
            <Link href="/catalogo" className="link hidden sm:inline-flex">Ver todo <ArrowUpRight size={16} /></Link>
          </Reveal>
          <div className="grid-products">
            {featured.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProductCard p={p} priority={i < 2} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* BUNDLE SPOTLIGHT */}
      {bundle && (
        <section className="relative overflow-hidden border-y border-[var(--line)] bg-[radial-gradient(ellipse_at_20%_50%,rgba(31,58,44,.55),transparent_60%)]">
          <div className="wrap grid items-center gap-12 py-[clamp(64px,8vw,110px)] md:grid-cols-2">
            <Reveal className="relative aspect-square overflow-hidden rounded-[18px]">
              <Image src={bundle.images[0]} alt={bundle.name} fill sizes="(min-width: 768px) 45vw, 92vw" className="object-cover" />
            </Reveal>
            <Reveal delay={100}>
              <span className="eyebrow">Para regalar o regalarte</span>
              <h2 className="h2 mt-5">{bundle.name.split('·')[0]}<br /><em>{bundle.name.split('·')[1] || 'la experiencia entera'}</em></h2>
              <p className="lead mt-6">{bundle.brief}</p>
              <ul className="mt-7 space-y-3">
                {(bundle.includes || []).map((x: string) => (
                  <li key={x} className="flex gap-3 text-[15px] text-[#d6d3c6]"><span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--gold)]" />{x}</li>
                ))}
              </ul>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Link href={`/productos/${bundle.id}`} className="btn">Armar mi ritual completo <ArrowRight size={18} /></Link>
                <span className="price text-xl">{money(bundle.promo || bundle.price)}</span>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* RUNES */}
      <section className="section">
        <div className="wrap grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <span className="eyebrow">El misterio</span>
            <h2 className="h2 mt-5">24 runas.<br /><em>Una te espera.</em></h2>
            <p className="lead mt-6">Las runas del Futhark antiguo no predicen tu destino: iluminan tu presente. Cada una trae una palabra, un mensaje y una pequeña práctica para acompañarte.</p>
            <p className="mt-4 text-[15px]">Por eso no te contamos cuál corresponde a cada aroma. Esa parte la descubrís vos.</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid grid-cols-6 gap-px overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--line)]">
              {runeSymbols.map((r, i) => (
                <div key={r} className="group grid aspect-square place-items-center bg-[var(--background)] font-serif text-[clamp(24px,3.2vw,40px)] text-[#5f6656] transition-colors duration-500 hover:bg-[#121812] hover:text-[var(--gold)]" style={{ transitionDelay: (i % 6) * 20 + 'ms' }}>
                  {r}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* REFILL + PROMISES */}
      <section className="pb-[clamp(64px,9vw,128px)]">
        <div className="wrap grid gap-5 md:grid-cols-3">
          {[
            [Recycle, `${s.refillPercent}% en tu recarga`, 'Traé tu envase y volvé a llenarlo. El ritual continúa, el vidrio también.', `https://wa.me/${s.whatsapp}?text=${encodeURIComponent('Hola, quiero consultar por el refill de mi vela.')}`, 'Consultar refill'],
            [MessageCircle, 'Compra asistida', 'No pedimos tarjetas en la web. Armás tu pedido y lo coordinamos por WhatsApp, a tu ritmo.', '/preguntas', 'Cómo comprar'],
            [Flame, 'Retiro en Villa Urquiza', `${s.address}. ${s.hours}. También enviamos a domicilio.`, '/envios', 'Envíos y retiros'],
          ].map(([Icon, t, d, href, cta]: any, i) => (
            <Reveal key={t} delay={i * 80} className="panel flex flex-col">
              <Icon size={24} className="text-[var(--gold)]" />
              <h3 className="h3 mt-6">{t}</h3>
              <p className="mt-3 flex-1 text-[15px]">{d}</p>
              <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="link mt-6">{cta} <ArrowUpRight size={15} /></a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="section border-t border-[var(--line)]">
          <div className="wrap">
            <span className="eyebrow">Momentos compartidos</span>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {testimonials.map((x: any) => (
                <Reveal as="blockquote" key={x.id} className="font-serif text-[26px] leading-snug text-[#e4dfd1]">
                  “{x.text}”
                  <cite className="mt-4 block font-sans text-sm not-italic text-[var(--gold)]">— {x.name}</cite>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ PREVIEW */}
      <section className="section border-t border-[var(--line)]">
        <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <span className="eyebrow">Antes de encender</span>
            <h2 className="h2 mt-5">Preguntas<br /><em>frecuentes.</em></h2>
            <Link href="/preguntas" className="link mt-8">Ver todas <ArrowUpRight size={15} /></Link>
          </Reveal>
          <Reveal delay={80}>
            {faqs.slice(0, 5).map((f: any) => (
              <details key={f.id} className="acc"><summary>{f.question}</summary><p>{f.answer}</p></details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="wrap">
          <Reveal className="relative overflow-hidden rounded-[24px] border border-[var(--line)] bg-[radial-gradient(ellipse_at_50%_120%,rgba(201,173,120,.22),transparent_60%),#101510] px-6 py-20 text-center">
            <span className="font-serif text-6xl text-[var(--gold)]">ᛟ</span>
            <h2 className="h2 mx-auto mt-6 max-w-2xl">Regalate el tiempo<br /><em>de estar presente.</em></h2>
            <Link href="/catalogo" className="btn mt-10">Elegir mi aroma <ArrowRight size={18} /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
