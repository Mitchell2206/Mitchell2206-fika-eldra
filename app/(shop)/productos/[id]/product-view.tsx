'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Gift, MessageCircle, Minus, Plus, Recycle, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { aromaStock, hasFragranceStock } from '@/lib/commerce';
import { money } from '@/lib/data';
import { unitPrice, useShop } from '@/components/shop-provider';
import { tagFor } from '@/components/product-card';

export function ProductView({ p, settings: s }: { p: any; settings: any }) {
  const { add } = useShop();
  const router = useRouter();
  const [img, setImg] = useState(0);
  const [aroma, setAroma] = useState('');
  const [qty, setQty] = useState(1);
  const [refill, setRefill] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef<HTMLDivElement>(null);
  const needs = p.fragrances?.length > 0;
  const perAroma = hasFragranceStock(p);
  const max = needs ? (aroma ? aromaStock(p, aroma) : p.stock) : p.stock;
  const soldOut = !p.stock || (!!aroma && aromaStock(p, aroma) === 0);
  const price = unitPrice(p);
  const refillPct = p.refillPercent ?? s.refillPercent;
  const lineTotal = price * qty - (refill ? Math.round(price * qty * refillPct / 100) : 0);
  const discount = Math.max(Number(s.cashDiscount || 0), Number(s.transferDiscount || 0));

  useEffect(() => {
    const on = () => { const el = ctaRef.current; if (el) setShowBar(el.getBoundingClientRect().bottom < 0); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { if (qty > Math.max(1, max)) setQty(Math.max(1, max)); }, [max, qty]);

  function go(buyNow: boolean) {
    if (needs && !aroma) {
      setPulse(true);
      setTimeout(() => setPulse(false), 900);
      pickRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (add(p, aroma, qty, refill) && buyNow) router.push('/pedido');
  }

  return (
    <section className="wrap pt-6 pb-16 md:pt-10">
      <Link href="/catalogo" className="link mb-6 text-[13px]"><ArrowLeft size={15} /> Volver a la colección</Link>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[var(--card)]">
            {p.images.map((src: string, i: number) => (
              <Image key={src} src={src} alt={`${p.name} · foto ${i + 1}`} fill priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" className={'object-cover transition-opacity duration-500 ' + (i === img ? 'opacity-100' : 'opacity-0')} />
            ))}
            <span className="card-tag">{tagFor(p)}</span>
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {p.images.map((src: string, i: number) => (
                <button key={src} onClick={() => setImg(i)} aria-label={`Ver foto ${i + 1}`} className={'relative h-24 w-20 overflow-hidden rounded-xl border transition ' + (i === img ? 'border-[var(--gold)]' : 'border-transparent opacity-60 hover:opacity-100')}>
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="eyebrow">{p.category}</span>
          <h1 className="mt-4 font-serif text-[clamp(40px,5vw,64px)] leading-[1.02]">{p.name}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-[#d4d0c3]">{p.brief}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="price !text-[26px]">{money(price)}{p.promo > 0 && <del>{money(p.price)}</del>}</span>
            {discount > 0 && <span className="text-[13px] text-[#9fd4cb]">{money(Math.round(price * (100 - discount) / 100))} en efectivo o transferencia</span>}
          </div>

          {needs && (
            <div ref={pickRef} className={'mt-9 rounded-2xl transition ' + (pulse ? 'ring-2 ring-[var(--gold)] ring-offset-8 ring-offset-[var(--background)]' : '')}>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <p className="font-serif text-2xl text-[var(--foreground)]">1 · Elegí tu fragancia</p>
                <span className="text-[12.5px]">{aroma ? <span className="text-[var(--gold-soft)]">{aroma}</span> : `${p.fragrances.length} opciones`}</span>
              </div>
              <div className="aromas" role="group" aria-label="Fragancias">
                {p.fragrances.map((a: string) => {
                  const left = aromaStock(p, a);
                  return (
                    <button key={a} type="button" className="aroma" aria-pressed={aroma === a} disabled={left === 0} onClick={() => { setAroma(a); setQty(1); }}>
                      {a}
                      {perAroma && <small>{left === 0 ? 'Agotado' : left <= 3 ? `Quedan ${left}` : 'Disponible'}</small>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 flex items-center gap-2 text-[13px]"><Gift size={14} className="text-[var(--gold)]" /> La runa de tu aroma y su mensaje se revelan al recibir tu vela.</p>
            </div>
          )}

          <div ref={ctaRef} className="mt-9 space-y-4">
            {needs && <p className="font-serif text-2xl text-[var(--foreground)]">2 · Sumalo a tu pedido</p>}
            {p.refill && (
              <button type="button" className="choice" role="checkbox" aria-checked={refill} onClick={() => setRefill(!refill)}>
                <span className="dot" />
                <span><strong>Quiero recargar mi envase <span className="save-tag">-{refillPct}%</span></strong><small>Traé tu vaso FIKA ELDRA; lo revisamos y lo volvemos a llenar.</small></span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="qty">
                <button aria-label="Restar" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Minus size={16} /></button>
                <span>{qty}</span>
                <button aria-label="Sumar" disabled={qty >= max} onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
              </div>
              <button className="btn flex-1" disabled={soldOut} onClick={() => go(false)}>
                {soldOut ? 'Sin stock' : <>Agregar · {money(lineTotal)} <ShoppingBag size={17} /></>}
              </button>
            </div>
            <button className="btn btn-wa btn-block" disabled={soldOut} onClick={() => go(true)}>Comprar ahora <MessageCircle size={17} /></button>
            <p className="text-[12.5px] text-[var(--muted-foreground)]">
              {needs && !aroma ? 'Elegí un aroma para ver su disponibilidad.' : soldOut ? 'Escribinos y te avisamos cuando vuelva.' : max <= 5 ? `Quedan ${max} unidades.` : 'En stock · listo para coordinar.'}
            </p>
          </div>

          <ul className="mt-8 grid gap-3 border-y border-[var(--line)] py-6 text-[13.5px] sm:grid-cols-3">
            <li className="flex gap-2.5"><ShieldCheck size={18} className="flex-none text-[var(--gold)]" />Sin pagos online: coordinás por WhatsApp</li>
            <li className="flex gap-2.5"><Truck size={18} className="flex-none text-[var(--gold)]" />Envío gratis desde {money(s.freeAbove)}</li>
            <li className="flex gap-2.5"><Recycle size={18} className="flex-none text-[var(--gold)]" />Retiro en {s.address.split('·')[0].trim()}</li>
          </ul>

          <div className="mt-8 space-y-5">
            <p className="text-[15.5px] leading-[1.85]">{p.description}</p>
            {p.includes?.length > 0 && (
              <div className="panel">
                <p className="eyebrow mb-4">Tu ritual incluye</p>
                <ul className="space-y-2.5">
                  {p.includes.map((x: string) => <li key={x} className="flex gap-3 text-[15px] text-[#dcd8cb]"><Check size={17} className="mt-0.5 flex-none text-[var(--gold)]" />{x}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6">
            {[
              ['Notas y detalles', [p.notes && `Notas: ${p.notes}`, p.content && !/por confirmar/i.test(p.content) && `Contenido: ${p.content}`, p.materials && !/por confirmar/i.test(p.materials) && `Composición: ${p.materials}`].filter(Boolean).join(' · ')],
              ['Modo de uso', p.use],
              ['Cuidados y advertencias', p.care],
              ['Entrega y refill', `Retiro en ${s.address} (${s.hours}). Envío ${money(s.shipping)}, sin cargo en pedidos mayores de ${money(s.freeAbove)}. ${p.refill ? 'La recarga está sujeta a revisión del envase.' : ''}`],
            ].filter(([, v]) => v).map(([t, v]) => (
              <details key={t} className="acc"><summary>{t}</summary><p>{v}</p></details>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className={'buybar ' + (showBar ? 'show' : '')}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-[var(--foreground)]">{p.name}</p>
          <p className="text-[12px]">{aroma || (needs ? 'Elegí tu fragancia' : money(price))}</p>
        </div>
        <button className="btn btn-sm" disabled={soldOut} onClick={() => go(false)}>{needs && !aroma ? 'Elegir aroma' : 'Agregar'}</button>
      </div>
    </section>
  );
}
