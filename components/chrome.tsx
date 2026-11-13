'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, MessageCircle, Minus, Plus, ShoppingBag, Truck, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { lineKey, totals } from '@/lib/commerce';
import { money } from '@/lib/data';
import { unitPrice, useShop } from './shop-provider';

const NAV = [
  ['/catalogo', 'Colección'],
  ['/historia', 'Nuestra historia'],
  ['/preguntas', 'Preguntas'],
  ['/contacto', 'Contacto'],
];

export function Header() {
  const { count, setOpen, settings } = useShop();
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pop, setPop] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    if (count > prev.current) { setPop(true); const t = setTimeout(() => setPop(false), 500); prev.current = count; return () => clearTimeout(t); }
    prev.current = count;
  }, [count]);
  useEffect(() => setMenu(false), [path]);

  return (
    <>
      <div className="announce">
        Envío sin cargo desde <strong>{money(settings.freeAbove)}</strong> · {Number(settings.cashDiscount || settings.transferDiscount) > 0 && <><strong>{Math.max(Number(settings.cashDiscount || 0), Number(settings.transferDiscount || 0))}% off</strong> en efectivo o transferencia · </>}Retiro en Villa Urquiza
      </div>
      <header className={'header' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap header-inner">
          <button className="icon-btn lg:hidden -ml-3" aria-label="Abrir menú" onClick={() => setMenu(true)}>
            <Menu size={22} />
          </button>
          <Link href="/" className="logo" aria-label="FIKA ELDRA, inicio">
            <Image src="/images/fika-eldra-logo.webp" alt="FIKA ELDRA" width={920} height={120} priority />
          </Link>
          <nav className="nav" aria-label="Principal">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <button className="icon-btn -mr-3" onClick={() => setOpen(true)} aria-label={`Abrir tu pedido, ${count} productos`}>
            <ShoppingBag size={21} />
            <span className="hidden sm:inline">Tu pedido</span>
            {count > 0 && <span className={'badge-count' + (pop ? ' pop' : '')}>{count}</span>}
          </button>
        </div>
      </header>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-[86vw] max-w-sm border-r border-[var(--line)] bg-[var(--background)] p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">Navegación de la tienda</SheetDescription>
          <div className="flex h-full flex-col px-7 pt-16 pb-8">
            <nav className="flex flex-col">
              {[['/', 'Inicio'], ...NAV, ['/pedido', 'Tu pedido']].map(([href, label]) => (
                <Link key={href} href={href} className="border-b border-[var(--line)] py-4 font-serif text-[30px] leading-none text-[var(--foreground)]">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>{settings.address}</p>
              <p>{settings.hours}</p>
              <a className="link" href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer">@{settings.instagram}</a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function FreeShippingMeter({ amount }: { amount: number }) {
  const { settings } = useShop();
  const goal = Number(settings.freeAbove) || 0;
  if (!goal) return null;
  const left = Math.max(0, goal - amount + 1);
  const pct = Math.min(100, (amount / goal) * 100);
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-[13px] text-[#d8d5c8]">
        <Truck size={16} className="text-[var(--gold)]" />
        {amount > goal ? <span>¡Tu envío es <strong className="text-[var(--gold-soft)]">sin cargo</strong>!</span> : <span>Te faltan <strong className="text-[var(--gold-soft)]">{money(left)}</strong> para el envío sin cargo</span>}
      </p>
      <div className="meter"><i style={{ width: pct + '%' }} /></div>
    </div>
  );
}

export function CartDrawer() {
  const { open, setOpen, lines, change, subtotal, refillDiscount, products, add, settings, cart } = useShop();
  const best = Math.max(Number(settings.cashDiscount || 0), Number(settings.transferDiscount || 0));
  const bestPay = Number(settings.cashDiscount || 0) >= Number(settings.transferDiscount || 0) ? 'Efectivo' : 'Transferencia';
  const t = totals(subtotal, refillDiscount, bestPay, 'Envío', settings);
  const suggest = products.filter((p) => !cart.some((x) => x.id === p.id) && p.stock > 0).slice(0, 2);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full max-w-[440px] gap-0 border-l border-[var(--line)] bg-[var(--background)] p-0 sm:max-w-[440px]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <SheetTitle className="font-serif text-[28px] font-normal">Tu pedido</SheetTitle>
          <SheetDescription className="sr-only">Productos que elegiste</SheetDescription>
        </div>
        {!lines.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <span className="font-serif text-6xl text-[var(--gold)]">ᛉ</span>
            <h3 className="font-serif text-3xl">Tu ritual empieza acá</h3>
            <p className="text-sm">Todavía no elegiste ningún producto.</p>
            <Link href="/catalogo" className="btn" onClick={() => setOpen(false)}>Explorar la colección</Link>
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--line)] px-6 py-4"><FreeShippingMeter amount={subtotal - refillDiscount} /></div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {lines.map((x) => (
                <div key={lineKey(x)} className="flex gap-4">
                  <Link href={`/productos/${x.p.id}`} className="relative h-24 w-20 flex-none overflow-hidden rounded-[10px] bg-[var(--card)]">
                    <Image src={x.p.images[0]} alt={x.p.name} fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <p className="font-serif text-[20px] leading-tight text-[var(--foreground)]">{x.p.name}</p>
                      <button aria-label={`Quitar ${x.p.name}`} className="h-7 w-7 flex-none text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={() => change(x, 0)}><X size={16} /></button>
                    </div>
                    <p className="text-[12.5px]">{x.aroma}{x.refill ? ' · Refill' : ''}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="qty !h-9">
                        <button aria-label="Restar" onClick={() => change(x, x.qty - 1)}><Minus size={14} /></button>
                        <span>{x.qty}</span>
                        <button aria-label="Sumar" onClick={() => change(x, x.qty + 1)}><Plus size={14} /></button>
                      </div>
                      <span className="price !text-[15px]">{money(unitPrice(x.p) * x.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {suggest.length > 0 && (
                <div className="border-t border-[var(--line)] pt-5">
                  <p className="eyebrow mb-3">Completá tu ritual</p>
                  <div className="space-y-2">
                    {suggest.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2.5">
                        <div className="relative h-14 w-12 flex-none overflow-hidden rounded-md"><Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" /></div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm text-[var(--foreground)]">{p.name}</p><p className="text-xs">{money(unitPrice(p))}</p></div>
                        {p.fragrances?.length ? (
                          <Link className="btn btn-ghost btn-sm" href={`/productos/${p.id}`} onClick={() => setOpen(false)}>Elegir</Link>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => add(p, undefined)}>Sumar</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3 border-t border-[var(--line)] bg-[#0b0e0b] px-6 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
              <div className="flex justify-between text-sm"><span className="text-[var(--text-soft)]">Subtotal</span><span className="price">{money(subtotal - refillDiscount)}</span></div>
              {best > 0 && <p className="text-[12.5px] text-[#9fd4cb]">Pagando en efectivo o transferencia ahorrás {money(t.paymentDiscount)} ({best}%).</p>}
              <Link href="/pedido" onClick={() => setOpen(false)} className="btn btn-block">Finalizar pedido <ArrowRight size={17} /></Link>
              <p className="flex items-center justify-center gap-2 text-center text-[12px] text-[var(--muted-foreground)]"><MessageCircle size={13} /> No cobramos online: coordinamos el pago por WhatsApp.</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ConsentBanner() {
  const { consent, setConsent, track } = useShop();
  const path = usePathname();
  if (consent !== null) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[rgba(16,20,16,.96)] p-5 shadow-2xl backdrop-blur sm:bottom-6">
      <p className="mb-1 font-serif text-xl text-[var(--foreground)]">Tu experiencia, a tu manera</p>
      <p className="text-[13.5px]">¿Nos permitís usar estadísticas anónimas para mejorar la tienda? Son opcionales. <Link className="underline" href="/cookies">Ver política</Link></p>
      <div className="mt-4 flex gap-2">
        <button className="btn btn-ghost btn-sm flex-1" onClick={() => setConsent('no')}>Solo necesarias</button>
        <button className="btn btn-sm flex-1" onClick={() => { setConsent('yes'); setTimeout(() => track('page', path)); }}>Aceptar</button>
      </div>
    </div>
  );
}

export function WhatsAppFab() {
  const { settings, track } = useShop();
  const path = usePathname();
  if (path === '/pedido' || path.startsWith('/productos/')) return null;
  return (
    <a className="fab" aria-label="Consultar por WhatsApp" href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" onClick={() => track('whatsapp', 'contacto')}>
      <MessageCircle size={24} />
    </a>
  );
}

export function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }: { children: React.ReactNode; className?: string; delay?: number; as?: any }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: delay + 'ms' }}>{children}</Tag>;
}
