'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Check, ChevronDown, Copy, Lock, MessageCircle, Minus, PackageCheck, Plus, ShoppingBag, Truck } from 'lucide-react';
import { lineKey, paymentRate, totals } from '@/lib/commerce';
import { clientId } from '@/lib/client-id';
import { money } from '@/lib/data';
import { unitPrice, useShop } from '@/components/shop-provider';
import { FreeShippingMeter } from '@/components/chrome';

const EMPTY = { name: '', phone: '', email: '', address: '', extra: '', locality: '', postal: '', time: '', delivery: 'Retiro', payment: 'Efectivo', notes: '' };
const SAVED = 'fika-customer';
type Errors = Partial<Record<keyof typeof EMPTY | 'accept', string>>;

function Field({ label, name, error, optional, ...props }: any) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}{optional ? <em className="ml-1 not-italic text-[var(--muted-foreground)]">(opcional)</em> : null}</span>
      <input id={name} name={name} className="input" aria-invalid={!!error} {...props} />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Checkout() {
  const { lines, change, subtotal, refillDiscount, settings: s, cart, clear, track, ready } = useShop();
  const [c, setC] = useState(EMPTY);
  const [remember, setRemember] = useState(true);
  const [accept, setAccept] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [key, setKey] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setKey(clientId());
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED) || 'null');
      if (saved && typeof saved === 'object') setC((x) => ({ ...x, ...saved, notes: '' }));
    } catch {}
  }, []);
  useEffect(() => {
    if (!s.payments.includes(c.payment)) setC((x) => ({ ...x, payment: s.payments[0] }));
    if (!s.deliveries.includes(c.delivery)) setC((x) => ({ ...x, delivery: s.deliveries.includes('Retiro') ? 'Retiro' : s.deliveries[0] }));
  }, [s, c.payment, c.delivery]);

  const t = useMemo(() => totals(subtotal, refillDiscount, c.payment, c.delivery, s), [subtotal, refillDiscount, c.payment, c.delivery, s]);
  const set = (k: keyof typeof EMPTY) => (e: any) => { setC({ ...c, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const slots = ['Mañana (8 a 14)', 'Tarde (14 a 20)', 'Cualquier horario'];
  const customSlot = c.time && !slots.includes(c.time);

  function validate() {
    const e: Errors = {};
    if (!c.name.trim()) e.name = 'Contanos tu nombre.';
    if (!/^\+?[\d\s()-]{8,25}$/.test(c.phone)) e.phone = 'Ingresá un teléfono con código de área, por ejemplo 11 2345 6789.';
    if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) e.email = 'Revisá el correo.';
    if (!c.time.trim()) e.time = 'Elegí una franja horaria.';
    if (c.delivery === 'Envío') {
      if (!c.address.trim()) e.address = 'Falta la dirección.';
      if (!c.locality.trim()) e.locality = 'Falta el barrio o localidad.';
      if (!c.postal.trim()) e.postal = 'Falta el código postal.';
    }
    if (!accept) e.accept = 'Necesitamos tu autorización para registrar el pedido.';
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      const el = formRef.current?.querySelector(`[name="${first}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el?.focus({ preventScroll: true }), 350);
      return false;
    }
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, items: cart, customer: c, accept, website }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No pudimos registrar el pedido.');
      try {
        if (remember) { const { notes, ...keep } = c; localStorage.setItem(SAVED, JSON.stringify(keep)); }
        else localStorage.removeItem(SAVED);
      } catch {}
      setDone(d);
      clear();
      setKey(clientId());
      track('complete', d.order.id);
      window.scrollTo({ top: 0 });
      if (window.matchMedia('(pointer: coarse)').matches) setTimeout(() => { track('whatsapp', d.order.id); window.location.href = d.whatsapp; }, 900);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Confirmation d={done} onWa={() => track('whatsapp', done.order.id)} />;

  if (ready && !lines.length)
    return (
      <section className="wrap grid min-h-[60vh] place-items-center py-24 text-center">
        <div>
          <ShoppingBag size={42} className="mx-auto text-[var(--gold)]" />
          <h1 className="h2 mt-6">Tu pedido está vacío.</h1>
          <p className="mx-auto mt-4 max-w-sm">Elegí un aroma y empezá tu ritual.</p>
          <Link href="/catalogo" className="btn mt-9">Descubrir la colección <ArrowRight size={18} /></Link>
        </div>
      </section>
    );

  const summary = (
    <div className="space-y-5">
      <div className="space-y-4">
        {lines.map((x) => (
          <div key={lineKey(x)} className="flex gap-3.5">
            <div className="relative h-[72px] w-[60px] flex-none overflow-hidden rounded-[10px] bg-[var(--card)]">
              <Image src={x.p.images[0]} alt={x.p.name} fill sizes="60px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-snug text-[var(--foreground)]">{x.p.name}</p>
              <p className="text-[12px]">{x.aroma}{x.refill ? ' · Refill' : ''}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="qty !h-8">
                  <button type="button" aria-label="Restar" onClick={() => change(x, x.qty - 1)}><Minus size={13} /></button>
                  <span className="text-sm">{x.qty}</span>
                  <button type="button" aria-label="Sumar" onClick={() => change(x, x.qty + 1)}><Plus size={13} /></button>
                </div>
                <span className="text-[14px] font-semibold text-[var(--foreground)]">{money(unitPrice(x.p) * x.qty)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <hr className="rule" />
      <dl className="space-y-2.5 text-[14px]">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="text-[var(--foreground)]">{money(subtotal)}</dd></div>
        {t.refillDiscount > 0 && <div className="flex justify-between text-[#9fd4cb]"><dt>Refill</dt><dd>− {money(t.refillDiscount)}</dd></div>}
        {t.paymentDiscount > 0 && <div className="flex justify-between text-[#9fd4cb]"><dt>{paymentRate(c.payment, s)}% pagando en {c.payment.toLowerCase()}</dt><dd>− {money(t.paymentDiscount)}</dd></div>}
        <div className="flex justify-between"><dt>{c.delivery === 'Retiro' ? 'Retiro en el local' : 'Envío'}</dt><dd className="text-[var(--foreground)]">{t.shipping ? money(t.shipping) : 'Sin cargo'}</dd></div>
      </dl>
      <hr className="rule" />
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-2xl text-[var(--foreground)]">Total</span>
        <span className="text-[24px] font-semibold text-[var(--foreground)]">{money(t.total)}</span>
      </div>
      {c.delivery !== 'Retiro' && <FreeShippingMeter amount={subtotal - t.discount} />}
    </div>
  );

  return (
    <section className="wrap pt-8 pb-28 md:pt-12">
      <span className="eyebrow">Compra asistida</span>
      <h1 className="mt-4 font-serif text-[clamp(40px,5vw,68px)] leading-none">Tu próximo <em>ritual.</em></h1>
      <p className="mt-4 max-w-xl">Completá tus datos y te llevamos a WhatsApp con el pedido listo. <strong className="font-medium text-[#e6e1d3]">No se cobra nada en la web:</strong> coordinamos pago y entrega con vos.</p>

      {/* Mobile summary toggle */}
      <button type="button" onClick={() => setSummaryOpen(!summaryOpen)} className="mt-8 flex w-full items-center justify-between rounded-2xl border border-[var(--line)] px-5 py-4 lg:hidden" aria-expanded={summaryOpen}>
        <span className="flex items-center gap-2 text-[14px]"><ShoppingBag size={17} className="text-[var(--gold)]" /> {summaryOpen ? 'Ocultar' : 'Ver'} resumen ({lines.reduce((n, x) => n + x.qty, 0)})<ChevronDown size={16} className={summaryOpen ? 'rotate-180 transition' : 'transition'} /></span>
        <span className="font-semibold text-[var(--foreground)]">{money(t.total)}</span>
      </button>
      {summaryOpen && <div className="panel mt-3 lg:hidden">{summary}</div>}

      <form ref={formRef} onSubmit={submit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
        <div className="space-y-12">
          {/* 1 */}
          <fieldset className="space-y-5">
            <legend className="mb-5 flex items-center gap-3 font-serif text-[28px] text-[var(--foreground)]"><span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--gold)] font-sans text-sm text-[var(--gold)]">1</span>Tus datos</legend>
            <Field label="Nombre y apellido" name="name" autoComplete="name" value={c.name} onChange={set('name')} error={errors.name} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="WhatsApp / teléfono" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="11 2345 6789" value={c.phone} onChange={set('phone')} error={errors.phone} />
              <Field label="Correo" name="email" type="email" autoComplete="email" optional value={c.email} onChange={set('email')} error={errors.email} />
            </div>
          </fieldset>

          {/* 2 */}
          <fieldset className="space-y-5">
            <legend className="mb-5 flex items-center gap-3 font-serif text-[28px] text-[var(--foreground)]"><span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--gold)] font-sans text-sm text-[var(--gold)]">2</span>Entrega</legend>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Forma de entrega">
              {[...s.deliveries].sort((a: string, b: string) => (a === 'Retiro' ? 0 : 1) - (b === 'Retiro' ? 0 : 1)).map((x: string) => (
                <button key={x} type="button" role="radio" aria-checked={c.delivery === x} className="choice" onClick={() => setC({ ...c, delivery: x })}>
                  <span className="dot" />
                  <span>
                    <strong className="flex items-center gap-2">{x === 'Retiro' ? <PackageCheck size={17} className="text-[var(--gold)]" /> : <Truck size={17} className="text-[var(--gold)]" />}{x === 'Retiro' ? 'Retiro sin cargo' : 'Envío a domicilio'}</strong>
                    <small>{x === 'Retiro' ? s.address : `${money(s.shipping)} · sin cargo desde ${money(s.freeAbove)}`}</small>
                  </span>
                </button>
              ))}
            </div>
            {c.delivery === 'Envío' && (
              <div className="grid gap-5 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                <div className="sm:col-span-2"><Field label="Calle y número" name="address" autoComplete="street-address" value={c.address} onChange={set('address')} error={errors.address} /></div>
                <Field label="Piso / depto" name="extra" optional value={c.extra} onChange={set('extra')} />
                <Field label="Barrio o localidad" name="locality" autoComplete="address-level2" value={c.locality} onChange={set('locality')} error={errors.locality} />
                <Field label="Código postal" name="postal" autoComplete="postal-code" inputMode="numeric" value={c.postal} onChange={set('postal')} error={errors.postal} />
              </div>
            )}
            <div className="field">
              <span>¿Cuándo te queda mejor?</span>
              <div className="pills" role="radiogroup" aria-label="Franja horaria">
                {slots.map((x) => <button key={x} type="button" name={x === slots[0] ? 'time' : undefined} role="radio" aria-checked={c.time === x} className={'pill ' + (c.time === x ? 'active' : '')} onClick={() => { setC({ ...c, time: x }); setErrors({ ...errors, time: undefined }); }}>{x}</button>)}
                <button type="button" role="radio" aria-checked={!!customSlot} className={'pill ' + (customSlot ? 'active' : '')} onClick={() => setC({ ...c, time: customSlot ? c.time : ' ' })}>Otro</button>
              </div>
              {customSlot && <input className="input mt-2" autoFocus placeholder="Ej: sábados después de las 10" value={c.time.trimStart()} onChange={set('time')} />}
              {errors.time && <span className="field-error">{errors.time}</span>}
            </div>
          </fieldset>

          {/* 3 */}
          <fieldset className="space-y-5">
            <legend className="mb-5 flex items-center gap-3 font-serif text-[28px] text-[var(--foreground)]"><span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--gold)] font-sans text-sm text-[var(--gold)]">3</span>¿Cómo preferís pagar?</legend>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Medio de pago">
              {s.payments.map((x: string) => {
                const rate = paymentRate(x, s);
                return (
                  <button key={x} type="button" role="radio" aria-checked={c.payment === x} className="choice" onClick={() => setC({ ...c, payment: x })}>
                    <span className="dot" />
                    <span><strong>{x}{rate > 0 && <span className="save-tag">-{rate}%</span>}</strong><small>{rate > 0 ? `Ahorrás ${money(Math.round((subtotal - refillDiscount) * rate / 100))}` : 'Precio de lista'}</small></span>
                  </button>
                );
              })}
            </div>
            <p className="flex items-center gap-2 text-[13px]"><Lock size={14} className="text-[var(--gold)]" /> Nunca pedimos datos de tarjeta en la web. {c.payment === 'Transferencia' && 'Los datos bancarios aparecen al confirmar.'}</p>
          </fieldset>

          {showNotes ? (
            <label className="field">
              <span>Nota para nosotros <em className="not-italic text-[var(--muted-foreground)]">(opcional)</em></span>
              <textarea className="input" autoFocus value={c.notes} onChange={set('notes')} placeholder="Es un regalo, timbre que no anda, etc." maxLength={600} />
            </label>
          ) : (
            <button type="button" className="link" onClick={() => setShowNotes(true)}><Plus size={15} /> Agregar una nota o aclaración</button>
          )}

          <label className="sr-only" aria-hidden>Sitio web<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>

          <div className="space-y-3">
            <button type="button" name="accept" role="checkbox" aria-checked={accept} className="flex items-start gap-3 text-left text-[14px] text-[#d6d3c6]" onClick={() => { setAccept(!accept); setErrors({ ...errors, accept: undefined }); }}>
              <span className={'mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-[5px] border ' + (accept ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--ink)]' : 'border-[#6d7366]')}>{accept && <Check size={14} strokeWidth={3} />}</span>
              <span>Acepto la <Link href="/privacidad" target="_blank" className="underline">política de privacidad</Link> y que me contacten por este pedido.</span>
            </button>
            {errors.accept && <p className="field-error pl-8">{errors.accept}</p>}
            <button type="button" role="checkbox" aria-checked={remember} className="flex items-start gap-3 text-left text-[13px] text-[var(--muted-foreground)]" onClick={() => setRemember(!remember)}>
              <span className={'mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-[5px] border ' + (remember ? 'border-[#6d7366] bg-[#2a3229] text-[var(--foreground)]' : 'border-[#6d7366]')}>{remember && <Check size={13} strokeWidth={3} />}</span>
              Recordar mis datos en este dispositivo para la próxima vez
            </button>
          </div>

          <div className="hidden lg:block">
            <button className="btn btn-block !min-h-[58px] text-[15px]" disabled={busy}>{busy ? 'Registrando tu pedido…' : <>Confirmar y enviar por WhatsApp · {money(t.total)} <ArrowRight size={18} /></>}</button>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="panel sticky top-24">
            <p className="eyebrow mb-6">Resumen</p>
            {summary}
            <p className="mt-6 flex items-start gap-2 text-[12.5px]"><MessageCircle size={14} className="mt-0.5 flex-none text-[var(--gold)]" />Al confirmar se abre WhatsApp con el detalle. Tu pedido queda reservado y lo confirmamos por ahí.</p>
          </div>
        </aside>

        {/* Mobile sticky submit */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[rgba(14,17,14,.96)] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <button className="btn btn-block" disabled={busy}>{busy ? 'Registrando…' : <>Confirmar por WhatsApp · {money(t.total)}</>}</button>
        </div>
      </form>
    </section>
  );
}

function Confirmation({ d, onWa }: { d: any; onWa: () => void }) {
  const o = d.order;
  return (
    <section className="wrap max-w-2xl py-16 text-center md:py-24">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[var(--gold)] text-[var(--gold)] animate-in zoom-in-50 duration-500"><Check size={36} /></div>
      <span className="eyebrow mt-8">Pedido Nº {o.id}</span>
      <h1 className="h2 mt-4">Tu ritual está <em>en camino.</em></h1>
      <p className="mx-auto mt-5 max-w-md">Registramos tu pedido por <strong className="text-[var(--foreground)]">{money(o.total)}</strong>. Para confirmarlo, enviá el mensaje que preparamos en WhatsApp.</p>
      <a href={d.whatsapp} onClick={onWa} className="btn mt-9 !min-h-[58px] px-10 text-[15px]"><MessageCircle size={19} /> Enviar mi pedido por WhatsApp</a>
      <p className="muted mt-3">El mensaje se envía recién cuando tocás «Enviar» en WhatsApp.</p>
      {d.bank && !o.demo && (
        <div className="panel mt-10 text-left">
          <p className="eyebrow mb-3">Datos para transferir</p>
          <p className="whitespace-pre-line text-[#e6e1d3]">{d.bank}</p>
          <button className="link mt-3" onClick={() => { navigator.clipboard?.writeText(d.bank); toast.success('Copiado'); }}><Copy size={14} /> Copiar</button>
        </div>
      )}
      <ol className="mt-12 grid gap-4 text-left sm:grid-cols-3">
        {[['Enviás el mensaje', 'Con el detalle del pedido ya escrito.'], ['Confirmamos', 'Disponibilidad, pago y entrega.'], ['Encendés tu ritual', 'Y descubrís tu runa.']].map(([t, x], i) => (
          <li key={t} className="panel !p-5"><span className="font-serif text-xl text-[var(--gold)]">0{i + 1}</span><p className="mt-2 font-medium text-[var(--foreground)]">{t}</p><p className="text-[13px]">{x}</p></li>
        ))}
      </ol>
      {o.demo && <p className="mt-8 text-sm text-[#f2c9a9]">Tienda en modo prueba: no realices pagos.</p>}
      <Link href="/catalogo" className="link mt-10">Seguir explorando <ArrowRight size={15} /></Link>
    </section>
  );
}
