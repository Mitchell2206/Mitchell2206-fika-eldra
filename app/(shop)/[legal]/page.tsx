import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShop } from '@/lib/store';
import { money } from '@/lib/data';
import { ConsentLink } from '@/components/consent-link';

const PAGES: Record<string, string> = { privacidad: 'Privacidad', terminos: 'Términos y condiciones', cambios: 'Cambios y devoluciones', envios: 'Envíos y retiros', cookies: 'Cookies' };

export function generateStaticParams() { return Object.keys(PAGES).map((legal) => ({ legal })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await params;
  return { title: PAGES[legal] };
}

export default async function Page({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  if (!PAGES[legal]) notFound();
  const { settings: s } = await getShop();
  const text: Record<string, string> = {
    privacidad: s.privacy,
    terminos: s.terms,
    cambios: s.returns,
    envios: `Retiro sin cargo en ${s.address}, ${s.hours.toLowerCase()}.\n\nEnvío a domicilio: ${money(s.shipping)}. Sin cargo en pedidos mayores de ${money(s.freeAbove)}. Coordinamos cobertura, día y horario por WhatsApp al confirmar tu pedido.`,
    cookies: 'Guardamos tu pedido en este dispositivo para que puedas continuarlo. Solo registramos estadísticas anónimas si las aceptás, y podés cambiar tu decisión en cualquier momento.',
  };
  return (
    <section className="wrap max-w-3xl pt-10 pb-24 md:pt-16">
      <span className="eyebrow">Información útil</span>
      <h1 className="h2 mt-5">{PAGES[legal]}</h1>
      <p className="mt-8 text-[16px] leading-[1.9] whitespace-pre-line">{text[legal]}</p>
      {legal === 'cookies' && <div className="mt-8"><ConsentLink className="btn btn-ghost" /></div>}
    </section>
  );
}
