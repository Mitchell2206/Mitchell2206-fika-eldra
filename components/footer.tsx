import Image from 'next/image';
import Link from 'next/link';
import { Camera, MapPin, MessageCircle } from 'lucide-react';
import { ConsentLink } from './consent-link';

export function Footer({ settings: s }: { settings: any }) {
  return (
    <footer className="footer">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-5">
          <Image src="/images/fika-eldra-logo.webp" alt="FIKA ELDRA" width={920} height={120} className="h-5 w-auto" />
          <p className="max-w-xs font-serif text-[22px] leading-snug text-[#d9d4c4]">Un aroma. Una intención.<br /><em>Un momento para volver a vos.</em></p>
        </div>
        <div className="flex flex-col gap-3">
          <span className="eyebrow mb-2">Explorá</span>
          <Link href="/catalogo">Colección</Link>
          <Link href="/historia">Nuestra historia</Link>
          <Link href="/pedido">Tu pedido</Link>
        </div>
        <div className="flex flex-col gap-3">
          <span className="eyebrow mb-2">Ayuda</span>
          <Link href="/preguntas">Preguntas frecuentes</Link>
          <Link href="/envios">Envíos y retiros</Link>
          <Link href="/cambios">Cambios y devoluciones</Link>
          <Link href="/contacto">Contacto</Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow mb-2">Encontranos</span>
          <p className="flex gap-2"><MapPin size={16} className="mt-1 flex-none text-[var(--gold)]" />{s.address}</p>
          <p className="pl-6">{s.hours}</p>
          <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2"><MessageCircle size={16} className="text-[var(--gold)]" /> WhatsApp</a>
          <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2"><Camera size={16} className="text-[var(--gold)]" /> @{s.instagram}</a>
        </div>
      </div>
      <div className="wrap flex flex-col gap-3 border-t border-[var(--line)] py-6 text-xs text-[var(--muted-foreground)] md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} FIKA ELDRA · Ritual con propósito · Precios en pesos argentinos</span>
        <div className="flex flex-wrap gap-5">
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
          <ConsentLink />
        </div>
      </div>
    </footer>
  );
}
