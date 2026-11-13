import { ShopProvider } from '@/components/shop-provider';
import { CartDrawer, ConsentBanner, Header, WhatsAppFab } from '@/components/chrome';
import { Footer } from '@/components/footer';
import { getShop } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  let shop;
  try {
    shop = await getShop();
  } catch (e: any) {
    return (
      <main className="wrap section grid min-h-[70vh] place-items-center text-center">
        <div className="space-y-5">
          <span className="font-serif text-7xl text-[var(--gold)]">ᛁ</span>
          <h1 className="h2">Estamos preparando tu momento.</h1>
          <p className="mx-auto max-w-md">La tienda no está disponible en este instante. Volvé a intentar en unos minutos o escribinos por WhatsApp.</p>
          {process.env.NODE_ENV !== 'production' && <p className="muted">{e?.message}</p>}
          <a className="btn" href="https://wa.me/5491121938070">Escribir por WhatsApp</a>
        </div>
      </main>
    );
  }
  return (
    <ShopProvider products={shop.products} settings={shop.settings}>
      <Header />
      <main id="contenido">{children}</main>
      <Footer settings={shop.settings} />
      <CartDrawer />
      <WhatsAppFab />
      <ConsentBanner />
    </ShopProvider>
  );
}
